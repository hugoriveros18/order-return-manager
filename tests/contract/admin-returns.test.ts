import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { adminReturns, action } from '@/features/returns/handlers';
it('lists the environment request and requires a rejection reason', async () => {
  const f = await fixture(),
    r = await requestFixture(f);
  try {
    const list = await adminReturns(request(f, '/api/admin/returns'));
    expect(list.status).toBe(200);
    expect((await list.json()).data.items[0].id).toBe(r.id);
    expect(
      (await action(request(f, '/api/action', 'POST', { reason: ' ' }), r.id, 'REJECT')).status,
    ).toBe(400);
    expect((await action(request(f, '/api/action', 'POST', {}), r.id, 'APPROVE')).status).toBe(200);
  } finally {
    await removeFixture(f);
  }
});
