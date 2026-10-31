import Redis from 'ioredis';
import { env } from '@/config/env';

// Shared Redis connection
export const redisConnection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // Required by BullMQ
});
