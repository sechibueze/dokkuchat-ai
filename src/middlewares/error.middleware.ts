import type { NextFunction, Request, Response } from 'express';

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);

  res.status(500).json({
    status: false,
    message: err.message || 'Internal server error',
    error: err,
  });
}
