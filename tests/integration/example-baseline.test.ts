import { it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { db } from '@/lib/prisma';
import { withEnvironment } from '@/features/demo/transaction';
import { reset } from '@/features/demo/reset';
import { orderDetail } from '@/features/orders/queries';
import { randomUUID } from 'node:crypto';
it('restores six attributable examples, two pending, without overcommitting either customer', async () => {
  const f = await fixture(),
    other = await fixture();
  try {
    await withEnvironment(f.hash, true, (c) =>
      reset(c, { confirmed: true }, { generation: 1, operationId: randomUUID() }),
    );
    const requests = await db().returnRequest.findMany({
      where: { environmentId: f.environment.id },
    });
    expect(requests).toHaveLength(6);
    expect(requests.filter((r) => r.status === 'PENDING')).toHaveLength(2);
    expect(new Set(requests.map((r) => r.status)).size).toBe(5);
    expect(new Set(requests.map((r) => r.customerId)).size).toBe(2);
    for (const r of requests) {
      const events = await db().historyEvent.findMany({
        where: { requestId: r.id },
        orderBy: { sequence: 'asc' },
      });
      expect(events).toHaveLength(r.version);
      expect(events[0].actorKind).toBe('CUSTOMER');
      expect(events.at(-1)!.eventType).toBe(r.status === 'PENDING' ? 'CREATED' : r.status);
      if (r.status === 'CANCELLED') expect(events.at(-1)!.actorKind).toBe('CUSTOMER');
      else if (r.status !== 'PENDING') expect(events.at(-1)!.actorKind).toBe('ADMIN');
    }
    const orders = await db().order.findMany({
      where: { environmentId: f.environment.id, status: 'DELIVERED' },
    });
    for (const order of orders) {
      const view = await withEnvironment(f.hash, false, (c) =>
        orderDetail(c, order.customerId, order.id),
      );
      for (const item of view.items) expect(item.availableQuantity).toBeGreaterThanOrEqual(0);
    }
    const newest = orders.find((o) => o.displayNumber === 'ORM-1042')!;
    const view = await withEnvironment(f.hash, false, (c) =>
      orderDetail(c, newest.customerId, newest.id),
    );
    expect(view.eligibility.eligible).toBe(true);
    expect(view.items[0].availableQuantity).toBe(1);
    expect(await db().returnRequest.count({ where: { environmentId: other.environment.id } })).toBe(
      0,
    );
  } finally {
    await removeFixture(f);
    await removeFixture(other);
  }
});
