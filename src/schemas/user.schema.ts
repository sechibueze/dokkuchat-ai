import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name must be at least 1 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Infer TypeScript type from schema if needed
export type CreateUserInput = z.infer<typeof createUserSchema>;
