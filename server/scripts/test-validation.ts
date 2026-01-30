import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

const results: TestResult[] = [];

async function runTests() {
    console.log('🧪 Starting Runtime Validation Tests...\n');

    // Test 1: Login as DIRECTION and get cookie
    let directionCookie = '';
    try {
        const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: 'admin@ecole.com',
            password: 'password123'
        });

        directionCookie = loginRes.headers['set-cookie']?.[0] || '';

        if (loginRes.status === 200 && directionCookie) {
            results.push({ name: 'Login as DIRECTION', passed: true });
        } else {
            results.push({ name: 'Login as DIRECTION', passed: false, error: 'No cookie received' });
        }
    } catch (error: any) {
        results.push({ name: 'Login as DIRECTION', passed: false, error: error.message });
    }

    // Test 2: GET /me should return 200
    try {
        const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
            headers: { Cookie: directionCookie }
        });

        if (meRes.status === 200 && meRes.data.user) {
            results.push({ name: 'GET /api/auth/me', passed: true });
        } else {
            results.push({ name: 'GET /api/auth/me', passed: false, error: 'Invalid response' });
        }
    } catch (error: any) {
        results.push({ name: 'GET /api/auth/me', passed: false, error: error.message });
    }

    // Test 3: Create user with INVALID role => 400
    try {
        const invalidUserRes = await axios.post(`${BASE_URL}/api/users`, {
            email: 'hacker@test.com',
            password: 'test123',
            role: 'HACKER', // INVALID
            firstName: 'Hacker',
            lastName: 'Test'
        }, {
            headers: { Cookie: directionCookie },
            validateStatus: () => true // Don't throw on 4xx
        });

        if (invalidUserRes.status === 400) {
            results.push({ name: 'Create user with invalid role (HACKER) => 400', passed: true });
        } else {
            results.push({
                name: 'Create user with invalid role (HACKER) => 400',
                passed: false,
                error: `Expected 400, got ${invalidUserRes.status}`
            });
        }
    } catch (error: any) {
        results.push({ name: 'Create user with invalid role (HACKER) => 400', passed: false, error: error.message });
    }

    // Test 4: Create valid STUDENT user => 201
    let studentCookie = '';
    try {
        const validUserRes = await axios.post(`${BASE_URL}/api/users`, {
            email: 'teststudent@ecole.com',
            password: 'test123',
            role: 'STUDENT',
            firstName: 'Test',
            lastName: 'Student'
        }, {
            headers: { Cookie: directionCookie }
        });

        if (validUserRes.status === 201) {
            results.push({ name: 'Create valid STUDENT user => 201', passed: true });

            // Login as student for next test
            const studentLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
                email: 'teststudent@ecole.com',
                password: 'test123'
            });
            studentCookie = studentLogin.headers['set-cookie']?.[0] || '';
        } else {
            results.push({
                name: 'Create valid STUDENT user => 201',
                passed: false,
                error: `Expected 201, got ${validUserRes.status}`
            });
        }
    } catch (error: any) {
        results.push({ name: 'Create valid STUDENT user => 201', passed: false, error: error.message });
    }

    // Test 5: Create post with INVALID type => 400
    try {
        const invalidPostRes = await axios.post(`${BASE_URL}/api/posts`, {
            content: 'Test post with invalid type',
            type: 'INVALID_TYPE' // INVALID
        }, {
            headers: { Cookie: studentCookie },
            validateStatus: () => true
        });

        if (invalidPostRes.status === 400) {
            results.push({ name: 'Create post with invalid type (INVALID_TYPE) => 400', passed: true });
        } else {
            results.push({
                name: 'Create post with invalid type (INVALID_TYPE) => 400',
                passed: false,
                error: `Expected 400, got ${invalidPostRes.status}`
            });
        }
    } catch (error: any) {
        results.push({ name: 'Create post with invalid type (INVALID_TYPE) => 400', passed: false, error: error.message });
    }

    // Test 6: Create valid post with type GENERAL => 201
    try {
        const validPostRes = await axios.post(`${BASE_URL}/api/posts`, {
            content: 'Test post with valid type',
            type: 'GENERAL'
        }, {
            headers: { Cookie: studentCookie }
        });

        if (validPostRes.status === 201) {
            results.push({ name: 'Create valid post with type GENERAL => 201', passed: true });
        } else {
            results.push({
                name: 'Create valid post with type GENERAL => 201',
                passed: false,
                error: `Expected 201, got ${validPostRes.status}`
            });
        }
    } catch (error: any) {
        results.push({ name: 'Create valid post with type GENERAL => 201', passed: false, error: error.message });
    }

    // Test 7: Verify /register does NOT exist
    try {
        const registerRes = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: 'test@test.com',
            password: 'test'
        }, {
            validateStatus: () => true
        });

        if (registerRes.status === 404) {
            results.push({ name: 'Verify /api/auth/register does NOT exist => 404', passed: true });
        } else {
            results.push({
                name: 'Verify /api/auth/register does NOT exist => 404',
                passed: false,
                error: `Expected 404, got ${registerRes.status}. /register should NOT exist!`
            });
        }
    } catch (error: any) {
        // If axios throws, it might be a network error or 404
        if (error.response?.status === 404) {
            results.push({ name: 'Verify /api/auth/register does NOT exist => 404', passed: true });
        } else {
            results.push({ name: 'Verify /api/auth/register does NOT exist => 404', passed: false, error: error.message });
        }
    }

    // Print results
    console.log('\n📊 Test Results:\n');
    results.forEach((result, index) => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} Test ${index + 1}: ${result.name}`);
        if (!result.passed && result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });

    const passedCount = results.filter(r => r.passed).length;
    console.log(`\n${passedCount}/${results.length} tests passed`);

    if (passedCount === results.length) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed');
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
