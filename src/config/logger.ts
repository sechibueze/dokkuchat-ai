import pino from 'pino';
import { projectConfig } from './env';
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

// export const logger = pino({
//   level: projectConfig.nodeEnv === 'production' ? 'info' : 'debug',

//   transport:
//     projectConfig.nodeEnv !== 'production'
//       ? {
//           target: 'pino-pretty',
//           options: {
//             colorize: true,
//             translateTime: 'SYS:standard',
//           },
//         }
//       : undefined,
// });

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? ` ${JSON.stringify(meta)}`
              : '';
            return `${timestamp} ${level}: ${message}${metaStr}`;
          }),
        ),
  ),
  defaultMeta: { service: 'dokkuchat' },
  transports: [new winston.transports.Console()],
});
