import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { UserRole } from '../types/shared';

export class ThreadController {
    static async getThread(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const threadId = parseInt(id as string);

            if (isNaN(threadId)) {
                return res.status(400).json({ error: 'Invalid thread ID' });
            }

            // Ensure user is authenticated
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const currentUser = req.user;

            const thread = await prisma.messageThread.findUnique({
                where: { id: threadId },
                include: {
                    messages: {
                        orderBy: { createdAt: 'asc' },
                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    role: true,
                                },
                            },
                        },
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    role: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!thread) {
                return res.status(404).json({ error: 'Thread not found' });
            }

            // Access Control: Check if user is participant or DIRECTION
            const isParticipant = thread.participants.some((p: { userId: number }) => p.userId === currentUser.id);
            if (currentUser.role !== UserRole.DIRECTION && !isParticipant) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            return res.json(thread);
        } catch (error) {
            console.error('Error fetching thread:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async getThreads(req: Request, res: Response) {
        try {
            const currentUser = req.user!;

            // 1. Fetch threads
            const threads = await prisma.messageThread.findMany({
                where: {
                    participants: {
                        some: { userId: currentUser.id }
                    }
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    role: true
                                }
                            }
                        }
                    },
                    student: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1, // Last message only for preview
                    }
                },
                orderBy: {
                    lastMessageAt: 'desc'
                }
            });

            // 2. Fetch Read Status for this user on these threads
            const threadIds = threads.map((t: { id: number }) => t.id);
            const threadReads = await prisma.threadRead.findMany({
                where: {
                    userId: currentUser.id,
                    threadId: { in: threadIds }
                }
            });

            // Map for quick lookup
            const readMap = new Map<number, Date>();
            threadReads.forEach((tr: { threadId: number; lastReadAt: Date }) => readMap.set(tr.threadId, tr.lastReadAt));

            // 3. Calculate unread counts
            const threadsWithUnread = await Promise.all(threads.map(async (thread: any) => {
                const lastRead = readMap.get(thread.id) || thread.createdAt;

                const unreadCount = await prisma.message.count({
                    where: {
                        threadId: thread.id,
                        createdAt: { gt: lastRead },
                        senderId: { not: currentUser.id }
                    }
                });

                return { ...thread, unreadCount };
            }));

            return res.json(threadsWithUnread);

        } catch (error) {
            console.error('Get threads error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async addMessage(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const threadId = parseInt(id as string);
            const { content } = req.body;
            const currentUser = req.user!;

            // 1. Validation content
            if (!content || typeof content !== 'string') {
                return res.status(400).json({ error: 'Content is required' });
            }
            const trimmedContent = content.trim();
            if (trimmedContent.length < 1 || trimmedContent.length > 2000) {
                return res.status(400).json({ error: 'Content must be between 1 and 2000 characters' });
            }

            if (isNaN(threadId)) {
                return res.status(400).json({ error: 'Invalid thread ID' });
            }

            // 2. Load thread + participants for RBAC
            const thread = await prisma.messageThread.findUnique({
                where: { id: threadId },
                include: { participants: true }
            });

            if (!thread) {
                return res.status(404).json({ error: 'Thread not found' });
            }

            // 3. Strict Access Control
            const isParticipant = thread.participants.some((p: any) => p.userId === currentUser.id);
            if (currentUser.role !== UserRole.DIRECTION && !isParticipant) {
                return res.status(403).json({ error: 'Forbidden' });
            }

            // 4. Transaction: Create Message + Update Thread
            const result = await prisma.$transaction(async (tx: any) => {
                // Create message
                const newMessage = await tx.message.create({
                    data: {
                        threadId,
                        senderId: currentUser.id,
                        content: trimmedContent
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                role: true
                            }
                        }
                    }
                });

                // Update thread timestamp
                await tx.messageThread.update({
                    where: { id: threadId },
                    data: { lastMessageAt: new Date() }
                });

                return newMessage;
            });

            return res.json(result);

        } catch (error) {
            console.error('Add message error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async createThread(req: Request, res: Response) {
        try {
            const currentUser = req.user!;
            const { studentId, recipientRole, recipientUserId } = req.body;

            // 1. Basic Validation
            if (!studentId || isNaN(Number(studentId))) {
                return res.status(400).json({ error: 'Invalid or missing studentId' });
            }

            // 2. Validate Student Rights (Parent only)
            if (currentUser.role === UserRole.PARENT) {
                // Check if studentId is linked to this parent
                const parentLink = await prisma.parentStudent.findUnique({
                    where: {
                        parentId_studentId: {
                            parentId: currentUser.id,
                            studentId: Number(studentId)
                        }
                    }
                });
                if (!parentLink) {
                    return res.status(403).json({ error: 'Forbidden: You ignore this child' });
                }
            }

            // 3. Validate Student Rights (Professor only)
            if (currentUser.role === UserRole.PROFESSOR) {
                // Check if the student is in a class taught by this professor
                // We need to fetch the student's classId first or do a joined query
                const student = await prisma.user.findUnique({
                    where: { id: Number(studentId) },
                    select: { classId: true }
                });

                if (!student || !student.classId) {
                    return res.status(404).json({ error: 'Student not found or not in a class' });
                }

                const canTeach = await prisma.professorClass.findUnique({
                    where: {
                        professorId_classId: {
                            professorId: currentUser.id,
                            classId: student.classId
                        }
                    }
                });

                if (!canTeach) {
                    return res.status(403).json({ error: 'Forbidden: You do not teach this student' });
                }
            }
            // 4. Determine Recipient ID
            let targetRecipientId = recipientUserId;

            if (!targetRecipientId) {
                // Fallback logic
                if (recipientRole === UserRole.DIRECTION) {
                    const directionUser = await prisma.user.findFirst({
                        where: { role: UserRole.DIRECTION, isActive: true, id: { not: currentUser.id } }
                    });
                    if (!directionUser) {
                        return res.status(404).json({ error: 'No other Direction user found' });
                    }
                    targetRecipientId = directionUser.id;
                } else if (recipientRole === UserRole.PROFESSOR) {
                    const profUser = await prisma.user.findFirst({
                        where: { role: UserRole.PROFESSOR, isActive: true }
                    });
                    if (!profUser) {
                        return res.status(404).json({ error: 'No Professor found' });
                    }
                    targetRecipientId = profUser.id;
                } else if (recipientRole === UserRole.PARENT) {
                    // Find parent of the student
                    const parentStudent = await prisma.parentStudent.findFirst({
                        where: { studentId: Number(studentId) },
                        include: { parent: true }
                    });
                    if (!parentStudent) {
                        return res.status(404).json({ error: 'Student has no parent linked' });
                    }
                    targetRecipientId = parentStudent.parentId;
                } else {
                    return res.status(400).json({ error: 'Invalid recipient role: ' + recipientRole });
                }
            }

            // 4. Prevent Self-Messaging
            if (targetRecipientId === currentUser.id) {
                return res.status(400).json({ error: 'Cannot create thread with yourself' });
            }

            // 5. Uniqueness Check
            const candidateThreads = await prisma.messageThread.findMany({
                where: { studentId: Number(studentId) },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, role: true }
                            }
                        }
                    },
                    student: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' }
                    }
                }
            });

            const found = candidateThreads.find((t: any) =>
                t.participants.some((p: any) => p.userId === currentUser.id) &&
                t.participants.some((p: any) => p.userId === targetRecipientId)
            );

            if (found) {
                return res.status(200).json(found);
            }

            // 6. Create New Thread
            const newThread = await prisma.messageThread.create({
                data: {
                    studentId: Number(studentId),
                    lastMessageAt: new Date(),
                    participants: {
                        create: [
                            { userId: currentUser.id },
                            { userId: targetRecipientId }
                        ]
                    }
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, firstName: true, lastName: true, role: true }
                            }
                        }
                    },
                    student: {
                        select: { id: true, firstName: true, lastName: true }
                    },
                    messages: true // Empty initially
                }
            });

            return res.status(201).json(newThread);

        } catch (error) {
            console.error('Create thread error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async markAsRead(req: Request, res: Response) {
        try {
            const currentUser = req.user!;
            const threadId = Number(req.params.id);

            // 1. Check participation
            const participant = await prisma.threadParticipant.findUnique({
                where: {
                    threadId_userId: {
                        threadId: threadId,
                        userId: currentUser.id
                    }
                }
            });

            if (!participant) {
                return res.status(403).json({ error: 'Forbidden: You are not part of this thread' });
            }

            // 2. Upsert ThreadRead
            await prisma.threadRead.upsert({
                where: {
                    threadId_userId: {
                        threadId: threadId,
                        userId: currentUser.id
                    }
                },
                update: {
                    lastReadAt: new Date()
                },
                create: {
                    threadId: threadId,
                    userId: currentUser.id,
                    lastReadAt: new Date()
                }
            });

            return res.json({ success: true });

        } catch (error) {
            console.error('Mark as read error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
