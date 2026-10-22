import { adminReturns } from '@/features/returns/handlers';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  return adminReturns(req);
}
