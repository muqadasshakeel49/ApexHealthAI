import { z } from 'zod';

// Helper to get today's date in YYYY-MM-DD
function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const createAppointmentSchema = z.object({
  service: z
    .string({ required_error: 'Service is required' })
    .min(2, 'Service must be at least 2 characters long')
    .max(100, 'Service must not exceed 100 characters')
    .trim(),
  appointmentDate: z
    .string({ required_error: 'Appointment date is required' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((dateStr) => {
      const today = getTodayString();
      return dateStr >= today;
    }, {
      message: 'Appointment date cannot be in the past'
    }),
  appointmentTime: z
    .string({ required_error: 'Appointment time is required' })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in 24-hour HH:mm format (e.g. 14:00)'),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined)
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], {
    required_error: 'Status is required'
  })
});

export const validateAppointmentSchema = createAppointmentSchema;

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
