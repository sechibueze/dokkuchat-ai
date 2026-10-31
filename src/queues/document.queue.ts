import { Worker, Job, Queue } from 'bullmq';
import { redisConnection } from '@/queues/connection.queue';
import { logger } from '@/config/logger';
import { appEvents } from '@/libs/event.lib';
import { db } from '@/config/database';
import { DocumentJob } from '@/schemas/document.schema';
import { BasicTextExtractor } from '@/modules/documents/extraction/text-extraction';
import { createDocumentStorage } from '@/modules/documents/storage/storage.factory';
import { chunkDocument } from '@/modules/documents/chunking/recursive-character-splitter';
import { createAIProviders } from '@/modules/ai/ai.container';
import { storeChunkEmbeddingsBatch } from '@/modules/ai/services/embedding.service';

export const DOCUMENT_QUEUE_NAME = 'doc-ingestion';
export const documentQueue = new Queue<DocumentJob>(DOCUMENT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s retries
    },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: 100, // Keep last 100 failed jobs for debugging
  },
});

export async function enqueueDocumentIngestion(payload: DocumentJob): Promise<void> {
  await documentQueue.add(DOCUMENT_QUEUE_NAME, payload);
}
const storage = createDocumentStorage();
export const setupDocumentWorker = () => {
  const worker = new Worker<DocumentJob>(
    DOCUMENT_QUEUE_NAME,
    async (job: Job) => {
      const { documentId, ownerId, correlationId } = job.data;
      const startTime = Date.now();

      logger.info('Document processing started', {
        correlationId,
        documentId,
        ownerId,
      });

      try {
        // Step 1: Fetch document
        const doc = await db.document.findUniqueOrThrow({
          where: { id: documentId, status: { in: ['QUEUED', 'FAILED', 'UPLOADED'] } },
        });
        await job.updateProgress(5);

        // Step 2: Extract text
        const textExtractor = new BasicTextExtractor();
        const fileBuffer = await storage.get(doc.storageKey);
        const { text } = await textExtractor.extract(fileBuffer, doc.mimeType);
        await job.updateProgress(15);

        logger.info('Text extracted', {
          correlationId,
          documentId,
          textLength: text.length,
          documentContent: text.substring(0, 50),
        });

        // Step 3: Chunk the text
        const chunks = chunkDocument(text, {
          maxTokens: 500,
          overlapTokens: 20,
          minChunkTokens: 20,
        });

        await job.updateProgress(30);

        logger.info('Document chunked', {
          correlationId,
          documentId,
          chunkCount: chunks.length,
          avgTokens: Math.round(
            chunks.reduce((sum, c) => sum + c.tokenEstimate, 0) / chunks.length,
          ),
        });

        // Step 4: Store chunks in database
        await db.$transaction(async (tx) => {
          await tx.chunk.deleteMany({ where: { documentId } });
          await tx.chunk.createMany({
            data: chunks.map((chunk) => ({
              documentId,
              index: chunk.index,
              content: chunk.text,
              tokenCount: chunk.tokenEstimate,
            })),
          });
        });
        await job.updateProgress(50);

        // Step 5: Generate embeddings
        const chunkTexts = chunks.map((c) => c.text);
        const ai = createAIProviders();
        const embeddings = await ai.embedding.embedMany(chunkTexts);
        await job.updateProgress(85);

        console.log('embeddings', embeddings[0]);

        // Step 6: Store embeddings
        const documentChunks = await db.chunk.findMany({
          where: { documentId },
          orderBy: { index: 'asc' },
          select: { id: true },
        });

        await storeChunkEmbeddingsBatch(
          documentChunks.map((chunk, i) => ({
            id: chunk.id,
            embedding: embeddings[i].vector,
          })),
        );
        await job.updateProgress(95);

        // Step 7: Mark complete
        await db.document.update({
          where: { id: documentId },
          data: {
            status: 'READY',
            chunkCount: chunks.length,
          },
        });
        await job.updateProgress(100);

        const duration = Date.now() - startTime;

        // Emit completion event with metrics
        appEvents.emit('doc:processed', {
          documentId,
          ownerId,
          correlationId,
          chunkCount: documentChunks.length,
          durationMs: duration,
        });

        logger.info('Document processing complete', {
          correlationId,
          documentId,
          durationMs: duration,
        });

        return {
          success: true,
          durationMs: duration,
        };
      } catch (error) {
        if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
          await db.document.update({
            where: { id: documentId },
            data: {
              status: 'FAILED',
              error: (error as Error).message,
            },
          });
        }
        logger.error('Document processing failed', {
          correlationId,
          documentId,
          error: (error as Error).message,
          attempt: job.attemptsMade + 1,
        });
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 3,
    },
  );

  return worker;
};
