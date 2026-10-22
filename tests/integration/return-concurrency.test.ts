import { it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { createReturn } from '@/features/returns/create';
import { db } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
it('allows only one of 20 distinct contenders for the last unit', async () => {
  const f = await fixture();
  try {
    await db().orderItem.update({ where: { id: f.items[0].id }, data: { purchasedQuantity: 1 } });
    const attempts = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        withEnvironment(f.hash, true, (c) =>
          createReturn(
            c,
            f.order.customerId,
            f.order.id,
            { reason: 'Concurrent reason', items: [{ orderItemId: f.items[0].id, quantity: 1 }] },
            { operationId: randomUUID(), generation: 1 },
          ),
        ),
      ),
    );
    expect(attempts.filter((a) => a.status === 'fulfilled')).toHaveLength(1);
    expect(await db().returnRequest.count({ where: { environmentId: f.environment.id } })).toBe(1);
    expect(
      await db().returnItem.aggregate({
        where: { environmentId: f.environment.id },
        _sum: { quantity: true },
      }),
    ).toMatchObject({ _sum: { quantity: 1 } });
  } finally {
    await removeFixture(f);
  }
});
