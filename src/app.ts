import express from 'express';
import pinoHttp from 'pino-http';

import { logger } from './config/logger';
import { routes } from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

app.use(express.json());

app.use(
  pinoHttp({
    logger,
  }),
);

app.use('/api', routes);

app.use(errorMiddleware);

export default app;
