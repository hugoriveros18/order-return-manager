import type { Context } from './transaction';
import { runOperation, type Operation } from './operations';
import { parse } from '@/lib/request-validation';
import { confirmedSchema } from '@/features/returns/schemas';
import { seedEnvironment } from './fixtures';
export async function reset(c: Context, value: unknown, op: Operation) {
  const input = parse(confirmedSchema, value);
  return runOperation(c, op, 'RESET', 'visitor', input, async () => {
    const generation = c.environment.generation + 1;
    await c.tx.customer.deleteMany({ where: { environmentId: c.environment.id } });
    await c.tx.demoEnvironment.update({ where: { id: c.environment.id }, data: { generation } });
    await seedEnvironment(c.tx, c.environment.id, generation, c.now);
    return { reset: true, generation };
  });
}
