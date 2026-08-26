import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { venueService } from '../../src/services/venue.service';
import { createTestFixtures, cleanupTestFixtures } from '../test-utils';
import prisma from '../../src/plugins/prisma';

describe('Phase 8 & 15: Search API and Lazy Expiration Logic', () => {
  let fixtures: any;

  beforeEach(async () => {
    fixtures = await createTestFixtures();
  });

  afterEach(async () => {
    await cleanupTestFixtures(fixtures);
  });

  it('Search active HOLD blocks FULL_DAY', async () => {
    // Manually create an active hold for EVENING
    await prisma.inventory.update({
        where: { id: fixtures.inventories.EVENING.id },
        data: { status: 'HOLD' }
    });
    await prisma.hold.create({
        data: {
            inventoryId: fixtures.inventories.EVENING.id,
            customerId: fixtures.customer.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
    });

    const res = await venueService.searchVenues({
        city: fixtures.property.city,
        date: fixtures.dateStr,
        session: 'FULL_DAY' // User requests full day
    });

    // Should return 0 results if we filter unavailable, OR if it returns it, it should say HOLD.
    // Let's check venue.service.ts. It skips spaces if session is requested and finalAvailability !== AVAILABLE.
    expect(res.items.length).toBe(0);
  });

  it('Search without session returns HOLD for active HOLD', async () => {
    // Manually create an active hold for EVENING
    await prisma.inventory.update({
        where: { id: fixtures.inventories.EVENING.id },
        data: { status: 'HOLD' }
    });
    await prisma.hold.create({
        data: {
            inventoryId: fixtures.inventories.EVENING.id,
            customerId: fixtures.customer.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        }
    });

    const res = await venueService.searchVenues({
        city: fixtures.property.city,
        date: fixtures.dateStr
    });

    expect(res.items.length).toBe(1);
    // Baseline is FULL_DAY. EVENING active hold -> FULL_DAY is HOLD.
    expect(res.items[0].availability).toBe('HOLD');
  });

  it('Expired HOLD is projected as AVAILABLE without mutating DB', async () => {
    // Manually create an EXPIRED hold for EVENING
    await prisma.inventory.update({
        where: { id: fixtures.inventories.EVENING.id },
        data: { status: 'HOLD' }
    });
    await prisma.hold.create({
        data: {
            inventoryId: fixtures.inventories.EVENING.id,
            customerId: fixtures.customer.id,
            expiresAt: new Date(Date.now() - 60000) // 1 minute ago (expired)
        }
    });

    const res = await venueService.searchVenues({
        city: fixtures.property.city,
        date: fixtures.dateStr
    });

    // Should resolve to AVAILABLE because the hold is expired
    expect(res.items.length).toBe(1);
    expect(res.items[0].availability).toBe('AVAILABLE');

    // Verify DB is UNCHANGED (still HOLD)
    const inv = await prisma.inventory.findUnique({
        where: { id: fixtures.inventories.EVENING.id }
    });
    expect(inv?.status).toBe('HOLD'); // Read query did not mutate DB
  });
});
