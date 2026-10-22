import type { Context } from '@/features/demo/transaction';
import { scope } from '@/features/demo/transaction';
import { missing } from '@/lib/errors';
import { eligibility } from './eligibility';
import type { Order } from '@/generated/prisma/client';
import type { ItemView, OrderView } from '@/lib/contracts';
import { nextCursor } from '@/lib/request-validation';
export async function ensureCustomer(c: Context, id: string) {
  const customer = await c.tx.customer.findFirst({ where: { ...scope(c), id } });
  if (!customer) throw missing();
  return customer;
}
export async function orderItems(c: Context, orderId: string): Promise<ItemView[]> {
  const items = await c.tx.orderItem.findMany({
    where: { ...scope(c), orderId },
    orderBy: { productId: 'asc' },
  });
  const products = await c.tx.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });
  const committed = await c.tx.returnRequest.findMany({
    where: { ...scope(c), orderId, status: { in: ['PENDING', 'APPROVED', 'RECEIVED'] } },
    select: { id: true },
  });
  const lines = await c.tx.returnItem.findMany({
    where: { ...scope(c), requestId: { in: committed.map((r) => r.id) } },
  });
  return items.map((i) => {
    const p = products.find((p) => p.id === i.productId)!;
    const used = lines.filter((l) => l.orderItemId === i.id).reduce((n, l) => n + l.quantity, 0);
    return {
      orderItemId: i.id,
      productId: p.id,
      name: p.name,
      imagePath: p.imagePath,
      imageAlt: p.imageAlt,
      purchasePriceMinor: i.purchasePriceMinor.toString(),
      purchasedQuantity: i.purchasedQuantity,
      committedQuantity: used,
      availableQuantity: i.purchasedQuantity - used,
    };
  });
}
export async function projectOrder(c: Context, order: Order): Promise<OrderView> {
  const items = await orderItems(c, order.id);
  const policy = await c.tx.returnPolicy.findUniqueOrThrow({
    where: { environmentId: c.environment.id },
  });
  return {
    id: order.id,
    displayNumber: order.displayNumber,
    customerId: order.customerId,
    orderedAt: order.orderedAt.toISOString(),
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
    status: order.status,
    items,
    eligibility: eligibility({
      status: order.status,
      deliveredAt: order.deliveredAt,
      now: c.now,
      windowDays: policy.windowDays,
      available: items.reduce((n, i) => n + i.availableQuantity, 0),
    }),
  };
}
export async function orderDetail(c: Context, customerId: string, id: string) {
  await ensureCustomer(c, customerId);
  const order = await c.tx.order.findFirst({ where: { ...scope(c), customerId, id } });
  if (!order) throw missing();
  return projectOrder(c, order);
}
export async function orderList(
  c: Context,
  customerId: string,
  page: { limit: number; cursor?: { id: string; at: Date } },
) {
  await ensureCustomer(c, customerId);
  const rows = await c.tx.order.findMany({
    where: {
      ...scope(c),
      customerId,
      ...(page.cursor
        ? {
            OR: [
              { orderedAt: { lt: page.cursor.at } },
              { orderedAt: page.cursor.at, id: { lt: page.cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ orderedAt: 'desc' }, { id: 'desc' }],
    take: page.limit + 1,
  });
  const visible = rows.slice(0, page.limit);
  const last = visible.at(-1);
  return {
    items: await Promise.all(visible.map((o) => projectOrder(c, o))),
    nextCursor: rows.length > page.limit && last ? nextCursor(last.id, last.orderedAt) : null,
  };
}
