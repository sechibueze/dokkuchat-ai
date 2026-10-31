import { openaiClient } from './openai.client';
import { withRetry } from '@/libs/http/retry';
import { createCircuitBreaker } from '@/libs/http/circuit-breaker';

import type {
  ChatMessage,
  LLMOptions,
  LLMProvider,
  LLMResult,
} from '@/modules/ai/contracts/llm-provider';

interface OpenAIChatResponse {
  model: string;
  choices: Array<{
    message: { content: string | null };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

const openaiLLMBreaker = createCircuitBreaker(
  async (payload: Record<string, unknown>) =>
    withRetry(() => openaiClient.post<OpenAIChatResponse>('/chat/completions', payload)),
  'openai-chat',
);

export class OpenAILLMProvider implements LLMProvider {
  readonly providerName = 'openai';

  async generate(messages: ChatMessage[], options: LLMOptions = {}): Promise<LLMResult> {
    const response = await openaiLLMBreaker.fire({
      model: options.model ?? 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxOutputTokens ?? 1000,
    });

    const choice = response.data.choices[0];

    if (!choice || typeof choice.message.content !== 'string') {
      throw new Error('LLM provider returned no text response');
    }

    return {
      text: choice.message.content,
      model: response.data.model,
      inputTokens: response.data.usage?.prompt_tokens ?? 0,
      outputTokens: response.data.usage?.completion_tokens ?? 0,
      finishReason: choice.finish_reason,
    };
  }
}
