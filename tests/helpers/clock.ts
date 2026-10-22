import type { Clock } from '@/lib/clock';
export function fixedClock(date: Date): Clock {
  return async () => date;
}
