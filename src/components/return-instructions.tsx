import type { Status } from '@/lib/contracts';
export function ReturnInstructions({
  status,
  view = 'customer',
}: {
  status: Status;
  view?: 'customer' | 'admin';
}) {
  if (status === 'APPROVED')
    return (
      <section className="return-instructions" aria-label="Approved return next steps">
        <h3>{view === 'admin' ? 'Complete the return' : 'Prepare your products'}</h3>
        <p>
          {view === 'admin'
            ? 'Confirm receipt to complete this demo return. Approval does not issue a refund or confirm physical receipt; receipt confirmation does not issue a refund.'
            : 'In this demo, pack the selected products for a simulated pickup within the next three business days. No real carrier will be sent. Approval does not issue a refund or confirm physical receipt.'}
        </p>
      </section>
    );
  if (status === 'RECEIVED')
    return (
      <section
        className="return-instructions received-instructions"
        aria-label="Received return confirmation"
      >
        <h3>Simulated receipt confirmed</h3>
        <p>Receipt is recorded for this demo. No refund has been issued.</p>
      </section>
    );
  return null;
}
