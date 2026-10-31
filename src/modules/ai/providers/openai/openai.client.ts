import axios from 'axios';
import { logger } from '@/config/logger.js';
import { env } from '@/config/env';

export const openaiClient = axios.create({
  baseURL: env.OPENAI_BASE_URL,
  timeout: env.OPENAI_TIMEOUT_MS,
  headers: {
    ...(env.OPENAI_API_KEY ? { Authorization: `Bearer ${env.OPENAI_API_KEY}` } : {}),
    'Content-Type': 'application/json',
    'User-Agent': 'DocuChat/1.0',
  },
});

openaiClient.interceptors.request.use((config) => {
  config.headers.set('X-Request-Started-At', String(Date.now()));

  logger.debug('Outgoing AI provider request', {
    method: config.method?.toUpperCase(),
    path: config.url,
  });

  return config;
});

openaiClient.interceptors.response.use(
  (response) => {
    const start = Number(response.config.headers.get('X-Request-Started-At'));

    logger.info('AI provider request completed', {
      status: response.status,
      path: response.config.url,
      durationMs: Number.isFinite(start) ? Date.now() - start : undefined,
      requestId: response.headers['x-request-id'],
    });

    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      logger.warn('AI provider request failed', {
        status: error.response?.status,
        path: error.config?.url,
        code: error.code,
      });
    }

    return Promise.reject(error);
  },
);
