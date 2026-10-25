import app from './app';
import { env } from '@/config/env';
import { logger } from './config/logger';
import { db } from './config/database';
import { setupQueueWorkers } from './queues';
import { setupEventListeners } from './listeners';

async function startServer() {
  try {
    // setupEventListeners();
    // setupQueueWorkers();
    await db.$connect();
    logger.info('Database connected');

    app.listen(env.PORT, () => {
      logger.info(`${env.APP_NAME || 'Dokkuchat'} server running on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);

    await db.$disconnect();

    process.exit(1);
  }
}

startServer();
