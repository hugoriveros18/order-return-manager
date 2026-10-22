import { it, expect } from 'vitest';
import { failure } from '@/lib/http';
import { DomainError } from '@/lib/errors';
import { parse, positiveInteger, reason } from '@/lib/request-validation';
it('returns uniform safe status and private cache headers', async () => {
  const r = failure(new DomainError('STATE_CONFLICT', 'Refresh and try again.'));
  expect(r.status).toBe(409);
  expect(r.headers.get('cache-control')).toBe('private, no-store');
  expect(await r.json()).toMatchObject({
    error: {
      code: 'STATE_CONFLICT',
      message: 'Refresh and try again.',
      requestId: expect.any(String),
    },
  });
});
it('rejects non-integer, overflowing and blank data without coercion', () => {
  for (const v of [0, -1, 1.5, '2', Number.MAX_SAFE_INTEGER])
    expect(() => parse(positiveInteger, v)).toThrow();
  expect(() => parse(reason, '   ')).toThrow();
  expect(parse(reason, '  useful reason  ')).toBe('useful reason');
});
