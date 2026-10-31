

export type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  pageNumber: number | null;
  distance: number;
  originalName: string;
};

function vectorLiteral(vector: number[]): string {
  if (vector.length !== 1536 || vector.some((value) => !Number.isFinite(value))) {
    throw new Error('Invalid query embedding');
  }

  return `[${vector.join(',')}]`;
}

export class VectorSearchRepository {
  async search(input: {
    organizationId: string;
    documentIds: string[];
    embedding: number[];
    limit?: number;
  }): Promise<RetrievedChunk[]> {
    if (input.documentIds.length === 0) return [];

    const limit = Math.max(1, Math.min(input.limit ?? Number(process.env.RAG_TOP_K ?? 6), 20));

    const vector = vectorLiteral(input.embedding);

    const rows = await prisma.$queryRaw<RetrievedChunk[]>(
      Prisma.sql`
        SELECT
          c."id",
          c."documentId",
          c."content",
          c."pageNumber",
          (c."embedding" <=> ${vector}::vector)::float8
            AS "distance",
          d."originalName"
        FROM "DocumentChunk" c
        INNER JOIN "Document" d
          ON d."id" = c."documentId"
        WHERE c."organizationId" = ${input.organizationId}
          AND d."organizationId" = ${input.organizationId}
          AND d."status" = 'READY'::"DocumentStatus"
          AND d."deletedAt" IS NULL
          AND c."documentId" IN (
            ${Prisma.join(input.documentIds)}
          )
        ORDER BY c."embedding" <=> ${vector}::vector
        LIMIT ${limit}
      `,
    );

    const minSimilarity = Number(process.env.RAG_MIN_SIMILARITY ?? 0.2);

    return rows.filter((row) => 1 - row.distance >= minSimilarity);
  }
}
