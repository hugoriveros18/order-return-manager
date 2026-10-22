'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { ItemView, OrderView } from '@/lib/contracts';
import { money, dateOnly } from '@/lib/money';
export function ProductRow({ item, children }: { item: ItemView; children?: React.ReactNode }) {
  return (
    <div className="product-row">
      <Image
        src={item.imagePath}
        alt={`${item.name} product illustration`}
        width={88}
        height={88}
      />
      <div className="product-info">
        <h3>{item.name}</h3>
        <p className="muted small">
          {item.requestedQuantity !== undefined
            ? `${item.requestedQuantity} unit(s) requested`
            : `Quantity ${item.purchasedQuantity}`}
        </p>
        <p className="small numeric">{money(item.purchasePriceMinor)} each</p>
        {children}
      </div>
      <strong className="product-price">
        {money(
          (
            BigInt(item.purchasePriceMinor) *
            BigInt(item.requestedQuantity ?? item.purchasedQuantity)
          ).toString(),
        )}
      </strong>
    </div>
  );
}
export function OrderSheet({ order }: { order: OrderView }) {
  const total = order.items.reduce(
    (n, i) => n + BigInt(i.purchasePriceMinor) * BigInt(i.purchasedQuantity),
    0n,
  );
  const itemCount = order.items.reduce((count, item) => count + item.purchasedQuantity, 0);
  return (
    <section className="sheet order-detail">
      <header className="detail-header">
        <div className="detail-title">
          <h2>Order {order.displayNumber}</h2>
          <span className={'badge ' + (order.status === 'DELIVERED' ? 'eligible' : 'CANCELLED')}>
            {order.status === 'DELIVERED'
              ? 'Delivered'
              : order.status === 'SHIPPED'
                ? 'Shipped'
                : 'Processing'}
          </span>
        </div>
        <div className="detail-meta">
          <span>
            Purchased<strong>{dateOnly(order.orderedAt)}</strong>
          </span>
          <span>
            Delivered
            <strong>{order.deliveredAt ? dateOnly(order.deliveredAt) : 'Not delivered yet'}</strong>
          </span>
        </div>
      </header>
      <div className="products">
        {order.items.map((item) => (
          <ProductRow key={item.orderItemId} item={item} />
        ))}
      </div>
      <div className="order-total">
        <span>
          Order total · {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
        <strong>{money(total.toString())}</strong>
      </div>
      <footer className="order-options">
        <div>
          <h3>Order options</h3>
          <p>
            {order.eligibility.eligible
              ? `Returns are available until ${order.eligibility.eligibleUntilDate}.`
              : order.eligibility.message}
          </p>
        </div>
        {order.eligibility.eligible && (
          <Link
            className="button secondary"
            prefetch={false}
            href={`/customer/${order.customerId}/orders/${order.id}/return`}
          >
            Request return
          </Link>
        )}
      </footer>
    </section>
  );
}
