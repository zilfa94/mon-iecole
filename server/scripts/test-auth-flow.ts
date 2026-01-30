
const BASE_URL = 'http://localhost:3000/api/auth';

async function testAuth() {
    console.log('--- Starting Auth Flow Tests ---');

    console.log('1. Testing Login...');
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@ecole.com', password: 'password123' })
        });

        if (response.status === 200) {
            console.log('Login Success (200) - PASS');

            // Extract cookie from set-cookie header
            // Note: In Node fetch, headers.get('set-cookie') might return all cookies as string or null depending on version.
            const cookie = response.headers.get('set-cookie');
            console.log('Cookie received:', cookie ? 'YES' : 'NO');

            if (cookie) {
                console.log('2. Testing /me with Cookie...');
                const meResponse = await fetch(`${BASE_URL}/me`, {
                    headers: { 'Cookie': cookie }
                });

                if (meResponse.status === 200) {
                    const data = await meResponse.json();
                    console.log('Me Success (200) - PASS');
                    console.log('User:', data.user.email, data.user.role);
                } else {
                    console.log('Me Failed:', meResponse.status, await meResponse.text());
                }
            } else {
                console.log('Cannot proceed: No cookie received');
            }

        } else {
            console.log('Login Failed:', response.status, await response.text());
        }

    } catch (e) {
        console.error('Error:', e);
    }

    console.log('--- Auth Tests Finished ---');
}

testAuth();
