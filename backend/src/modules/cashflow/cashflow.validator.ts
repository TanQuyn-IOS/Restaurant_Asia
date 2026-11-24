import { z } from 'zod';

export const createCashFlowSchema = z.object({
  type: z.enum(['INFLOW', 'OUTFLOW']),
  category: z.enum([
    'REVENUE_ORDER',
    'GOODS_PURCHASE',
    'STAFF_SALARY',
    'UTILITIES',
    'MARKETING',
    'REFUND',
    'OTHER',
  ]),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
  amount: z.number().positive('Số tiền phải > 0'),
  method: z.enum(['CASH', 'VIETQR', 'TRANSFER', 'CARD']).default('CASH'),
  referenceCode: z.string().max(100).optional(),
  notes: z.string().max(255).optional(),
});
