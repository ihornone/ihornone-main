import { z } from 'astro/zod';

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_CHAT_ID: z.string().min(1, 'TELEGRAM_CHAT_ID is required'),
  SITE_URL: z.string().url().optional().default('https://ihornone.site'),
});

function loadEnv() {
  const result = envSchema.safeParse(import.meta.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  return result.data;
}

let _env: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!_env) {
    _env = loadEnv();
  }
  return _env;
}
