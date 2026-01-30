import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isPostType, PostType, POST_TYPES } from '../types/shared';

export class PostController {
    // Create a new post (DIRECTION, PROFESSOR, STUDENT only - NO PARENTS)
    static async createPost(req: Request, res: Response) {
        try {
            const { content, type, isPinned, classId } = req.body;

            // 1. Strict Runtime Validation for Type
            if (!isPostType(type)) {
                return res.status(400).json({
                    error: 'Invalid post type provided. Must be one of: ' + POST_TYPES.join(', ')
                });
            }

            // 2. Validate required fields
            if (!content) {
                return res.status(400).json({ error: 'Content is required' });
            }

            // 3. Get uploaded files from middleware (if any)
            const uploadedFiles = (req as any).uploadedFiles || [];

            // 4. Create post with attachments
            const newPost = await prisma.post.create({
                data: {
                    authorId: req.user!.id,
                    content,
                    type, // Validated above
                    isPinned: isPinned || false,
                    classId: classId ? parseInt(classId) : null,
                    attachments: {
                        create: uploadedFiles.map((file: any) => ({
                            url: file.url,
                            filename: file.filename,
                            mimeType: file.mimeType,
                            size: file.size
                        }))
                    }
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    attachments: true
                }
            });

            return res.status(201).json(newPost);

        } catch (error) {
            console.error('Create post error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // List all posts (Scoped)
    static async listPosts(req: Request, res: Response) {
        try {
            const currentUser = req.user!;
            const { classId } = req.query;

            let whereClause: any = {};

            // Scoping Logic
            if (currentUser.role === 'STUDENT' || currentUser.role === 'PARENT') {
                // Students/Parents see Global Posts (classId null) OR Posts for their class
                // We need to fetch student's classId first if not in session (assuming session usage for MVP)
                // For MVP, simplistic check: 
                // If Student -> user.classId
                // If Parent -> fetch children's classIds? 

                // Keep it simple for V1.1: 
                // PARENT/STUDENT sees GLOBAL + THEIR Class(es).

                const userClassIds: number[] = [];
                if (currentUser.role === 'STUDENT' && currentUser.classId) {
                    userClassIds.push(currentUser.classId);
                }
                // (Parent logic omitted for brevity in V1.1 - assuming they see global for now or we check relations)
                // If PARENT, we need to fetch their kids.
                if (currentUser.role === 'PARENT') {
                    const parentData = await prisma.user.findUnique({
                        where: { id: currentUser.id },
                        include: {
                            parentStudents: {
                                include: {
                                    student: { select: { classId: true } }
                                }
                            }
                        }
                    });
                    parentData?.parentStudents.forEach(ps => {
                        if (ps.student.classId) userClassIds.push(ps.student.classId);
                    });
                }

                whereClause = {
                    OR: [
                        { classId: null }, // Global
                        { classId: { in: userClassIds } } // Their classes
                    ]
                };
            } else {
                // DIRECTION / PROFESSOR
                // If strict class filter requested
                if (classId && classId !== 'all') {
                    whereClause = { classId: parseInt(classId as string) };
                }
                // If no filter or 'all', they see EVERYTHING (Direction) 
                // OR (Professor) they see Global + Their Classes? 
                // Usually Profs want to see everything or filter.
                // Let's default to: If no filter, see ALL posts (simple).
            }

            const posts = await prisma.post.findMany({
                where: whereClause,
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    class: {
                        select: { name: true }
                    },
                    attachments: true,
                    comments: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        },
                        orderBy: { createdAt: 'asc' }
                    }
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            return res.json(posts);
        } catch (error) {
            console.error('List posts error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Create a comment on a post
    static async createComment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { content } = req.body;

            // 1. Validate content
            if (!content || content.trim().length === 0) {
                return res.status(400).json({ error: 'Comment content is required' });
            }

            // 2. Create comment
            const comment = await prisma.comment.create({
                data: {
                    postId: parseInt(id),
                    authorId: req.user!.id,
                    content: content.trim()
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    }
                }
            });

            return res.status(201).json(comment);

        } catch (error) {
            console.error('Create comment error:', error);
            // Handle post not found
            if ((error as any).code === 'P2003') {
                return res.status(404).json({ error: 'Post not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Toggle pin status (DIRECTION only)
    static async togglePin(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { isPinned } = req.body;

            // 1. Strict Validation
            if (typeof isPinned !== 'boolean') {
                return res.status(400).json({ error: 'isPinned must be a boolean' });
            }

            // 2. Update post
            const post = await prisma.post.update({
                where: { id: Number(id) },
                data: { isPinned }
            });

            return res.json(post);
        } catch (error) {
            console.error('Toggle pin error:', error);
            // Handle record not found
            if ((error as any).code === 'P2025') {
                return res.status(404).json({ error: 'Post not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}
