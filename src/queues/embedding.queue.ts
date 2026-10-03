import { Queue } from 'bullmq';
import { redisConnection } from './connection.queue';

export const embeddingQueue = new Queue('embedding-generation', {
  connection: redisConnection,
});
