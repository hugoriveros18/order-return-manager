import { describe, it, expect } from 'vitest';
import { nextStatus } from '@/features/returns/transitions';
const states = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RECEIVED'] as const;
const actions = ['APPROVE', 'REJECT', 'CANCEL', 'RECEIVE'] as const;
describe('all state/action pairs', () => {
  for (const s of states)
    for (const a of actions)
      it(`${s} + ${a}`, () => {
        const valid = (s === 'PENDING' && a !== 'RECEIVE') || (s === 'APPROVED' && a === 'RECEIVE');
        if (valid)
          expect(nextStatus(s, a)).toBe(
            { APPROVE: 'APPROVED', REJECT: 'REJECTED', CANCEL: 'CANCELLED', RECEIVE: 'RECEIVED' }[
              a
            ],
          );
        else expect(() => nextStatus(s, a)).toThrow();
      });
});
