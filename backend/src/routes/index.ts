import { Router } from 'express';
import authRoutes from './auth.routes';
import appointmentRoutes from './appointment.routes';
import chatRoutes from './chat.routes';

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chat', chatRoutes);

export default router;
