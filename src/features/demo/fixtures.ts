import catalog from '../../../catalog/products.json' with { type: 'json' };
import type { Prisma, OrderStatus, ReturnStatus, EventType } from '@/generated/prisma/client';
export function cents(value: number) {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}
export async function seedCatalog(tx: Prisma.TransactionClient) {
  for (const p of catalog)
    await tx.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        category: p.category,
        imagePath: '/products/' + p.image.split('/').pop(),
        imageAlt: `Fictional ${p.name} product illustration`,
        priceMinor: cents(p.price),
        currency: 'USD',
      },
    });
}
export async function seedEnvironment(
  tx: Prisma.TransactionClient,
  environmentId: string,
  generation: number,
  now: Date,
  includeExamples = true,
) {
  const customers = await Promise.all(
    ['Alex Morgan', 'Jordan Lee'].map((displayName) =>
      tx.customer.create({ data: { environmentId, generation, displayName } }),
    ),
  );
  const scenarios: {
    customer: number;
    age: number;
    status: OrderStatus;
    items: [number, number][];
  }[] = [
    {
      customer: 0,
      age: 3,
      status: 'DELIVERED',
      items: [
        [1, 2],
        [2, 2],
        [5, 1],
      ],
    },
    {
      customer: 0,
      age: 12,
      status: 'DELIVERED',
      items: [
        [3, 3],
        [4, 1],
      ],
    },
    {
      customer: 0,
      age: 45,
      status: 'DELIVERED',
      items: [
        [6, 1],
        [7, 1],
      ],
    },
    { customer: 0, age: 0, status: 'PROCESSING', items: [[8, 1]] },
    { customer: 1, age: 1, status: 'SHIPPED', items: [[9, 1]] },
    {
      customer: 1,
      age: 5,
      status: 'DELIVERED',
      items: [
        [10, 2],
        [1, 1],
        [6, 1],
      ],
    },
  ];
  const seeded: {
    order: { id: string; customerId: string };
    items: { id: string; productId: number }[];
  }[] = [];
  for (const [i, s] of scenarios.entries()) {
    const deliveredAt = new Date(now.getTime() - s.age * 86400000);
    const order = await tx.order.create({
      data: {
        environmentId,
        generation,
        customerId: customers[s.customer].id,
        displayNumber: 'ORM-' + (1042 + i),
        orderedAt: new Date(deliveredAt.getTime() - 4 * 86400000),
        status: s.status,
        deliveredAt: s.status === 'DELIVERED' ? deliveredAt : null,
      },
    });
    const items = [];
    for (const [productId, purchasedQuantity] of s.items) {
      const p = catalog.find((x) => x.id === productId)!;
      items.push(
        await tx.orderItem.create({
          data: {
            environmentId,
            generation,
            orderId: order.id,
            productId,
            purchasedQuantity,
            purchasePriceMinor: cents(p.price),
          },
        }),
      );
    }
    seeded.push({ order, items });
  }
  if (includeExamples) {
    const examples: { order: number; line: number; status: ReturnStatus; reason: string }[] = [
      { order: 0, line: 0, status: 'PENDING', reason: 'The keyboard does not fit my workspace.' },
      { order: 0, line: 1, status: 'RECEIVED', reason: 'I prefer a different mouse shape.' },
      { order: 1, line: 0, status: 'APPROVED', reason: 'The headphones are not the right fit.' },
      { order: 1, line: 0, status: 'REJECTED', reason: 'I would like a different colour.' },
      { order: 1, line: 1, status: 'CANCELLED', reason: 'I no longer need this accessory.' },
      {
        order: 5,
        line: 0,
        status: 'PENDING',
        reason: 'The desk mat is too large for my workspace.',
      },
    ];
    for (const [index, example] of examples.entries()) {
      const { order, items } = seeded[example.order];
      const createdAt = new Date(now.getTime() - (24 - index) * 3600000);
      const types: EventType[] = ['CREATED'];
      if (example.status === 'RECEIVED') types.push('APPROVED', 'RECEIVED');
      else if (example.status !== 'PENDING') types.push(example.status);
      const rejectionReason =
        example.status === 'REJECTED'
          ? 'The demonstration policy does not cover a colour preference for this request.'
          : null;
      const request = await tx.returnRequest.create({
        data: {
          environmentId,
          generation,
          orderId: order.id,
          customerId: order.customerId,
          displayNumber: 'RET-EXAMPLE-' + (index + 1),
          reason: example.reason,
          status: example.status,
          rejectionReason,
          version: types.length,
          createdAt,
          updatedAt: new Date(createdAt.getTime() + (types.length - 1) * 3600000),
        },
      });
      await tx.returnItem.create({
        data: {
          environmentId,
          generation,
          requestId: request.id,
          orderId: order.id,
          orderItemId: items[example.line].id,
          quantity: 1,
        },
      });
      for (const [i, eventType] of types.entries()) {
        const customerAction = eventType === 'CREATED' || eventType === 'CANCELLED';
        await tx.historyEvent.create({
          data: {
            environmentId,
            generation,
            requestId: request.id,
            sequence: i + 1,
            eventType,
            occurredAt: new Date(createdAt.getTime() + i * 3600000),
            actorKind: customerAction ? 'CUSTOMER' : 'ADMIN',
            actorCustomerId: customerAction ? order.customerId : null,
            reason: eventType === 'REJECTED' ? rejectionReason : null,
          },
        });
      }
    }
  }
  await tx.returnPolicy.upsert({
    where: { environmentId },
    create: { environmentId, windowDays: 30 },
    update: { windowDays: 30 },
  });
  return customers;
}
