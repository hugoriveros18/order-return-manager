import { randomBytes } from 'node:crypto';
import type { Context } from '@/features/demo/transaction';
import { scope } from '@/features/demo/transaction';
import { runOperation, type Operation } from '@/features/demo/operations';
import { orderDetail } from '@/features/orders/queries';
import { DomainError } from '@/lib/errors';
import { parse } from '@/lib/request-validation';
import { createSchema } from './schemas';
export async function createReturn(
  c: Context,
  customerId: string,
  orderId: string,
  value: unknown,
  op: Operation,
) {
  const input = parse(createSchema, value);
  return runOperation(c, op, 'CREATE_RETURN', customerId, { orderId, ...input }, async () => {
    const order = await orderDetail(c, customerId, orderId);
    if (!order.eligibility.eligible)
      throw new DomainError('ORDER_INELIGIBLE', order.eligibility.message);
    for (const line of input.items) {
      const item = order.items.find((i) => i.orderItemId === line.orderItemId);
      if (!item)
        throw new DomainError(
          'INVALID_INPUT',
          'All selected items must belong to this order.',
          400,
        );
      if (line.quantity > item.availableQuantity)
        throw new DomainError(
          'QUANTITY_CONFLICT',
          `Only ${item.availableQuantity} unit(s) of ${item.name} are available.`,
        );
    }
    const r = await c.tx.returnRequest.create({
      data: {
        ...scope(c),
        orderId,
        customerId,
        displayNumber: 'RET-' + randomBytes(5).toString('hex').toUpperCase(),
        reason: input.reason,
        status: 'PENDING',
      },
    });
    await c.tx.returnItem.createMany({
      data: input.items.map((line) => ({
        ...scope(c),
        requestId: r.id,
        orderId,
        orderItemId: line.orderItemId,
        quantity: line.quantity,
      })),
    });
    await c.tx.historyEvent.create({
      data: {
        ...scope(c),
        requestId: r.id,
        sequence: 1,
        eventType: 'CREATED',
        occurredAt: c.now,
        actorKind: 'CUSTOMER',
        actorCustomerId: customerId,
      },
    });
    return {
      id: r.id,
      displayNumber: r.displayNumber,
      customerId,
      orderId,
      status: r.status,
      version: r.version,
      createdAt: r.createdAt.toISOString(),
    };
  });
}
