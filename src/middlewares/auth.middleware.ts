import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';

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
    const decoded = verifyToken(token);
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
      status: 'fail',
      message: 'Invalid or corrupted token',
    });
  }
};
