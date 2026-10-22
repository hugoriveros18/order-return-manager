import { timingSafeEqual } from 'node:crypto';
import { json, failure } from '@/lib/http';
import { DomainError } from '@/lib/errors';
import { env } from '@/lib/env';
import { body, operation } from '@/lib/request-validation';
import { session } from './context';
import { reset } from './reset';
import { cleanup } from './cleanup';
export async function resetHandler(req: Request) {
  try {
    return await session(
      req,
      async (c) => {
        const data = await reset(c, await body(req), operation(req));
        return json({ data, meta: { generation: data.generation } });
      },
      'reset',
    );
  } catch (e) {
    return failure(e);
  }
}
export async function cleanupHandler(req: Request) {
  try {
    const actual = Buffer.from(req.headers.get('authorization') ?? '');
    const expected = Buffer.from('Bearer ' + env().CRON_SECRET);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      throw new DomainError(
        'DEMO_SESSION_REQUIRED',
        'This maintenance operation is not available.',
        403,
      );
    return json({ data: await cleanup() });
  } catch (e) {
    return failure(e);
  }
}
