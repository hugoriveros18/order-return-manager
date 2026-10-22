import { it, expect } from 'vitest';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { change } from '@/features/returns/decide';
import { db } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
it('allows only one competing approval/rejection with one decision event', async () => {
  const f = await fixture(),
    r = await requestFixture(f);
  try {
    const results = await Promise.allSettled(
      ['APPROVE', 'REJECT'].map((a) =>
        withEnvironment(f.hash, true, (c) =>
          change(
            c,
            r.id,
            a as 'APPROVE' | 'REJECT',
            { generation: 1, operationId: randomUUID() },
            a === 'REJECT' ? 'Not eligible condition' : undefined,
          ),
        ),
      ),
    );
    expect(results.filter((v) => v.status === 'fulfilled')).toHaveLength(1);
    expect(await db().historyEvent.count({ where: { requestId: r.id } })).toBe(2);
    expect((await db().returnRequest.findUniqueOrThrow({ where: { id: r.id } })).version).toBe(2);
  } finally {
    await removeFixture(f);
  }
});
