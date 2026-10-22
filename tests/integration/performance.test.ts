import { it, expect } from 'vitest';
import { performance } from 'node:perf_hooks';
import { writeFileSync } from 'node:fs';
import { fixture, removeFixture } from '../helpers/factories';
import { withEnvironment } from '@/features/demo/transaction';
import { orderDetail } from '@/features/orders/queries';
it('measures warm scoped order reads across ten active environments', async () => {
  const fixtures = await Promise.all(Array.from({ length: 10 }, () => fixture()));
  try {
    const durations: number[] = [];
    for (let round = 0; round < 3; round++)
      await Promise.all(
        fixtures.map(async (f) => {
          const started = performance.now();
          await withEnvironment(f.hash, false, (c) =>
            orderDetail(c, f.order.customerId, f.order.id),
          );
          durations.push(performance.now() - started);
        }),
      );
    durations.sort((a, b) => a - b);
    const p95 = durations[Math.ceil(0.95 * durations.length) - 1];
    writeFileSync(
      '/tmp/orm-performance.json',
      JSON.stringify({ environments: 10, samples: durations.length, p95Ms: Math.round(p95) }),
    );
    console.log(
      JSON.stringify({
        measurement: 'warm_scoped_order_read',
        environments: 10,
        samples: durations.length,
        p95Ms: Math.round(p95),
      }),
    );
    expect(p95).toBeLessThan(2000);
  } finally {
    for (const f of fixtures) await removeFixture(f);
  }
});
