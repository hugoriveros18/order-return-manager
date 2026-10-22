import { it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { policyHandler } from '@/features/policy/handlers';
it('returns the 30-day default and validates prospective integer policy updates', async () => {
  const f = await fixture();
  try {
    expect(
      (await (await policyHandler(request(f, '/api/admin/policy'))).json()).data.windowDays,
    ).toBe(30);
    for (const windowDays of [0, -1, 1.5, '30'])
      expect(
        (await policyHandler(request(f, '/api/admin/policy', 'PATCH', { windowDays }))).status,
      ).toBe(400);
    const r = await policyHandler(request(f, '/api/admin/policy', 'PATCH', { windowDays: 5 }));
    expect(r.status).toBe(200);
    expect((await r.json()).data.windowDays).toBe(5);
  } finally {
    await removeFixture(f);
  }
});
