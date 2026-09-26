import pino from 'pino';
import { projectConfig } from './env';
export const logger = pino({
  level: projectConfig.nodeEnv === 'production' ? 'info' : 'debug',

  transport:
    projectConfig.nodeEnv !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
});
