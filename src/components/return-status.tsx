import type { Status } from '@/lib/contracts';
export const statusLabels: Record<Status, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved — awaiting pickup',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  RECEIVED: 'Return received',
};
export function ReturnStatus({ status }: { status: Status }) {
  return <span className={'badge ' + status}>{statusLabels[status]}</span>;
}
