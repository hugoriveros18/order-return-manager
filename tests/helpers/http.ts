import { randomUUID } from 'node:crypto';
import type { fixture } from './factories';
import { cookieNames } from '@/features/demo/cookies';
export function request(
  f: Awaited<ReturnType<typeof fixture>>,
  path: string,
  method = 'GET',
  value?: unknown,
  headers: Record<string, string> = {},
) {
  const origin = process.env.APP_ORIGIN!;
  return new Request(origin + path, {
    method,
    headers: {
      origin,
      'content-type': 'application/json',
      cookie: `${cookieNames.visitor}=${f.token}; ${cookieNames.demo}=${f.token}`,
      'idempotency-key': randomUUID(),
      'x-demo-generation': '1',
      ...headers,
    },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
  });
}
