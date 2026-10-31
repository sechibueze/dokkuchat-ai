import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import type { Request } from 'express';
import { cacheRedis } from '../libs/cache.lib';
import { env } from '@/config/env';

function createStore(prefix: string) {
  if (!cacheRedis) return undefined;

  return new RedisStore({
    sendCommand: (command, ...args) => cacheRedis.call(command, ...args) as Promise<number>,
    prefix,
  });
}

// Helper to create limiters with Redis backing
function createLimiter(options: {
  windowMs: number;
  max: number | ((req: Request) => number);
  message: string;
  prefix: string;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true, // Send X-RateLimit-* headers
    legacyHeaders: false, // Don't send X-RateLimit-* (old format)
    store: createStore(options.prefix),
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: options.message,
      },
    },
    keyGenerator:
      options.keyGenerator ||
      ((req: Request) => (req as any).user?.sub || ipKeyGenerator(req.ip ?? '') || 'anonymous'),
  });
}

// Auth endpoints: same for everyone, keyed by IP (user isn't authenticated yet)
export const authLimiter = createLimiter({
  prefix: 'rl_auth',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 50 : 10,
  message: 'Too many auth attempts. Please try again later.',
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? '') || 'anonymous',
});

// General API: tier-based
export const apiLimiter = createLimiter({
  prefix: 'rl_api',
  windowMs: 15 * 60 * 1000,
  max: (req: Request) => {
    const tier = (req as any).user?.tier || 'free';
    const limits: Record<string, number> = {
      free: 100,
      pro: 500,
      enterprise: 2000,
    };
    return limits[tier] || 100;
  },
  message: 'Rate limit exceeded. Please slow down.',
});

// Document uploads: tier-based, tight limits
export const uploadLimiter = createLimiter({
  prefix: 'rl_upload',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => {
    const tier = (req as any).user?.tier || 'free';
    const limits: Record<string, number> = {
      free: 5,
      pro: 50,
      enterprise: 500,
    };
    return limits[tier] || 5;
  },
  message: 'Upload limit reached. Please try again later.',
});

// AI/chat queries: tier-based, per-minute (expensive operations)
export const chatLimiter = createLimiter({
  prefix: 'rl_chat',
  windowMs: 60 * 1000, // 1 minute
  max: (req: Request) => {
    const tier = (req as any).user?.tier || 'free';
    const limits: Record<string, number> = {
      free: 10,
      pro: 30,
      enterprise: 100,
    };
    return limits[tier] || 10;
  },
  message: 'Too many queries. Please slow down.',
});
