import { createHash } from 'node:crypto';
import { DomainError } from '@/lib/errors';
import type { Context } from './transaction';
import type { OperationKind, Prisma } from '@/generated/prisma/client';
export type Operation = { operationId: string; generation: number };
export function serializable<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)),
  ) as T;
}
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  return value;
}
export function payloadHash(value: unknown) {
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}
export async function runOperation<T>(
  c: Context,
  op: Operation,
  kind: OperationKind,
  actor: string,
  payload: unknown,
  callback: () => Promise<T>,
): Promise<T> {
  const hash = payloadHash({ kind, actor, payload });
  const old = await c.tx.operationReceipt.findUnique({
    where: {
      environmentId_inputGeneration_operationId: {
        environmentId: c.environment.id,
        inputGeneration: op.generation,
        operationId: op.operationId,
      },
    },
  });
  if (
    op.generation !== c.environment.generation &&
    !(kind === 'RESET' && old?.operationKind === 'RESET')
  )
    throw new DomainError('STALE_DEMO', 'This demonstration changed. Refresh before continuing.');
  if (old) {
    if (old.payloadHash !== hash)
      throw new DomainError(
        'IDEMPOTENCY_CONFLICT',
        'This action identifier was already used with different details.',
      );
    return old.resultJson as T;
  }
  const result = serializable(await callback());
  await c.tx.operationReceipt.create({
    data: {
      environmentId: c.environment.id,
      inputGeneration: op.generation,
      operationId: op.operationId,
      operationKind: kind,
      payloadHash: hash,
      actorScope: actor,
      resultJson: result as Prisma.InputJsonValue,
      statusCode: kind === 'CREATE_RETURN' ? 201 : 200,
    },
  });
  return result;
}
