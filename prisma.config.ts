import { defineConfig } from '@prisma/config';
import 'dotenv/config';
export default defineConfig({
  migrations: {
    // The folder where your migration files are located
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
