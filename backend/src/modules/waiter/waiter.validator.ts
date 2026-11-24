import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  tableId: z.string().uuid(),
  type: z.enum(['CALL_WAITER', 'REQUEST_BILL', 'REFILL_WATER', 'EXTRA_CUTLERY', 'CLEAN_TABLE', 'OTHER']),
  title: z.string().min(1).max(100),
  note: z.string().max(255).optional(),
});

export const updateServiceRequestSchema = z.object({
  status: z.enum(['PENDING', 'ATTENDING', 'RESOLVED']),
  assignedToId: z.string().uuid().optional(),
});
