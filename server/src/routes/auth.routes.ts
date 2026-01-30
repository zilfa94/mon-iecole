import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', AuthController.login);
router.get('/me', requireAuth, AuthController.me);

export default router;
