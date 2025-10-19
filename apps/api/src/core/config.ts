import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables first
const envPath = path.join(__dirname, '../../.env');
dotenv.config({ path: envPath });

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('4000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6380'),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const config = envSchema.parse(process.env);

// Common validation schemas
export const idSchema = z.string().cuid();
export const emailSchema = z.string().email();
export const passwordSchema = z.string().min(8);

export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const ratingSchema = z.number().int().min(1).max(5);

export const priceSchema = z.number().int().positive(); // In cents