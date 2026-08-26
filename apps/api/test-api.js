const axios = require('axios');

async function testApi() {
  console.log('--- API VERIFICATION ---');
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'customer@happiquick.test',
      password: 'Customer@123'
    });
    
    if (!loginRes.data.success) {
      console.log('Login failed', loginRes.data);
      return;
    }
    const token = loginRes.data.data.token;
    console.log('Login successful');

    // 2. Venue Details API
    const gardenLawnId = 'fffd1e8a-08e1-433e-8656-21c213d87d03';
    const date = '2026-08-26';
    
    const venueRes = await axios.get(`http://localhost:3001/api/v1/venues/${gardenLawnId}?date=${date}`);
    
    console.log('Venue Space:', venueRes.data.data.venueSpace.name);
    console.log('Availability:', JSON.stringify(venueRes.data.data.availability.sessions, null, 2));

    // 3. POST /holds
    console.log(`\nPOST /api/v1/holds`);
    const holdRes = await axios.post('http://localhost:3001/api/v1/holds', {
      venueSpaceId: gardenLawnId,
      date: date,
      session: 'MORNING'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Hold creation result:', holdRes.data.success ? 'SUCCESS' : holdRes.data);

    // 4. Verify Search Again
    console.log(`\nGET /api/v1/venues/search?city=chennai&date=2026-08-26`);
    const searchRes = await axios.get(`http://localhost:3001/api/v1/venues/search?city=chennai&date=2026-08-26`);
    const searchItem = searchRes.data.data.items.find(i => i.venueSpaceId === gardenLawnId);
    console.log('Search Result Garden Lawn Availability:', searchItem?.availability);

  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

testApi();
