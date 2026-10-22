import type { Context } from '@/features/demo/transaction';
import { scope } from '@/features/demo/transaction';
import { runOperation, type Operation } from '@/features/demo/operations';
import { missing } from '@/lib/errors';
import { parse, reason as reasonSchema } from '@/lib/request-validation';
import { nextStatus, type Action } from './transitions';
import { appendEvent } from './history';
export async function change(
  c: Context,
  id: string,
  action: Action,
  op: Operation,
  reason?: string,
  customerId?: string,
) {
  if (action === 'REJECT') reason = parse(reasonSchema, reason);
  return runOperation(
    c,
    op,
    action,
    customerId ?? 'admin',
    { id, reason: reason ?? null },
    async () => {
      const request = await c.tx.returnRequest.findFirst({
        where: { ...scope(c), id, ...(customerId ? { customerId } : {}) },
      });
      if (!request) throw missing();
      const status = nextStatus(request.status, action);
      const r = await c.tx.returnRequest.update({
        where: { id: request.id },
        data: {
          status,
          version: { increment: 1 },
          rejectionReason: action === 'REJECT' ? reason : null,
        },
      });
      await appendEvent(
        c,
        r.id,
        r.version,
        status === 'PENDING' ? 'CREATED' : status,
        customerId,
        reason,
      );
      return { id: r.id, displayNumber: r.displayNumber, status: r.status, version: r.version };
    },
  );
}
