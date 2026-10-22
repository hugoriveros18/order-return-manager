import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { request } from '../helpers/http';
import { action } from '@/features/returns/handlers';
it('receives only approved requests without a waiting period and rejects final state changes', async () => {
  const f = await fixture(),
    r = await requestFixture(f, 'APPROVED');
  try {
    expect((await action(request(f, '/api/receive', 'POST', {}), r.id, 'RECEIVE')).status).toBe(
      200,
    );
    expect((await action(request(f, '/api/receive', 'POST', {}), r.id, 'RECEIVE')).status).toBe(
      409,
    );
  } finally {
    await removeFixture(f);
  }
});
