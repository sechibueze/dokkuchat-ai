import { OpenAIEmbeddingProvider } from './providers/openai/openai-embedding.provider.js';
import { OpenAILLMProvider } from './providers/openai/openai-llm.provider.js';
import type { EmbeddingProvider } from './contracts/embedding-provider.js';
import type { LLMProvider } from './contracts/llm-provider.js';
import { OllamaEmbeddingProvider } from './providers/ollama/ollama-embedding.provider.js';
import { OllamaLLMProvider } from './providers/ollama/ollama-llm.provider.js';

export interface AIProviders {
  embedding: EmbeddingProvider;
  llm: LLMProvider;
}

export function createAIProviders(): AIProviders {
  const provider = (process.env.AI_PROVIDER ?? 'ollama') as string;

  switch (provider) {
    case 'openai':
      return {
        embedding: new OpenAIEmbeddingProvider(),
        llm: new OpenAILLMProvider(),
      };

    case 'ollama':
      return {
        embedding: new OllamaEmbeddingProvider(),
        llm: new OllamaLLMProvider(),
      };

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

export const aiProviders = createAIProviders();
