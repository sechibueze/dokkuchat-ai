import { ADMIN_EVENTS } from '../events/admin.event';
import { appEvents } from '../libs/event.lib';

export const registerAdminListeners = () => {
  appEvents.on(ADMIN_EVENTS.ROLE_ASSIGNED, async (data) => {
    try {
    } catch (error) {
      console.error('Failed to log role assignment:', error);
    }
  });

  appEvents.on(ADMIN_EVENTS.ROLE_REVOKED, async (data) => {
    try {
    } catch (error) {
      console.error('Failed to log role revocation:', error);
    }
  });
};
