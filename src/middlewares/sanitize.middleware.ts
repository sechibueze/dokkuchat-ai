import type { Request, Response, NextFunction } from 'express';
import xss from 'xss';

function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return xss(value, {
      whiteList: {}, // Strip ALL HTML tags
      stripIgnoreTag: true, // Remove unrecognized tags entirely
      stripIgnoreTagBody: ['script', 'style'], // Remove script/style contents
    });
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    const clean: any = {};
    for (const key of Object.keys(value)) {
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }

  return value;
}

export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Safe mutation for req.body
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  // Mutate properties inside req.query individually rather than reassigning req.query
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      req.query[key] = sanitizeValue(req.query[key]);
    }
  }

  // Mutate properties inside req.params individually
  if (req.params && typeof req.params === 'object') {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitizeValue(req.params[key]);
    }
  }

  next();
}
