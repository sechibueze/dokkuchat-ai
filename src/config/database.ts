import { projectConfig } from './env.js';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

console.log('Database URL:', projectConfig.databaseUrl);
const adapter = new PrismaPg({
  connectionString: projectConfig.databaseUrl,
});

export const db = new PrismaClient({ adapter });
