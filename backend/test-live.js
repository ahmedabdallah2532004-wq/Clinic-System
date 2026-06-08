const BASE_URL = 'http://localhost:3001';
const testEmail = `live-test-${Date.now()}@clinic.com`;

async function runLiveTest() {
  console.log('🚀 Initiating live API verification test...\n');

  try {
    // 1. Unauthenticated test
    console.log('Test 1: Requesting profile without authentication...');
    const unauthorizedRes = await fetch(`${BASE_URL}/users/profile`);
    console.log(`Status: ${unauthorizedRes.status} (Expected: 401)`);
    if (unauthorizedRes.status === 401) {
      console.log('✅ PASS: Profile correctly blocked anonymous guest.\n');
    } else {
      console.log('❌ FAIL: Guest allowed to access profile.\n');
    }

    // 2. Registration test
    console.log(`Test 2: Registering patient (${testEmail})...`);
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123',
        fullName: 'Live Test Patient',
        dateOfBirth: '1995-10-10',
        gender: 'FEMALE',
        contactNumber: '9998887777'
      })
    });
    const registerData = await registerRes.json();
    console.log(`Status: ${registerRes.status} (Expected: 201)`);
    if (registerRes.status === 201 && registerData.accessToken) {
      console.log('✅ PASS: Patient successfully registered and JWT returned.\n');
    } else {
      console.log('❌ FAIL: Registration failed.', registerData, '\n');
      return;
    }

    // 3. Login test
    console.log('Test 3: Logging in with new credentials...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status} (Expected: 201)`);
    if (loginRes.status === 201 && loginData.accessToken) {
      console.log('✅ PASS: Login successful and JWT retrieved.\n');
    } else {
      console.log('❌ FAIL: Login failed.', loginData, '\n');
      return;
    }

    const token = loginData.accessToken;

    // 4. Authenticated profile test
    console.log('Test 4: Fetching user profile with active JWT token...');
    const profileRes = await fetch(`${BASE_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    console.log(`Status: ${profileRes.status} (Expected: 200)`);
    if (profileRes.status === 200 && profileData.email === testEmail) {
      console.log('✅ PASS: Profile successfully loaded.');
      console.log('User Email:', profileData.email);
      console.log('User Role(s):', profileData.roles);
      console.log('Full Name:', profileData.fullName, '\n');
    } else {
      console.log('❌ FAIL: Profile fetch failed or data mismatch.', profileData, '\n');
    }

    console.log('🎉 Live API verification test suite completed successfully!');
  } catch (error) {
    console.error('❌ Error executing live test:', error.message);
  }
}

// Give NestJS server 3 seconds to fully initialize before running tests
setTimeout(runLiveTest, 3000);
