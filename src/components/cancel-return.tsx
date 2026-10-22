'use client';
import { AsyncButton } from './async-button';
import { notify } from './toast';
import { useState } from 'react';
import { useDemoMutation } from './use-demo-mutation';
import { Modal } from './modal';
export function CancelReturn({
  customerId,
  requestId,
  generation,
  onComplete,
}: {
  customerId: string;
  requestId: string;
  generation: number;
  onComplete: () => void;
}) {
  const [confirming, setConfirming] = useState(false),
    mutation = useDemoMutation();
  async function cancel() {
    const r = await mutation.run(
      `/api/customers/${customerId}/returns/${requestId}/cancel`,
      { confirmed: true },
      generation,
    );
    if (r) {
      notify('success', 'Request cancelled.');
      setConfirming(false);
      onComplete();
    }
  }
  return (
    <section className="section-gap">
      <button className="secondary" onClick={() => setConfirming(true)}>
        Cancel request
      </button>
      {confirming && (
        <Modal
          title="Cancel this return request?"
          busy={mutation.busy}
          onClose={() => setConfirming(false)}
        >
          <p>
            The selected units will be released. A new request must still meet the current return
            policy.
          </p>
          <div className="actions">
            <button
              className="secondary"
              disabled={mutation.busy}
              onClick={() => setConfirming(false)}
            >
              Keep request
            </button>
            <AsyncButton
              className="danger"
              busy={mutation.busy}
              busyLabel="Cancelling…"
              onClick={cancel}
            >
              Confirm cancellation
            </AsyncButton>
          </div>
        </Modal>
      )}
    </section>
  );
}
