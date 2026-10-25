import { env } from './env';
import { PrismaClient } from '../../prisma/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
});

export const db = new PrismaClient({
  adapter,
  omit: { user: { password: true } },
});
