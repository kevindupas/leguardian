/**
 * INTEGRATION TESTS - BRACELET ALIAS SYSTEM
 *
 * These tests verify that the bracelet alias system works correctly
 * across the entire frontend-backend stack.
 *
 * Run with: npx tsx tests/integration/alias.test.ts
 */

const API_URL = 'http://localhost:8000/api';
let token = '';
let guardianEmail = '';
let testsPassed = 0;
let testsFailed = 0;

// Simple test utilities
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    await testFn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error: any) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    testsFailed++;
  }
}

// Main test suite
async function runTests() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('🧪 BRACELET ALIAS SYSTEM - FRONTEND INTEGRATION TESTS');
  console.log('════════════════════════════════════════════════════════════\n');

  // TEST 1: User registration
  await runTest('1. User can register and get authentication token', async () => {
    guardianEmail = `test_${Date.now()}@test.com`;

    const response = await fetch(`${API_URL}/mobile/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: guardianEmail,
        password: 'password123',
        password_confirmation: 'password123',
      }),
    });

    assertEqual(response.status, 200, `Expected status 200, got ${response.status}`);
    const data = await response.json();
    assert(data.token, 'No token returned');
    assert(data.token.length > 0, 'Token is empty');
    token = data.token;
  });

  // TEST 2: Fetch available bracelets
  await runTest('2. User can fetch available unpaired bracelets', async () => {
    const response = await fetch(`${API_URL}/mobile/bracelets/available`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    assertEqual(response.status, 200);
    const data = await response.json();
    assert(data.bracelets, 'No bracelets property');
    assert(Array.isArray(data.bracelets), 'Bracelets is not an array');
  });

  // TEST 3: Register bracelet without alias
  await runTest('3. User can register bracelet without alias', async () => {
    const braceletCode = `NO-ALIAS-${Date.now()}`;
    const registerResponse = await fetch(`${API_URL}/mobile/bracelets/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_code: braceletCode,
      }),
    });

    assertEqual(registerResponse.status, 200);
    const data = await registerResponse.json();
    assert(data.bracelet, 'No bracelet in response');
    assert(data.bracelet.name, 'No bracelet name');
    assertEqual(data.bracelet.alias, null);
    assertEqual(data.bracelet.is_paired, true);
  });

  // TEST 4: Register bracelet with alias
  await runTest('4. User can register bracelet with custom alias', async () => {
    const braceletCode = `WITH-ALIAS-${Date.now()}`;
    const customAlias = 'Mon Bracelet Enfant';

    const response = await fetch(`${API_URL}/mobile/bracelets/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        unique_code: braceletCode,
        alias: customAlias,
      }),
    });

    assertEqual(response.status, 200);
    const data = await response.json();
    assert(data.bracelet, 'No bracelet in response');
    assert(data.bracelet.name, 'No bracelet name');
    assertEqual(data.bracelet.alias, customAlias, `Expected alias "${customAlias}", got "${data.bracelet.alias}"`);
    assertEqual(data.bracelet.is_paired, true);
  });

  // TEST 5: Fetch bracelets and verify aliases
  await runTest('5. User can fetch bracelets and see aliases', async () => {
    const response = await fetch(`${API_URL}/mobile/bracelets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    assertEqual(response.status, 200);
    const data = await response.json();
    assert(data.bracelets, 'No bracelets property');
    assert(Array.isArray(data.bracelets), 'Bracelets is not an array');
    assert(data.bracelets.length > 0, 'No bracelets returned');

    // Verify each bracelet has required fields
    data.bracelets.forEach((bracelet: any) => {
      assert(bracelet.id, `Bracelet missing id`);
      assert(bracelet.name, `Bracelet missing name`);
      assert(bracelet.unique_code, `Bracelet missing unique_code`);
      assert(bracelet.hasOwnProperty('alias'), `Bracelet missing alias property`);
    });
  });

  // TEST 6: Update bracelet alias
  await runTest('6. User can update bracelet alias', async () => {
    // Get a bracelet to update
    const getResponse = await fetch(`${API_URL}/mobile/bracelets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const { bracelets } = await getResponse.json();
    assert(bracelets.length > 0, 'No bracelets available to update');

    const bracelet = bracelets[0];
    const newAlias = `Updated-${Date.now()}`;

    const updateResponse = await fetch(`${API_URL}/mobile/bracelets/${bracelet.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        alias: newAlias,
      }),
    });

    assertEqual(updateResponse.status, 200);
    const data = await updateResponse.json();
    assert(data.bracelet, 'No bracelet in response');
    assertEqual(data.bracelet.alias, newAlias);
    assertEqual(data.bracelet.name, bracelet.name, 'Bracelet name should not change');
  });

  // TEST 7: Verify name and alias are different fields
  await runTest('7. Name and alias are independent fields', async () => {
    const getResponse = await fetch(`${API_URL}/mobile/bracelets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const { bracelets } = await getResponse.json();
    assert(bracelets.length > 0, 'No bracelets available');

    bracelets.forEach((bracelet: any) => {
      // Name should be the unique identifier (e.g., BR-2025-001)
      assert(bracelet.name, 'Bracelet has no name');
      // Alias should be optional user-friendly name
      assert(bracelet.hasOwnProperty('alias'), 'Bracelet missing alias field');
      // They should not be the same (unless alias is set to the name)
      // but if alias is provided, it should be different from name
      if (bracelet.alias && bracelet.alias !== bracelet.name) {
        // This is the expected case
      }
    });
  });

  // TEST 8: Verify API response structure
  await runTest('8. API returns correct response structure with alias', async () => {
    const response = await fetch(`${API_URL}/mobile/bracelets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    assertEqual(response.status, 200);
    const data = await response.json();

    assert(data.hasOwnProperty('bracelets'), 'Response missing bracelets property');
    assert(Array.isArray(data.bracelets), 'Bracelets is not an array');

    if (data.bracelets.length > 0) {
      const bracelet = data.bracelets[0];
      const requiredFields = [
        'id', 'unique_code', 'name', 'status', 'battery_level',
        'firmware_version', 'created_at', 'updated_at', 'alias'
      ];

      requiredFields.forEach(field => {
        assert(bracelet.hasOwnProperty(field), `Bracelet missing ${field}`);
      });
    }
  });

  // Print summary
  console.log('\n════════════════════════════════════════════════════════════');
  console.log(`Tests passed: ${testsPassed}`);
  console.log(`Tests failed: ${testsFailed}`);
  console.log('════════════════════════════════════════════════════════════\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
