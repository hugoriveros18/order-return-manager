import { it, expect } from 'vitest';
import { testDatabaseUrl } from '../helpers/database-target';
process.env.ORM_TEST_DATABASE_URL = testDatabaseUrl();
import { bootstrap, handleDemo } from '@/features/demo/handlers';
import { randomUUID } from 'node:crypto';
it('bootstraps private cookie-scoped demos and replays lost provisioning responses', async () => {
  const origin = process.env.APP_ORIGIN!;
  const boot = await bootstrap(
    new Request(origin + '/api/visitor', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  expect(boot.status).toBe(200);
  const cookie = boot.headers.get('set-cookie')!.split(';')[0];
  const key = randomUUID();
  const start = () =>
    handleDemo(
      new Request(origin + '/api/demo', {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json', cookie, 'idempotency-key': key },
        body: '{}',
      }),
    );
  const a = await start(),
    b = await start();
  expect(a.status).toBe(201);
  expect(b.status).toBe(200);
  expect((await a.json()).data.customers).toHaveLength(2);
  expect(a.headers.get('cache-control')).toContain('no-store');
  expect(b.headers.get('set-cookie')).toContain('HttpOnly');
});
it('rejects invalid origins and malformed bodies without provisioning', async () => {
  const r = await bootstrap(
    new Request('http://127.0.0.1/api/visitor', {
      method: 'POST',
      headers: { origin: 'https://unrelated.example', 'content-type': 'application/json' },
      body: '{}',
    }),
  );
  expect(r.status).toBe(403);
});
