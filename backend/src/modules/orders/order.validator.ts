import { z } from 'zod';

export const orderItemInputSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1, 'Số lượng phải >= 1').default(1),
  note: z.string().max(255).optional(),
});

export const createOrderSchema = z.object({
  tableId: z.string().uuid(),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  customerType: z.enum(['WALK_IN', 'REGULAR', 'VIP', 'GROUP']).default('WALK_IN'),
  customerCount: z.number().int().min(1).default(2),
  notes: z.string().max(255).optional(),
  items: z.array(orderItemInputSchema).optional(),
});

export const addItemsToOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'Phải có ít nhất 1 món ăn'),
});

export const updateOrderItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  note: z.string().max(255).optional(),
});

export const applyDiscountSchema = z.object({
  discountPercent: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
});

export const splitOrderSchema = z.object({
  targetTableId: z.string().uuid().optional(), // Nếu tách ra bàn khác, hoặc để cùng bàn
  splits: z.array(
    z.object({
      orderItemId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ).optional(),
  itemSplits: z.array(
    z.object({
      orderItemId: z.string().uuid(),
      quantity: z.number().int().min(1),
    })
  ).optional(),
}).refine((data) => (data.splits && data.splits.length > 0) || (data.itemSplits && data.itemSplits.length > 0), {
  message: 'Phải chọn ít nhất 1 món để tách bill',
});
