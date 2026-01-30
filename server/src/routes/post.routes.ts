import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../types/shared';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create post: DIRECTION, PROFESSOR, STUDENT only (NO PARENTS)
router.post('/', requireRole([UserRole.DIRECTION, UserRole.PROFESSOR, UserRole.STUDENT]), PostController.createPost);

// List posts: All authenticated users can view
router.get('/', PostController.listPosts);

// Pin/Unpin post: DIRECTION only
router.patch('/:id/pin', requireRole([UserRole.DIRECTION]), PostController.togglePin);

export default router;
