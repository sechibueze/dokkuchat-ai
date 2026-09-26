import dotenv from 'dotenv';
import app from '../app.js';
dotenv.config();
export const projectConfig = {
  appName: process.env.APP_NAME ?? 'Dokkuchat',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
};
