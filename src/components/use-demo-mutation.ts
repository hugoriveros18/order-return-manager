'use client';
import { notify } from './toast';
import { useState, useRef } from 'react';
import { refreshDemoData } from './demo-context';
import type { ApiError } from '@/lib/contracts';
export function useDemoMutation() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<ApiError>();
  const intent = useRef<{ signature: string; id: string } | null>(null);
  const inFlight = useRef(false);
  function reportError(value: ApiError) {
    setError(value);
    notify(
      'error',
      value.message +
        (value.retryAfterSeconds ? ` Try again in ${value.retryAfterSeconds} seconds.` : ''),
    );
  }
  async function run<T>(
    url: string,
    payload: unknown,
    generation?: number,
    method = 'POST',
  ): Promise<T | undefined> {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(undefined);
    try {
      let current = generation;
      if (current === undefined) {
        const response = await fetch('/api/demo', { cache: 'no-store' });
        const b = await response.json();
        if (!response.ok) {
          reportError(b.error);
          return;
        }
        current = b.meta.generation;
      }
      const signature = JSON.stringify({ url, payload, generation: current, method });
      if (intent.current?.signature !== signature)
        intent.current = { signature, id: crypto.randomUUID() };
      const r = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': intent.current.id,
          'X-Demo-Generation': String(current),
        },
        body: JSON.stringify(payload),
      });
      const b = await r.json();
      if (!r.ok) {
        reportError(b.error);
        return;
      }
      intent.current = null;
      if (url !== '/api/demo/reset') refreshDemoData();
      return b.data as T;
    } catch {
      reportError({
        code: 'NETWORK_ERROR',
        message: 'The result could not be confirmed. Try again to safely retry this action.',
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return { run, busy, error, clearError: () => setError(undefined) };
}
