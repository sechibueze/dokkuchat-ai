import { z } from 'zod';

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Infer TypeScript type from schema if needed
export type LoginUserInput = z.infer<typeof loginUserSchema>;
