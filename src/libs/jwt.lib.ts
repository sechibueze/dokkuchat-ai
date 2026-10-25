import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

export interface JwtPayload {
  sub: string;
  tier: string;
  role: string;
  type: 'access' | 'refresh';
}

/**
 * Signs a new JWT access token containing essential user claims.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  });
};
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.AUTH_REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.AUTH_ACCESS_TOKEN_SECRET) as JwtPayload;
};
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.AUTH_REFRESH_TOKEN_SECRET) as JwtPayload;
};
