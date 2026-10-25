import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { logger } from '@/config/logger';

const CORRELATION_ID_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/;

export const correlationIdMiddleware: RequestHandler = (req, res, next) => {
  const suppliedId = req.get('x-correlation-id');

  const correlationId =
    suppliedId && CORRELATION_ID_PATTERN.test(suppliedId) ? suppliedId : randomUUID();

  res.locals.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  logger.info('HTTP request received', {
    correlationId,
    method: req.method,
    path: req.path,
  });

  next();
};
