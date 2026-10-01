import { userQueue } from '../queues/user.queue';
import type { UserRegisteredJobData } from '../workers/user.worker';
import { logger } from '../config/logger';
import { appEvents } from '../libs/event.lib';
import { AUTH_EVENTS } from '../events/auth.event';
export const registerUserListeners = () => {
  appEvents.on(
    AUTH_EVENTS.USER_REGISTERED,
    async (payload: UserRegisteredJobData) => {
      try {
        logger.info(
          `[Event: ${AUTH_EVENTS.USER_REGISTERED}] Queuing background tasks for ${payload.email}`,
        );

        // Push jobs into Redis Queue
        await Promise.all([
          userQueue.add('send-welcome-email', payload),
          userQueue.add('update-analytics', payload),
        ]);
      } catch (error) {
        logger.error(
          `Error queuing background tasks for ${payload.email}: ${error}`,
        );
      }
    },
  );
};
