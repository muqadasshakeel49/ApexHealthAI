import { Router } from 'express';
import chatController from '../controllers/chat.controller';
import authenticate from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { createSessionSchema, postMessageSchema } from '../validators/chat.validator';
import { aiRateLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

router.post('/sessions', validateBody(createSessionSchema), (req, res, next) =>
  chatController.createSession(req, res, next)
);

router.get('/sessions', (req, res, next) =>
  chatController.getSessions(req, res, next)
);

router.get('/sessions/:id', (req, res, next) =>
  chatController.getSessionById(req, res, next)
);

router.get('/sessions/:id/messages', (req, res, next) =>
  chatController.getMessages(req, res, next)
);

router.post('/sessions/:id/messages', aiRateLimiter, validateBody(postMessageSchema), (req, res, next) =>
  chatController.postMessage(req, res, next)
);

router.delete('/sessions/:id', (req, res, next) =>
  chatController.deleteSession(req, res, next)
);

export default router;
