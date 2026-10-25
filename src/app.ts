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
import { requestLogger } from './middlewares/request-logger.middleware';
import { metricsRegistry } from './libs/metrics.lib';
import { metricsMiddleware } from './middlewares/metrics.middleware';
import { setupQueueWorkers } from './queues';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { correlationIdMiddleware } from './middlewares/correlation-id.middleware';

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

const allowedOrigins = env.CORS_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
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
app.disable('x-powered-by');
app.use(requestLogger);
app.use(express.json({ limit: '1mb' }));
app.use(sanitizeInput);
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
  });
  next();
});

app.use(metricsMiddleware);

// Metrics endpoint (no auth — Prometheus needs to scrape it)
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', metricsRegistry.contentType);
  res.send(await metricsRegistry.metrics());
});
// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Also serve the raw JSON spec
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
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
