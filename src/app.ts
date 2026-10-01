import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { logger } from './config/logger';
import { routes } from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { registerUserListeners } from './listeners/user.listener.js';
import { verifyWebhookSignature } from './middlewares/verify-webhook.middleware';

const app = express();

app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin requests
// app.use(
//   '/webhooks',
//   verifyWebhookSignature(secret, 'x-signature'),
//   express.raw({
//     type: 'application/json',
//     verify: (req: any, res, buf) => {
//       req.rawBody = buf;
//     },
//   }),
// );

app.use(express.json());

registerUserListeners();

app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.use('/api/v1', routes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.path} not found` },
  });
});

app.use(errorHandler);

export default app;
