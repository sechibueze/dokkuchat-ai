import type { EmbeddingProvider, EmbeddingResult } from '@/modules/ai/contracts/embedding-provider';
import { ollamaClient } from './ollama.client';
import { withRetry } from '@/libs/http/retry';
import { createCircuitBreaker } from '@/libs/http/circuit-breaker';
import { env } from '@/config/env';

interface OllamaEmbedResponse {
  model: string;
  embeddings: number[][];
  prompt_eval_count?: number;
  total_duration?: number;
  load_duration?: number;
}

// `ollama list`
const MODEL = env.OLLAMA_EMBEDDING_MODEL ?? 'qwen3-embedding:0.6b';
const BATCH_SIZE = 32;
// Native output size of your Qwen model (0.6b = 1024, 4b = 2560, 8b = 4096)
const NATIVE_DIMENSIONS = Number(env.OLLAMA_EMBEDDING_NATIVE_DIMENSIONS ?? 1024);
// Size of the pgvector column
const DIMENSIONS = Number(env.EMBEDDING_COLUMN_DIMENSIONS ?? 1536);

const ollamaEmbeddingBreaker = createCircuitBreaker(
  async (input: { input: string[] }) =>
    withRetry(() =>
      ollamaClient.post<OllamaEmbedResponse>('/api/embed', {
        model: MODEL,
        input: input.input,
        truncate: true, // truncate over-long inputs instead of erroring
        keep_alive: '30m', // avoid reloading the model between ingestion batches
        // dimensions: DIMENSIONS, // optional: Qwen3 embedding supports reduced dims on recent Ollama versions
      }),
    ),
  'ollama-embeddings',
);
function padVector(vector: number[]): number[] {
  if (vector.length === DIMENSIONS) return vector;
  const padded = new Array<number>(DIMENSIONS).fill(0);
  for (let i = 0; i < vector.length; i++) padded[i] = vector[i];
  return padded;
}
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'ollama';
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
    if (NATIVE_DIMENSIONS > DIMENSIONS) {
      throw new Error(
        `Model dimensions (${NATIVE_DIMENSIONS}) exceed column dimensions (${DIMENSIONS}); padding can't fix this`,
      );
    }

    const output: EmbeddingResult[] = [];

    for (let offset = 0; offset < texts.length; offset += BATCH_SIZE) {
      const batch = texts.slice(offset, offset + BATCH_SIZE);
      const response = await ollamaEmbeddingBreaker.fire({ input: batch });
      const body = response.data;

      // Ollama returns results in input order; no `index` field to sort by.
      if (!Array.isArray(body.embeddings) || body.embeddings.length !== batch.length) {
        throw new Error('Embedding provider returned an unexpected result count');
      }

      for (const vector of body.embeddings) {
        if (vector.length !== NATIVE_DIMENSIONS) {
          throw new Error(
            `Embedding dimension mismatch: expected ${NATIVE_DIMENSIONS}, got ${vector.length}`,
          );
        }
      }

      // Ollama reports one token count for the whole batch (may be absent).
      const estimatedPerInput = Math.ceil((body.prompt_eval_count ?? 0) / batch.length);

      output.push(
        ...body.embeddings.map((vector: number[]) => ({
          vector: padVector(vector),
          model: body.model ?? MODEL,
          inputTokens: estimatedPerInput,
        })),
      );
    }

    return output;
  }
}
