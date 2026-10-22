import { z } from 'zod';
import { db } from '@/lib/prisma';
import { failure, json } from '@/lib/http';
import { body, parse, uuid, validateOrigin } from '@/lib/request-validation';
import { admit } from './rate-limit';
import { cookie, cookieNames, hashToken, readCookie, validVisitor, visitorToken } from './cookies';
import { visitorFrom, session } from './context';
import { provision } from './provision';
export async function bootstrap(req: Request) {
  try {
    validateOrigin(req);
    await admit('global-bootstrap', 'bootstrap');
    parse(z.strictObject({}), await body(req));
    let token = readCookie(req, cookieNames.visitor);
    if (!token || !validVisitor(token)) token = visitorToken();
    await db().visitorContext.upsert({
      where: { tokenHash: hashToken(token) },
      update: {},
      create: { tokenHash: hashToken(token) },
    });
    return json({ data: { ready: true } }, 200, {
      'Set-Cookie': cookie(cookieNames.visitor, token),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function handleDemo(req: Request) {
  try {
    if (req.method === 'GET')
      return await session(req, async (c) =>
        json({
          data: {
            generation: c.environment.generation,
            expiresAt: new Date(
              (req.headers.get('x-demo-activity') === 'navigation'
                ? c.now
                : c.environment.lastActivityAt
              ).getTime() +
                168 * 3600000,
            ).toISOString(),
            customers: await c.tx.customer.findMany({
              where: { environmentId: c.environment.id, generation: c.environment.generation },
              orderBy: { displayName: 'asc' },
            }),
          },
          meta: { generation: c.environment.generation },
        }),
      );
    validateOrigin(req);
    const visitor = await visitorFrom(req);
    await admit(visitor.tokenHash, 'create');
    parse(z.strictObject({}), await body(req));
    const id = parse(uuid, req.headers.get('idempotency-key'));
    const r = await provision(visitor, id);
    return json(
      {
        data: { customers: r.customers, generation: r.environment.generation },
        meta: { generation: r.environment.generation },
      },
      r.replay ? 200 : 201,
      { 'Set-Cookie': cookie(cookieNames.demo, r.token) },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function customers(req: Request) {
  try {
    return await session(req, async (c) =>
      json({
        data: await c.tx.customer.findMany({
          where: { environmentId: c.environment.id, generation: c.environment.generation },
          orderBy: { displayName: 'asc' },
        }),
        meta: { generation: c.environment.generation },
      }),
    );
  } catch (e) {
    return failure(e);
  }
}
