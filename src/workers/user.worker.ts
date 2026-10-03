import { Worker, Job } from 'bullmq';
import { logger } from '../config/logger.js';
import { USER_QUEUE_NAME } from '../queues/user.queue.js';
import { redisConnection } from '../queues/connection.queue.js';

export interface UserRegisteredJobData {
  userId: string;
  email: string;
  name: string;
}

export const setupUserWorker = () => {
  const userWorker = new Worker(
    USER_QUEUE_NAME,
    async (job: Job) => {
      logger.info(`[Job ${job.id}] Processing ${job.name}`);

      switch (job.name) {
        case 'send-welcome-email': {
          const { email } = job.data as UserRegisteredJobData;
          logger.info(`[Job ${job.id}] Sending welcome email to ${email}...`);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          logger.info(
            `[Job ${job.id}] Welcome email sent successfully to ${email}`,
          );
          break;
        }

        case 'update-analytics': {
          const { userId } = job.data as UserRegisteredJobData;
          logger.info(
            `[Job ${job.id}] Updating analytics for user ${userId}...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 800));
          logger.info(`[Job ${job.id}] Analytics updated for user ${userId}`);
          break;
        }

        default:
          logger.warn(`[Job ${job.id}] Unknown job name: ${job.name}`);
      }
    },
    { connection: redisConnection },
  );

  userWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} (${job.name}) completed successfully`);
  });

  userWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} (${job?.name}) failed: ${err.message}`);
  });

  return userWorker;
};
