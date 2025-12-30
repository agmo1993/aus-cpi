import { z } from "zod";

const envSchema = z.object({
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASS: z.string().min(1, "DB_PASS is required"),
  DB_PORT: z.string().default("5432"),
  NEXT_PUBLIC_API_URL: z.string().optional(),
});

// Parse environment variables
// During build time, use default values to avoid errors
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DB_HOST;

export const env = isBuildTime
  ? {
      DB_HOST: 'localhost',
      DB_USER: 'postgres',
      DB_PASS: 'password',
      DB_PORT: '5432',
      NEXT_PUBLIC_API_URL: undefined,
    }
  : envSchema.parse({
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_PASS: process.env.DB_PASS,
      DB_PORT: process.env.DB_PORT,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    });
