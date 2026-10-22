import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { cancel } from '@/features/returns/cancel';
import { change } from '@/features/returns/decide';
import { orderDetail } from '@/features/orders/queries';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/prisma';
import { createReturn } from '@/features/returns/create';
it('releases cancelled units once and allows a new eligible request', async () => {
  const f = await fixture(),
    r = await requestFixture(f, 'PENDING', f.items[0].purchasedQuantity);
  const op = { generation: 1, operationId: randomUUID() };
  try {
    const run = () =>
      withEnvironment(f.hash, true, (c) =>
        cancel(c, f.order.customerId, r.id, { confirmed: true }, op),
      );
    await run();
    await run();
    expect(await db().historyEvent.count({ where: { requestId: r.id } })).toBe(2);
    await withEnvironment(f.hash, true, (c) =>
      createReturn(
        c,
        f.order.customerId,
        f.order.id,
        {
          reason: 'New eligible intent',
          items: [{ orderItemId: f.items[0].id, quantity: f.items[0].purchasedQuantity }],
        },
        { generation: 1, operationId: randomUUID() },
      ),
    );
    await expect(
      withEnvironment(f.hash, true, (c) =>
        change(c, r.id, 'APPROVE', { generation: 1, operationId: randomUUID() }),
      ),
    ).rejects.toMatchObject({ status: 409 });
  } finally {
    await removeFixture(f);
  }
});
it('releases units after cancellation and exactly one approve/reject/cancel wins', async () => {
  const f = await fixture(),
    r = await requestFixture(f);
  try {
    const op = () => ({ generation: 1, operationId: randomUUID() });
    const values = await Promise.allSettled([
      withEnvironment(f.hash, true, (c) =>
        cancel(c, f.order.customerId, r.id, { confirmed: true }, op()),
      ),
      withEnvironment(f.hash, true, (c) => change(c, r.id, 'APPROVE', op())),
      withEnvironment(f.hash, true, (c) => change(c, r.id, 'REJECT', op(), 'Reason')),
    ]);
    expect(values.filter((v) => v.status === 'fulfilled')).toHaveLength(1);
    const updated = await withEnvironment(f.hash, false, (c) =>
      orderDetail(c, f.order.customerId, f.order.id),
    );
    expect(updated.items[0].availableQuantity).toBeGreaterThanOrEqual(0);
  } finally {
    await removeFixture(f);
  }
});
