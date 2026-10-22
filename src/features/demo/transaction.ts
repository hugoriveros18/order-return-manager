import type { DemoEnvironment } from '@/generated/prisma/client';
import { db, type Prisma } from '@/lib/prisma';
import { DomainError } from '@/lib/errors';
import { databaseClock, type Clock } from '@/lib/clock';
export type Context = { tx: Prisma.TransactionClient; environment: DemoEnvironment; now: Date };
export async function withEnvironment<T>(
  hash: string,
  activity: boolean,
  callback: (context: Context) => Promise<T>,
  clock: Clock = databaseClock,
): Promise<T> {
  for (let attempt = 0; ; attempt++)
    try {
      return await db().$transaction(
        async (tx) => {
          await tx.$executeRaw`SET LOCAL lock_timeout = '10s'`;
          const [locked] = await tx.$queryRaw<
            { id: string }[]
          >`SELECT id FROM "DemoEnvironment" WHERE "capabilityHash"=${hash} FOR UPDATE`;
          const environment = locked
            ? await tx.demoEnvironment.findUnique({ where: { id: locked.id } })
            : null;
          if (!environment)
            throw new DomainError(
              'DEMO_SESSION_REQUIRED',
              'Start or continue your demonstration.',
              403,
            );
          const now = await clock(tx);
          if (now.getTime() >= environment.lastActivityAt.getTime() + 168 * 3600000)
            throw new DomainError(
              'DEMO_EXPIRED',
              'This demonstration expired after seven days without activity. Start a new demonstration.',
            );
          const result = await callback({ tx, environment, now });
          if (activity)
            await tx.demoEnvironment.update({
              where: { id: environment.id },
              data: { lastActivityAt: now },
            });
          return result;
        },
        { isolationLevel: 'ReadCommitted', maxWait: 15000, timeout: 20000 },
      );
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (['P2034', '40P01'].includes(code) && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 20 + Math.random() * 40));
        continue;
      }
      if (['P2034', '40P01', 'P2010'].includes(code) && !(error instanceof DomainError))
        throw new DomainError(
          'STATE_CONFLICT',
          'Another action is in progress. Refresh and try again.',
        );
      throw error;
    }
}
export function scope(c: Context) {
  return { environmentId: c.environment.id, generation: c.environment.generation };
}
