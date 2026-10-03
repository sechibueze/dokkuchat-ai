import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../libs/errors.lib';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Operational error: we created this intentionally
  if (err instanceof AppError) {
    console.warn(
      `[${err.code}] ${err.message}`,
      err.details ? { details: err.details } : '',
    );

    return res.status(err.statusCode).json({
      status: false,
      error: {
        code: err.isOperational ? 500 : err.code,
        message: !err.isOperational ? 'Internal server error' : err.message,
        ...(err.details && !err.isOperational && { details: err.details }),
      },
    });
  }

  // Programming error: this is a bug
  console.error('Unhandled error:', err);

  return res.status(500).json({
    status: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}

// Scrub sensitive values from error details before responding
function scrubSensitiveData(data: any): any {
  if (typeof data !== 'string') return data;

  const patterns = [
    /Bearer [A-Za-z0-9\-._~+\/]+=*/g, // JWT tokens
    /sk-[A-Za-z0-9]{20,}/g, // OpenAI keys
    /password["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, // password in any format
  ];

  let scrubbed = data;
  for (const pattern of patterns) {
    scrubbed = scrubbed.replace(pattern, '[REDACTED]');
  }
  return scrubbed;
}
