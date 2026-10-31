import { ollamaClient } from './ollama.client';
import { withRetry } from '@/libs/http/retry';
import { createCircuitBreaker } from '@/libs/http/circuit-breaker';

import type {
  ChatMessage,
  LLMOptions,
  LLMProvider,
  LLMResult,
} from '@/modules/ai/contracts/llm-provider';

interface OllamaChatResponse {
  model: string;
  message: {
    role: string;
    content: string;
    thinking?: string; // present for reasoning models when think is enabled
  };
  done: boolean;
  done_reason?: string; // 'stop' | 'length' | 'load' ...
  prompt_eval_count?: number;
  eval_count?: number;
}

const DEFAULT_MODEL = process.env.OLLAMA_LLM_MODEL ?? 'qwen3:8b';
// Ollama's default context window is small (4096) and silently truncates long
// prompts, which is bad for RAG. Set this to what your hardware can handle.
const NUM_CTX = Number(process.env.OLLAMA_NUM_CTX ?? 8192);
const GENERATION_TIMEOUT_MS = Number(process.env.OLLAMA_LLM_TIMEOUT_MS ?? 120_000);

const ollamaLLMBreaker = createCircuitBreaker(
  async (payload: Record<string, unknown>) =>
    withRetry(() =>
      ollamaClient.post<OllamaChatResponse>('/api/chat', payload, {
        timeout: GENERATION_TIMEOUT_MS, // local generation is slower than the embedding default
      }),
    ),
  'ollama-chat',
);

export class OllamaLLMProvider implements LLMProvider {
  readonly providerName = 'ollama';

  async generate(messages: ChatMessage[], options: LLMOptions = {}): Promise<LLMResult> {
    const response = await ollamaLLMBreaker.fire({
      model: options.model ?? DEFAULT_MODEL,
      messages,
      stream: false,
      think: false, // keep reasoning out of `content` for Qwen3-style models
      keep_alive: '30m',
      options: {
        temperature: options.temperature ?? 0.2,
        num_predict: options.maxOutputTokens ?? 1000,
        num_ctx: NUM_CTX,
      },
    });

    const body = response.data;

    if (!body.message || typeof body.message.content !== 'string' || !body.message.content) {
      throw new Error('LLM provider returned no text response');
    }

    return {
      text: body.message.content,
      model: body.model,
      inputTokens: body.prompt_eval_count ?? 0,
      outputTokens: body.eval_count ?? 0,
      finishReason: body.done_reason ?? null,
    };
  }
}
