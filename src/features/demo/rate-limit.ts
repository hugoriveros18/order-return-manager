import { db } from '@/lib/prisma';
import { DomainError } from '@/lib/errors';
import type { RateCategory } from '@/generated/prisma/client';
export async function admit(
  visitorHash: string,
  kind: 'mutation' | 'reset' | 'create' | 'bootstrap' = 'mutation',
) {
  const quotas: { category: RateCategory; size: number; limit: number }[] = [
    { category: 'MUTATION_MINUTE', size: 60000, limit: kind === 'bootstrap' ? 1000 : 60 },
  ];
  if (kind === 'reset') quotas.push({ category: 'RESET_HOUR', size: 3600000, limit: 5 });
  if (kind === 'create')
    quotas.push({ category: 'CREATE_ENVIRONMENT_HOUR', size: 3600000, limit: 10 });
  try {
    const retry = await db().$transaction(async (tx) => {
      const [clock] = await tx.$queryRaw<
        { ms: bigint }[]
      >`SELECT floor(extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms`;
      const row = { now: new Date(Number(clock.ms)) };
      let wait = 0;
      for (const q of quotas) {
        const start = new Date(Math.floor(row.now.getTime() / q.size) * q.size);
        const end = new Date(start.getTime() + q.size);
        const value = await tx.rateBucket.upsert({
          where: {
            visitorHash_category_windowStart: {
              visitorHash,
              category: q.category,
              windowStart: start,
            },
          },
          create: {
            visitorHash,
            category: q.category,
            windowStart: start,
            expiresAt: end,
            attempts: 1,
          },
          update: { attempts: { increment: 1 } },
        });
        if (value.attempts > q.limit)
          wait = Math.max(wait, Math.ceil((end.getTime() - row.now.getTime()) / 1000));
      }
      return wait;
    });
    if (retry)
      throw new DomainError(
        'RATE_LIMITED',
        'This demonstration has reached its action limit. Please wait before trying again.',
        429,
        retry,
      );
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError(
      'TEMPORARILY_UNAVAILABLE',
      'The demonstration is temporarily unavailable. Please try again.',
      503,
    );
  }
}
