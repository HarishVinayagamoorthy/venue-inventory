import { PrismaClient, Prisma } from '@prisma/client';
import { InvStatus, HoldStatus, Session } from 'shared-types';
import prisma from '../plugins/prisma';
import { holdRepository } from '../repositories/hold.repository';
import { availabilityService } from './availability.service';
import { holdExpirationQueue } from '../jobs/hold-expiration.queue';
import { HoldCreationInput } from 'shared-validation';

export class HoldService {
  async createHold(customerId: string, input: HoldCreationInput) {
    const { venueSpaceId, date: dateStr, session: requestedSession } = input;
    const requestedDate = new Date(dateStr);
    
    // Determine conflicting sessions to lock
    const conflictingSessions = availabilityService.getConflictingSessions(requestedSession as Session);
    const sessionsToLock = [requestedSession as Session, ...conflictingSessions];

    // 0. Ensure inventory rows physically exist for this date to support dynamic generation safely
    // Done outside the main lock transaction to avoid MySQL deadlock on concurrent INSERT IGNORE
    await holdRepository.ensureInventoryExists(prisma, venueSpaceId, requestedDate);

    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock rows in deterministic order
      const lockedRows = await holdRepository.lockConflictingInventoryRows(
        tx,
        venueSpaceId,
        requestedDate,
        sessionsToLock
      );

      // Check if requested inventory row even exists
      const targetRow = lockedRows.find(r => r.session === requestedSession);
      if (!targetRow) {
        throw new Error('INVENTORY_NOT_FOUND');
      }

      // 2. Safely expire stale holds inside the transaction before checking availability
      const currentStates: Record<Session, InvStatus | undefined> = {
        [Session.MORNING]: undefined,
        [Session.EVENING]: undefined,
        [Session.FULL_DAY]: undefined,
      };

      const now = new Date();

      for (const row of lockedRows) {
        let finalStatus = row.status;

        if (row.status === InvStatus.HOLD) {
          // Check if there is an active hold that has expired
          const activeHold = await holdRepository.getActiveHoldForInventory(tx, row.id);
          if (!activeHold) {
             // Cascaded hold with no direct record. The real conflict will be detected via the actual session that has the hold.
             finalStatus = InvStatus.AVAILABLE;
          } else if (activeHold.expiresAt < now) {
            // Expire it inline safely
            await holdRepository.updateHoldStatus(tx, activeHold.id, HoldStatus.EXPIRED);
            await holdRepository.updateInventoryStatus(tx, row.id, InvStatus.AVAILABLE);
            finalStatus = InvStatus.AVAILABLE;
          }
        }
        currentStates[row.session as Session] = finalStatus;
      }

      // 3. Check effective availability after cleanups
      const isAvailable = availabilityService.isInventoryAvailable(requestedSession as Session, currentStates);
      if (!isAvailable) {
        throw new Error('INVENTORY_UNAVAILABLE');
      }

      // 4. Check if the customer already has an active hold for this venue/date/session to prevent duplicates
      const activeHoldForTarget = await holdRepository.getActiveHoldForInventory(tx, targetRow.id);
      if (activeHoldForTarget && activeHoldForTarget.status === HoldStatus.ACTIVE) {
         // Should not happen due to availability check, but added safeguard
         throw new Error('INVENTORY_UNAVAILABLE');
      }

      // 5. Create new hold
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
      const newHold = await holdRepository.createHold(tx, targetRow.id, customerId, expiresAt);

      // 6. Update inventory status for target row ONLY (AvailabilityService dynamically handles overlaps)
      await holdRepository.updateInventoryStatus(tx, targetRow.id, InvStatus.HOLD);

      // We schedule the job after returning from transaction block.
      return { hold: newHold, targetRow };
    });
  }

  async scheduleExpirationJob(holdId: string) {
    // Delay of 10 minutes exactly matching the hold duration
    await holdExpirationQueue.add('expire-hold', { holdId }, {
      delay: 10 * 60 * 1000,
      removeOnComplete: true,
      removeOnFail: true
    });
  }

  async processExpirationJob(holdId: string) {
    await prisma.$transaction(async (tx: any) => {
      // Find the hold
      const hold = await tx.hold.findUnique({
        where: { id: holdId },
        include: { inventory: true }
      });

      if (!hold) return;

      // Lock the specific inventory row to serialize updates
      await holdRepository.lockConflictingInventoryRows(tx, hold.inventory.venueSpaceId, hold.inventory.date, [hold.inventory.session]);
      
      // Lock the hold itself
      const lockedHold = await holdRepository.getActiveHoldForInventory(tx, hold.inventoryId);
      
      if (!lockedHold || lockedHold.id !== hold.id) {
         return; // Already processed or not the active one
      }

      if (lockedHold.status === HoldStatus.ACTIVE && lockedHold.expiresAt < new Date()) {
        await holdRepository.updateHoldStatus(tx, lockedHold.id, HoldStatus.EXPIRED);
        await holdRepository.updateInventoryStatus(tx, lockedHold.inventoryId, InvStatus.AVAILABLE);
      }
    });
  }

  async cancelHold(customerId: string, holdId: string) {
    // 0. Fetch the hold without a lock first to get its inventory context
    // This allows us to lock INVENTORY -> HOLD consistently with the rest of the application
    const holdContext = await prisma.hold.findUnique({
      where: { id: holdId },
      include: { inventory: true }
    });

    if (!holdContext) {
      throw new Error('HOLD_NOT_FOUND');
    }

    if (holdContext.customerId !== customerId) {
      throw new Error('FORBIDDEN');
    }

    return await prisma.$transaction(async (tx: any) => {
      // 1. Lock the inventory row first to maintain global deterministic lock ordering
      await holdRepository.lockConflictingInventoryRows(
        tx,
        holdContext.inventory.venueSpaceId,
        holdContext.inventory.date,
        [holdContext.inventory.session as Session]
      );

      // 2. Lock Hold row
      const lockedHold = (await tx.$queryRawUnsafe(`
        SELECT * FROM Hold WHERE id = '${holdId}' FOR UPDATE
      `))[0] as any;

      // 3. Verify Hold exists (again, in case it was deleted)
      if (!lockedHold) {
        throw new Error('HOLD_NOT_FOUND');
      }

      // 4. Verify Hold status (Must be ACTIVE)
      if (lockedHold.status === HoldStatus.CANCELLED) {
        return { message: 'Already cancelled' }; // Idempotent
      }
      if (lockedHold.status === HoldStatus.CONVERTED) {
        throw new Error('HOLD_ALREADY_CONVERTED');
      }
      if (lockedHold.status === HoldStatus.EXPIRED) {
        throw new Error('HOLD_EXPIRED'); // Already expired, cannot cancel
      }
      if (lockedHold.status !== HoldStatus.ACTIVE) {
        throw new Error('HOLD_NOT_ACTIVE');
      }

      // 5. Re-check expiry inside lock
      if (lockedHold.expiresAt < new Date()) {
         // Expire inline rather than cancelling
         await holdRepository.updateHoldStatus(tx, lockedHold.id, HoldStatus.EXPIRED);
         await holdRepository.updateInventoryStatus(tx, lockedHold.inventoryId, InvStatus.AVAILABLE);
         throw new Error('HOLD_EXPIRED');
      }

      // 6. Execute Cancellation
      await holdRepository.updateHoldStatus(tx, lockedHold.id, HoldStatus.CANCELLED);
      await holdRepository.updateInventoryStatus(tx, lockedHold.inventoryId, InvStatus.AVAILABLE);

      return { message: 'Hold cancelled successfully' };
    });
  }
}

export const holdService = new HoldService();
