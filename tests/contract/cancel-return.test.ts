import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { cancelAction } from '@/features/returns/handlers';
it('requires confirmation and cancels only the selected customer pending request', async () => {
  const f = await fixture(),
    r = await requestFixture(f);
  try {
    expect(
      (await cancelAction(request(f, '/api/cancel', 'POST', {}), f.order.customerId, r.id)).status,
    ).toBe(400);
    expect(
      (
        await cancelAction(
          request(f, '/api/cancel', 'POST', { confirmed: true }),
          f.order.customerId,
          r.id,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await cancelAction(
          request(f, '/api/cancel', 'POST', { confirmed: true }),
          f.order.customerId,
          r.id,
        )
      ).status,
    ).toBe(409);
  } finally {
    await removeFixture(f);
  }
});
