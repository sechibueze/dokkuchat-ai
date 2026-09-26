import jwt from 'jsonwebtoken';
import { projectConfig } from '../config/env.js';

const JWT_SECRET = projectConfig.jwtSecret;
const JWT_EXPIRES_IN = projectConfig.jwtExpiresIn;

export interface JwtPayload {
  id: string;
  tier: string;
}

/**
 * Signs a new JWT access token containing essential user claims.
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};
