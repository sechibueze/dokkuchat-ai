import { projectConfig } from './env.js';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: projectConfig.databaseUrl,
});

export const db = new PrismaClient({
  adapter,
  omit: { user: { password_hash: true } },
});
