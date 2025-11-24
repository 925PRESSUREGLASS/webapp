import { z } from 'zod';

var envSchema = z.object({
  DATABASE_URL: z.string().url().nonempty(),
  API_KEY: z.string().optional(),
  ALLOWED_ORIGIN: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.string().optional()
});

var parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error('Invalid environment variables: ' + JSON.stringify(parsed.error.format(), null, 2));
}

var env = parsed.data;

export { env };
