import { db } from '@/config/database';
import type { EmbeddingProvider } from '@/modules/ai/contracts/embedding-provider';
import { createAIProviders } from '../ai/ai.container';

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  text: string;
  similarity: number;
}
const aiProvider = createAIProviders();
export class RetrievalService {
  constructor() {}

  async search(input: {
    ownerId: string;
    query: string;
    limit?: number;
  }): Promise<RetrievedChunk[]> {
    const limit = Math.max(1, Math.min(input.limit ?? 5, 20));
    const embedded = await aiProvider.embedding.embed(input.query);

    // pgvector expects a vector literal such as [0.1,0.2,...].
    // Validate every value before constructing the parameter value.
    if (
      embedded.vector.length !== aiProvider.embedding.dimensions ||
      embedded.vector.some((value) => !Number.isFinite(value))
    ) {
      throw new Error('Invalid query embedding');
    }

    const vectorLiteral = `[${embedded.vector.join(',')}]`;

    return db.$queryRaw<RetrievedChunk[]>`
      SELECT
        dc.id AS "chunkId",
        dc."documentId" AS "documentId",
        dc.content AS "text",
        1 - (dc.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "Chunk" dc
      INNER JOIN "Document" d ON d.id = dc."documentId"
      WHERE d."ownerId" = ${input.ownerId}::uuid
        AND d.status = 'READY'
        AND d."deletedAt" IS NULL
      ORDER BY dc.embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `;
  }
}
