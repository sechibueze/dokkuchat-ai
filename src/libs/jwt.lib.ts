import jwt from 'jsonwebtoken';
import { projectConfig } from '../config/env.js';

const JWT_SECRET = projectConfig.jwtSecret;
const JWT_REFRESH_SECRET = projectConfig.jwtRefreshSecret;
const JWT_EXPIRES_IN = projectConfig.jwtExpiresIn;

export interface JwtPayload {
  sub: string;
  tier: string;
  type: 'access' | 'refresh';
}

/**
 * Signs a new JWT access token containing essential user claims.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
};
