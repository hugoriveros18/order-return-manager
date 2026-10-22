import { randomUUID } from 'node:crypto';
import { DomainError } from './errors';
import { logError } from './logger';
const privateHeaders = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
export function json(value: unknown, status = 200, extra: Record<string, string> = {}) {
  return Response.json(value, { status, headers: { ...privateHeaders, ...extra } });
}
export function failure(error: unknown) {
  const requestId = randomUUID();
  const e =
    error instanceof DomainError
      ? error
      : new DomainError('INTERNAL_ERROR', 'Something went wrong. Please try again.', 500);
  if (e.status >= 500) logError(requestId, error);
  return json(
    {
      error: {
        code: e.code,
        message: e.message,
        requestId,
        ...(e.retryAfterSeconds ? { retryAfterSeconds: e.retryAfterSeconds } : {}),
      },
    },
    e.status,
    e.retryAfterSeconds ? { 'Retry-After': String(e.retryAfterSeconds) } : {},
  );
}
