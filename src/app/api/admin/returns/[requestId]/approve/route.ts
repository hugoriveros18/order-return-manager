import { action } from '@/features/returns/handlers';
export const runtime = 'nodejs';
export async function POST(req: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const p = await params;
  return action(req, p.requestId, 'APPROVE');
}
