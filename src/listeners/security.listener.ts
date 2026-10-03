import { AUTH_EVENTS } from '../events/auth.event';
import { cacheRedis } from '../libs/cache.lib';
import { appEvents } from '../libs/event.lib';

export const registerSecurityListeners = () => {
  appEvents.on(AUTH_EVENTS.LOGIN_FAILED, async (data) => {
    try {
      const key = `login-failures:${data.deviceInfo}`;
      const failures = await cacheRedis.incr(key);

      // Set expiry on first failure
      if (failures === 1) {
        await cacheRedis.expire(key, 900); // 15 minute window
      }

      if (failures >= 5) {
        console.warn(
          `Security: ${failures} failed logins from ${data.deviceInfo} for ${data.email}`,
        );
        // Could add the IP to a temporary block list here
      }
    } catch (error) {
      console.error('Failed to track login failure:', error);
    }
  });
};
