import prisma from '../plugins/prisma';
import { HoldStatus, InvStatus, Session } from 'shared-types';
import { paymentRepository } from '../repositories/payment.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { holdRepository } from '../repositories/hold.repository';
import { PaymentSimulationInput } from 'shared-validation';
import crypto from 'crypto';

export class PaymentService {
  /**
   * Generates a unique, human-readable booking reference.
   * Example: HAP-20261220-8F42K
   */
  private generateBookingReference(date: Date): string {
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `HAP-${dateStr}-${randomSuffix}`;
  }

  async processPaymentSimulation(
    customerId: string,
    input: PaymentSimulationInput,
    idempotencyKey: string
  ) {
    // 1. Check idempotency FIRST before any locks
    const existingPayment = await paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existingPayment) {
      // If we already processed this exact request, return the existing result idempotently.
      return {
        paymentId: existingPayment.id,
        status: existingPayment.status,
        booking: existingPayment.booking ? {
          id: existingPayment.booking.id,
          bookingReference: existingPayment.booking.bookingReference,
          status: existingPayment.booking.status
        } : undefined
      };
    }

    const { holdId, result } = input;

    // 2. We need the hold details to lock the inventory row first to avoid deadlocks.
    // So we fetch the hold without a lock first to get its inventory context.
    const hold = await prisma.hold.findUnique({
      where: { id: holdId },
      include: { inventory: { include: { venueSpace: true } } }
    });

    if (!hold) {
      throw new Error('NOT_FOUND');
    }

    if (hold.customerId !== customerId) {
      throw new Error('FORBIDDEN');
    }

    // 3. Begin the authoritative transaction
    try {
      return await prisma.$transaction(async (tx: any) => {
        // Re-verify idempotency inside transaction to prevent race conditions on insert
        // Note: In real DB, the UNIQUE constraint on idempotencyKey also protects this.
        const txExisting = await tx.paymentAttempt.findUnique({
          where: { idempotencyKey },
          include: { booking: true }
        });
        if (txExisting) {
          return {
            paymentId: txExisting.id,
            status: txExisting.status,
            booking: txExisting.booking ? {
              id: txExisting.booking.id,
              bookingReference: txExisting.booking.bookingReference,
              status: txExisting.booking.status
            } : undefined
          };
        }

        // Lock Order: INVENTORY -> HOLD -> (PAYMENT is inserted)
        // This matches hold-expiration.worker.ts
        await holdRepository.lockConflictingInventoryRows(
          tx,
          hold.inventory.venueSpaceId,
          hold.inventory.date,
          [hold.inventory.session as Session]
        );

        // Lock Hold
        const lockedHold = (await tx.$queryRawUnsafe(`
          SELECT * FROM Hold WHERE id = '${holdId}' FOR UPDATE
        `))[0] as any;

        if (!lockedHold) {
          throw new Error('NOT_FOUND');
        }

        // 4. Validate Hold Status and Expiration
        if (lockedHold.status === HoldStatus.CONVERTED) {
          // It's possible we were waiting on the lock while another request with the SAME idempotency key
          // completed the conversion. We should check if our idempotency key is the one that converted it.
          const postLockTxExisting = await tx.paymentAttempt.findUnique({
            where: { idempotencyKey },
            include: { booking: true }
          });
          if (postLockTxExisting) {
            return {
              paymentId: postLockTxExisting.id,
              status: postLockTxExisting.status,
              booking: postLockTxExisting.booking ? {
                id: postLockTxExisting.booking.id,
                bookingReference: postLockTxExisting.booking.bookingReference,
                status: postLockTxExisting.booking.status
              } : undefined
            };
          }
          throw new Error('ALREADY_CONVERTED');
        }

        const now = new Date();
        if (lockedHold.status !== HoldStatus.ACTIVE || lockedHold.expiresAt < now) {
          // If it's expired, safely expire it inline
          if (lockedHold.status === HoldStatus.ACTIVE) {
            await holdRepository.updateHoldStatus(tx, lockedHold.id, HoldStatus.EXPIRED);
            await holdRepository.updateInventoryStatus(tx, lockedHold.inventoryId, InvStatus.AVAILABLE);
          }
          throw new Error('HOLD_EXPIRED');
        }

        const amount = Number(hold.inventory.venueSpace.price);

        // 5. Create the Payment record
        const paymentStatus = result;
        const payment = await paymentRepository.createPayment(
          tx,
          lockedHold.id,
          idempotencyKey,
          amount,
          paymentStatus
        );

        if (paymentStatus === 'FAILED') {
          // If payment failed, hold remains ACTIVE (unless business logic says otherwise)
          return {
            paymentId: payment.id,
            status: paymentStatus
          };
        }

        // 6. Payment SUCCESS -> Create Booking & Update States
        const bookingReference = this.generateBookingReference(hold.inventory.date);
        
        const booking = await bookingRepository.createBooking(
          tx,
          lockedHold.inventoryId,
          customerId,
          lockedHold.id,
          payment.id,
          amount,
          bookingReference
        );

        // Transition Hold -> CONVERTED
        await holdRepository.updateHoldStatus(tx, lockedHold.id, HoldStatus.CONVERTED);

        // Transition Inventory -> BOOKED
        await holdRepository.updateInventoryStatus(tx, lockedHold.inventoryId, InvStatus.BOOKED);

        return {
          paymentId: payment.id,
          status: paymentStatus,
          booking: {
            id: booking.id,
            bookingReference: booking.bookingReference,
            status: booking.status
          }
        };
      }, {
        timeout: 15000,
        maxWait: 5000
      });
    } catch (error: any) {
      if (error.message === 'ALREADY_CONVERTED' || (error.code === 'P2002' && error.meta?.target?.includes('idempotencyKey'))) {
        // Under REPEATABLE READ, our transaction snapshot might not see the concurrently inserted payment.
        // We catch the error outside the transaction (where we get a fresh read) and check if OUR idempotency key succeeded.
        const freshCheck = await paymentRepository.findByIdempotencyKey(idempotencyKey);
        if (freshCheck) {
          return {
            paymentId: freshCheck.id,
            status: freshCheck.status,
            booking: freshCheck.booking ? {
              id: freshCheck.booking.id,
              bookingReference: freshCheck.booking.bookingReference,
              status: freshCheck.booking.status
            } : undefined
          };
        }
      }
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
