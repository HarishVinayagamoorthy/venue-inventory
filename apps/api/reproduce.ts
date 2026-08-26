import { buildApp } from './src/app';
import prisma from './src/plugins/prisma';
import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

async function main() {
  console.log('--- REPRODUCE 500 SCRIPT ---');
  const app = buildApp();
  
  const customer = await prisma.user.findUnique({ where: { email: 'customer@happiquick.test' } });
  const token = jwt.sign({ id: customer!.id, email: customer!.email, role: 'CUSTOMER' }, env.JWT_SECRET);

  const payload = {
    venueSpaceId: "06097197-c8bb-4df7-87c5-617c5019951e",
    date: "2026-08-31",
    session: "MORNING"
  };

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
