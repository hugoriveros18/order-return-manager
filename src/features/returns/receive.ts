import type { Context } from '@/features/demo/transaction';
import type { Operation } from '@/features/demo/operations';
import { change } from './decide';
export function receive(c: Context, id: string, op: Operation) {
  return change(c, id, 'RECEIVE', op);
}
