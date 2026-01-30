import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../types/shared';

const router = Router();

// Toutes les routes user sont strictement protégées : DIRECTION only
router.use(requireAuth);
// 1. Routes accessibles à tous les utilisateurs connectés
router.get('/me', UserController.me);
router.get('/me/students', UserController.getMyStudents);
router.get('/me/classes', UserController.getMyClasses);

// 2. Middleware: Restriction DIRECTION uniquement pour la suite
router.use(requireRole([UserRole.DIRECTION]));

// 3. Routes Admin (Direction Only)
router.post('/', UserController.createUser);
router.get('/', UserController.listUsers);
router.patch('/:id', UserController.updateUser);

export default router;
