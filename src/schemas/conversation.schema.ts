import { z } from 'zod';

export const createConversationSchema = z.object({
  title: z.string().max(200).optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});
export const conversationListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const conversationParamsSchema = z.object({
  conversationId: z.string().min(1).max(128),
});
export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  documentIds: z.array(z.string().uuid()).optional(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type ConversationListQueryInput = z.infer<typeof conversationListQuerySchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ConversationParamsInput = z.infer<typeof conversationParamsSchema>;
