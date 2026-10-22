'use client';
import type { ButtonHTMLAttributes, ComponentProps } from 'react';
import { Icon } from './icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  busyLabel?: string;
  icon?: ComponentProps<typeof Icon>['name'];
};

export function AsyncButton({
  busy = false,
  busyLabel,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: Props) {
  const pendingLabel = busyLabel ?? children;
  return (
    <button
      {...props}
      className={`async-button ${className}`}
      disabled={disabled || busy}
      aria-busy={busy}
    >
      <span className="button-sizer" aria-hidden="true">
        {icon && <Icon name={icon} />}
        {children}
      </span>
      <span className="button-sizer" aria-hidden="true">
        <Icon name="refresh" />
        {pendingLabel}
      </span>
      <span className="button-face">
        {busy ? (
          <span className="button-spinner">
            <Icon name="refresh" />
          </span>
        ) : (
          icon && <Icon name={icon} />
        )}
        {busy ? pendingLabel : children}
      </span>
    </button>
  );
}
