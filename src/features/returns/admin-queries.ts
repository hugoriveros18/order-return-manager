import type { Context } from '@/features/demo/transaction';
import { scope } from '@/features/demo/transaction';
import { missing } from '@/lib/errors';
import { nextCursor } from '@/lib/request-validation';
import type { ReturnStatus } from '@/generated/prisma/client';
import { projectReturn } from './serialize';
export async function requestDetail(c: Context, id: string, customerId?: string) {
  const r = await c.tx.returnRequest.findFirst({
    where: { ...scope(c), id, ...(customerId ? { customerId } : {}) },
  });
  if (!r) throw missing();
  return projectReturn(c, r);
}
export async function requestList(
  c: Context,
  page: { limit: number; cursor?: { id: string; at: Date } },
  status?: ReturnStatus,
  customerId?: string,
) {
  const rows = await c.tx.returnRequest.findMany({
    where: {
      ...scope(c),
      ...(customerId ? { customerId } : {}),
      ...(status ? { status } : {}),
      ...(page.cursor
        ? {
            OR: [
              { createdAt: { lt: page.cursor.at } },
              { createdAt: page.cursor.at, id: { lt: page.cursor.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: page.limit + 1,
  });
  const visible = rows.slice(0, page.limit),
    last = visible.at(-1);
  return {
    items: await Promise.all(visible.map((r) => projectReturn(c, r))),
    nextCursor: rows.length > page.limit && last ? nextCursor(last.id, last.createdAt) : null,
  };
}
