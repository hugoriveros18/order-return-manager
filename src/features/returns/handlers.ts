import { scope } from '@/features/demo/transaction';
import { session } from '@/features/demo/context';
import { json, failure } from '@/lib/http';
import { body, operation, parse, uuid } from '@/lib/request-validation';
import { z } from 'zod';
import { pageQuery } from '@/lib/request-validation';
import { requestList, requestDetail } from './admin-queries';
import { customerDetail, customerList } from './customer-queries';
import { change } from './decide';
import { emptySchema, rejectSchema } from './schemas';
import type { Action } from './transitions';
import { cancel } from './cancel';
import { createReturn } from './create';
export async function create(req: Request, customer: string, order: string) {
  try {
    return await session(
      req,
      async (c) => {
        const customerId = parse(uuid, customer),
          orderId = parse(uuid, order);
        const result = await createReturn(c, customerId, orderId, await body(req), operation(req));
        return json({ data: result, meta: { generation: c.environment.generation } }, 201);
      },
      'mutation',
    );
  } catch (e) {
    return failure(e);
  }
}

export async function adminReturns(req: Request, id?: string) {
  try {
    return await session(req, async (c) => {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const selected = status
        ? parse(z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RECEIVED']), status)
        : undefined;
      const data = id
        ? await requestDetail(c, parse(uuid, id))
        : await requestList(c, pageQuery(url), selected);
      const pendingCount = await c.tx.returnRequest.count({
        where: { ...scope(c), status: 'PENDING' },
      });
      return json({ data, meta: { generation: c.environment.generation, pendingCount } });
    });
  } catch (e) {
    return failure(e);
  }
}
export async function action(req: Request, id: string, kind: Action, customerId?: string) {
  try {
    return await session(
      req,
      async (c) => {
        const input = await body(req);
        const reject = kind === 'REJECT' ? parse(rejectSchema, input) : undefined;
        if (kind !== 'REJECT') parse(emptySchema, input);
        const result = await change(
          c,
          parse(uuid, id),
          kind,
          operation(req),
          reject?.reason,
          customerId,
        );
        return json({ data: result, meta: { generation: c.environment.generation } });
      },
      'mutation',
    );
  } catch (e) {
    return failure(e);
  }
}
export async function customerReturns(req: Request, customer: string, id?: string) {
  try {
    return await session(req, async (c) => {
      const customerId = parse(uuid, customer);
      const data = id
        ? await customerDetail(c, customerId, parse(uuid, id))
        : await customerList(c, customerId, pageQuery(new URL(req.url)));
      return json({ data, meta: { generation: c.environment.generation } });
    });
  } catch (e) {
    return failure(e);
  }
}
export async function cancelAction(req: Request, customer: string, id: string) {
  try {
    return await session(
      req,
      async (c) => {
        const data = await cancel(
          c,
          parse(uuid, customer),
          parse(uuid, id),
          await body(req),
          operation(req),
        );
        return json({ data, meta: { generation: c.environment.generation } });
      },
      'mutation',
    );
  } catch (e) {
    return failure(e);
  }
}
