import { it, expect } from 'vitest';
import { eligibility } from '@/features/orders/eligibility';
const deliveredAt = new Date('2026-10-01T15:00:00Z');
it('uses inclusive Bogota calendar dates and rejects the following day', () => {
  expect(
    eligibility({
      status: 'DELIVERED',
      deliveredAt,
      now: new Date('2026-11-01T04:59:59Z'),
      windowDays: 30,
      available: 1,
    }).eligible,
  ).toBe(true);
  expect(
    eligibility({
      status: 'DELIVERED',
      deliveredAt,
      now: new Date('2026-11-01T05:00:00Z'),
      windowDays: 30,
      available: 1,
    }).code,
  ).toBe('WINDOW_EXPIRED');
});
it('rejects non-delivered orders, no units and invalid/future delivery', () => {
  const base = {
    status: 'DELIVERED',
    deliveredAt,
    now: new Date('2026-10-02T15:00:00Z'),
    windowDays: 30,
    available: 1,
  };
  expect(eligibility({ ...base, status: 'SHIPPED' }).code).toBe('NOT_DELIVERED');
  expect(eligibility({ ...base, available: 0 }).code).toBe('NO_AVAILABLE_UNITS');
  expect(eligibility({ ...base, deliveredAt: null }).code).toBe('INVALID_DELIVERY_DATE');
  expect(eligibility({ ...base, deliveredAt: new Date('2027-01-01') }).code).toBe(
    'INVALID_DELIVERY_DATE',
  );
});
