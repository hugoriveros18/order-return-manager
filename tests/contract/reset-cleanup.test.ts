import { it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { resetHandler, cleanupHandler } from '@/features/demo/maintenance-handlers';
it('requires reset confirmation and protects cleanup with its server secret', async () => {
  const f = await fixture();
  try {
    expect((await resetHandler(request(f, '/api/demo/reset', 'POST', {}))).status).toBe(400);
    expect(
      (await resetHandler(request(f, '/api/demo/reset', 'POST', { confirmed: true }))).status,
    ).toBe(200);
    expect(
      (await cleanupHandler(new Request('http://localhost/api/internal/cleanup'))).status,
    ).toBe(403);
  } finally {
    await removeFixture(f);
  }
});
