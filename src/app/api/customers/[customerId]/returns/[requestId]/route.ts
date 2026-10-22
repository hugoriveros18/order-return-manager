import { customerReturns } from '@/features/returns/handlers';
export const runtime = 'nodejs';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ customerId: string; requestId: string }> },
) {
  const p = await params;
  return customerReturns(req, p.customerId, p.requestId);
}
