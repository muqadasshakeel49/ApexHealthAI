import { z } from 'zod';

export const createSessionSchema = z.object({
  title: z
    .string()
    .max(255, 'Title must not exceed 255 characters')
    .trim()
    .optional()
});

export const postMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim()
});

export const extractedAppointmentSchema = z.object({
  service: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  time: z.string().nullable().default(null),
  notes: z.string().nullable().default(null)
});

export const aiOutputSchema = z.object({
  reply: z.string().min(1, 'Reply cannot be empty'),
  intent: z.enum(['BOOK_APPOINTMENT', 'GENERAL_QUERY', 'UNKNOWN']).default('BOOK_APPOINTMENT'),
  appointment: extractedAppointmentSchema,
  missingFields: z.array(z.string()).default([]),
  readyToBook: z.boolean().default(false),
  confidence: z.number().min(0).max(1).optional()
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type PostMessageInput = z.infer<typeof postMessageSchema>;
export type AIOutputData = z.infer<typeof aiOutputSchema>;
