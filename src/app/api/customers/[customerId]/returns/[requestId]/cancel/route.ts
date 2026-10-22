import { cancelAction } from '@/features/returns/handlers';
export const runtime = 'nodejs';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ customerId: string; requestId: string }> },
) {
  const p = await params;
  return cancelAction(req, p.customerId, p.requestId);
}
