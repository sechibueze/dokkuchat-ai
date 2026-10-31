/*
  Warnings:

  - The primary key for the `Chunk` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `WebhookEvent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `Chunk` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `WebhookEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Chunk" DROP CONSTRAINT "Chunk_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "WebhookEvent" DROP CONSTRAINT "WebhookEvent_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "AIUsage" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "operation" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicros" BIGINT NOT NULL DEFAULT 0,
    "requestId" VARCHAR(128),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageCitation" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "chunkId" UUID NOT NULL,
    "citationIndex" INTEGER NOT NULL,
    "quotedText" VARCHAR(1000),

    CONSTRAINT "MessageCitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIUsage_createdAt_idx" ON "AIUsage"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsage_userId_createdAt_idx" ON "AIUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConversationMessage_conversationId_createdAt_idx" ON "ConversationMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "MessageCitation_documentId_chunkId_idx" ON "MessageCitation"("documentId", "chunkId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageCitation_messageId_citationIndex_key" ON "MessageCitation"("messageId", "citationIndex");

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageCitation" ADD CONSTRAINT "MessageCitation_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ConversationMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
