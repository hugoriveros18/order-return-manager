import { db } from '@/lib/prisma';
import { DomainError } from '@/lib/errors';
import { validateOrigin } from '@/lib/request-validation';
import { cookieNames, hashToken, readCookie, validVisitor } from './cookies';
import { admit } from './rate-limit';
import { withEnvironment, type Context } from './transaction';
export async function visitorFrom(req: Request) {
  const token = readCookie(req, cookieNames.visitor);
  if (!token || !validVisitor(token))
    throw new DomainError('DEMO_SESSION_REQUIRED', 'Start your demonstration first.', 403);
  const visitor = await db().visitorContext.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!visitor)
    throw new DomainError('DEMO_SESSION_REQUIRED', 'Start your demonstration first.', 403);
  return visitor;
}
export async function session<T>(
  req: Request,
  callback: (c: Context) => Promise<T>,
  mutation?: 'mutation' | 'reset',
) {
  if (mutation) validateOrigin(req);
  const visitor = await visitorFrom(req);
  if (mutation) await admit(visitor.tokenHash, mutation);
  const token = readCookie(req, cookieNames.demo);
  if (!token)
    throw new DomainError('DEMO_SESSION_REQUIRED', 'Start or continue your demonstration.', 403);
  if (visitor.lastEnvironmentExpiredAt) {
    const exists = await db().demoEnvironment.findUnique({ where: { visitorId: visitor.id } });
    if (!exists)
      throw new DomainError(
        'DEMO_EXPIRED',
        'This demonstration expired. Start a new demonstration.',
      );
  }
  return withEnvironment(
    hashToken(token),
    !!mutation || req.headers.get('x-demo-activity') === 'navigation',
    async (c) => {
      if (c.environment.visitorId !== visitor.id)
        throw new DomainError('DEMO_SESSION_REQUIRED', 'This demonstration is not available.', 403);
      return callback(c);
    },
  );
}
