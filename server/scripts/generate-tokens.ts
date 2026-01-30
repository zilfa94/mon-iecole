

import path from 'path';
import dotenv from 'dotenv';

// Explicitly load .env from the server root (one level up from scripts)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import jwt from 'jsonwebtoken';
import { UserRole } from '../src/types/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

function generateToken(id: number, role: UserRole) {
    return jwt.sign({ id, email: 'test@test.com', role }, JWT_SECRET, { expiresIn: '1h' });
}

// Mocking the test (since we'd need to start the server and run fetch)
// Or better, verify logic via unit test style or just assume manual verification?
// User asked: "teste GET ...".
// I will create a script that generates tokens and prints CURL commands for the user (or uses fetch if I had it installed, but node doesn't have fetch natively in all versions, wait Node 18+ does).
// Checked package.json: "@types/node": "^25.1.0" => Node 25?? Latest is 23. Anyway, recent node has fetch.
// I will write a script that starts the server (programmatically? no complex), 
// Or just I will assume the server is NOT running, so I can't request it.
// I need these tokens to run requests against a running server.
// I will provide the tokens in the output so user can test, OR I will run the server in background?
// Agent can run background processes.

console.log("Tokens for testing:");
console.log("DIRECTION:", generateToken(1, UserRole.DIRECTION)); // ID 1 (Admin)
console.log("PROFESSOR (Non-participant):", generateToken(3, UserRole.PROFESSOR)); // ID 3 (Prof)
console.log("STUDENT (Participant):", generateToken(4, UserRole.STUDENT)); // ID 4 (Student Leo)
console.log("PARENT (Participant):", generateToken(6, UserRole.PARENT)); // ID 6 (Parent Leo)
