import app from './app';
import { projectConfig } from './config/env';
import { logger } from './config/logger';
import { db } from './config/database';
import { setupWorkers } from './workers';

async function startServer() {
  try {
    setupWorkers();
    await db.$connect();

    logger.info('Database connected');

    app.listen(projectConfig.port, () => {
      logger.info(
        `${projectConfig.appName} server running on http://localhost:${projectConfig.port}`,
      );
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');

    await db.$disconnect();

    process.exit(1);
  }
}

startServer();
