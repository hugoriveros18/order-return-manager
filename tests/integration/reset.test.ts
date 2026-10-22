import { it, expect, vi } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { reset } from '@/features/demo/reset';
import { createReturn } from '@/features/returns/create';
import { db } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
import { updatePolicy } from '@/features/policy/service';
it('rolls back the deleted graph and generation when reseeding fails', async () => {
  const f = await fixture();
  const r = await requestFixture(f);
  try {
    await expect(
      withEnvironment(f.hash, true, async (c) => {
        const fail = vi
          .spyOn(c.tx.customer, 'create')
          .mockRejectedValueOnce(new Error('Injected seed failure'));
        try {
          return await reset(c, { confirmed: true }, { generation: 1, operationId: randomUUID() });
        } finally {
          fail.mockRestore();
        }
      }),
    ).rejects.toThrow('Injected seed failure');
    expect(
      (await db().demoEnvironment.findUniqueOrThrow({ where: { id: f.environment.id } }))
        .generation,
    ).toBe(1);
    expect(await db().returnRequest.findUnique({ where: { id: r.id } })).not.toBeNull();
    expect(await db().historyEvent.count({ where: { requestId: r.id } })).toBe(1);
    expect(await db().operationReceipt.count({ where: { environmentId: f.environment.id } })).toBe(
      0,
    );
  } finally {
    await removeFixture(f);
  }
});
it('serializes a policy update against reset and fences the old generation', async () => {
  const f = await fixture();
  try {
    const result = await Promise.allSettled([
      withEnvironment(f.hash, true, (c) =>
        updatePolicy(c, { windowDays: 3 }, { generation: 1, operationId: randomUUID() }),
      ),
      withEnvironment(f.hash, true, (c) =>
        reset(c, { confirmed: true }, { generation: 1, operationId: randomUUID() }),
      ),
    ]);
    expect(result[1].status).toBe('fulfilled');
    expect(
      (await db().returnPolicy.findUniqueOrThrow({ where: { environmentId: f.environment.id } }))
        .windowDays,
    ).toBe(30);
  } finally {
    await removeFixture(f);
  }
});
it('resets once across concurrent retries and fences old-tab writes', async () => {
  const a = await fixture(),
    b = await fixture();
  await requestFixture(a);
  const op = { operationId: randomUUID(), generation: 1 };
  try {
    await db().returnPolicy.update({
      where: { environmentId: a.environment.id },
      data: { windowDays: 5 },
    });
    const run = () => withEnvironment(a.hash, true, (c) => reset(c, { confirmed: true }, op));
    const results = await Promise.all([run(), run()]);
    expect(results[0].generation).toBe(2);
    expect(results[1].generation).toBe(2);
    expect(await db().returnRequest.count({ where: { environmentId: a.environment.id } })).toBe(6);
    expect(
      (await db().returnPolicy.findUniqueOrThrow({ where: { environmentId: a.environment.id } }))
        .windowDays,
    ).toBe(30);
    expect(await db().order.count({ where: { environmentId: b.environment.id } })).toBe(6);
    await expect(
      withEnvironment(a.hash, true, (c) =>
        createReturn(
          c,
          a.order.customerId,
          a.order.id,
          { reason: 'Old tab', items: [{ orderItemId: a.items[0].id, quantity: 1 }] },
          { generation: 1, operationId: randomUUID() },
        ),
      ),
    ).rejects.toMatchObject({ code: 'STALE_DEMO' });
  } finally {
    await removeFixture(a);
    await removeFixture(b);
  }
});

it('serializes creation against reset without attaching old resources to the new graph', async () => {
  const f = await fixture();
  try {
    const result = await Promise.allSettled([
      withEnvironment(f.hash, true, (c) =>
        createReturn(
          c,
          f.order.customerId,
          f.order.id,
          { reason: 'Racing reset', items: [{ orderItemId: f.items[0].id, quantity: 1 }] },
          { generation: 1, operationId: randomUUID() },
        ),
      ),
      withEnvironment(f.hash, true, (c) =>
        reset(c, { confirmed: true }, { generation: 1, operationId: randomUUID() }),
      ),
    ]);
    expect(result[1].status).toBe('fulfilled');
    expect(
      (await db().demoEnvironment.findUniqueOrThrow({ where: { id: f.environment.id } }))
        .generation,
    ).toBe(2);
    expect(await db().returnRequest.count({ where: { environmentId: f.environment.id } })).toBe(6);
  } finally {
    await removeFixture(f);
  }
});
