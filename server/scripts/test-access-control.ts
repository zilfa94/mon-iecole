
import jwt from 'jsonwebtoken';
import { UserRole } from '../src/types/enums';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateToken(id: number, role: UserRole) {
    return jwt.sign({ id, email: 'test@test.com', role }, JWT_SECRET, { expiresIn: '1h' });
}

// IDs from seed:
// 1: Direction
// 2: Professor
// 3: Student (Participant in thread 1)
// 4: Parent (Participant in thread 1)
// Thread ID: 1

const BASE_URL = 'http://localhost:3000/api/threads/1';

async function testRequest(name: string, token: string | null, expectedStatus: number) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(BASE_URL, { headers });
        console.log(`[${name}] Status: ${response.status} (Expected: ${expectedStatus}) - ${response.status === expectedStatus ? 'PASS' : 'FAIL'}`);
        if (response.status !== expectedStatus) {
            console.log('Response:', await response.text());
        }
    } catch (e) {
        console.error(`[${name}] Error:`, e);
    }
}

async function run() {
    console.log('--- Starting Access Control Tests ---');

    // 1. No Token
    await testRequest('No Token', null, 401);

    // 2. Non Participant (Professor ID 2)
    const tokenProf = generateToken(2, UserRole.PROFESSOR);
    await testRequest('Non-Participant (Prof)', tokenProf, 403);

    // 3. Participant (Student ID 3)
    const tokenStudent = generateToken(3, UserRole.STUDENT);
    await testRequest('Participant (Student)', tokenStudent, 200);

    // 4. Direction (ID 1)
    const tokenDirection = generateToken(1, UserRole.DIRECTION);
    await testRequest('Direction (Admin)', tokenDirection, 200);

    console.log('--- Tests Finished ---');
}

run();
