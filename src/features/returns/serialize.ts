import type { Context } from '@/features/demo/transaction';
import { scope } from '@/features/demo/transaction';
import type { ReturnRequest } from '@/generated/prisma/client';
import { orderItems } from '@/features/orders/queries';
import type { ReturnView } from '@/lib/contracts';
export async function projectReturn(c: Context, r: ReturnRequest): Promise<ReturnView> {
  const order = await c.tx.order.findFirstOrThrow({ where: { ...scope(c), id: r.orderId } });
  const customer = await c.tx.customer.findFirstOrThrow({
    where: { ...scope(c), id: r.customerId },
  });
  const lines = await c.tx.returnItem.findMany({ where: { ...scope(c), requestId: r.id } });
  const all = await orderItems(c, r.orderId);
  const history = await c.tx.historyEvent.findMany({
    where: { ...scope(c), requestId: r.id },
    orderBy: { sequence: 'asc' },
  });
  return {
    id: r.id,
    displayNumber: r.displayNumber,
    orderId: r.orderId,
    orderDisplayNumber: order.displayNumber,
    customerId: r.customerId,
    customerName: customer.displayName,
    createdAt: r.createdAt.toISOString(),
    status: r.status,
    version: r.version,
    reason: r.reason,
    rejectionReason: r.rejectionReason,
    instructions:
      r.status === 'APPROVED'
        ? 'Pack the selected products. Pickup is simulated within the next three business days. No real carrier will be sent. Approval does not issue a refund or confirm physical receipt.'
        : null,
    items: lines.map((l) => ({
      ...all.find((i) => i.orderItemId === l.orderItemId)!,
      requestedQuantity: l.quantity,
    })),
    history: history.map((e) => ({
      id: e.id,
      sequence: e.sequence,
      eventType: e.eventType,
      occurredAt: e.occurredAt.toISOString(),
      actor: {
        kind: e.actorKind,
        displayName: e.actorKind === 'ADMIN' ? 'Demonstration administrator' : customer.displayName,
      },
      reason: e.reason,
    })),
  };
}
