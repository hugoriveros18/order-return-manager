import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { customerReturns } from '@/features/returns/handlers';
it('shows ordered attributable history and denies another profile', async () => {
  const f = await fixture(),
    r = await requestFixture(f, 'REJECTED');
  try {
    const response = await customerReturns(request(f, '/api/returns'), f.order.customerId, r.id);
    expect(response.status).toBe(200);
    const data = (await response.json()).data;
    expect(data.rejectionReason).toBeTruthy();
    expect(data.history.map((e: { sequence: number }) => e.sequence)).toEqual([1, 2]);
    expect(data.history[0].actor.kind).toBe('CUSTOMER');
    const other = f.customers.find((c) => c.id !== f.order.customerId)!;
    expect((await customerReturns(request(f, '/api/returns'), other.id, r.id)).status).toBe(404);
  } finally {
    await removeFixture(f);
  }
});
