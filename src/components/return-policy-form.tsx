'use client';
import { AsyncButton } from './async-button';
import { notify } from './toast';
import { SectionSkeleton } from './section-skeleton';
import { useState } from 'react';
import { useDemoData, ErrorNotice } from './demo-context';
import { useDemoMutation } from './use-demo-mutation';
export function ReturnPolicyForm() {
  const policy = useDemoData<{ windowDays: number; updatedAt: string }>('/api/admin/policy'),
    mutation = useDemoMutation();
  const [days, setDays] = useState<string>();
  if (policy.error) return <ErrorNotice error={policy.error} retry={policy.refresh} />;
  if (!policy.data) return <SectionSkeleton variant="policy" />;
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Return policy</h1>
          <p className="muted">
            One calendar-day window applies to every order in your demonstration.
          </p>
        </div>
      </div>
      <form
        className="sheet measure"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await mutation.run(
            '/api/admin/policy',
            { windowDays: Number(days ?? policy.data!.windowDays) },
            policy.generation,
            'PATCH',
          );
          if (r) {
            notify('success', 'Return window updated.');
            policy.refresh();
          }
        }}
      >
        <h2>Global return window</h2>
        <p>
          Customers can request returns from the delivery date through the final allowed calendar
          date, inclusive. The initial window is 30 days.
        </p>
        <div className="form-field">
          <label htmlFor="window">Return window in calendar days</label>
          <input
            id="window"
            type="number"
            min="1"
            step="1"
            required
            value={days ?? String(policy.data.windowDays)}
            onChange={(e) => {
              setDays(e.target.value);
            }}
            aria-describedby="window-help"
          />
          <p className="form-help" id="window-help">
            Changes affect new request evaluations. Existing requests, their decisions and history
            stay valid.
          </p>
        </div>
        <AsyncButton busy={mutation.busy} busyLabel="Saving…">
          Save return window
        </AsyncButton>
      </form>
    </>
  );
}
