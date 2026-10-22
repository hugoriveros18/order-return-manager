import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { updatePolicy } from '@/features/policy/service';
import { createReturn } from '@/features/returns/create';
import { db } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
it('applies policy only to new evaluation and leaves another environment unchanged', async () => {
  const a = await fixture(),
    b = await fixture(),
    r = await requestFixture(a);
  try {
    await withEnvironment(a.hash, true, (c) =>
      updatePolicy(c, { windowDays: 1 }, { generation: 1, operationId: randomUUID() }),
    );
    await expect(
      withEnvironment(a.hash, true, (c) =>
        createReturn(
          c,
          a.order.customerId,
          a.order.id,
          { reason: 'Now expired', items: [{ orderItemId: a.items[0].id, quantity: 1 }] },
          { generation: 1, operationId: randomUUID() },
        ),
      ),
    ).rejects.toMatchObject({ code: 'ORDER_INELIGIBLE' });
    expect((await db().returnRequest.findUniqueOrThrow({ where: { id: r.id } })).status).toBe(
      'PENDING',
    );
    expect(
      (await db().returnPolicy.findUniqueOrThrow({ where: { environmentId: b.environment.id } }))
        .windowDays,
    ).toBe(30);
  } finally {
    await removeFixture(a);
    await removeFixture(b);
  }
});

it('serializes creation against a policy change without partial domain writes', async () => {
  const f = await fixture();
  try {
    const result = await Promise.allSettled([
      withEnvironment(f.hash, true, (c) =>
        createReturn(
          c,
          f.order.customerId,
          f.order.id,
          { reason: 'Racing policy', items: [{ orderItemId: f.items[0].id, quantity: 1 }] },
          { generation: 1, operationId: randomUUID() },
        ),
      ),
      withEnvironment(f.hash, true, (c) =>
        updatePolicy(c, { windowDays: 1 }, { generation: 1, operationId: randomUUID() }),
      ),
    ]);
    expect(result[1].status).toBe('fulfilled');
    const requests = await db().returnRequest.findMany({
      where: { environmentId: f.environment.id },
    });
    expect(requests).toHaveLength(result[0].status === 'fulfilled' ? 1 : 0);
    expect(await db().historyEvent.count({ where: { environmentId: f.environment.id } })).toBe(
      requests.length,
    );
  } finally {
    await removeFixture(f);
  }
});
