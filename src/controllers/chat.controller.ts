import type { NextFunction, Request, Response } from 'express';

import { ChatService } from '@/services/chat.service';

// import {
//   conversationListQuerySchema,
//   conversationParamsSchema,
//   createConversationSchema,
//   messageHistoryQuerySchema,
//   sendMessageSchema,
// } from './chat.schemas.js';
import {
  ConversationListQueryInput,
  ConversationParamsInput,
  CreateConversationInput,
  SendMessageInput,
} from '@/schemas/conversation.schema.js';

const service = new ChatService();

export class ChatController {
  async createConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const conversationInput = req.body as CreateConversationInput;
      const conversation = await service.createConversation({
        userId: req.user?.sub as string,
        title: conversationInput.title,
        documentIds: conversationInput.documentIds,
      });

      return res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  }

  async listConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as ConversationListQueryInput;

      const result = await service.listConversations({
        userId: req.user?.sub as string,
        cursor: query.cursor,
        limit: query.limit,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getConversation(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = conversationParamsSchema.parse(req.params);

      const result = await service.getConversation({
        conversationId,
        organizationId: res.locals.organizationId,
        userId: res.locals.auth.userId,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { conversationId } = conversationParamsSchema.parse(req.params);

      const query = messageHistoryQuerySchema.parse(req.query);

      const result = await service.getHistory({
        conversationId,
        organizationId: res.locals.organizationId,
        userId: res.locals.auth.userId,
        before: query.before,
        limit: query.limit,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const input = req.body as SendMessageInput;
      const params = req.params as ConversationParamsInput;

      const result = await service.sendMessage({
        conversationId: params.conversationId,
        userId: req.user?.sub as string,
        message: input.message,
        documentIds: input.documentIds,
      });

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
