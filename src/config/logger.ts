import winston from 'winston';
import { env } from './env';

const isProduction = env.nodeEnv === 'production';

const safeStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();

  return JSON.stringify(value, (_key, currentValue) => {
    if (typeof currentValue === 'bigint') {
      return currentValue.toString();
    }

    if (currentValue instanceof Error) {
      return {
        name: currentValue.name,
        message: currentValue.message,
        stack: currentValue.stack,
      };
    }

    if (currentValue && typeof currentValue === 'object') {
      if (seen.has(currentValue)) {
        return '[Circular Reference]';
      }

      seen.add(currentValue);
    }

    return currentValue;
  });
};

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
            const metaStr = Object.keys(meta).length ? ` ${safeStringify(meta)}` : '';

            return `${timestamp} ${level}: ${message}${metaStr}`;
          }),
        ),
  ),

  defaultMeta: {
    service: 'dokkuchat',
  },

  transports: [new winston.transports.Console()],
});
