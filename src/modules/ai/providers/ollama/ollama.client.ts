import { env } from '@/config/env';
import axios from 'axios';

export const ollamaClient = axios.create({
  baseURL: env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  timeout: 60_000, // first call can be slow while the model loads
  headers: { 'Content-Type': 'application/json' },
});
