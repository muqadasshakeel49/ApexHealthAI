/// <reference path="./types/express.d.ts" />
import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import apiRoutes from './routes';
import errorHandler from './middleware/error.middleware';
import { standardRateLimiter } from './middleware/rateLimiter.middleware';
import logger from './utils/logger';

export function createApp(): Express {
  const app = express();

  // 1. Security Headers via Helmet
  app.use(helmet());

  // 2. Cross-Origin Resource Sharing
  app.use(
    cors({
      origin: [config.frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // 3. Request Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Global standard rate limiting
  app.use('/api', standardRateLimiter);

  // 5. Lightweight structured request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl !== '/api/health') {
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
      }
    });
    next();
  });

  // 6. Mount API routes
  app.use('/api', apiRoutes);

  // 7. 404 Route Catch-all
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`
      }
    });
  });

  // 8. Centralized error handling
  app.use(errorHandler);

  return app;
}

export default createApp;
