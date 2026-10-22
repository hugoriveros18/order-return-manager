import { orders } from '@/features/orders/handlers';
export const runtime = 'nodejs';
export async function GET(req: Request, { params }: { params: Promise<{ customerId: string }> }) {
  const p = await params;
  return orders(req, p.customerId);
}
