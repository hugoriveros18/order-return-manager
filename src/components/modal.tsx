'use client';
import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { setToastHost } from './toast';
import { Icon } from './icon';
export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    close = useRef(onClose),
    pending = useRef(busy),
    id = useId();
  useEffect(() => {
    close.current = onClose;
    pending.current = busy;
  }, [onClose, busy]);
  useEffect(() => {
    const active = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    if (dialog) setToastHost(dialog);
    return () => {
      setToastHost(null);
      dialog?.close();
      if (active instanceof HTMLElement) active.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending.current) close.current();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending.current) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            close.current();
        }
      }}
    >
      <div className="modal-header">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" disabled={busy} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>,
    document.body,
  );
}
