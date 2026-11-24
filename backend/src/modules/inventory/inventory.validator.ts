import { z } from 'zod';

export const createIngredientSchema = z.object({
  name: z.string().min(1, 'Tên nguyên liệu không được để trống').max(150),
  category: z.string().min(1, 'Nhóm nguyên liệu không được để trống').max(100),
  baseUnit: z.string().min(1, 'Đơn vị cơ bản không được để trống').max(20),
  currentStock: z.number().min(0, 'Tồn kho ban đầu >= 0').default(0),
  minStockLevel: z.number().min(0, 'Mức cảnh báo tồn tối thiểu >= 0').default(5),
  costPerUnit: z.number().min(0, 'Đơn giá bình quân >= 0').default(0),
  allowNegativeStock: z.boolean().default(false),
});

export const updateIngredientSchema = createIngredientSchema.partial();

export const stockTakeAdjustmentSchema = z.object({
  ingredientId: z.string().uuid(),
  actualStock: z.number().min(0, 'Số lượng kiểm kê thực tế phải >= 0'),
  notes: z.string().min(1, 'Ghi chú lý do chênh lệch kiểm kê'),
});

export const wasteDamageSchema = z.object({
  ingredientId: z.string().uuid(),
  quantity: z.number().positive('Số lượng hủy/hỏng phải > 0'),
  notes: z.string().min(1, 'Ghi chú lý do hao hụt/hỏng'),
});

export const unitConversionSchema = z.object({
  fromUnit: z.string().min(1).max(20),
  toUnit: z.string().min(1).max(20),
  conversionRate: z.number().positive('Tỷ lệ quy đổi phải > 0'),
});
