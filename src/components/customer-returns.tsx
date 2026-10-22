'use client';
import { AsyncButton } from './async-button';
import { Icon } from './icon';
import { SectionSkeleton } from './section-skeleton';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useDemoData, ErrorNotice } from './demo-context';
import { ReturnInstructions } from './return-instructions';
import { ReturnStatus } from './return-status';
import { CancelReturn } from './cancel-return';
import { ReturnHistory } from './return-history';
import { ProductRow } from './order-sheet';
import { dateTime } from '@/lib/money';
import type { ReturnView, Paged } from '@/lib/contracts';
export function CustomerReturns() {
  const p = useParams<{ customerId: string; requestId?: string }>(),
    query = useSearchParams(),
    cursor = query.get('cursor');
  const list = useDemoData<Paged<ReturnView>>(
    !p.requestId
      ? `/api/customers/${p.customerId}/returns${cursor ? '?cursor=' + encodeURIComponent(cursor) : ''}`
      : null,
  );
  const detail = useDemoData<ReturnView>(
    p.requestId ? `/api/customers/${p.customerId}/returns/${p.requestId}` : null,
  );
  const current = p.requestId ? detail : list;
  if (current.error) return <ErrorNotice error={current.error} retry={current.refresh} />;
  if (current.loading)
    return <SectionSkeleton variant={p.requestId ? 'return-detail' : 'returns'} />;
  return (
    <div className={p.requestId ? 'center-flow' : undefined}>
      <div className="page-heading">
        <div>
          <h1>{p.requestId ? 'Return request' : 'My returns'}</h1>
          <p className="muted">Follow your requests and every step of their history.</p>
        </div>
        <AsyncButton
          className="secondary"
          onClick={current.refresh}
          busy={current.refreshing}
          busyLabel="Refreshing…"
          icon="refresh"
        >
          Refresh
        </AsyncButton>
      </div>
      {p.requestId ? (
        <>
          <Link className="back-link" href={`/customer/${p.customerId}/returns`} prefetch={false}>
            <Icon name="left" />
            Back to requests
          </Link>
          {detail.data && (
            <section className="sheet measure customer-return-detail">
              <div className="page-heading">
                <div>
                  <h2>{detail.data.displayNumber}</h2>
                  <Link
                    href={`/customer/${p.customerId}/orders/${detail.data.orderId}`}
                    prefetch={false}
                  >
                    Order {detail.data.orderDisplayNumber}
                  </Link>
                </div>
                <ReturnStatus status={detail.data.status} />
              </div>
              <p className="small muted">Created {dateTime(detail.data.createdAt)}</p>
              {detail.data.items.map((item) => (
                <ProductRow item={item} key={item.orderItemId} />
              ))}
              <div className="reason-summary">
                <h3>Your reason</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{detail.data.reason}</p>
              </div>
              {detail.data.rejectionReason && (
                <div className="alert error">
                  <h3>Rejection reason</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{detail.data.rejectionReason}</p>
                </div>
              )}
              <ReturnInstructions status={detail.data.status} />
              {detail.data.status === 'PENDING' && (
                <CancelReturn
                  customerId={p.customerId}
                  requestId={detail.data.id}
                  generation={detail.generation!}
                  onComplete={detail.refresh}
                />
              )}
              <ReturnHistory events={detail.data.history} />
            </section>
          )}
        </>
      ) : !list.data?.items.length ? (
        <div className="empty">
          <h2>No returns yet</h2>
          <p>Open a delivered order to choose the items and quantities you would like to return.</p>
          <Link className="button" prefetch={false} href={`/customer/${p.customerId}/orders`}>
            View orders
          </Link>
        </div>
      ) : (
        <div className="list-panel">
          {list.data.items.map((r) => (
            <Link
              key={r.id}
              className="list-row"
              href={`/customer/${p.customerId}/returns/${r.id}`}
              prefetch={false}
            >
              <div className="page-heading">
                <div>
                  <strong>{r.displayNumber}</strong>
                  <small>
                    Order {r.orderDisplayNumber} · {dateTime(r.createdAt)}
                  </small>
                </div>
                <ReturnStatus status={r.status} />
              </div>
            </Link>
          ))}
          {list.data.nextCursor && (
            <Link
              className="list-row"
              href={'?cursor=' + encodeURIComponent(list.data.nextCursor)}
              prefetch={false}
            >
              Next page
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
