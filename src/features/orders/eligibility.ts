import { localDate, addCalendarDays } from '@/lib/calendar';
import type { Eligibility } from '@/lib/contracts';
export function eligibility(input: {
  status: string;
  deliveredAt: Date | null;
  now: Date;
  windowDays: number;
  available: number;
}): Eligibility {
  const { status, deliveredAt, now, windowDays, available } = input;
  const fail = (code: string, message: string, eligibleUntilDate: string | null = null) => ({
    eligible: false,
    code,
    message,
    eligibleUntilDate,
  });
  if (status !== 'DELIVERED')
    return fail('NOT_DELIVERED', 'Only delivered orders can be returned.');
  if (!deliveredAt || !Number.isFinite(deliveredAt.getTime()) || deliveredAt > now)
    return fail('INVALID_DELIVERY_DATE', 'This order has no valid delivery date.');
  const until = addCalendarDays(localDate(deliveredAt), windowDays);
  if (localDate(now) > until)
    return fail('WINDOW_EXPIRED', 'The return window for this order has closed.', until);
  if (available <= 0)
    return fail(
      'NO_AVAILABLE_UNITS',
      'All purchased units are already committed to returns.',
      until,
    );
  return {
    eligible: true,
    code: 'ELIGIBLE',
    message: 'This order is eligible for a return.',
    eligibleUntilDate: until,
  };
}
