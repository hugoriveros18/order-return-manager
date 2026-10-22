'use client';
import Link from 'next/link';
import { notify } from './toast';
import { useEffect, useCallback, useSyncExternalStore } from 'react';
import type { ApiError } from '@/lib/contracts';
type Resource = {
  data?: unknown;
  generation?: number;
  pendingCount?: number;
  error?: ApiError;
  fetching?: boolean;
  loadedAt?: number;
};
const empty: Resource = {};
const cache = new Map<string, Resource>();
const listeners = new Map<string, Set<() => void>>();
let epoch = 0;
function publish(path: string, value: Resource) {
  cache.set(path, value);
  listeners.get(path)?.forEach((f) => f());
}
export function clearDemoData() {
  epoch++;
  cache.clear();
  for (const [path, set] of listeners) {
    if (!set.size) continue;
    if (!['/api/demo', '/api/customers', '/api/admin/returns'].includes(path)) {
      cache.set(path, {
        error: {
          code: 'STALE_DEMO',
          message:
            'This demonstration was reset. Open Orders or Requests to continue with the restored examples.',
        },
      });
    }
    set.forEach((f) => f());
  }
  for (const path of ['/api/demo', '/api/customers', '/api/admin/returns'])
    if (listeners.get(path)?.size) void load(path, false);
}
export function refreshDemoData() {
  for (const [path, value] of cache) {
    cache.set(path, { ...value, loadedAt: 0 });
    if (listeners.get(path)?.size) void load(path);
  }
}
export function renewDemoActivity() {
  return load('/api/demo');
}
export function checkDemoAccess() {
  return load('/api/demo', false);
}
async function load(path: string, activity = true) {
  if (cache.get(path)?.fetching) return;
  const currentEpoch = epoch,
    previous = cache.get(path) || empty;
  publish(path, { ...previous, fetching: true, error: undefined });
  try {
    const r = await fetch(path, {
      headers: activity ? { 'X-Demo-Activity': 'navigation' } : {},
      cache: 'no-store',
    });
    const b = await r.json();
    if (epoch !== currentEpoch) return;
    if (!r.ok) {
      if (['DEMO_EXPIRED', 'DEMO_SESSION_REQUIRED', 'STALE_DEMO'].includes(b.error.code)) {
        for (const key of cache.keys()) publish(key, { error: b.error });
      } else if (previous.data) {
        notify('error', b.error.message);
        publish(path, { ...previous, error: undefined, fetching: false });
      } else publish(path, { ...previous, error: b.error, fetching: false });
      return;
    }
    publish(path, {
      data: b.data,
      generation: b.meta?.generation,
      pendingCount: b.meta?.pendingCount,
      fetching: false,
      loadedAt: Date.now(),
    });
  } catch {
    if (epoch === currentEpoch) {
      if (previous.data) {
        notify('error', 'Could not refresh this screen. Check your connection and try again.');
        publish(path, { ...previous, error: undefined, fetching: false });
        return;
      }
      publish(path, {
        ...previous,
        fetching: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Could not load this screen. Check your connection and try again.',
        },
      });
    }
  }
}
export function useDemoData<T>(path: string | null) {
  const subscribe = useCallback(
    (f: () => void) => {
      if (!path) return () => {};
      let set = listeners.get(path);
      if (!set) {
        set = new Set();
        listeners.set(path, set);
      }
      set.add(f);
      return () => {
        set.delete(f);
      };
    },
    [path],
  );
  const get = useCallback(() => (path ? cache.get(path) || empty : empty), [path]);
  const state = useSyncExternalStore(subscribe, get, () => empty);
  useEffect(() => {
    if (path && (!cache.get(path)?.loadedAt || Date.now() - cache.get(path)!.loadedAt! > 30000))
      void load(path);
  }, [path]);
  const refresh = useCallback(() => {
    if (path) void load(path);
  }, [path]);
  return {
    data: state.data as T | undefined,
    generation: state.generation,
    pendingCount: state.pendingCount,
    error: state.error,
    loading: !state.data && !state.error,
    refreshing: !!state.fetching,
    refresh,
  };
}
export function ErrorNotice({ error, retry }: { error: ApiError; retry?: () => void }) {
  return (
    <div className="alert error" role="alert">
      <p>
        {error.message}
        {error.retryAfterSeconds ? ` Try again in ${error.retryAfterSeconds} seconds.` : ''}
      </p>
      {['DEMO_EXPIRED', 'DEMO_SESSION_REQUIRED', 'STALE_DEMO'].includes(error.code) ? (
        <Link className="button secondary" href="/" prefetch={false}>
          Start or continue demonstration
        </Link>
      ) : retry ? (
        <button className="secondary" onClick={retry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
