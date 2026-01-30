import { Router } from 'express';
import { ThreadController } from '../controllers/thread.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../types/shared';

const router = Router();

// Routes
router.get('/unread', requireAuth, ThreadController.getUnreadCount);
router.get('/', requireAuth, ThreadController.getThreads);
router.get('/:id', requireAuth, ThreadController.getThread);
router.post('/', requireAuth, ThreadController.createThread);
router.post('/:id/messages', requireAuth, ThreadController.addMessage);
router.post('/:id/read', requireAuth, ThreadController.markAsRead);

export default router;
