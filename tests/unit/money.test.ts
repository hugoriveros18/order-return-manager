import { it, expect } from 'vitest';
import { money } from '@/lib/money';
import { cents } from '@/features/demo/fixtures';
it('preserves catalog USD cents and displays exactly two decimals', () => {
  expect(cents(79.99)).toBe(7999n);
  expect(cents(39.99)).toBe(3999n);
  expect(money('7999')).toBe('USD 79.99');
  expect(money('100')).toBe('USD 1.00');
});
