import { it, expect } from 'vitest';
import { fixture, removeFixture } from '../helpers/factories';
import { db } from '@/lib/prisma';
import { provision } from '@/features/demo/provision';
import { randomUUID } from 'node:crypto';
it('refuses provisioning at the database-wide active-environment limit without a partial graph', async () => {
  const f = await fixture();
  await db().demoEnvironment.delete({ where: { id: f.environment.id } });
  const ids = Array.from({ length: 1000 }, () => randomUUID());
  try {
    await db().visitorContext.createMany({ data: ids.map((id) => ({ id, tokenHash: id })) });
    await db().demoEnvironment.createMany({
      data: ids.map((id) => ({ visitorId: id, capabilityHash: id, lastActivityAt: new Date() })),
    });
    await expect(provision(f.visitor, randomUUID())).rejects.toMatchObject({
      code: 'DEMO_CAPACITY_REACHED',
      status: 503,
    });
    expect(await db().demoEnvironment.count({ where: { visitorId: f.visitor.id } })).toBe(0);
    expect(await db().provisionReceipt.count({ where: { visitorId: f.visitor.id } })).toBe(0);
  } finally {
    await db().visitorContext.deleteMany({ where: { id: { in: ids } } });
    await removeFixture(f);
  }
});
it('concurrent starts recover one isolated graph with identical operation replay', async () => {
  const f = await fixture();
  await db().demoEnvironment.delete({ where: { id: f.environment.id } });
  try {
    const key = randomUUID();
    const r = await Promise.all([provision(f.visitor, key), provision(f.visitor, key)]);
    expect(r[0].environment.id).toBe(r[1].environment.id);
    expect(await db().demoEnvironment.count({ where: { visitorId: f.visitor.id } })).toBe(1);
    expect(await db().order.count({ where: { environmentId: r[0].environment.id } })).toBe(6);
  } finally {
    await removeFixture(f);
  }
});

it('does not revive expired provisioning receipts and stores only a capability hash', async () => {
  const f = await fixture();
  await db().demoEnvironment.delete({ where: { id: f.environment.id } });
  try {
    const key = randomUUID();
    const first = await provision(f.visitor, key);
    expect(first.environment.capabilityHash).not.toBe(first.token);
    await db().demoEnvironment.update({
      where: { id: first.environment.id },
      data: { lastActivityAt: new Date(Date.now() - 169 * 3600000) },
    });
    await expect(provision(f.visitor, key)).rejects.toMatchObject({ code: 'DEMO_EXPIRED' });
    const fresh = await provision(f.visitor, randomUUID());
    expect(fresh.environment.id).not.toBe(first.environment.id);
  } finally {
    await removeFixture(f);
  }
});
