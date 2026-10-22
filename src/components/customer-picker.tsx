'use client';
import { useState, useRef, useEffect, useId } from 'react';
import type { CustomerView } from '@/lib/contracts';
import { Icon } from './icon';
export function CustomerPicker({
  customers,
  value,
  onChange,
}: {
  customers: CustomerView[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false),
    root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    id = useId();
  const selected = customers.find((c) => c.id === value) || customers[0];
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    root.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus();
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  return (
    <div
      className="customer-picker"
      ref={root}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          trigger.current?.focus();
        }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();
          if (!open) {
            setOpen(true);
            return;
          }
          const options = [...root.current!.querySelectorAll<HTMLButtonElement>('[role="option"]')],
            index = options.indexOf(document.activeElement as HTMLButtonElement);
          const next =
            e.key === 'Home'
              ? 0
              : e.key === 'End'
                ? options.length - 1
                : (index + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
          options[next]?.focus();
        }
        if (e.key === 'Tab') setOpen(false);
      }}
    >
      <button
        ref={trigger}
        className="customer-trigger"
        aria-label={selected ? 'Select customer' : 'Loading customer profiles'}
        disabled={!selected}
        aria-busy={!selected}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar">
          {selected?.displayName
            .split(' ')
            .map((s) => s[0])
            .join('')}
        </span>
        <span>
          <small>Fictional customer</small>
          <strong>
            {selected?.displayName || (
              <span className="picker-placeholder" aria-hidden="true">
                <span className="skeleton-block" />
                <span className="skeleton-block" />
              </span>
            )}
          </strong>
        </span>
        <Icon name="down" />
      </button>
      {open && (
        <div id={id} className="customer-options" role="listbox" aria-label="Fictional customer">
          {customers.map((c) => (
            <button
              key={c.id}
              role="option"
              aria-selected={c.id === value}
              tabIndex={-1}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
                onChange(c.id);
              }}
            >
              <span className="avatar">
                {c.displayName
                  .split(' ')
                  .map((s) => s[0])
                  .join('')}
              </span>
              <span>
                {c.displayName}
                <small>Demo profile</small>
              </span>
              {c.id === value && <Icon name="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
