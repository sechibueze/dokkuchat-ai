import { db } from '@/config/database';

export async function storeChunkEmbeddingsBatch(
  chunks: { id: string; embedding: number[] }[],
): Promise<void> {
  // Use a transaction for atomicity
  await db.$transaction(
    chunks.map((chunk) => {
      const vectorStr = `[${chunk.embedding.join(',')}]`;
      return db.$executeRaw`
        UPDATE "Chunk"
        SET embedding = ${vectorStr}::vector
        WHERE id = ${chunk.id}
      `;
    }),
  );
}
