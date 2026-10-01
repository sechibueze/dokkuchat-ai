import { Request } from 'express';
import type { JwtPayload } from '../libs/jwt.lib.ts';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
