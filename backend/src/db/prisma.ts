import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prismaClientGlobal: PrismaClient | undefined;
}

export const prisma =
  global.prismaClientGlobal ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' }
          ]
        : [{ emit: 'event', level: 'error' }]
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaClientGlobal = prisma;
}

// Attach logger events when in dev mode
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  prisma.$on('error', (e: any) => {
    logger.error('Prisma Error', { error: e.message });
  });
}

export default prisma;
