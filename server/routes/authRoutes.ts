import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';
import { validateRegister, validateLogin } from '../middleware/validateMiddleware';

const router = Router();

// POST /api/auth/register
router.post('/register', validateRegister, register);

// POST /api/auth/login
router.post('/login', validateLogin, login);

// GET /api/auth/me (Protected)
router.get('/me', authenticateToken, getMe);

export default router;
