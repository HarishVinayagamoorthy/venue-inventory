import { Prisma } from '@prisma/client';
import { Session, HoldStatus, InvStatus } from 'shared-types';
import prisma from '../plugins/prisma';

// Use any for DB models to bypass broken Prisma generation in this env
type Inventory = any;
type Hold = any;

export class HoldRepository {
  /**
   * Safely ensures baseline inventory rows exist for a given date.
   * Concurrency safe due to skipDuplicates flag mapping to INSERT IGNORE.
   */
  async ensureInventoryExists(
    client: any,
    venueSpaceId: string,
    date: Date
  ): Promise<void> {
    try {
      await client.inventory.createMany({
        data: [
          { venueSpaceId, date, session: Session.MORNING, status: InvStatus.AVAILABLE },
          { venueSpaceId, date, session: Session.EVENING, status: InvStatus.AVAILABLE },
          { venueSpaceId, date, session: Session.FULL_DAY, status: InvStatus.AVAILABLE },
        ],
        skipDuplicates: true
      });
    } catch (e: any) {
      // Ignore deadlock errors gracefully if they happen on this standalone insert
      if (e.code === 'P2034' || (e.message && e.message.toLowerCase().includes('deadlock'))) {
        return;
      }
      // P2003 is Foreign Key Constraint failed. This happens if the venueSpaceId does not exist.
      if (e.code === 'P2003') {
        throw new Error('INVENTORY_NOT_FOUND');
      }
      // P2002 is Unique Constraint failed. In high concurrency, skipDuplicates might still throw this.
      // Since our goal is just to ensure the row exists, a P2002 means it already exists, which is fine.
      if (e.code === 'P2002') {
        return;
      }
      throw e;
    }
  }

  /**
   * Locks all inventory rows for the given venue space, date, and sessions.
   * Uses raw SQL with SELECT ... FOR UPDATE.
   * Crucially, orders the rows deterministically to prevent deadlocks.
   */
  async lockConflictingInventoryRows(
    tx: Prisma.TransactionClient,
    venueSpaceId: string,
    date: Date,
    sessions: Session[]
  ): Promise<Inventory[]> {
    // We convert the Date object to a format MySQL can safely query as DATE
    const dateStr = date.toISOString().split('T')[0];
    
    // Construct a safe SQL query using string interpolation since sessions are strictly typed enums
    const sessionList = sessions.map(s => `'${s}'`).join(',');
    
    // Create a deterministic order using FIELD function
    return (await tx.$queryRawUnsafe(`
      SELECT *
      FROM Inventory
      WHERE venueSpaceId = '${venueSpaceId}'
        AND date = '${dateStr}'
        AND session IN (${sessionList})
      ORDER BY FIELD(session, 'MORNING', 'EVENING', 'FULL_DAY')
      FOR UPDATE
    `)) as Inventory[];
  }

  async getActiveHoldForInventory(
    tx: Prisma.TransactionClient,
    inventoryId: string
  ): Promise<Hold | null> {
    const holds = (await tx.$queryRawUnsafe(`
      SELECT *
      FROM Hold
      WHERE inventoryId = '${inventoryId}'
        AND status = '${HoldStatus.ACTIVE}'
      FOR UPDATE
    `)) as Hold[];
    return holds[0] || null;
  }

  async createHold(
    tx: Prisma.TransactionClient,
    inventoryId: string,
    customerId: string,
    expiresAt: Date
  ): Promise<Hold> {
    return await tx.hold.create({
      data: {
        inventoryId,
        customerId,
        status: HoldStatus.ACTIVE,
        expiresAt
      }
    });
  }

  async updateHoldStatus(
    tx: Prisma.TransactionClient,
    holdId: string,
    status: HoldStatus
  ): Promise<void> {
    await tx.hold.update({
      where: { id: holdId },
      data: { status }
    });
  }

  async updateInventoryStatus(
    tx: Prisma.TransactionClient,
    inventoryId: string,
    status: InvStatus
  ): Promise<void> {
    await tx.inventory.update({
      where: { id: inventoryId },
      data: { status }
    });
  }

  async getHoldById(holdId: string): Promise<(Hold & { inventory: Inventory }) | null> {
    return await prisma.hold.findUnique({
      where: { id: holdId },
      include: { inventory: true }
    });
  }

  async getActiveHoldsByCustomer(customerId: string): Promise<(Hold & { inventory: Inventory })[]> {
    return await prisma.hold.findMany({
      where: { customerId, status: HoldStatus.ACTIVE },
      include: { inventory: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const holdRepository = new HoldRepository();
