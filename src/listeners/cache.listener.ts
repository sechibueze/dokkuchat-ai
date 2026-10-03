import { appEvents } from '../libs/event.lib';

import * as Cache from '../libs/cache.lib';
import { ADMIN_EVENTS } from '../events/admin.event';
export const registerCacheListeners = () => {
  appEvents.on(ADMIN_EVENTS.ROLE_ASSIGNED, async (data) => {
    try {
      const key = `permissions:${data.userId}`;
      await Cache.cacheDel(key);
      console.log(`Cache cleared for key: ${key}`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  });
  appEvents.on(ADMIN_EVENTS.ROLE_REVOKED, async (data) => {
    try {
      const key = `permissions:${data.userId}`;
      await Cache.cacheDel(key);
      console.log(`Cache cleared for key: ${key}`);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  });
};
