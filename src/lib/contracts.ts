export type CustomerView = { id: string; displayName: string };
export type Status = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RECEIVED';
export type ItemView = {
  orderItemId: string;
  productId: number;
  name: string;
  imagePath: string;
  imageAlt: string;
  purchasePriceMinor: string;
  purchasedQuantity: number;
  committedQuantity: number;
  availableQuantity: number;
  requestedQuantity?: number;
};
export type Eligibility = {
  eligible: boolean;
  code: string;
  message: string;
  eligibleUntilDate: string | null;
};
export type OrderView = {
  id: string;
  displayNumber: string;
  customerId: string;
  orderedAt: string;
  deliveredAt: string | null;
  status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  items: ItemView[];
  eligibility: Eligibility;
};
export type EventView = {
  id: string;
  sequence: number;
  eventType: string;
  occurredAt: string;
  actor: { kind: string; displayName: string };
  reason: string | null;
};
export type ReturnView = {
  id: string;
  displayNumber: string;
  orderId: string;
  orderDisplayNumber: string;
  customerId: string;
  customerName: string;
  createdAt: string;
  status: Status;
  version: number;
  reason: string;
  rejectionReason: string | null;
  instructions: string | null;
  items: ItemView[];
  history: EventView[];
};
export type Paged<T> = { items: T[]; nextCursor: string | null };
export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
  retryAfterSeconds?: number;
};
