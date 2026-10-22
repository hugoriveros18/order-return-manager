import type { Context } from '@/features/demo/transaction';
import { ensureCustomer } from '@/features/orders/queries';
import { requestDetail, requestList } from './admin-queries';
export async function customerDetail(c: Context, customerId: string, id: string) {
  await ensureCustomer(c, customerId);
  return requestDetail(c, id, customerId);
}
export async function customerList(
  c: Context,
  customerId: string,
  page: { limit: number; cursor?: { id: string; at: Date } },
) {
  await ensureCustomer(c, customerId);
  return requestList(c, page, undefined, customerId);
}
