import { Request } from 'express';
import type { JwtPayload } from '../utils/jwt.util.ts';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
