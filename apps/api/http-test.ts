import jwt from 'jsonwebtoken';
import { env } from './src/config/env';

async function main() {
  const token = jwt.sign({ id: 'some-customer-id', email: 'customer@happiquick.test', role: 'CUSTOMER' }, env.JWT_SECRET);

  const payload = {
    venueSpaceId: "06097197-c8bb-4df7-87c5-617c5019951e",
    date: "2026-08-31",
    session: "MORNING"
  };

  console.log('Sending HTTP POST to http://localhost:3001/api/v1/holds...');

  const res = await fetch('http://localhost:3001/api/v1/holds', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  console.log(`Status Code: ${res.status}`);
  const data = await res.json();
  console.log(`Response:`, JSON.stringify(data, null, 2));
}

main().catch(console.error);
