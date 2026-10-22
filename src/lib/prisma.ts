import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import { env } from './env';
const shared = globalThis as unknown as { ormPrisma?: PrismaClient };
function create() {
  const pool = new Pool({
    connectionString:
      (process.env.NODE_ENV !== 'production' ? process.env.ORM_TEST_DATABASE_URL : undefined) ??
      env().DATABASE_URL,
    max: 5,
    options: '-c timezone=UTC',
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });
  if (process.env.VERCEL) attachDatabasePool(pool);
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}
export function db() {
  return shared.ormPrisma ?? (shared.ormPrisma = create());
}
export type { PrismaClient };
export type { Prisma } from '@/generated/prisma/client';
