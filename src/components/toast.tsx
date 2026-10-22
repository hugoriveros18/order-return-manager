'use client';
import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icon';

type Toast = { id: string; kind: 'success' | 'error'; message: string };
type Snapshot = { items: Toast[]; host: HTMLDialogElement | null };
const initial: Snapshot = { items: [], host: null };
let snapshot = initial;
const listeners = new Set<() => void>();
const timers = new Map<
  string,
  { timer?: ReturnType<typeof setTimeout>; remaining: number; started: number }
>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => snapshot;
const getServerSnapshot = () => initial;
function publish(value: Snapshot) {
  snapshot = value;
  listeners.forEach((listener) => listener());
}
export function dismissToast(id: string) {
  clearTimeout(timers.get(id)?.timer);
  timers.delete(id);
  publish({ ...snapshot, items: snapshot.items.filter((item) => item.id !== id) });
}
export function notify(kind: Toast['kind'], message: string) {
  const id = crypto.randomUUID();
  timers.set(id, {
    remaining: 5000,
    started: Date.now(),
    timer: setTimeout(() => dismissToast(id), 5000),
  });
  publish({ ...snapshot, items: [...snapshot.items, { id, kind, message }] });
}
function pause(id: string) {
  const state = timers.get(id);
  if (!state?.timer) return;
  clearTimeout(state.timer);
  state.remaining = Math.max(0, state.remaining - (Date.now() - state.started));
  state.timer = undefined;
}
function resume(id: string) {
  const state = timers.get(id);
  if (!state || state.timer) return;
  state.started = Date.now();
  state.timer = setTimeout(() => dismissToast(id), state.remaining);
}
// Native dialogs live in the browser's top layer. Host notifications inside the
// active dialog so failures remain visible, dismissible and keyboard accessible.
export function setToastHost(host: HTMLDialogElement | null) {
  publish({ ...snapshot, host });
}
export function ToastViewport() {
  const { items, host } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!items.length) return null;
  return createPortal(
    <div className="toast-viewport" aria-label="Notifications">
      {items.map((item) => (
        <article
          key={item.id}
          className={`toast toast-${item.kind}`}
          onPointerEnter={() => pause(item.id)}
          onPointerLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement)) resume(item.id);
          }}
          onFocus={() => pause(item.id)}
          onBlur={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget) &&
              !event.currentTarget.matches(':hover')
            )
              resume(item.id);
          }}
        >
          <span className="toast-icon">
            <Icon name={item.kind === 'success' ? 'check' : 'info'} />
          </span>
          <p role={item.kind === 'error' ? 'alert' : 'status'} aria-atomic="true">
            {item.message}
          </p>
          <button
            type="button"
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(item.id)}
          >
            <Icon name="close" />
          </button>
        </article>
      ))}
    </div>,
    host ?? document.body,
  );
}
