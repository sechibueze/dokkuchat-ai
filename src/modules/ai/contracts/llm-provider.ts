export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface LLMResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  finishReason: string | null;
}

export interface LLMProvider {
  readonly providerName: string;

  generate(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResult>;
}
