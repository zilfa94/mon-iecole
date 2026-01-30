
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../src/types/shared';
// Removed logger import to avoid ts-node issues

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Unread Badges Logic...');

    // 1. Setup Users (Direction & Parent)
    const direction = await prisma.user.findFirst({ where: { role: UserRole.DIRECTION } });
    const parent = await prisma.user.findFirst({ where: { role: UserRole.PARENT } });

    if (!direction || !parent) {
        console.error('❌ Need both DIRECTION and PARENT users in DB');
        return;
    }

    // 2. Clean previous threads between them
    // Find thread
    const threads = await prisma.messageThread.findMany({
        where: {
            participants: {
                every: {
                    userId: { in: [direction.id, parent.id] }
                }
            }
        }
    });

    // Deleting old threads for clean test
    for (const t of threads) {
        await prisma.message.deleteMany({ where: { threadId: t.id } });
        await prisma.threadParticipant.deleteMany({ where: { threadId: t.id } });
        await prisma.threadRead.deleteMany({ where: { threadId: t.id } });
        await prisma.messageThread.delete({ where: { id: t.id } });
    }
    console.log('🧹 Cleaned old threads');

    // 3. Create a new thread (Direction -> Parent)
    const thread = await prisma.messageThread.create({
        data: {
            lastMessageAt: new Date(),
            participants: {
                create: [
                    { userId: direction.id },
                    { userId: parent.id }
                ]
            }
        }
    });

    // 4. Direction sends a message
    await prisma.message.create({
        data: {
            threadId: thread.id,
            senderId: direction.id,
            content: "Hello Parent, this is a test message."
        }
    });
    console.log('📨 Message sent from Direction');

    // 5. Parent checks threads (Should be 1 unread)
    // Simulate logic from ThreadController.getThreads

    // Mock getThreads for Parent
    const currentUser = parent;

    // Fetch read status
    const lastReadEntry = await prisma.threadRead.findUnique({
        where: {
            threadId_userId: {
                threadId: thread.id,
                userId: currentUser.id
            }
        }
    });
    const lastRead = lastReadEntry?.lastReadAt || thread.createdAt;

    const unreadCount = await prisma.message.count({
        where: {
            threadId: thread.id,
            createdAt: { gt: lastRead },
            senderId: { not: currentUser.id }
        }
    });

    console.log(`🔍 Parent Unread Count: ${unreadCount}`);
    if (unreadCount !== 1) {
        console.error('❌ Expected 1 unread message');
        process.exit(1);
    } else {
        console.log('✅ Unread count correct (1)');
    }

    // 6. Parent marks as read
    await prisma.threadRead.upsert({
        where: {
            threadId_userId: {
                threadId: thread.id,
                userId: currentUser.id
            }
        },
        update: { lastReadAt: new Date() },
        create: {
            threadId: thread.id,
            userId: currentUser.id,
            lastReadAt: new Date()
        }
    });
    console.log('👀 Parent marked as read');

    // 7. Check again (Should be 0)
    const lastReadEntry2 = await prisma.threadRead.findUnique({
        where: {
            threadId_userId: {
                threadId: thread.id,
                userId: currentUser.id
            }
        }
    });
    const lastRead2 = lastReadEntry2?.lastReadAt || thread.createdAt;

    const unreadCount2 = await prisma.message.count({
        where: {
            threadId: thread.id,
            createdAt: { gt: lastRead2 },
            senderId: { not: currentUser.id }
        }
    });

    console.log(`🔍 Parent Unread Count after reading: ${unreadCount2}`);
    if (unreadCount2 !== 0) {
        console.error('❌ Expected 0 unread messages');
        process.exit(1);
    } else {
        console.log('✅ Unread count correct (0)');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
