import type { EventView } from '@/lib/contracts';
import { dateTime } from '@/lib/money';
const verbs: Record<string, string> = {
  CREATED: 'Request created',
  APPROVED: 'Request approved',
  REJECTED: 'Request rejected',
  CANCELLED: 'Request cancelled',
  RECEIVED: 'Simulated receipt confirmed',
};
export function ReturnHistory({ events }: { events: EventView[] }) {
  return (
    <section className="section-gap">
      <h2>History</h2>
      <ol className="timeline">
        {events.map((e) => (
          <li key={e.id}>
            <strong>{verbs[e.eventType] ?? e.eventType}</strong>
            <small>{dateTime(e.occurredAt)}</small>
            <span className="small">
              {e.actor.kind === 'CUSTOMER' ? 'Customer: ' : 'Administrator: '}
              {e.actor.displayName}
            </span>
            {e.reason && <p style={{ whiteSpace: 'pre-wrap' }}>{e.reason}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
