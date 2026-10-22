import type { Context } from '@/features/demo/transaction';
import { scope } from '@/features/demo/transaction';
import type { EventType } from '@/generated/prisma/client';
export function appendEvent(
  c: Context,
  requestId: string,
  sequence: number,
  eventType: EventType,
  customerId?: string,
  reason?: string,
) {
  return c.tx.historyEvent.create({
    data: {
      ...scope(c),
      requestId,
      sequence,
      eventType,
      occurredAt: c.now,
      actorKind: customerId ? 'CUSTOMER' : 'ADMIN',
      actorCustomerId: customerId ?? null,
      reason: reason ?? null,
    },
  });
}
