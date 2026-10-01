import type { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError } from 'zod';

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Flatten error messages by field key
        const formattedErrors = error.flatten().fieldErrors;

        // Extracts the first error message for each field
        const fieldErrors = Object.keys(formattedErrors).reduce(
          (acc, key) => {
            acc[key] = formattedErrors[key]?.[0] || 'Invalid value';
            return acc;
          },
          {} as Record<string, string>,
        );

        return res.status(400).json({
          status: false,
          message: 'Validation failed',
          errors: fieldErrors,
        });
      }

      next(error);
    }
  };
};
