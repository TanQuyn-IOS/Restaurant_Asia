import { z } from 'zod';

export const createReservationSchema = z.object({
  tableId: z.string().uuid(),
  customerName: z.string().min(1, 'Tên khách hàng không được để trống').max(100),
  phone: z.string().min(1, 'Số điện thoại không được để trống').max(20),
  guestCount: z.number().int().min(1).default(2),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  customerType: z.enum(['WALK_IN', 'REGULAR', 'VIP', 'GROUP']).default('REGULAR'),
  notes: z.string().max(255).optional(),
});

export const updateReservationStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'SEATED', 'CANCELLED', 'NO_SHOW']),
});
