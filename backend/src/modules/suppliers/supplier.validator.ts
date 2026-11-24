import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Tên nhà cung cấp không được để trống').max(150),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(255).optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial();

export const goodsReceiptItemSchema = z.object({
  ingredientId: z.string().min(1).max(36),
  quantity: z.number().positive('Số lượng nhập phải > 0'),
  unit: z.string().min(1, 'Đơn vị không được để trống'),
  unitPrice: z.number().min(0, 'Đơn giá nhập phải >= 0'),
});

export const createGoodsReceiptSchema = z.object({
  supplierId: z.string().min(1).max(36),
  items: z.array(goodsReceiptItemSchema).min(1, 'Phiếu nhập phải có ít nhất 1 mặt hàng'),
  paymentMethod: z.enum(['CASH', 'VIETQR', 'TRANSFER', 'CARD']).default('TRANSFER'),
  paidAmount: z.number().min(0).default(0),
  notes: z.string().max(255).optional(),
});

export const createSupplierPaymentSchema = z.object({
  receiptId: z.string().min(1).max(36),
  amount: z.number().positive('Số tiền chi trả phải > 0'),
  paymentMethod: z.enum(['CASH', 'VIETQR', 'TRANSFER', 'CARD']).default('TRANSFER'),
  referenceCode: z.string().max(100).optional(),
  notes: z.string().max(255).optional(),
});
