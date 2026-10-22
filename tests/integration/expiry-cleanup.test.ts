import { it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { fixedClock } from '../helpers/clock';
import { cleanup } from '@/features/demo/cleanup';
import { db } from '@/lib/prisma';
it('renews interactive access only before the exact deadline and excludes background reads', async () => {
  const start = new Date('2026-10-01T12:00:00Z'),
    f = await fixture(start);
  try {
    await withEnvironment(
      f.hash,
      false,
      async () => true,
      fixedClock(new Date('2026-10-07T12:00:00Z')),
    );
    expect(
      (await db().demoEnvironment.findUniqueOrThrow({ where: { id: f.environment.id } }))
        .lastActivityAt,
    ).toEqual(start);
    await withEnvironment(
      f.hash,
      true,
      async () => true,
      fixedClock(new Date('2026-10-07T12:00:00Z')),
    );
    await expect(
      withEnvironment(f.hash, true, async () => true, fixedClock(new Date('2026-10-14T12:00:00Z'))),
    ).rejects.toMatchObject({ code: 'DEMO_EXPIRED' });
  } finally {
    await removeFixture(f);
  }
});
it('cleanup deletes expired owned data and retains an active visitor environment', async () => {
  const old = await fixture(new Date(Date.now() - 169 * 3600000)),
    active = await fixture();
  try {
    const count = await cleanup();
    expect(count.deletedCount).toBeGreaterThan(0);
    expect(await db().demoEnvironment.findUnique({ where: { id: old.environment.id } })).toBeNull();
    expect(
      await db().demoEnvironment.findUnique({ where: { id: active.environment.id } }),
    ).not.toBeNull();
    expect(
      (await db().visitorContext.findUniqueOrThrow({ where: { id: old.visitor.id } }))
        .lastEnvironmentExpiredAt,
    ).not.toBeNull();
  } finally {
    await removeFixture(old);
    await removeFixture(active);
  }
});
