import { randomBytes } from 'node:crypto';
import { db } from '@/lib/prisma';
import { databaseClock } from '@/lib/clock';
import { DomainError } from '@/lib/errors';
import { demoToken, hashToken } from './cookies';
import { seedEnvironment } from './fixtures';
import type { VisitorContext } from '@/generated/prisma/client';
export async function provision(visitor: VisitorContext, operationId: string) {
  return db().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "CapacityGuard" WHERE id=1 FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "VisitorContext" WHERE id=${visitor.id}::uuid FOR UPDATE`;
      const now = await databaseClock(tx);
      const receipt = await tx.provisionReceipt.findUnique({
        where: { visitorId_operationId: { visitorId: visitor.id, operationId } },
      });
      let environment = await tx.demoEnvironment.findUnique({ where: { visitorId: visitor.id } });
      if (environment) {
        await tx.$queryRaw`SELECT id FROM "DemoEnvironment" WHERE id=${environment.id}::uuid FOR UPDATE`;
        environment = await tx.demoEnvironment.findUnique({ where: { id: environment.id } });
      }
      if (
        receipt &&
        (!environment ||
          environment.id !== receipt.resultEnvironmentId ||
          now.getTime() >= environment.lastActivityAt.getTime() + 168 * 3600000)
      )
        throw new DomainError(
          'DEMO_EXPIRED',
          'This demonstration expired. Start a new demonstration.',
        );
      if (environment && now.getTime() >= environment.lastActivityAt.getTime() + 168 * 3600000) {
        await tx.visitorContext.update({
          where: { id: visitor.id },
          data: { lastEnvironmentExpiredAt: now },
        });
        await tx.demoEnvironment.delete({ where: { id: environment.id } });
        await tx.provisionReceipt.deleteMany({ where: { visitorId: visitor.id } });
        environment = null;
      }
      let nonce: string;
      let replay = false;
      if (environment) {
        const previous =
          receipt ??
          (await tx.provisionReceipt.findFirst({
            where: { visitorId: visitor.id, resultEnvironmentId: environment.id },
          }));
        if (!previous)
          throw new DomainError('DEMO_SESSION_REQUIRED', 'Start a new demonstration.', 403);
        nonce = previous.nonce;
        replay = true;
      } else {
        const count = await tx.demoEnvironment.count({
          where: { lastActivityAt: { gt: new Date(now.getTime() - 168 * 3600000) } },
        });
        if (count >= 1000)
          throw new DomainError(
            'DEMO_CAPACITY_REACHED',
            'The demonstration is at capacity. Please try again later.',
            503,
          );
        nonce = randomBytes(32).toString('base64url');
        environment = await tx.demoEnvironment.create({
          data: {
            visitorId: visitor.id,
            capabilityHash: hashToken(demoToken(visitor.id, nonce)),
            lastActivityAt: now,
          },
        });
        await seedEnvironment(tx, environment.id, 1, now);
      }
      if (!receipt)
        await tx.provisionReceipt.create({
          data: { visitorId: visitor.id, operationId, nonce, resultEnvironmentId: environment.id },
        });
      await tx.demoEnvironment.update({
        where: { id: environment.id },
        data: { lastActivityAt: now },
      });
      const customers = await tx.customer.findMany({
        where: { environmentId: environment.id, generation: environment.generation },
        orderBy: { displayName: 'asc' },
      });
      return { environment, customers, token: demoToken(visitor.id, nonce), replay };
    },
    { maxWait: 15000, timeout: 20000 },
  );
}
