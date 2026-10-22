'use client';
import { useEffect, useId, useState, type ComponentProps } from 'react';
import { useSearchParams } from 'next/navigation';
import { renewDemoActivity } from './demo-context';
import type { Status } from '@/lib/contracts';
import { Icon } from './icon';
import { statusLabels } from './return-status';

type StateInfo = {
  icon: ComponentProps<typeof Icon>['name'];
  tag: string;
  summary: string;
  actor: string;
  explanation: string;
};
const stateInfo: Record<Status, StateInfo> = {
  PENDING: {
    icon: 'clock',
    tag: 'Units reserved',
    summary: 'Your request is waiting for a decision.',
    actor: 'Customer submits the request',
    explanation:
      'The customer selects eligible products, positive quantities and a reason. Creating the request reserves those units. While pending, the administrator can approve or reject it, or the customer can confirm cancellation.',
  },
  APPROVED: {
    icon: 'check',
    tag: 'Units reserved',
    summary: 'Your request is approved. Review the next steps.',
    actor: 'Administrator approves',
    explanation:
      'Approval applies to the whole request. Pack the products for a simulated pickup within the next three business days. No real carrier will be sent. Units remain reserved; approval does not issue a refund or confirm physical receipt.',
  },
  RECEIVED: {
    icon: 'box',
    tag: 'Final state',
    summary: 'Receipt is confirmed. The return is complete.',
    actor: 'Administrator confirms receipt',
    explanation:
      'Only an approved request can be marked received. The administrator records this simulated receipt as a separate action; it is never automatic and does not require waiting three business days. The request is final, its units remain committed and no monetary refund is issued.',
  },
  REJECTED: {
    icon: 'close',
    tag: 'Final state',
    summary: 'A rejection reason is required. Units are released.',
    actor: 'Administrator rejects',
    explanation:
      'Only a pending request can be rejected. The administrator must provide a reason, which remains in the history. All units in the request are released. This request is final; any new request must still meet the current eligibility rules.',
  },
  CANCELLED: {
    icon: 'returns',
    tag: 'Final state',
    summary: 'The customer withdraws the request. Units are released.',
    actor: 'Customer confirms cancellation',
    explanation:
      'The customer confirms cancellation while the request is pending. Its units become available again, subject to eligibility. The request cannot be reactivated, and approved, rejected or received requests cannot be cancelled.',
  },
};

export function ReturnGuide() {
  const [selected, setSelected] = useState<Status>('PENDING');
  const navigation = useSearchParams().toString();
  useEffect(() => {
    void renewDemoActivity();
  }, [navigation]);
  const explanationId = useId();
  const info = stateInfo[selected];
  function stateCard(status: Status) {
    const item = stateInfo[status];
    return (
      <button
        type="button"
        className={`guide-state guide-state-${status}`}
        data-state={status}
        aria-label={`Learn about ${statusLabels[status]}`}
        aria-pressed={selected === status}
        aria-controls={explanationId}
        onClick={() => setSelected(status)}
      >
        <span className="guide-state-top">
          <span className="guide-state-icon">
            <Icon name={item.icon} />
          </span>
          <span className="guide-state-tag">{item.tag}</span>
        </span>
        <h3>{statusLabels[status]}</h3>
        <p>{item.summary}</p>
        <span className="guide-state-actor">{item.actor}</span>
      </button>
    );
  }
  return (
    <div className="return-guide">
      <header className="page-heading guide-page-heading">
        <div>
          <p className="guide-eyebrow">The return guide</p>
          <h1>Every return has a clear next step.</h1>
          <p className="muted">See what happens, who takes action and where a request can go.</p>
        </div>
        <span className="guide-reading-time">
          <Icon name="clock" />A one-minute overview
        </span>
      </header>
      <section className="guide-panel" aria-labelledby="guide-map-title">
        <header className="guide-panel-heading">
          <h2 id="guide-map-title">The complete picture</h2>
          <p>Follow the arrows. Select any state to learn more.</p>
        </header>
        <div className="guide-map" role="group" aria-label="Return states and transitions">
          {stateCard('PENDING')}
          <div
            className="guide-transition guide-approve-link"
            data-from="PENDING"
            data-to="APPROVED"
          >
            <span>Approve</span>
          </div>
          {stateCard('APPROVED')}
          <div
            className="guide-transition guide-receive-link"
            data-from="APPROVED"
            data-to="RECEIVED"
          >
            <span>Receive</span>
          </div>
          {stateCard('RECEIVED')}
          <div className="guide-branch-stem" aria-hidden="true" />
          <p className="guide-alternatives">Alternative outcomes · Only from Pending review</p>
          <div
            className="guide-transition guide-reject-link"
            data-from="PENDING"
            data-to="REJECTED"
          >
            <span>Reject</span>
          </div>
          {stateCard('REJECTED')}
          <div
            className="guide-transition guide-cancel-link"
            data-from="PENDING"
            data-to="CANCELLED"
          >
            <span>Customer cancels · pending only</span>
          </div>
          {stateCard('CANCELLED')}
        </div>
        <section
          className="guide-explanation"
          id={explanationId}
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="guide-explanation-icon">
            <Icon name={info.icon} />
          </span>
          <div>
            <h3>{statusLabels[selected]} — what it means</h3>
            <p>{info.explanation}</p>
          </div>
        </section>
      </section>
      <section className="guide-essentials" aria-label="Return essentials">
        <article>
          <Icon name="box" />
          <div>
            <h3>Start with an eligible order</h3>
            <p>
              Delivered, inside your return window and with units still available. The initial
              window is 30 calendar days; an administrator can change it for this demo.
            </p>
          </div>
        </article>
        <article>
          <Icon name="layers" />
          <div>
            <h3>One product, multiple units</h3>
            <p>
              Bought 2 and requested 1? The other unit can have its own request. Pending, approved
              and received units stay committed.
            </p>
          </div>
        </article>
        <article>
          <Icon name="admin" />
          <div>
            <h3>About this demo</h3>
            <p>This demo uses sample data. Payments, refunds and shipping are not processed.</p>
          </div>
        </article>
      </section>
      <details className="guide-quantity-help">
        <summary>
          Why can the same product appear in another return?
          <Icon name="down" />
        </summary>
        <div>
          <p>
            Availability is calculated per order item: purchased units minus units in pending,
            approved and received requests. Rejected or cancelled requests release their units. The
            order must still meet the return window and delivery rules.
          </p>
          <div className="guide-quantity-example">
            <span>
              <strong>2</strong> units purchased
            </span>
            <span aria-hidden="true">−</span>
            <span>
              <strong>1</strong> unit committed
            </span>
            <span aria-hidden="true">=</span>
            <span>
              <strong>1</strong> unit available
            </span>
          </div>
        </div>
      </details>
    </div>
  );
}
