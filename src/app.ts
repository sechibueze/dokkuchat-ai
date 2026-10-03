import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { logger } from './config/logger';
import { routes } from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { verifyWebhookSignature } from './middlewares/verify-webhook.middleware';
import { setupEventListeners } from './listeners';
import * as RateLimiter from './middlewares/rate-limiter.middleware';
import { sanitizeInput } from './middlewares/sanitize.middleware';
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'none'"],
        styleSrc: ["'none'"],
        imgSrc: ["'none'"],
        connectSrc: ["'self'"],
        // Allow Swagger UI
        // scriptSrc: ["'self'", "'unsafe-inline'"],
        // styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
);

const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3001'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Cache preflight requests for 24 hours
  }),
);

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
app.use(sanitizeInput);
setupEventListeners();

app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.use('/api/v1', RateLimiter.apiLimiter, routes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.path} not found` },
  });
});

app.use(errorHandler);

export default app;
