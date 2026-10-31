import { z } from 'zod';

// export const createConversationSchema = z.object({
//   title: z.string().trim().min(1).max(120).optional(),
//   documentIds: z.array(z.string().min(1).max(128)).max(50).default([]),
// });

export const sendMessageSchema = z.object({
  message: z.string().trim().min(1).max(12_000),
  documentIds: z.array(z.string().min(1).max(128)).max(50).optional(),
});

export const conversationParamsSchema = z.object({
  conversationId: z.string().min(1).max(128),
});

export const messageHistoryQuerySchema = z.object({
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
