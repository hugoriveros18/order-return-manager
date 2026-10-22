import { db } from '@/lib/prisma';
import { databaseClock, type Clock } from '@/lib/clock';
export async function cleanup(clock: Clock = databaseClock) {
  const now = await db().$transaction((tx) => clock(tx));
  const candidates = await db().demoEnvironment.findMany({
    where: { lastActivityAt: { lte: new Date(now.getTime() - 168 * 3600000) } },
    orderBy: { lastActivityAt: 'asc' },
    take: 100,
    select: { id: true },
  });
  let deletedCount = 0;
  for (const { id } of candidates) {
    const deleted = await db().$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '2s'`;
        const [locked] = await tx.$queryRaw<
          { id: string }[]
        >`SELECT id FROM "DemoEnvironment" WHERE id=${id}::uuid FOR UPDATE`;
        const env = locked
          ? await tx.demoEnvironment.findUnique({ where: { id: locked.id } })
          : null;
        if (!env) return false;
        const current = await clock(tx);
        if (current.getTime() < env.lastActivityAt.getTime() + 168 * 3600000) return false;
        await tx.visitorContext.update({
          where: { id: env.visitorId },
          data: { lastEnvironmentExpiredAt: current },
        });
        await tx.provisionReceipt.deleteMany({ where: { resultEnvironmentId: id } });
        await tx.demoEnvironment.delete({ where: { id } });
        return true;
      },
      { timeout: 10000 },
    );
    if (deleted) deletedCount++;
  }
  await db().rateBucket.deleteMany({ where: { expiresAt: { lt: now } } });
  await db()
    .$executeRaw`DELETE FROM "VisitorContext" v WHERE v."createdAt" < ${new Date(now.getTime() - 30 * 86400000)} AND NOT EXISTS (SELECT 1 FROM "DemoEnvironment" e WHERE e."visitorId"=v.id)`;
  return { deletedCount };
}
