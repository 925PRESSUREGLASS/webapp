import { z } from 'zod';

var envSchema = z.object({
  // Server configuration
  PORT: z.string().optional(),
  NODE_ENV: z.string().optional(),
  // Database configuration
  DATABASE_URL: z.string().url().nonempty().optional(),
  PRISMA_ACCELERATE_URL: z.string().url().nonempty().optional(),
  // API configuration
  API_KEY: z.string().optional(),
  ALLOWED_ORIGIN: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.string().optional(),
  // AI embeddings configuration
  AI_EMBEDDINGS_URL: z.string().url().optional(),
  AI_EMBEDDINGS_TIMEOUT_MS: z.string().optional(),
  // Email/SMTP configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional()
});

var parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error('Invalid environment variables: ' + JSON.stringify(parsed.error.format(), null, 2));
}

var env = parsed.data;

export { env };
