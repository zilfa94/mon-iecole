import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../types/shared';
import { upload, handleFileUpload } from '../middlewares/upload.middleware';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Create post: DIRECTION, PROFESSOR, STUDENT only (NO PARENTS) - with file upload support
router.post('/', requireRole([UserRole.DIRECTION, UserRole.PROFESSOR, UserRole.STUDENT]), upload.array('files', 5), handleFileUpload, PostController.createPost);

// List posts: All authenticated users can view
router.get('/', PostController.listPosts);

// Create comment: All authenticated users can comment
router.post('/:id/comments', PostController.createComment);

// Update post: Author or DIRECTION only (checked in controller)
router.patch('/:id', PostController.updatePost);

// Delete post: Author or DIRECTION only (checked in controller)
router.delete('/:id', PostController.deletePost);

// Pin/Unpin post: DIRECTION only
router.patch('/:id/pin', requireRole([UserRole.DIRECTION]), PostController.togglePin);

export default router;
