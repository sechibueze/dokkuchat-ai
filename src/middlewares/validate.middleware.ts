import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export function validate(schema: z.ZodType, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        },
      });
    }

    if (target === 'body') {
      req.body = result.data;
    } else {
      Object.defineProperty(req, target, {
        value: result.data,
        writable: true,
        configurable: true,
      });
    }

    next();
  };
}
