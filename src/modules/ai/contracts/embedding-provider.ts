export interface EmbeddingResult {
  vector: number[];
  model: string;
  inputTokens: number;
}

export interface EmbeddingProvider {
  readonly providerName: string;
  readonly dimensions: number;

  embed(text: string): Promise<EmbeddingResult>;

  embedMany(texts: string[]): Promise<EmbeddingResult[]>;
}
