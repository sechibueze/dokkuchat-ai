import { setupUserWorker } from './user.worker';
import { logger } from '../config/logger';

export const setupWorkers = () => {
  setupUserWorker();

  logger.info('[Workers] All BullMQ workers initialized successfully');
};
