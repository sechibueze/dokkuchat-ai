import Redis from 'ioredis';
import { projectConfig } from '../config/env';

// Shared Redis connection
export const redisConnection = new Redis(
  projectConfig.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null, // Required by BullMQ
  },
);
