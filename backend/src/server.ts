/// <reference path="./types/express.d.ts" />
import createApp from './app';
import config from './config';
import logger from './utils/logger';
import prisma from './db/prisma';

const app = createApp();

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database successfully.');

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Backend server running on port ${config.port} in ${config.env} mode`);
      logger.info(`Health check: http://localhost:${config.port}/api/health`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database connection closed. Server terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default async function handler(req: any, res: any) {
  return app(req, res);
}
