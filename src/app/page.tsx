'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { Icon } from '@/components/icon';
import { clearDemoData } from '@/components/demo-context';
import { AsyncButton } from '@/components/async-button';
import { notify } from '@/components/toast';
export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState<'customer' | 'admin' | null>(null);
  async function start(admin = false) {
    if (busy) return;
    setBusy(admin ? 'admin' : 'customer');
    try {
      const bootstrap = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!bootstrap.ok) {
        notify('error', (await bootstrap.json()).error.message);
        return;
      }
      const r = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: '{}',
      });
      const b = await r.json();
      if (!r.ok) {
        notify('error', b.error.message);
        return;
      }
      clearDemoData();
      router.push(
        admin
          ? `/admin/returns?customer=${b.data.customers[0].id}`
          : `/customer/${b.data.customers[0].id}/orders`,
      );
    } catch {
      notify('error', 'Could not start the demonstration. Please try again.');
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <header className="landing-header">
        <Brand />
        <ThemeToggle />
      </header>
      <main id="main" className="landing">
        <div className="landing-grid">
          <section className="landing-copy">
            <h1>
              Your orders.
              <br />A clearer next step.
            </h1>
            <p>
              Find your purchases, explore the details and follow every update. A straightforward
              experience from start to finish.
            </p>
            <div className="landing-cta">
              <AsyncButton
                disabled={!!busy}
                busy={busy === 'customer'}
                busyLabel="Preparing your workspace…"
                icon="arrow"
                onClick={() => start()}
              >
                Explore the demo
              </AsyncButton>
              <AsyncButton
                className="text-button"
                disabled={!!busy}
                busy={busy === 'admin'}
                busyLabel="Preparing your workspace…"
                onClick={() => start(true)}
              >
                Try administrator view
              </AsyncButton>
            </div>
            <div className="cta-notes">
              <p>No account needed. Your own fictional customers and orders.</p>
              <p>Already exploring? Continue your active demonstration.</p>
            </div>
          </section>
          <div className="preview-scene" aria-label="Example fictional order">
            <div className="scene-arch" />
            <div className="scene-window">
              <div className="scene-head">
                <strong>Order ORM-1042</strong>
                <span className="badge eligible">
                  <Icon name="check" />
                  Delivered
                </span>
              </div>
              <div className="scene-products">
                {['keyform-t84', 'flowgrip-m6', 'liftstand-a1'].map((name) => (
                  <Image
                    key={name}
                    src={`/products/nivora-${name}.webp`}
                    alt={`Fictional Nivora ${name} illustration`}
                    width={160}
                    height={160}
                    priority
                  />
                ))}
              </div>
              <div className="scene-row">
                <span>Your purchase details</span>
                <strong>3 products</strong>
              </div>
              <div className="scene-row">
                <span>One independent workspace</span>
                <Icon name="lock" />
              </div>
              <div className="scene-bottom">
                <span className="mini-check">
                  <Icon name="check" />
                </span>
                <div>
                  <strong>Your purchases, in one place</strong>
                  <p>View an order and choose your next step.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="definition-grid">
          {[
            [
              'box',
              'Start with your purchase',
              'See products, quantities and original USD prices in each order.',
            ],
            [
              'returns',
              'Follow every step',
              'Explore example returns, review decisions and see their history.',
            ],
            [
              'refresh',
              'Make it your own demo',
              'Switch views, try a different outcome or reset your sample data.',
            ],
          ].map(([glyph, title, description]) => (
            <section key={title} className="landing-feature">
              <Icon name={glyph as 'box' | 'returns' | 'refresh'} />
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </section>
          ))}
        </div>
        <p className="landing-footer">
          All products and customer profiles are fictional. This demo does not issue refunds,
          arrange real pickups or require registration.
        </p>
      </main>
    </>
  );
}
