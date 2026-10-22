import type { Context } from '@/features/demo/transaction';
import type { Operation } from '@/features/demo/operations';
import { parse } from '@/lib/request-validation';
import { confirmedSchema } from './schemas';
import { change } from './decide';
export async function cancel(
  c: Context,
  customerId: string,
  id: string,
  value: unknown,
  op: Operation,
) {
  parse(confirmedSchema, value);
  return change(c, id, 'CANCEL', op, undefined, customerId);
}
