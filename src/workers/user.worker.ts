import { Worker, Job } from 'bullmq';
import { USER_QUEUE_NAME, redisConnection } from '../queues/user-queue.js';
import { logger } from '../utils/logger.js';

export interface UserRegisteredJobData {
  userId: string;
  email: string;
  name: string;
}

// Instantiate worker
export const userWorker = new Worker(
  USER_QUEUE_NAME,
  async (job: Job) => {
    switch (job.name) {
      case 'send-welcome-email': {
        const { email, name } = job.data as UserRegisteredJobData;
        logger.info(`[Job ${job.id}] Sending welcome email to ${email}...`);
        // TODO: Call your email service (e.g. Resend, SendGrid)
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulating email delay
        logger.info(
          `[Job ${job.id}] Welcome email sent successfully to ${email}`,
        );
        break;
      }

      case 'update-analytics': {
        const { userId } = job.data as UserRegisteredJobData;
        logger.info(`[Job ${job.id}] Updating analytics for user ${userId}...`);
        // TODO: Call analytics service (e.g. PostHog, Mixpanel)
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulating API delay
        logger.info(`[Job ${job.id}] Analytics updated for user ${userId}`);
        break;
      }

      default:
        logger.warn(`[Job ${job.id}] Unknown job name: ${job.name}`);
    }
  },
  { connection: redisConnection },
);

// Worker error listeners
userWorker.on('completed', (job) => {
  logger.info(`Job ${job.id} (${job.name}) completed successfully`);
});

userWorker.on('failed', (job, err) => {
  logger.error(
    `Job ${job?.id} (${job?.name}) failed with error: ${err.message}`,
  );
});
