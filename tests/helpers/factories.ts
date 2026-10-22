import { testDatabaseUrl } from './database-target';
process.env.ORM_TEST_DATABASE_URL = testDatabaseUrl();
import { visitorToken } from '@/features/demo/cookies';
import { randomUUID, createHash } from 'node:crypto';
import { db } from '@/lib/prisma';
import { seedCatalog, seedEnvironment } from '@/features/demo/fixtures';
import type { ReturnStatus } from '@/generated/prisma/client';
export async function fixture(now = new Date()) {
  const token = visitorToken();
  const hash = createHash('sha256').update(token).digest('hex');
  const visitor = await db().visitorContext.create({ data: { tokenHash: hash } });
  return db().$transaction(
    async (tx) => {
      await seedCatalog(tx);
      const environment = await tx.demoEnvironment.create({
        data: { visitorId: visitor.id, capabilityHash: hash, lastActivityAt: now },
      });
      const customers = await seedEnvironment(tx, environment.id, 1, now, false);
      const order = await tx.order.findFirstOrThrow({
        where: { environmentId: environment.id, status: 'DELIVERED' },
        orderBy: { deliveredAt: 'desc' },
      });
      const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
      return { token, hash, visitor, environment, customers, order, items };
    },
    { timeout: 20000 },
  );
}
export async function requestFixture(
  f: Awaited<ReturnType<typeof fixture>>,
  status: ReturnStatus = 'PENDING',
  quantity = 1,
) {
  const item = f.items[0];
  return db().$transaction(async (tx) => {
    const r = await tx.returnRequest.create({
      data: {
        environmentId: f.environment.id,
        generation: 1,
        orderId: f.order.id,
        customerId: f.order.customerId,
        displayNumber: 'RET-' + randomUUID().slice(0, 8),
        reason: 'Does not fit my workspace',
        status,
        rejectionReason: status === 'REJECTED' ? 'Outside demo condition' : null,
        version: status === 'PENDING' ? 1 : status === 'RECEIVED' ? 3 : 2,
      },
    });
    await tx.returnItem.create({
      data: {
        environmentId: f.environment.id,
        generation: 1,
        requestId: r.id,
        orderItemId: item.id,
        orderId: f.order.id,
        quantity,
      },
    });
    await tx.historyEvent.create({
      data: {
        environmentId: f.environment.id,
        generation: 1,
        requestId: r.id,
        sequence: 1,
        eventType: 'CREATED',
        actorKind: 'CUSTOMER',
        actorCustomerId: f.order.customerId,
      },
    });
    if (status !== 'PENDING')
      await tx.historyEvent.create({
        data: {
          environmentId: f.environment.id,
          generation: 1,
          requestId: r.id,
          sequence: 2,
          eventType: status === 'RECEIVED' ? 'APPROVED' : status,
          actorKind: status === 'CANCELLED' ? 'CUSTOMER' : 'ADMIN',
          actorCustomerId: status === 'CANCELLED' ? f.order.customerId : null,
          reason: status === 'REJECTED' ? 'Outside demo condition' : null,
        },
      });
    if (status === 'RECEIVED')
      await tx.historyEvent.create({
        data: {
          environmentId: f.environment.id,
          generation: 1,
          requestId: r.id,
          sequence: 3,
          eventType: 'RECEIVED',
          actorKind: 'ADMIN',
        },
      });
    return r;
  });
}
export async function removeFixture(f: Awaited<ReturnType<typeof fixture>>) {
  await db().visitorContext.delete({ where: { id: f.visitor.id } });
}
