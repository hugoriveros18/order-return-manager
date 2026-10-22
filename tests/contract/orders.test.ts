import { it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { orders } from '@/features/orders/handlers';
it('returns scoped order details, USD snapshots and denies foreign customer access', async () => {
  const a = await fixture(),
    b = await fixture();
  try {
    const r = await orders(request(a, '/api/orders'), a.order.customerId, a.order.id);
    expect(r.status).toBe(200);
    const v = await r.json();
    expect(v.data.eligibility.eligible).toBe(true);
    expect(v.data.items[0].purchasePriceMinor).toMatch(/^\d+$/);
    expect((await orders(request(a, '/api/orders'), b.order.customerId, b.order.id)).status).toBe(
      404,
    );
    expect((await orders(request(a, '/api/orders?limit=51'), a.order.customerId)).status).toBe(400);
  } finally {
    await removeFixture(a);
    await removeFixture(b);
  }
});
