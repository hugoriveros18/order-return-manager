import { config } from 'dotenv';
config({ path: '.env.local', quiet: true });
export function testDatabaseUrl() {
  const value = process.env.TEST_DATABASE_URL;
  if (!value) throw new Error('TEST_DATABASE_URL is required.');
  const target = new URL(value);
  if (
    !target.pathname.endsWith('_test') ||
    value === process.env.DATABASE_URL ||
    !['127.0.0.1', 'localhost'].includes(target.hostname)
  )
    throw new Error('Refusing an unsafe test database target.');
  return value;
}
