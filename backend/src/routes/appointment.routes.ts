import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller';
import authenticate from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  validateAppointmentSchema
} from '../validators/appointment.validator';

const router = Router();

// All appointment routes require authentication
router.use(authenticate);

router.post('/', validateBody(createAppointmentSchema), (req, res, next) =>
  appointmentController.createAppointment(req, res, next)
);

router.get('/', (req, res, next) =>
  appointmentController.getAppointments(req, res, next)
);

router.get('/:id', (req, res, next) =>
  appointmentController.getAppointmentById(req, res, next)
);

router.patch('/:id/status', validateBody(updateAppointmentStatusSchema), (req, res, next) =>
  appointmentController.updateStatus(req, res, next)
);

router.post('/validate', validateBody(validateAppointmentSchema), (req, res, next) =>
  appointmentController.validate(req, res, next)
);

export default router;
