import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/services/auth.service';
import prisma from '../src/db/prisma';
import config from '../src/config';

// Mock Prisma
jest.mock('../src/db/prisma', () => ({
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    it('should register a new user and return user object and JWT token', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date()
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(prisma.user.create).toHaveBeenCalled();

      // Verify token
      const decoded: any = jwt.verify(result.token, config.jwt.secret);
      expect(decoded.userId).toBe('user-uuid-1');
      expect(decoded.email).toBe('test@example.com');
    });

    it('should throw 409 EMAIL_EXISTS if email is already taken', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-id',
        email: 'test@example.com'
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User'
        })
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'EMAIL_EXISTS'
      });

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login an existing user with valid credentials', async () => {
      const plainPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: hashedPassword,
        createdAt: new Date()
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: plainPassword
      });

      expect(result).toHaveProperty('token');
      expect(result.user.id).toBe('user-uuid-1');
    });

    it('should throw 401 INVALID_CREDENTIALS for non-existent email', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS'
      });
    });

    it('should throw 401 INVALID_CREDENTIALS for incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 10);

      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        passwordHash: hashedPassword
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword'
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS'
      });
    });
  });
});
