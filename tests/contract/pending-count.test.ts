import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { adminReturns, action } from '@/features/returns/handlers';
it('counts pending requests independently of status filters and excludes other environments', async () => {
  const f = await fixture(),
    other = await fixture();
  try {
    const a = await requestFixture(f);
    await requestFixture(f);
    await requestFixture(other);
    const filtered = await adminReturns(request(f, '/api/admin/returns?status=APPROVED'));
    expect((await filtered.json()).meta.pendingCount).toBe(2);
    await action(request(f, '/api/action', 'POST', {}), a.id, 'APPROVE');
    expect(
      (await (await adminReturns(request(f, '/api/admin/returns'))).json()).meta.pendingCount,
    ).toBe(1);
  } finally {
    await removeFixture(f);
    await removeFixture(other);
  }
});
