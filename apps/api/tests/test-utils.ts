import prisma from '../src/plugins/prisma';
import { Session, InvStatus, HoldStatus } from 'shared-types';

/**
 * Creates an isolated test environment to avoid concurrency collisions and INVENTORY_NOT_FOUND errors.
 * Generates unique users, property, venue space, and 3 inventory records for a specific date.
 */
export async function createTestFixtures() {
  const uniqueId = Math.random().toString(36).substring(2, 9);
  const dateStr = `2030-01-01`; // Use a far future date to avoid any real overlap
  const date = new Date(dateStr);

  const owner = await prisma.user.create({
    data: {
      name: `Test Owner ${uniqueId}`,
      email: `owner-${uniqueId}@test.com`,
      passwordHash: 'dummy',
      role: 'PARTNER'
    }
  });

  const customer = await prisma.user.create({
    data: {
      name: `Test Customer ${uniqueId}`,
      email: `customer-${uniqueId}@test.com`,
      passwordHash: 'dummy',
      role: 'CUSTOMER'
    }
  });

  const property = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: `Test Property ${uniqueId}`,
      city: `Test City ${uniqueId}`,
      area: 'Test Area',
      address: '123 Test St'
    }
  });

  const space = await prisma.venueSpace.create({
    data: {
      propertyId: property.id,
      name: `Test Space ${uniqueId}`,
      capacity: 100,
      price: 1000
    }
  });

  // Create inventories for MORNING, EVENING, FULL_DAY
  const invMorning = await prisma.inventory.create({
    data: {
      venueSpaceId: space.id,
      date,
      session: Session.MORNING,
      status: InvStatus.AVAILABLE
    }
  });

  const invEvening = await prisma.inventory.create({
    data: {
      venueSpaceId: space.id,
      date,
      session: Session.EVENING,
      status: InvStatus.AVAILABLE
    }
  });

  const invFullDay = await prisma.inventory.create({
    data: {
      venueSpaceId: space.id,
      date,
      session: Session.FULL_DAY,
      status: InvStatus.AVAILABLE
    }
  });

  return {
    uniqueId,
    dateStr,
    date,
    owner,
    customer,
    property,
    space,
    inventories: {
      MORNING: invMorning,
      EVENING: invEvening,
      FULL_DAY: invFullDay
    }
  };
}

export async function cleanupTestFixtures(fixtures: any) {
  if (!fixtures) return;

  // Cleanup in reverse dependency order
  // Use try-catch because tests might have created additional records (Holds, Bookings, Payments)
  try {
    await prisma.booking.deleteMany({
      where: { inventory: { venueSpaceId: fixtures.space.id } }
    });
    await prisma.paymentAttempt.deleteMany({
      where: { hold: { inventory: { venueSpaceId: fixtures.space.id } } }
    });
    await prisma.hold.deleteMany({
      where: { inventory: { venueSpaceId: fixtures.space.id } }
    });
    await prisma.inventory.deleteMany({
      where: { venueSpaceId: fixtures.space.id }
    });
    await prisma.venueSpace.delete({
      where: { id: fixtures.space.id }
    });
    await prisma.property.delete({
      where: { id: fixtures.property.id }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [fixtures.owner.id, fixtures.customer.id] } }
    });
  } catch (err) {
    console.error('Cleanup failed (some records might remain):', err);
  }
}
