// import { prisma } from '../../shared/prisma.js';

import { db } from '@/config/database';
import { logger } from '@/config/logger';
import { ConflictError } from '@/libs/errors.lib';
import { RAGService } from '@/modules/chat/rag.service';

// import { badRequest, conflict, notFound } from '../../shared/http-error.js';

// import { RagService } from '../rag/rag.service.js';

const rag = new RAGService();

type ChatScope = {
  userId: string;
};

export class ChatService {
  async createConversation(
    input: ChatScope & {
      title?: string;
      documentIds: string[];
    },
  ) {
    const documentIds = [...new Set(input.documentIds)];

    await this.assertDocumentsReady(documentIds);

    const conversation = await db.conversation.create({
      data: {
        userId: input.userId,
        title: input.title?.trim() || 'New conversation',
        // documentIds,
      },
      select: {
        id: true,
        title: true,
        // documentIds: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return conversation;
  }

  async listConversations(
    input: ChatScope & {
      cursor?: string;
      limit: number;
    },
  ) {
    const rows = await db.conversation.findMany({
      where: {
        userId: input.userId,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
      ...(input.cursor
        ? {
            cursor: { id: input.cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        title: true,
        // documentIds: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: {
            content: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;

    return {
      items,
      nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
    };
  }

  async getConversation(
    input: ChatScope & {
      conversationId: string;
    },
  ) {
    const conversation = await db.conversation.findFirst({
      where: {
        id: input.conversationId,
        // organizationId: input.organizationId,
        userId: input.userId,
      },
      select: {
        id: true,
        title: true,
        // documentIds: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!conversation) {
      throw new ConflictError('Conversation not found');
    }

    return conversation;
  }

  async getHistory(
    input: ChatScope & {
      conversationId: string;
      before?: string;
      limit: number;
    },
  ) {
    await this.getConversation(input);

    const beforeMessage = input.before
      ? await prisma.chatMessage.findFirst({
          where: {
            id: input.before,
            conversationId: input.conversationId,
            // organizationId: input.organizationId,
          },
          select: {
            id: true,
            createdAt: true,
          },
        })
      : null;

    if (input.before && !beforeMessage) {
      throw badRequest('History cursor not found');
    }

    const rows = await prisma.chatMessage.findMany({
      where: {
        conversationId: input.conversationId,
        organizationId: input.organizationId,
        ...(beforeMessage
          ? {
              OR: [
                {
                  createdAt: {
                    lt: beforeMessage.createdAt,
                  },
                },
                {
                  createdAt: beforeMessage.createdAt,
                  id: { lt: beforeMessage.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: input.limit + 1,
      select: {
        id: true,
        role: true,
        content: true,
        citations: true,
        promptTokens: true,
        completionTokens: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > input.limit;

    const items = (hasMore ? rows.slice(0, input.limit) : rows).reverse();

    return {
      items,
      nextCursor: hasMore ? (items[0]?.id ?? null) : null,
    };
  }

  async sendMessage(
    input: ChatScope & {
      conversationId: string;
      message: string;
      documentIds?: string[];
    },
  ) {
    const conversation = await this.getConversation(input);

    // const documentIds =
    //   input.documentIds === undefined ? conversation.documentIds : [...new Set(input.documentIds)];

    // await this.assertDocumentsReady(documentIds);

    // if (input.documentIds !== undefined) {
    //   await db.conversation.update({
    //     where: { id: conversation.id },
    //     data: {
    //       documentIds,
    //       updatedAt: new Date(),
    //     },
    //   });
    // }
    const historyRows = await db.conversationMessage.findMany({
      where: {
        conversationId: conversation.id,
        // organizationId: input.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        role: true,
        content: true,
      },
    });

    const userMessage = await db.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          // organizationId: input.organizationId,
          // userId: input.userId,
          role: 'user',
          content: input.message,
        },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    const ragResult = await rag.answer({
      question: input.message,
      userId: input.userId,
      maxOutputTokens: 500,
      // organizationId: input.organizationId,
      // documentIds,
      history: historyRows.reverse().filter(
        (
          message,
        ): message is {
          role: 'user' | 'assistant';
          content: string;
        } => message.role === 'user' || message.role === 'assistant',
      ),
    });

    const assistantMessage = await db.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          // organizationId: input.organizationId,
          role: 'assistant',
          content: ragResult.answer,

          citations: {
            create: ragResult.sources.map((s, i) => ({
              messageId: userMessage.id,
              documentId: s.documentId,
              chunkId: s.chunkId,
              citationIndex: i,
              quotedText: s.excerpt,
            })),
          },
          inputTokens: ragResult.usage.inputTokens,
          outputTokens: ragResult.usage.outputTokens,
        },
        select: {
          id: true,
          role: true,
          content: true,
          citations: true,
          inputTokens: true,
          outputTokens: true,
          createdAt: true,
        },
      });

      await tx.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      return created;
    });
    logger.info('chat ok', {
      id: 'hu',
    });
    return {
      conversationId: conversation.id,
      userMessage: userMessage.content,
      assistantMessage: assistantMessage.content,
    };
  }

  private async assertDocumentsReady(documentIds: string[]): Promise<void> {
    if (documentIds.length === 0) return;

    const documents = await db.document.findMany({
      where: {
        id: { in: documentIds },
        status: 'READY',
        deletedAt: null,
      },
      select: { id: true },
    });

    if (documents.length !== documentIds.length) {
      throw new ConflictError('One or more selected documents are unavailable or not ready');
    }
  }
}
