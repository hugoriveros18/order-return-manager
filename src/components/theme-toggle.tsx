'use client';
import { useSyncExternalStore, useEffect } from 'react';
import { Icon } from './icon';
const subscribe = (f: () => void) => {
  window.addEventListener('orm-theme', f);
  window.addEventListener('storage', f);
  const m = matchMedia('(prefers-color-scheme: dark)');
  m.addEventListener('change', f);
  return () => {
    window.removeEventListener('orm-theme', f);
    window.removeEventListener('storage', f);
    m.removeEventListener('change', f);
  };
};
function snapshot() {
  try {
    return (
      localStorage.getItem('orm-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    );
  } catch {
    return 'light';
  }
}
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, snapshot, () => 'light');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    const pointer = () => {
      document.documentElement.dataset.input = 'pointer';
    };
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Tab') document.documentElement.dataset.input = 'keyboard';
    };
    document.addEventListener('pointerdown', pointer);
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('keydown', keyboard);
    };
  }, []);
  return (
    <button
      className="icon-button theme-toggle"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => {
        const next = theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem('orm-theme', next);
        } catch {}
        document.documentElement.dataset.theme = next;
        window.dispatchEvent(new Event('orm-theme'));
      }}
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
