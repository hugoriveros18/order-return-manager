import { z } from 'zod';
import { DomainError } from './errors';
import { env } from './env';
export const uuid = z.uuid();
export const positiveInteger = z.number().int().positive().max(2147483647);
export const reason = z
  .string()
  .trim()
  .min(1)
  .refine((v) => Array.from(v).length <= 1000, 'Use at most 1000 characters.');
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success)
    throw new DomainError(
      'INVALID_INPUT',
      'Check the identifiers, quantities and required fields.',
      400,
    );
  return result.data;
}
export function validateOrigin(req: Request) {
  if (req.headers.get('origin') !== env().APP_ORIGIN)
    throw new DomainError(
      'INVALID_ORIGIN',
      'This action must be made from this demonstration.',
      403,
    );
  if (!req.headers.get('content-type')?.startsWith('application/json'))
    throw new DomainError('INVALID_INPUT', 'Send a JSON request.', 400);
}
export async function body(req: Request) {
  const reader = req.body?.getReader();
  if (!reader) throw new DomainError('INVALID_INPUT', 'Send a valid JSON request.', 400);
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 32768) {
      await reader.cancel();
      throw new DomainError('INVALID_INPUT', 'This request is too large.', 400);
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new DomainError('INVALID_INPUT', 'Send a valid JSON request.', 400);
  }
}
export function operation(req: Request) {
  return {
    operationId: parse(uuid, req.headers.get('idempotency-key')),
    generation: parse(positiveInteger, Number(req.headers.get('x-demo-generation'))),
  };
}
export function pageQuery(url: URL) {
  const limit = parse(positiveInteger, Number(url.searchParams.get('limit') ?? 20));
  if (limit > 50) throw new DomainError('INVALID_INPUT', 'Use a page size of at most 50.', 400);
  const raw = url.searchParams.get('cursor');
  let cursor: { id: string; at: Date } | undefined;
  if (raw) {
    try {
      const p = JSON.parse(Buffer.from(raw, 'base64url').toString());
      cursor = { id: parse(uuid, p.id), at: new Date(p.at) };
      if (!Number.isFinite(cursor.at.getTime())) throw Error();
    } catch {
      throw new DomainError('INVALID_INPUT', 'This page cursor is invalid.', 400);
    }
  }
  return { limit, cursor };
}
export function nextCursor(id: string, at: Date) {
  return Buffer.from(JSON.stringify({ id, at: at.toISOString() })).toString('base64url');
}
