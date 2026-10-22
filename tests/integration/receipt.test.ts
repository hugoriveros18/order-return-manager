import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { receive } from '@/features/returns/receive';
import { orderDetail } from '@/features/orders/queries';
import { db } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
it('replays receipt once, retains commitment and adds one administrator event', async () => {
  const f = await fixture(),
    r = await requestFixture(f, 'APPROVED'),
    op = { operationId: randomUUID(), generation: 1 };
  try {
    await Promise.all([1, 2].map(() => withEnvironment(f.hash, true, (c) => receive(c, r.id, op))));
    expect(await db().historyEvent.count({ where: { requestId: r.id } })).toBe(3);
    const order = await withEnvironment(f.hash, false, (c) =>
      orderDetail(c, f.order.customerId, f.order.id),
    );
    expect(order.items.find((i) => i.orderItemId === f.items[0].id)!.committedQuantity).toBe(1);
  } finally {
    await removeFixture(f);
  }
});
