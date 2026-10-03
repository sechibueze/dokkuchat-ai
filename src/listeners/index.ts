import { logger } from '../config/logger';
import { registerCacheListeners } from './cache.listener';
import { registerUserListeners } from './user.listener';

export const setupEventListeners = () => {
  registerUserListeners();

  // Register cache listeners
  registerCacheListeners();

  // Register admin listeners
  //   registerAdminListeners();

  logger.info('[Listeners] All event listeners registered successfully');
};
