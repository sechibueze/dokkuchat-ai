import { setupUserWorker } from './user.queue';
import { logger } from '../config/logger';
import { setupDocumentWorker } from './document.queue';

export const setupQueueWorkers = () => {
  // setupUserWorker();
  setupDocumentWorker();

  logger.info('[Workers] All BullMQ workers initialized successfully');
};
