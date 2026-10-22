import type { Status } from '@/lib/contracts';
import { DomainError } from '@/lib/errors';
export type Action = 'APPROVE' | 'REJECT' | 'CANCEL' | 'RECEIVE';
const targets = {
  APPROVE: 'APPROVED',
  REJECT: 'REJECTED',
  CANCEL: 'CANCELLED',
  RECEIVE: 'RECEIVED',
} as const;
export function nextStatus(status: Status, action: Action): Status {
  if (
    (status === 'PENDING' && action !== 'RECEIVE') ||
    (status === 'APPROVED' && action === 'RECEIVE')
  )
    return targets[action];
  throw new DomainError(
    'STATE_CONFLICT',
    'This request changed or does not allow that action. Refresh its current status.',
  );
}
