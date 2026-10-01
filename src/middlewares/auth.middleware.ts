import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../libs/jwt.lib';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: false,
        message: 'Authentication token missing or invalid',
      });
    }

    // Extract token string after "Bearer "
    const token = authHeader.split(' ')[1];

    // Verify token and attach user payload to request
    const decoded = verifyAccessToken(token as string);
    req.user = decoded;

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: false,
        message: 'Token has expired',
      });
    }

    return res.status(401).json({
      status: false,
      message: 'Invalid or corrupted token',
    });
  }
};
