'use client';
import { AsyncButton } from './async-button';
import { notify } from './toast';
import { SectionSkeleton } from './section-skeleton';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDemoData, ErrorNotice, clearDemoData } from './demo-context';
import { useDemoMutation } from './use-demo-mutation';
import { Modal } from './modal';
import { Icon } from './icon';
import type { CustomerView } from '@/lib/contracts';
export function DemoReset() {
  const context = useDemoData<{ customers: CustomerView[]; generation: number }>('/api/demo'),
    mutation = useDemoMutation(),
    router = useRouter(),
    query = useSearchParams();
  const admin = query.get('view') === 'admin';
  const [confirming, setConfirming] = useState(false),
    [restoring, setRestoring] = useState(false);
  const busy = mutation.busy || restoring;
  async function reset() {
    if (busy) return;
    setRestoring(true);
    try {
      const selectedName = context.data?.customers.find(
        (c) => c.id === query.get('customer'),
      )?.displayName;
      const result = await mutation.run('/api/demo/reset', { confirmed: true }, context.generation);
      if (result) {
        notify('success', 'Demonstration reset.');
        clearDemoData();
        try {
          localStorage.setItem('orm-reset', crypto.randomUUID());
        } catch {}
        const r = await fetch('/api/demo', {
          cache: 'no-store',
          headers: { 'X-Demo-Activity': 'navigation' },
        });
        if (r.ok) {
          const b = await r.json();
          setConfirming(false);
          const customerId =
            b.data.customers.find((c: CustomerView) => c.displayName === selectedName)?.id ??
            b.data.customers[0].id;
          router.replace(
            admin ? `/admin/returns?customer=${customerId}` : `/customer/${customerId}/orders`,
          );
        } else {
          setConfirming(false);
          notify('error', 'The demo was reset, but its data could not be loaded. Try refreshing.');
          context.refresh();
        }
      }
    } catch {
      setConfirming(false);
      notify('error', 'Could not load the restored demonstration. Try refreshing.');
      context.refresh();
    } finally {
      setRestoring(false);
    }
  }
  if (context.error) return <ErrorNotice error={context.error} retry={context.refresh} />;
  if (!context.data) return <SectionSkeleton variant="settings" />;
  return (
    <div className="settings-wrap">
      <div className="page-heading">
        <div>
          <h1>Demo settings</h1>
          <p className="muted">Your workspace, your settings.</p>
        </div>
      </div>
      <p className="context-note">
        <Icon name={admin ? 'admin' : 'user'} />
        You’re in {admin ? 'Administrator' : 'Customer'} view. Settings keep you in this view.
      </p>
      <section className="sheet settings-panel">
        <section className="setting-section">
          <span className="setting-icon">
            <Icon name="lock" />
          </span>
          <div>
            <h2>Your workspace</h2>
            <p>
              Customer and administrator views share this browser’s orders and requests. Your
              selected customer stays local to this tab.
            </p>
          </div>
        </section>
        <section className="setting-section">
          <span className="setting-icon">
            <Icon name="clock" />
          </span>
          <div>
            <h2>Temporary by design</h2>
            <p>
              Data expires after seven days without your activity. Opening a screen or performing an
              operation renews that period. Background updates do not. After expiry, you’ll be asked
              to start a new demonstration.
            </p>
          </div>
        </section>
        <section className="setting-section danger-zone">
          <span className="setting-icon">
            <Icon name="refresh" />
          </span>
          <div>
            <h2>Start fresh</h2>
            <p>Restore the original example data whenever you want to try a different journey.</p>
            <ul>
              <li>Remove the requests, decisions and history you generated.</li>
              <li>Restore the initial orders, six example returns and their histories.</li>
              <li>Restore the 30-day return window.</li>
            </ul>
            <button className="secondary" onClick={() => setConfirming(true)}>
              Reset demonstration
            </button>
          </div>
        </section>
      </section>
      {confirming && (
        <Modal
          title="Restore the initial demo data?"
          busy={busy}
          onClose={() => setConfirming(false)}
        >
          <p>
            Your requests, decisions and history will be removed and replaced with the initial
            sample data. This cannot be undone.
          </p>
          <div className="actions">
            <button className="secondary" disabled={busy} onClick={() => setConfirming(false)}>
              Keep my data
            </button>
            <AsyncButton className="danger" busy={busy} busyLabel="Restoring data…" onClick={reset}>
              Confirm reset
            </AsyncButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
