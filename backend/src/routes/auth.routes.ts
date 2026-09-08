import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import authenticate from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), (req, res, next) =>
  authController.register(req, res, next)
);

router.post('/login', authRateLimiter, validateBody(loginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

export default router;
