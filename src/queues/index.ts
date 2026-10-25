import { setupUserWorker } from './user.queue';
import { logger } from '../config/logger';

export const setupQueueWorkers = () => {
  setupUserWorker();

  logger.info('[Workers] All BullMQ workers initialized successfully');
};
