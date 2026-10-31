import type { EmbeddingProvider, EmbeddingResult } from '@/modules/ai/contracts/embedding-provider';
import { openaiClient } from './openai.client';
import { withRetry } from '@/libs/http/retry';
import { createCircuitBreaker } from '@/libs/http/circuit-breaker';

interface OpenAIEmbeddingResponse {
  data: Array<{
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

const MODEL = 'text-embedding-3-small';
const DIMENSIONS = 1536;

const openaiEmbeddingBreaker = createCircuitBreaker(
  async (input: { input: string[] }) =>
    withRetry(() =>
      openaiClient.post<OpenAIEmbeddingResponse>('/embeddings', {
        model: MODEL,
        input: input.input,
      }),
    ),
  'openai-embeddings',
);

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'openai';
  readonly dimensions = DIMENSIONS;

  async embed(text: string): Promise<EmbeddingResult> {
    const [result] = await this.embedMany([text]);
    return result;
  }

  async embedMany(texts: string[]): Promise<EmbeddingResult[]> {
    if (texts.length === 0) return [];

    if (texts.some((text) => !text.trim())) {
      throw new Error('Embedding inputs cannot be empty');
    }

    // OpenAI accepts batches, but impose an application-level cap.
    const output: EmbeddingResult[] = [];

    for (let offset = 0; offset < texts.length; offset += 64) {
      const batch = texts.slice(offset, offset + 64);
      const response = await openaiEmbeddingBreaker.fire({ input: batch });
      const body = response.data;

      const sorted = [...body.data].sort((a, b) => a.index - b.index);

      if (sorted.length !== batch.length) {
        throw new Error('Embedding provider returned an unexpected result count');
      }

      for (const item of sorted) {
        if (item.embedding.length !== this.dimensions) {
          throw new Error('Embedding dimension mismatch');
        }
      }

      const estimatedPerInput = Math.ceil(body.usage.prompt_tokens / batch.length);

      output.push(
        ...sorted.map((item) => ({
          vector: item.embedding,
          model: body.model,
          inputTokens: estimatedPerInput,
        })),
      );
    }

    return output;
  }
}
