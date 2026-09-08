import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';
import config from '../config';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

export class AuthService {
  async register(data: RegisterInput) {
    const normalizedEmail = data.email.toLowerCase();

    // Check duplicate email
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: data.name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    const token = this.generateToken(user.id, user.email, user.name);
    logger.info('User successfully registered', { userId: user.id, email: user.email });

    return { user, token };
  }

  async login(data: LoginInput) {
    const normalizedEmail = data.email.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive'
        }
      }
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = this.generateToken(user.id, user.email, user.name);
    logger.info('User logged in successfully', { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      token
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  private generateToken(userId: string, email: string, name: string): string {
    return jwt.sign(
      { userId, email, name },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn as any }
    );
  }
}

export const authService = new AuthService();
export default authService;
