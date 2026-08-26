import { buildApp } from './src/app';
import { holdRepository } from './src/repositories/hold.repository';
import prisma from './src/plugins/prisma';
import jwt from 'jsonwebtoken';
import { InvStatus, Session } from 'shared-types';

async function main() {
  const app = buildApp();
  await app.ready();

  const venueSpace = await prisma.venueSpace.findFirst();
  if (!venueSpace) {
    console.log("No venue space found");
    return;
  }

  // Create or update inventory row to BOOKED
  await holdRepository.ensureInventoryExists(prisma, venueSpace.id, new Date('2026-08-31'));
  const invs = await prisma.inventory.findMany({ where: { venueSpaceId: venueSpace.id, date: new Date('2026-08-31') } });
  
  for (const inv of invs) {
    if (inv.session === 'MORNING') {
      await prisma.inventory.update({ where: { id: inv.id }, data: { status: 'BOOKED' } });
    }
  }

  // Create a real user in the DB so we don't get P2003
  let user = await prisma.user.findFirst({ where: { email: 'test500@test.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test500@test.com',
        name: 'Test',
        passwordHash: 'hash',
        role: 'CUSTOMER'
      }
    });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'super-secret');

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/holds',
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      venueSpaceId: venueSpace.id,
      date: '2026-08-31',
      session: 'MORNING'
    }
  });

  console.log('Status:', response.statusCode);
  console.log('Body:', response.payload);
  
  await app.close();
}

main().catch(console.error);
