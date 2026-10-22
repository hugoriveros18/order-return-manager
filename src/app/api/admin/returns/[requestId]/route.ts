import { adminReturns } from '@/features/returns/handlers';
export const runtime = 'nodejs';
export async function GET(req: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const p = await params;
  return adminReturns(req, p.requestId);
}
