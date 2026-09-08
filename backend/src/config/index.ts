import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend .env, or fallback to root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_jwt_key_super_secure_32_chars_min',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  mistral: {
    apiKey: process.env.MISTRAL_API_KEY || '',
    model: process.env.MISTRAL_MODEL || 'mistral-small-latest'
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_yKOaA9WvUJ1h@ep-summer-lab-ay7z4myh-pooler.c-5.us-east-2.aws.neon.tech/ai_appointments?sslmode=require&channel_binding=require'
  }
};

export default config;
