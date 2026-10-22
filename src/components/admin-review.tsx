'use client';
import { AsyncButton } from './async-button';
import { notify } from './toast';
import { SectionSkeleton } from './section-skeleton';
import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useDemoData, ErrorNotice, renewDemoActivity } from './demo-context';
import { useDemoMutation } from './use-demo-mutation';
import { ReturnStatus, statusLabels } from './return-status';
import { ReturnHistory } from './return-history';
import { ReturnInstructions } from './return-instructions';
import { ProductRow } from './order-sheet';
import { Modal } from './modal';
import { dateTime } from '@/lib/money';
import type { ReturnView, Paged } from '@/lib/contracts';
export function AdminReview() {
  const params = useParams<{ requestId?: string }>(),
    query = useSearchParams();
  const filter = query.get('status') ?? '';
  const list = useDemoData<Paged<ReturnView>>('/api/admin/returns');
  const [pinned, setPinned] = useState<string>(),
    [extra, setExtra] = useState<ReturnView[]>([]),
    [next, setNext] = useState<string | null | undefined>(),
    [paging, setPaging] = useState(false);
  const [rejecting, setRejecting] = useState(false),
    [reason, setReason] = useState(''),
    [action, setAction] = useState<'approve' | 'reject' | 'receive'>();
  const all = [
    ...(list.data?.items ?? []),
    ...extra.filter((r) => !list.data?.items.some((v) => v.id === r.id)),
  ];
  const filtered = all.filter((r) => !filter || r.status === filter),
    selectedId = pinned ?? query.get('request') ?? params.requestId;
  const detail = useDemoData<ReturnView>(
    selectedId && !all.some((r) => r.id === selectedId) ? `/api/admin/returns/${selectedId}` : null,
  );
  const selected = selectedId ? (all.find((r) => r.id === selectedId) ?? detail.data) : filtered[0];
  const mutation = useDemoMutation();
  const url = (status: string, id?: string) =>
    '/admin/returns?' +
    new URLSearchParams({
      ...(query.get('customer') ? { customer: query.get('customer')! } : {}),
      ...(status ? { status } : {}),
      ...(id ? { request: id } : {}),
    });
  async function loadMore() {
    const cursor = next === undefined ? list.data?.nextCursor : next;
    if (!cursor || paging) return;
    setPaging(true);
    try {
      const r = await fetch('/api/admin/returns?cursor=' + encodeURIComponent(cursor), {
        cache: 'no-store',
        headers: { 'X-Demo-Activity': 'navigation' },
      });
      const b = await r.json();
      if (!r.ok) {
        notify('error', b.error.message);
        return;
      }
      setExtra((previous) => [...previous, ...b.data.items]);
      setNext(b.data.nextCursor);
    } catch {
      notify('error', 'Could not load the next page. Try again.');
    } finally {
      setPaging(false);
    }
  }
  async function decide(kind: 'approve' | 'reject' | 'receive') {
    if (!selected) return;
    setPinned(selected.id);
    setAction(kind);
    const r = await mutation.run(
      `/api/admin/returns/${selected.id}/${kind}`,
      kind === 'reject' ? { reason } : {},
      list.generation ?? detail.generation,
    );
    if (r) {
      setExtra([]);
      setNext(undefined);
      setRejecting(false);
      setReason('');
      notify(
        'success',
        kind === 'approve'
          ? 'Request approved.'
          : kind === 'reject'
            ? 'Request rejected.'
            : 'Simulated receipt confirmed.',
      );
      detail.refresh();
      list.refresh();
    }
  }
  if (list.error) return <ErrorNotice error={list.error} retry={list.refresh} />;
  if (!list.data) return <SectionSkeleton variant="admin" />;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Return requests</h1>
          <p className="muted">Review the products and reason, then make a decision.</p>
        </div>
        <AsyncButton
          className="secondary"
          icon="refresh"
          busy={list.refreshing || detail.refreshing}
          busyLabel="Refreshing…"
          onClick={() => {
            setExtra([]);
            setNext(undefined);
            list.refresh();
            detail.refresh();
          }}
        >
          Refresh
        </AsyncButton>
      </div>
      <nav className="filters" aria-label="Filter requests">
        {[['', 'All requests'], ...Object.entries(statusLabels)].map(([value, label]) => (
          <button
            key={value}
            className={'filter ' + (filter === value ? 'active' : '')}
            aria-pressed={filter === value}
            onClick={() => {
              void renewDemoActivity();
              setPinned(undefined);
              window.history.pushState(null, '', url(value));
            }}
          >
            {label}
            <span>
              {value === 'PENDING'
                ? list.pendingCount
                : all.filter((r) => !value || r.status === value).length}
            </span>
          </button>
        ))}
      </nav>
      <div className="master-detail">
        <aside className="list-panel request-queue" aria-label="Request queue">
          {filtered.length ? (
            filtered.map((r) => (
              <button
                className={'list-row queue-item ' + (selected?.id === r.id ? 'selected' : '')}
                key={r.id}
                aria-pressed={selected?.id === r.id}
                onClick={() => {
                  setPinned(r.id);
                  window.history.pushState(null, '', url(filter, r.id));
                }}
              >
                <div className="queue-item-head">
                  <strong>{r.displayNumber}</strong>
                  <small>{dateTime(r.createdAt)}</small>
                </div>
                <small>
                  {r.customerName} · {r.orderDisplayNumber}
                </small>
                <ReturnStatus status={r.status} />
              </button>
            ))
          ) : (
            <div className="queue-empty">No requests match this status.</div>
          )}
          {(next === undefined ? list.data.nextCursor : next) && (
            <AsyncButton
              className="text-button load-more"
              busy={paging}
              busyLabel="Loading more…"
              onClick={loadMore}
            >
              Load more requests
            </AsyncButton>
          )}
        </aside>
        <div className="request-detail-slot">
          {detail.error ? (
            <ErrorNotice error={detail.error} retry={detail.refresh} />
          ) : selected ? (
            <section className="sheet request-detail">
              <header className="detail-header">
                <div className="detail-title">
                  <h2>{selected.displayNumber}</h2>
                  <ReturnStatus status={selected.status} />
                </div>
                <div className="detail-meta">
                  <span>
                    Customer<strong>{selected.customerName}</strong>
                  </span>
                  <span>
                    Order<strong>{selected.orderDisplayNumber}</strong>
                  </span>
                </div>
                <p className="small muted">Created {dateTime(selected.createdAt)}</p>
              </header>
              <div className="products">
                {selected.items.map((i) => (
                  <ProductRow item={i} key={i.orderItemId} />
                ))}
              </div>
              <div className="request-evidence">
                <div className="reason-summary">
                  <h3>Customer reason</h3>
                  <p>{selected.reason}</p>
                </div>
                {selected.rejectionReason && (
                  <div className="alert error">
                    <h3>Rejection reason</h3>
                    <p>{selected.rejectionReason}</p>
                  </div>
                )}
                <ReturnInstructions status={selected.status} view="admin" />
              </div>
              <div className="decision-bar">
                {selected.status === 'PENDING' && (
                  <>
                    <p className="approval-note">
                      Approval updates the request status. It does not issue a refund or confirm
                      physical receipt.
                    </p>
                    <AsyncButton
                      busy={mutation.busy && action === 'approve'}
                      disabled={mutation.busy}
                      busyLabel="Approving…"
                      onClick={() => decide('approve')}
                    >
                      Approve request
                    </AsyncButton>
                    <button
                      className="secondary"
                      disabled={mutation.busy}
                      onClick={() => setRejecting(true)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {selected.status === 'APPROVED' && (
                  <AsyncButton
                    busy={mutation.busy && action === 'receive'}
                    disabled={mutation.busy}
                    busyLabel="Confirming…"
                    onClick={() => decide('receive')}
                  >
                    Confirm simulated receipt
                  </AsyncButton>
                )}
              </div>
              <div className="request-body">
                <ReturnHistory events={selected.history} />
              </div>
            </section>
          ) : selectedId && detail.loading ? (
            <SectionSkeleton variant="admin-detail" />
          ) : (
            <div className="empty stable-empty">
              <h2>No requests in this view</h2>
              <p>
                Choose another status{list.data.nextCursor ? ' or load more requests' : ''} to see
                the rest of your requests.
              </p>
            </div>
          )}
        </div>
      </div>
      {rejecting && (
        <Modal
          title="Reject this request?"
          busy={mutation.busy}
          onClose={() => setRejecting(false)}
        >
          <p>
            The customer will see your explanation. This decision applies to every product in the
            request.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (reason.trim()) void decide('reject');
            }}
          >
            <div className="form-field">
              <label htmlFor="rejection-reason">
                Rejection reason <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="rejection-reason"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="actions">
              <button
                className="secondary"
                type="button"
                onClick={() => setRejecting(false)}
                disabled={mutation.busy}
              >
                Keep pending
              </button>
              <AsyncButton
                className="danger"
                busy={mutation.busy && action === 'reject'}
                busyLabel="Rejecting…"
                disabled={mutation.busy || !reason.trim()}
              >
                Confirm rejection
              </AsyncButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
