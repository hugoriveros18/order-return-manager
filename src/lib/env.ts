import { config } from 'dotenv';
import { z } from 'zod';
config({ path: '.env.local', quiet: true });
const schema = z.object({
  DATABASE_URL: z.string().startsWith('postgres'),
  DEMO_TOKEN_SECRET: z.string().min(32),
  APP_ORIGIN: z.url(),
  CRON_SECRET: z.string().min(32),
});
export function env() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success)
    throw new Error('Server configuration is incomplete. Check environment variable names.');
  return parsed.data;
}
