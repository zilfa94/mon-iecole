
import path from 'path';
import dotenv from 'dotenv';

// Explicitly load .env from the server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to database...");
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                isActive: true
            }
        });
        console.log("Users in DB:", JSON.stringify(users, null, 2));
    } catch (e) {
        console.error("Error fetching users:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
