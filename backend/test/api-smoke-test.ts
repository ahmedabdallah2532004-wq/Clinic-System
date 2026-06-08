import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

async function testRBAC() {
  console.log('🚀 Starting API RBAC Tests...');

  // Mock Tokens (In a real test, you'd login to get these)
  const patientToken = 'MOCK_PATIENT_JWT';
  const adminToken = 'MOCK_ADMIN_JWT';

  // 1. Patient accessing Admin Dashboard
  console.log('\n--- Test 1: Patient -> Admin Endpoints ---');
  try {
    await axios.get(`${BASE_URL}/billing/invoices`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.error('❌ FAIL: Patient accessed admin invoices!');
  } catch (e: any) {
    if (e.response?.status === 403) {
      console.log('✅ PASS: Patient correctly forbidden from Admin invoices.');
    } else {
      console.error('❌ ERROR:', e.message);
    }
  }

  // 2. Unauthenticated access
  console.log('\n--- Test 2: Unauthenticated Access ---');
  try {
    await axios.get(`${BASE_URL}/appointments`);
    console.error('❌ FAIL: Accessed protected endpoint without token!');
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log('✅ PASS: Protected endpoint correctly blocked guest.');
    } else {
      console.error('❌ ERROR:', e.message);
    }
  }

  // 3. Admin accessing System Stats
  console.log('\n--- Test 3: Admin -> Protected Endpoints ---');
  try {
    // Assuming /doctors is protected for Admins/Receptionists
    const res = await axios.get(`${BASE_URL}/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (res.status === 200) {
      console.log('✅ PASS: Admin successfully accessed doctors list.');
    }
  } catch (e: any) {
    console.error('❌ FAIL: Admin could not access doctors list!', e.message);
  }
}

testRBAC();
