import dotenv from 'dotenv';
import app from '../app.js';
dotenv.config();
export const projectConfig = {
  appName: process.env.APP_NAME ?? 'Dokkuchat',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: process.env.PORT ?? 5000,
  databaseUrl: process.env.DATABASE_URL,
};
