import { session } from '@/features/demo/context';
import { json, failure } from '@/lib/http';
import { pageQuery, parse, uuid } from '@/lib/request-validation';
import { orderDetail, orderList } from './queries';
export async function orders(req: Request, customer: string, id?: string) {
  try {
    return await session(req, async (c) => {
      const customerId = parse(uuid, customer);
      const data = id
        ? await orderDetail(c, customerId, parse(uuid, id))
        : await orderList(c, customerId, pageQuery(new URL(req.url)));
      return json({ data, meta: { generation: c.environment.generation } });
    });
  } catch (e) {
    return failure(e);
  }
}
