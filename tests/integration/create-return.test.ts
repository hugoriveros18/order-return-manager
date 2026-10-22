import { it, expect, vi } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { createReturn } from '@/features/returns/create';
import { db } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
it('rolls back request, items and receipt when history persistence fails', async () => {
  const f = await fixture();
  try {
    await expect(
      withEnvironment(f.hash, true, async (c) => {
        const fail = vi
          .spyOn(c.tx.historyEvent, 'create')
          .mockRejectedValueOnce(new Error('Injected history failure'));
        try {
          return await createReturn(
            c,
            f.order.customerId,
            f.order.id,
            { reason: 'Atomic creation', items: [{ orderItemId: f.items[0].id, quantity: 1 }] },
            { operationId: randomUUID(), generation: 1 },
          );
        } finally {
          fail.mockRestore();
        }
      }),
    ).rejects.toThrow('Injected history failure');
    const where = { environmentId: f.environment.id };
    expect(
      await Promise.all([
        db().returnRequest.count({ where }),
        db().returnItem.count({ where }),
        db().historyEvent.count({ where }),
        db().operationReceipt.count({ where }),
      ]),
    ).toEqual([0, 0, 0, 0]);
  } finally {
    await removeFixture(f);
  }
});
it('creates one pending request/event and exactly replays an operation', async () => {
  const f = await fixture(),
    op = { operationId: randomUUID(), generation: 1 };
  const input = { reason: 'Not suitable', items: [{ orderItemId: f.items[0].id, quantity: 1 }] };
  try {
    const run = () =>
      withEnvironment(f.hash, true, (c) =>
        createReturn(c, f.order.customerId, f.order.id, input, op),
      );
    const a = await run(),
      b = await run();
    expect(a.id).toBe(b.id);
    expect(a.status).toBe('PENDING');
    expect(await db().historyEvent.count({ where: { requestId: a.id } })).toBe(1);
  } finally {
    await removeFixture(f);
  }
});
it('rejects over-quantity without request or history changes', async () => {
  const f = await fixture();
  try {
    await expect(
      withEnvironment(f.hash, false, (c) =>
        createReturn(
          c,
          f.order.customerId,
          f.order.id,
          { reason: 'Reason', items: [{ orderItemId: f.items[0].id, quantity: 500 }] },
          { operationId: randomUUID(), generation: 1 },
        ),
      ),
    ).rejects.toMatchObject({ code: 'QUANTITY_CONFLICT' });
    expect(await db().returnRequest.count({ where: { environmentId: f.environment.id } })).toBe(0);
    expect(await db().historyEvent.count({ where: { environmentId: f.environment.id } })).toBe(0);
  } finally {
    await removeFixture(f);
  }
});

it('allows deliberate new requests for remaining units and conflicts on changed replay payloads', async () => {
  const f = await fixture(),
    op = { operationId: randomUUID(), generation: 1 };
  try {
    await db().orderItem.update({ where: { id: f.items[0].id }, data: { purchasedQuantity: 2 } });
    const input = {
      reason: 'Deliberate request',
      items: [{ orderItemId: f.items[0].id, quantity: 1 }],
    };
    await withEnvironment(f.hash, true, (c) =>
      createReturn(c, f.order.customerId, f.order.id, input, op),
    );
    await expect(
      withEnvironment(f.hash, true, (c) =>
        createReturn(c, f.order.customerId, f.order.id, { ...input, reason: 'Changed intent' }, op),
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
    await withEnvironment(f.hash, true, (c) =>
      createReturn(c, f.order.customerId, f.order.id, input, {
        operationId: randomUUID(),
        generation: 1,
      }),
    );
    expect(await db().returnRequest.count({ where: { environmentId: f.environment.id } })).toBe(2);
  } finally {
    await removeFixture(f);
  }
});
