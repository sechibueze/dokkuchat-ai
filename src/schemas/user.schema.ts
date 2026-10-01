import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name must be at least 1 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name must be at least 1 characters').optional(),
  email: z.string().email('Invalid email address format').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
});

// Infer TypeScript type from schema if needed
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
