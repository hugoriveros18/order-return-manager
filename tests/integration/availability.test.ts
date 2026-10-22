import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { db } from '@/lib/prisma';
import { withEnvironment } from '@/features/demo/transaction';
import { orderDetail } from '@/features/orders/queries';
it('counts pending, approved and received while rejected/cancelled release units', async () => {
  const f = await fixture();
  try {
    await db().orderItem.update({ where: { id: f.items[0].id }, data: { purchasedQuantity: 10 } });
    for (const status of ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RECEIVED'] as const)
      await requestFixture(f, status);
    const detail = await withEnvironment(f.hash, false, (c) =>
      orderDetail(c, f.order.customerId, f.order.id),
    );
    const item = detail.items.find((i) => i.orderItemId === f.items[0].id)!;
    expect(item.committedQuantity).toBe(3);
    expect(item.availableQuantity).toBe(7);
  } finally {
    await removeFixture(f);
  }
});
