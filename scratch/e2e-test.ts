import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

async function main() {
  try {
    console.log('1. Registering user...');
    const registerRes = await api.post('/auth/register', {
      name: 'Test User ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });
    const token = registerRes.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('3. Creating hold...');
    const holdRes = await api.post('/holds', {
      venueSpaceId: "ff4d6bd2-696c-45a2-802d-d4227f970766",
      date: "2026-08-31",
      session: "MORNING"
    });
    const holdId = holdRes.data.data.holdId;
    console.log('Hold created:', holdId);

    console.log('4. Making payment...');
    const paymentRes = await api.post('/payments', {
      holdId,
      result: 'SUCCESS'
    }, {
      headers: {
        'idempotency-key': 'idem-' + Date.now()
      }
    });
    console.log('Payment successful:', paymentRes.data);
  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

main();
