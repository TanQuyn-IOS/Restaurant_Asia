import { z } from 'zod';

export const cancelCookedItemSchema = z.object({
  reason: z.string().min(1, 'Lý do hủy món không được để trống'),
});
