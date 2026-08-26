import { buildApp } from './src/app';
import prisma from './src/plugins/prisma';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

async function main() {
  console.log('--- REPRODUCE 500 SCRIPT ---');
  const app = buildApp();
  
  const customer = await prisma.user.findUnique({ where: { email: 'customer@happiquick.test' } });
  const token = jwt.sign({ id: customer!.id, email: customer!.email, role: 'CUSTOMER' }, env.JWT_SECRET);

  // 1. Get a venue space
  const property = await prisma.property.findFirst({ include: { spaces: true } });
  const venueSpace = property!.spaces[0];

  const payload = {
    venueSpaceId: venueSpace.id,
    date: "2026-08-31",
    session: "MORNING"
  };

  console.log('Testing HOLD state...');
  // Force a hold by another user
  const otherUser = await prisma.user.findFirst({ where: { email: { not: 'customer@happiquick.test' } } });
  
  await prisma.inventory.createMany({
    data: [
      { venueSpaceId: venueSpace.id, date: new Date('2026-08-31'), session: 'MORNING', status: 'HOLD' },
      { venueSpaceId: venueSpace.id, date: new Date('2026-08-31'), session: 'EVENING', status: 'AVAILABLE' },
      { venueSpaceId: venueSpace.id, date: new Date('2026-08-31'), session: 'FULL_DAY', status: 'AVAILABLE' },
    ],
    skipDuplicates: true
  });
  
  const inv = await prisma.inventory.findFirst({ where: { venueSpaceId: venueSpace.id, date: new Date('2026-08-31'), session: 'MORNING' } });
  await prisma.inventory.update({ where: { id: inv!.id }, data: { status: 'BOOKED' } });
  
  await prisma.hold.create({
    data: {
      inventoryId: inv!.id,
      customerId: otherUser!.id,
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    }
  });

  console.log('Sending payload:', payload);

  const holdRes = await app.inject({
    method: 'POST',
    url: '/api/v1/holds',
    headers: { authorization: `Bearer ${token}` },
    payload
  });
  
  console.log(`Status Code: ${holdRes.statusCode}`);
  console.log(`Response:`, holdRes.json());
  
  await app.close();
}

main().catch(console.error);
