import { Queue } from 'bullmq';
import { redisConnection } from './connection.queue';

// Name of the background queue
export const USER_QUEUE_NAME = 'user-background-tasks';

// Instantiate queue
export const userQueue = new Queue(USER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s retries
    },
    removeOnComplete: true, // Clean up completed jobs
    removeOnFail: 100, // Keep last 100 failed jobs for debugging
  },
});
