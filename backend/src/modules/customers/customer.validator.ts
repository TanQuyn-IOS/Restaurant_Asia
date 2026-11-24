import { z } from 'zod';

export const createCustomerSchema = z.object({
  fullName: z.string().min(1, 'Tên khách hàng không được để trống').max(100),
  phone: z.string().min(1, 'Số điện thoại không được để trống').max(20),
  email: z.string().email().optional().or(z.literal('')),
  customerType: z.enum(['WALK_IN', 'REGULAR', 'VIP', 'GROUP']).default('WALK_IN'),
});

export const updateCustomerSchema = createCustomerSchema.partial();
