import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address format')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must not exceed 100 characters'),
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters long')
    .max(255, 'Name must not exceed 255 characters')
    .trim()
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address format')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
