import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { paymentService } from '../../src/services/payment.service';
import { createTestFixtures, cleanupTestFixtures } from '../test-utils';
import prisma from '../../src/plugins/prisma';
import { HoldStatus } from 'shared-types';

describe('Phase 4: Simulated Payment + Transactional Booking Engine - Concurrency Tests', () => {
  let fixtures: any;
  let activeHold: any;

  beforeEach(async () => {
    fixtures = await createTestFixtures();
    
    // Create an active hold for MORNING to simulate checkout
    activeHold = await prisma.hold.create({
        data: {
            inventoryId: fixtures.inventories.MORNING.id,
            customerId: fixtures.customer.id,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            status: HoldStatus.ACTIVE
        }
    });
    
    await prisma.inventory.update({
        where: { id: fixtures.inventories.MORNING.id },
        data: { status: 'HOLD' }
    });
  });

  afterEach(async () => {
    await cleanupTestFixtures(fixtures);
  });

  it('RACE CONDITION TEST - Duplicate callback scenario (Same Idempotency Key)', async () => {
    // Both simulate a success payment hitting the server simultaneously
    const idemKey = `idem-${fixtures.uniqueId}-1`;
    const req1 = paymentService.processPaymentSimulation(
      fixtures.customer.id, 
      { holdId: activeHold.id, result: 'SUCCESS' }, 
      idemKey
    ).then(res => ({ success: true, res })).catch(err => { console.error(err); return { success: false, err: err.message }; });

    const req2 = paymentService.processPaymentSimulation(
      fixtures.customer.id, 
      { holdId: activeHold.id, result: 'SUCCESS' }, 
      idemKey // Same idempotency key
    ).then(res => ({ success: true, res })).catch(err => { console.error('REQ2 ERROR:', err); return { success: false, err: err.message }; });

    const results = await Promise.all([req1, req2]);
    
    // Because of idempotency key constraint, both should return a successful DTO
    const successful = results.filter(r => r.success);
    expect(successful.length).toBe(2);

    // Verify it's exactly the same booking
    if (successful[0].res && successful[1].res) {
      expect((successful[0].res as any).paymentId).toBe((successful[1].res as any).paymentId);
      expect((successful[0].res as any).booking.id).toBe((successful[1].res as any).booking.id);
    }

    const bookings = await prisma.booking.findMany({ where: { holdId: activeHold.id } });
    expect(bookings.length).toBe(1);
    
    const inv = await prisma.inventory.findUnique({ where: { id: fixtures.inventories.MORNING.id } });
    expect(inv?.status).toBe('BOOKED');
  });

  it('RACE CONDITION TEST - Different idempotency keys (Double Spend)', async () => {
    const req1 = paymentService.processPaymentSimulation(
      fixtures.customer.id, 
      { holdId: activeHold.id, result: 'SUCCESS' }, 
      `idem-${fixtures.uniqueId}-2`
    ).then(res => ({ success: true, res })).catch(err => ({ success: false, err: err.message }));

    const req2 = paymentService.processPaymentSimulation(
      fixtures.customer.id, 
      { holdId: activeHold.id, result: 'SUCCESS' }, 
      `idem-${fixtures.uniqueId}-3`
    ).then(res => ({ success: true, res })).catch(err => ({ success: false, err: err.message }));

    const results = await Promise.all([req1, req2]);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Only one should succeed because the first one transitions the hold to CONVERTED
    // The second transaction will see ALREADY_CONVERTED and reject
    expect(successful.length).toBe(1);
    expect(failed.length).toBe(1);
    expect(failed[0].err).toBe('ALREADY_CONVERTED');

    const bookings = await prisma.booking.findMany({ where: { holdId: activeHold.id } });
    expect(bookings.length).toBe(1);
  });
});
