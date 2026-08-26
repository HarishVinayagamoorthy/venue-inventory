import { buildApp } from './src/app';
import prisma from './src/plugins/prisma';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

async function main() {
  console.log('--- STARTING VERIFICATION ---');
  const app = buildApp();
  
  // 1. Get Customer Token
  const customer = await prisma.user.findUnique({ where: { email: 'customer@happiquick.test' } });
  const token = jwt.sign({ id: customer!.id, email: customer!.email, role: 'CUSTOMER' }, env.JWT_SECRET);
  
  // 2. Search & Filter Verification
  console.log('Testing filters (Chennai, capacity >= 500, price <= 500000)');
  const searchRes = await app.inject({
    method: 'GET',
    url: '/api/v1/venues/search?city=Chennai&minCapacity=500&maxPrice=500000&date=2026-08-31&session=EVENING'
  });
  
  const searchData = searchRes.json();
  if (searchRes.statusCode !== 200) throw new Error('Search failed: ' + JSON.stringify(searchData));
  if (searchData.data.items.length === 0) throw new Error('No venues found in Chennai with those filters');
  console.log(`Found ${searchData.data.items.length} venues matching complex filters.`);
  
  const targetVenueId = searchData.data.items[0].venueSpaceId;
  
  // 3. JIT Inventory & Booking Flow Verification
  const testDate = '2026-09-17';
  console.log(`\nTesting booking flow for ${testDate} (Unseeded Date)...`);
  
  const invBefore = await prisma.inventory.findMany({ where: { venueSpaceId: targetVenueId, date: new Date(testDate) } });
  console.log('Inventory before HOLD call:', JSON.stringify(invBefore, null, 2));

  const holdRes = await app.inject({
    method: 'POST',
    url: '/api/v1/holds',
    headers: { authorization: `Bearer ${token}` },
    payload: { venueSpaceId: targetVenueId, date: testDate, session: 'MORNING' }
  });
  
  if (holdRes.statusCode !== 201) throw new Error('Hold failed: ' + holdRes.payload);
  const holdId = holdRes.json().data.holdId;
  console.log(`Created Hold: ${holdId}`);
  
  // Verify inventory was created
  const inventoryCount = await prisma.inventory.count({
    where: { venueSpaceId: targetVenueId, date: new Date(testDate) }
  });
  if (inventoryCount !== 3) throw new Error(`Expected 3 inventory rows for JIT date, found ${inventoryCount}`);
  console.log('JIT Inventory correctly generated 3 rows.');

  // Payment Simulation
  console.log('Simulating Payment...');
  const payRes = await app.inject({
    method: 'POST',
    url: '/api/v1/payments',
    headers: { authorization: `Bearer ${token}`, 'idempotency-key': 'test-idem-123' },
    payload: { holdId, result: 'SUCCESS' }
  });
  
  if (payRes.statusCode !== 200) throw new Error('Payment failed: ' + payRes.payload);
  console.log('Payment successful. Booking created.');
  
  // 4. Duplicate Booking Reject Verification
  console.log('\nTesting duplicate hold on booked session...');
  const dupHoldRes = await app.inject({
    method: 'POST',
    url: '/api/v1/holds',
    headers: { authorization: `Bearer ${token}` },
    payload: { venueSpaceId: targetVenueId, date: testDate, session: 'MORNING' }
  });
  
  if (dupHoldRes.statusCode === 201) throw new Error('Duplicate hold succeeded incorrectly!');
  console.log(`Duplicate rejected properly with status ${dupHoldRes.statusCode}.`);

  // 5. Session Overlap Verification
  console.log('\nTesting overlap hold (FULL_DAY) over booked MORNING session...');
  const overlapHoldRes = await app.inject({
    method: 'POST',
    url: '/api/v1/holds',
    headers: { authorization: `Bearer ${token}` },
    payload: { venueSpaceId: targetVenueId, date: testDate, session: 'FULL_DAY' }
  });
  
  if (overlapHoldRes.statusCode === 201) throw new Error('Overlap hold succeeded incorrectly!');
  console.log(`Overlap rejected properly with status ${overlapHoldRes.statusCode}.`);
  
  await app.close();
  console.log('\n--- VERIFICATION SUCCESSFUL ---');
}

main().catch(console.error);
