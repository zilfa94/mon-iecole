
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        // Attempt to access the attachments relation in a query (type-safe)
        const message = await prisma.message.findFirst({
            include: {
                attachments: true // Verify this property exists
            }
        });

        console.log('✅ Attachments relation exists on Message model in Prisma Client.');

        // Attempt to access the messageThread participants relation in a query (type-safe)
        const thread = await prisma.messageThread.findFirst({
            include: {
                participants: true
            }
        });

        console.log('✅ Participants relation exists on MessageThread model in Prisma Client.');

    } catch (error) {
        console.error('❌ Error verifying types:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
