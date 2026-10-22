import type { Status } from '@/lib/contracts';
export function ReturnInstructions({ status }: { status: Status }) {
  if (status === 'APPROVED')
    return (
      <section className="return-instructions">
        <h3>Prepare your products</h3>
        <p>
          Pack the selected products. Pickup is simulated within the next three business days. No
          real carrier will be sent.
        </p>
        <p>Approval does not issue a refund or confirm physical receipt.</p>
      </section>
    );
  if (status === 'RECEIVED')
    return (
      <section className="return-instructions received-instructions">
        <h3>Simulated receipt confirmed</h3>
        <p>Your return is complete. No monetary refund has been issued.</p>
      </section>
    );
  return null;
}
