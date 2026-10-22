import { it, expect, vi } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { db } from '@/lib/prisma';
import { orders } from '@/features/orders/handlers';
import {
  customerReturns,
  adminReturns,
  action,
  create,
  cancelAction,
} from '@/features/returns/handlers';
import { handleDemo, customers } from '@/features/demo/handlers';
import { policyHandler } from '@/features/policy/handlers';
import { reset } from '@/features/demo/reset';
import { withEnvironment } from '@/features/demo/transaction';
import { admit } from '@/features/demo/rate-limit';
import { failure } from '@/lib/http';
import { randomUUID } from 'node:crypto';
import { resetHandler } from '@/features/demo/maintenance-handlers';
it('applies Origin, JSON and body guards across every scoped mutation family', async () => {
  const f = await fixture(),
    r = await requestFixture(f);
  try {
    const calls: [string, (req: Request) => Promise<Response>][] = [
      ['POST', (req) => create(req, f.order.customerId, f.order.id)],
      ...(['APPROVE', 'REJECT', 'RECEIVE'] as const).map(
        (kind) =>
          ['POST', (req: Request) => action(req, r.id, kind)] as [
            string,
            (req: Request) => Promise<Response>,
          ],
      ),
      ['POST', (req) => cancelAction(req, f.order.customerId, r.id)],
      ['PATCH', (req) => policyHandler(req)],
      ['POST', (req) => resetHandler(req)],
    ];
    for (const [method, call] of calls) {
      const invalidHeaders: Record<string, string>[] = [
        { origin: 'https://foreign.example' },
        { 'content-type': 'text/plain' },
      ];
      for (const headers of invalidHeaders) {
        const result = await call(request(f, '/api/mutation', method, {}, headers));
        expect(result.status).toBe('origin' in headers ? 403 : 400);
        expect(result.headers.get('cache-control')).toBe('private, no-store');
      }
      const bad = request(f, '/api/mutation', method, {});
      expect((await call(new Request(bad, { body: '{' }))).status).toBe(400);
    }
    expect(await db().historyEvent.count({ where: { requestId: r.id } })).toBe(1);
    expect(
      await db().rateBucket.findFirst({
        where: { visitorHash: f.hash, category: 'MUTATION_MINUTE' },
      }),
    ).not.toBeNull();
  } finally {
    await removeFixture(f);
  }
});
it('returns private data/error envelopes on all scoped read families and blocks foreign IDs', async () => {
  const a = await fixture(),
    b = await fixture(),
    r = await requestFixture(a);
  try {
    const reads = [
      handleDemo(request(a, '/api/demo')),
      customers(request(a, '/api/customers')),
      orders(request(a, '/api/orders'), a.order.customerId),
      orders(request(a, '/api/orders'), a.order.customerId, a.order.id),
      customerReturns(request(a, '/api/returns'), a.order.customerId),
      customerReturns(request(a, '/api/returns'), a.order.customerId, r.id),
      adminReturns(request(a, '/api/admin/returns')),
      adminReturns(request(a, '/api/admin/returns'), r.id),
      policyHandler(request(a, '/api/admin/policy')),
    ];
    for (const response of await Promise.all(reads)) {
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(response.headers.get('vary')).toBe('Cookie');
    }
    expect((await orders(request(a, '/api/orders'), b.order.customerId, b.order.id)).status).toBe(
      404,
    );
    expect((await adminReturns(request(a, '/api/admin/returns?status=INVALID'))).status).toBe(400);
    const wrong = await action(
      request(a, '/api/action', 'POST', {}, { origin: 'https://foreign.example' }),
      r.id,
      'APPROVE',
    );
    expect(wrong.status).toBe(403);
  } finally {
    await removeFixture(a);
    await removeFixture(b);
  }
});
it('enforces each anonymous allowance durably and reset never renews it', async () => {
  const f = await fixture();
  try {
    for (let n = 0; n < 5; n++) await admit(f.hash, 'reset');
    await expect(admit(f.hash, 'reset')).rejects.toMatchObject({ status: 429 });
    await withEnvironment(f.hash, true, (c) =>
      reset(c, { confirmed: true }, { generation: 1, operationId: randomUUID() }),
    );
    await expect(admit(f.hash, 'reset')).rejects.toMatchObject({ status: 429 });
    await db().rateBucket.deleteMany({ where: { visitorHash: f.hash } });
    for (let n = 0; n < 10; n++) await admit(f.hash, 'create');
    await expect(admit(f.hash, 'create')).rejects.toMatchObject({ status: 429 });
    await db().rateBucket.deleteMany({ where: { visitorHash: f.hash } });
    for (let n = 0; n < 60; n++) await admit(f.hash);
    await expect(admit(f.hash)).rejects.toMatchObject({ status: 429 });
  } finally {
    await db().rateBucket.deleteMany({ where: { visitorHash: f.hash } });
    await removeFixture(f);
  }
});
it('unexpected errors expose only a safe identifier/message and redact diagnostics', async () => {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = failure(new Error('secret-token SQL SELECT * FROM customer'));
    const b = JSON.stringify(await response.json());
    expect(response.status).toBe(500);
    expect(b).not.toContain('SQL');
    expect(b).not.toContain('secret-token');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('secret-token');
  } finally {
    spy.mockRestore();
  }
});

it('rejects missing capabilities, oversized or malformed JSON, unknown fields and stale generations', async () => {
  const f = await fixture(),
    r = await requestFixture(f);
  try {
    const noCookie = await handleDemo(new Request(process.env.APP_ORIGIN! + '/api/demo'));
    expect(noCookie.status).toBe(403);
    const huge = await action(
      request(f, '/api/action', 'POST', { extra: 'a'.repeat(33000) }),
      r.id,
      'APPROVE',
    );
    expect(huge.status).toBe(400);
    expect(
      (await action(request(f, '/api/action', 'POST', { unknown: true }), r.id, 'APPROVE')).status,
    ).toBe(400);
    expect(
      (
        await action(
          request(f, '/api/action', 'POST', {}, { 'x-demo-generation': '9' }),
          r.id,
          'APPROVE',
        )
      ).status,
    ).toBe(409);
    expect(await db().historyEvent.count({ where: { requestId: r.id } })).toBe(1);
  } finally {
    await removeFixture(f);
  }
});
