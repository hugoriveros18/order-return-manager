import { create } from '@/features/returns/handlers';
export const runtime = 'nodejs';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ customerId: string; orderId: string }> },
) {
  const p = await params;
  return create(req, p.customerId, p.orderId);
}
