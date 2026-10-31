import 'dotenv/config';
import { z } from 'zod';
import { logger } from './logger';

const optionalString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),

  DATABASE_URL: z.string().min(1),

  REDIS_URL: optionalString,
  LOCAL_STORAGE_ROOT: optionalString,
  DOCUMENT_MAX_BYTES: optionalString,
  DOCUMENT_STORAGE_PROVIDER: z.string().min(1),
  AWS_ENDPOINT_URL: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  OPENAI_BASE_URL: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_API_KEY: optionalString,
  OPENAI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(30000),
  HTTP_MAX_RETRY_ATTEMPTS: z.coerce.number().int().min(1).max(5).default(3),

  OLLAMA_EMBEDDING_NATIVE_DIMENSIONS: optionalString,
  OLLAMA_EMBEDDING_MODEL: optionalString,
  EMBEDDING_COLUMN_DIMENSIONS: optionalString,

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  AUTH_ACCESS_TOKEN_SECRET: z.string().min(1),
  AUTH_REFRESH_TOKEN_SECRET: z.string().min(1),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900000),
  AUTH_REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(3600).default(604800),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  logger.error(
    'Invalid environment configuration:',
    result.error.issues.map(({ path, message }) => ({
      field: path.join('.'),
      message,
    })),
  );

  throw new Error('Environment configuration validation failed');
}

export const env = Object.freeze(result.data);
