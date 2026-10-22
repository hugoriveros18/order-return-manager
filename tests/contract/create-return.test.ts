import { it, expect } from 'vitest';
import { createSchema } from '@/features/returns/schemas';
import { fixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { create } from '@/features/returns/handlers';
import { db } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
it('validates the HTTP creation contract and replays only identical intent', async () => {
  const f = await fixture(),
    other = await fixture();
  const input = {
    reason: '  Valid reason  ',
    items: [{ orderItemId: f.items[0].id, quantity: 1 }],
  };
  const send = (value: unknown, headers: Record<string, string> = {}) =>
    create(request(f, '/api/create', 'POST', value, headers), f.order.customerId, f.order.id);
  try {
    for (const value of [
      { ...input, items: [] },
      { ...input, reason: ' ' },
      { ...input, reason: '😀'.repeat(1001) },
      { ...input, extra: true },
      { ...input, items: [input.items[0], input.items[0]] },
      ...[0, -1, 1.5, 2147483648, '1'].map((quantity) => ({
        ...input,
        items: [{ ...input.items[0], quantity }],
      })),
      { ...input, items: [{ orderItemId: other.items[0].id, quantity: 1 }] },
    ])
      expect((await send(value)).status).toBe(400);
    expect((await send(input, { 'idempotency-key': '' })).status).toBe(400);
    expect((await send(input, { 'x-demo-generation': '9' })).status).toBe(409);
    expect((await send({ ...input, items: [{ ...input.items[0], quantity: 500 }] })).status).toBe(
      409,
    );
    expect(await db().returnRequest.count({ where: { environmentId: f.environment.id } })).toBe(0);
    const key = randomUUID(),
      headers = { 'idempotency-key': key };
    const a = await send(input, headers),
      b = await send(input, headers);
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);
    expect((await a.json()).data.id).toBe((await b.json()).data.id);
    expect((await send({ ...input, reason: 'Changed intent' }, headers)).status).toBe(409);
    expect(createSchema.safeParse({ ...input, reason: '😀'.repeat(1000) }).success).toBe(true);
  } finally {
    await removeFixture(f);
    await removeFixture(other);
  }
});
it('rejects empty selections, repeated order items, fractional units and blank reasons', () => {
  const id = 'cdb8ebfa-4136-4c07-93c1-cda518fe73e3';
  for (const data of [
    { reason: 'x', items: [] },
    { reason: ' ', items: [{ orderItemId: id, quantity: 1 }] },
    { reason: 'x', items: [{ orderItemId: id, quantity: 1.2 }] },
    {
      reason: 'x',
      items: [
        { orderItemId: id, quantity: 1 },
        { orderItemId: id, quantity: 1 },
      ],
    },
  ])
    expect(createSchema.safeParse(data).success).toBe(false);
});
