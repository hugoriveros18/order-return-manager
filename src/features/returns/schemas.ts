import { z } from 'zod';
import { uuid, positiveInteger, reason } from '@/lib/request-validation';
export const createSchema = z.strictObject({
  reason,
  items: z
    .array(z.strictObject({ orderItemId: uuid, quantity: positiveInteger }))
    .min(1)
    .refine(
      (v) => new Set(v.map((i) => i.orderItemId)).size === v.length,
      'Select each item only once.',
    ),
});
export const rejectSchema = z.strictObject({ reason });
export const confirmedSchema = z.strictObject({ confirmed: z.literal(true) });
export const emptySchema = z.strictObject({});
