import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '@/lib/env';
export const cookieNames = {
  visitor: process.env.NODE_ENV === 'production' ? '__Host-orm-visitor' : 'orm-visitor',
  demo: process.env.NODE_ENV === 'production' ? '__Host-orm-demo' : 'orm-demo',
};
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
function sign(value: string) {
  return createHmac('sha256', env().DEMO_TOKEN_SECRET).update(value).digest('base64url');
}
export function visitorToken() {
  const value = randomBytes(32).toString('base64url');
  return value + '.' + sign(value);
}
export function validVisitor(token: string) {
  const [value, sig, ...extra] = token.split('.');
  if (!/^[\w-]{43}$/.test(value ?? '') || !sig || extra.length) return false;
  const expected = Buffer.from(sign(value));
  const got = Buffer.from(sig);
  return expected.length === got.length && timingSafeEqual(expected, got);
}
export function demoToken(visitorId: string, nonce: string) {
  return sign('demo:' + visitorId + ':' + nonce);
}
export function readCookie(req: Request, name: string) {
  return req.headers
    .get('cookie')
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(name + '='))
    ?.slice(name.length + 1);
}
export function cookie(name: string, token: string) {
  return `${name}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
