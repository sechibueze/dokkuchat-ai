import { Router } from 'express';

import { ChatController } from '@/controllers/chat.controller';
import { validate } from '@/middlewares/validate.middleware.js';
import {
  conversationListQuerySchema,
  conversationParamsSchema,
  createConversationSchema,
  sendMessageSchema,
} from '@/schemas/conversation.schema.js';
import { authenticate } from '@/middlewares/auth.middleware';

const router = Router();
const chatController = new ChatController();

router.use(authenticate);

router.post(
  '/conversations',
  validate(createConversationSchema),
  chatController.createConversation,
);

router.get(
  '/conversations',
  validate(conversationListQuerySchema, 'query'),
  chatController.listConversations,
);

// router.get('/conversations/:conversationId', controller.getConversation.bind(controller));

// router.get('/conversations/:conversationId/messages', controller.getHistory.bind(controller));

router.post(
  '/conversations/:conversationId/messages',
  validate(sendMessageSchema),
  validate(conversationParamsSchema, 'params'),
  chatController.sendMessage,
);

export default router;
