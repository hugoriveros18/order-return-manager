import { z } from 'zod';
import { positiveInteger } from '@/lib/request-validation';
export const policySchema = z.strictObject({ windowDays: positiveInteger });
