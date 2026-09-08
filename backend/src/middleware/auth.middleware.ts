import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthUserPayload } from '../types';
import prisma from '../db/prisma';

interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is missing or malformed'
        }
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token not provided'
        }
      });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (err: any) {
      const isExpired = err.name === 'TokenExpiredError';
      res.status(401).json({
        success: false,
        error: {
          code: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
          message: isExpired
            ? 'Your session has expired. Please log in again.'
            : 'Authentication token is invalid.'
        }
      });
      return;
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user associated with this token no longer exists'
        }
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
