import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { isPostType, PostType, POST_TYPES } from '../types/shared';

export class PostController {
    // Create a new post (DIRECTION, PROFESSOR, STUDENT only - NO PARENTS)
    static async createPost(req: Request, res: Response) {
        try {
            const { content, type, isPinned } = req.body;

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

            // 3. Create post
            const newPost = await prisma.post.create({
                data: {
                    authorId: req.user!.id,
                    content,
                    type, // Validated above
                    isPinned: isPinned || false
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

            return res.status(201).json(newPost);

        } catch (error) {
            console.error('Create post error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // List all posts
    static async listPosts(req: Request, res: Response) {
        try {
            const posts = await prisma.post.findMany({
                include: {
                    author: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true
                        }
                    },
                    comments: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true
                                }
                            }
                        }
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
