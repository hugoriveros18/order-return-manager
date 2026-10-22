import { describe, it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { db } from '@/lib/prisma';
import { withEnvironment } from '@/features/demo/transaction';
import { fixedClock } from '../helpers/clock';
import { admit } from '@/features/demo/rate-limit';
import { runOperation } from '@/features/demo/operations';
import { randomUUID } from 'node:crypto';
describe('PostgreSQL foundation', () => {
  it('enforces positive units and cross-environment parent ownership', async () => {
    const a = await fixture(),
      b = await fixture();
    try {
      await expect(
        db().orderItem.update({ where: { id: a.items[0].id }, data: { purchasedQuantity: 0 } }),
      ).rejects.toThrow();
      await expect(
        db().order.update({ where: { id: a.order.id }, data: { customerId: b.customers[0].id } }),
      ).rejects.toThrow();
    } finally {
      await removeFixture(a);
      await removeFixture(b);
    }
  });
  it('expires at the exact boundary before touching activity', async () => {
    const f = await fixture(new Date('2026-10-01T12:00:00Z'));
    try {
      expect(
        await withEnvironment(
          f.hash,
          false,
          async () => true,
          fixedClock(new Date('2026-10-08T11:59:59Z')),
        ),
      ).toBe(true);
      await expect(
        withEnvironment(
          f.hash,
          true,
          async () => true,
          fixedClock(new Date('2026-10-08T12:00:00Z')),
        ),
      ).rejects.toMatchObject({ code: 'DEMO_EXPIRED' });
      expect(
        (await db().demoEnvironment.findUniqueOrThrow({ where: { id: f.environment.id } }))
          .lastActivityAt,
      ).toEqual(f.environment.lastActivityAt);
    } finally {
      await removeFixture(f);
    }
  });
  it('replays one operation, rejects payload changes and rolls back failed writes', async () => {
    const f = await fixture(),
      op = { operationId: randomUUID(), generation: 1 };
    try {
      const run = (v: number) =>
        withEnvironment(f.hash, false, (c) =>
          runOperation(c, op, 'UPDATE_POLICY', 'admin', { v }, async () => {
            await c.tx.returnPolicy.update({
              where: { environmentId: f.environment.id },
              data: { windowDays: v },
            });
            return { v };
          }),
        );
      expect(await run(12)).toEqual({ v: 12 });
      expect(await run(12)).toEqual({ v: 12 });
      await expect(run(13)).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
      await expect(
        withEnvironment(f.hash, false, async (c) => {
          await c.tx.returnPolicy.update({
            where: { environmentId: f.environment.id },
            data: { windowDays: 1 },
          });
          throw Error('injected rollback');
        }),
      ).rejects.toThrow();
      expect(
        (await db().returnPolicy.findUniqueOrThrow({ where: { environmentId: f.environment.id } }))
          .windowDays,
      ).toBe(12);
    } finally {
      await removeFixture(f);
    }
  });
  it('persists quota admission outside a rejected domain transaction', async () => {
    const f = await fixture();
    try {
      await admit(f.hash);
      await expect(
        withEnvironment(f.hash, false, async () => {
          throw Error('invalid domain');
        }),
      ).rejects.toThrow();
      expect(await db().rateBucket.count({ where: { visitorHash: f.hash, attempts: 1 } })).toBe(1);
      await db().rateBucket.deleteMany({ where: { visitorHash: f.hash } });
    } finally {
      await removeFixture(f);
    }
  });
});
