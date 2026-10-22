'use client';
import { AsyncButton } from './async-button';
import { SectionSkeleton } from './section-skeleton';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useDemoData, ErrorNotice, renewDemoActivity } from './demo-context';
import { OrderSheet } from './order-sheet';
import { Icon } from './icon';
import { dateOnly } from '@/lib/money';
import type { OrderView, Paged } from '@/lib/contracts';
export function OrdersScreen() {
  const p = useParams<{ customerId: string; orderId?: string }>(),
    query = useSearchParams();
  const cursor = query.get('cursor'),
    selectedId = query.get('order') ?? p.orderId;
  const list = useDemoData<Paged<OrderView>>(
    `/api/customers/${p.customerId}/orders${cursor ? '?cursor=' + encodeURIComponent(cursor) : ''}`,
  );
  const detail = useDemoData<OrderView>(
    selectedId && list.data && !list.data.items.some((o) => o.id === selectedId)
      ? `/api/customers/${p.customerId}/orders/${selectedId}`
      : null,
  );
  if (list.error) return <ErrorNotice error={list.error} retry={list.refresh} />;
  if (!list.data) return <SectionSkeleton variant="orders" />;
  const orders = list.data.items,
    selected =
      (selectedId ? (orders.find((o) => o.id === selectedId) ?? detail.data) : undefined) ??
      (!selectedId ? orders[0] : undefined);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Your orders</h1>
          <p className="muted">Your purchases, with the details you need.</p>
        </div>
        <AsyncButton
          className="secondary"
          onClick={list.refresh}
          busy={list.refreshing}
          busyLabel="Refreshing…"
          icon="refresh"
        >
          Refresh
        </AsyncButton>
      </div>
      {!orders.length ? (
        <div className="empty">
          <h2>No orders available</h2>
          <p>
            No orders are available for this customer. Reset the demo to restore the initial orders.
          </p>
          <Link
            className="button secondary"
            href={`/demo/reset?view=customer&customer=${p.customerId}`}
            prefetch={false}
          >
            Reset demonstration
          </Link>
        </div>
      ) : (
        <div className="master-detail">
          <aside className="list-panel order-browser" aria-label="Order list">
            {orders.map((o) => (
              <Link
                key={o.id}
                className={'list-row order-option ' + (selected?.id === o.id ? 'selected' : '')}
                prefetch={false}
                href={`/customer/${p.customerId}/orders?order=${o.id}${cursor ? '&cursor=' + encodeURIComponent(cursor) : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  void renewDemoActivity();
                  window.history.pushState(null, '', e.currentTarget.href);
                }}
                aria-current={selected?.id === o.id ? 'true' : undefined}
              >
                <div className="order-option-head">
                  <strong>{o.displayNumber}</strong>
                  <Icon name="chevron" />
                </div>
                <small>
                  {dateOnly(o.orderedAt)} · {o.items.length} products
                </small>
                <div className="order-option-bottom">
                  <div className="order-thumbs">
                    {o.items.slice(0, 2).map((i) => (
                      <Image key={i.orderItemId} src={i.imagePath} alt="" width={38} height={38} />
                    ))}
                  </div>
                  <span
                    className={'badge ' + (o.status === 'DELIVERED' ? 'eligible' : 'CANCELLED')}
                  >
                    {o.status === 'DELIVERED'
                      ? 'Delivered'
                      : o.status === 'SHIPPED'
                        ? 'Shipped'
                        : 'Processing'}
                  </span>
                </div>
              </Link>
            ))}
            {list.data.nextCursor && (
              <Link
                className="list-row"
                href={`?cursor=${encodeURIComponent(list.data.nextCursor)}`}
                prefetch={false}
              >
                Next page
              </Link>
            )}
          </aside>
          <div className="order-detail-slot">
            {detail.error ? (
              <ErrorNotice error={detail.error} retry={detail.refresh} />
            ) : selected ? (
              <OrderSheet order={selected} />
            ) : (
              <SectionSkeleton variant="order-detail" />
            )}
            <p className="footnote">
              <Icon name="info" />
              Original purchase prices in USD.
            </p>
          </div>
        </div>
      )}
      {orders.length > 0 && !orders.some((o) => o.eligibility.eligible) && (
        <div className="alert">
          <p>
            No orders on this page are available for return. Check another page or reset your
            demonstration.
          </p>
          <Link href={`/demo/reset?view=customer&customer=${p.customerId}`} prefetch={false}>
            Reset demonstration
          </Link>
        </div>
      )}
    </>
  );
}
