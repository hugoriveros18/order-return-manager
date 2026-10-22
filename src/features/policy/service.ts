import type { Context } from '@/features/demo/transaction';
import { runOperation, type Operation } from '@/features/demo/operations';
import { parse } from '@/lib/request-validation';
import { policySchema } from './schema';
export function readPolicy(c: Context) {
  return c.tx.returnPolicy.findUniqueOrThrow({ where: { environmentId: c.environment.id } });
}
export async function updatePolicy(c: Context, value: unknown, op: Operation) {
  const input = parse(policySchema, value);
  return runOperation(c, op, 'UPDATE_POLICY', 'admin', input, async () => {
    const p = await c.tx.returnPolicy.update({
      where: { environmentId: c.environment.id },
      data: input,
    });
    return { windowDays: p.windowDays, updatedAt: p.updatedAt.toISOString() };
  });
}
