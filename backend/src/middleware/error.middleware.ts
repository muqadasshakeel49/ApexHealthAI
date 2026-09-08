import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  // Log full error internally with context
  logger.error(`[${req.method} ${req.originalUrl}] ${message}`, {
    statusCode,
    code,
    stack: err.stack,
    details: err.details
  });

  const responseBody: {
    success: false;
    error: {
      code: string;
      message: string;
      details?: any;
    };
  } = {
    success: false,
    error: {
      code,
      message
    }
  };

  if (err.details) {
    responseBody.error.details = err.details;
  }

  res.status(statusCode).json(responseBody);
};

export default errorHandler;
