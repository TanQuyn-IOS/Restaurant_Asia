import { z } from 'zod';

export const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive('Số tiền thanh toán phải > 0'),
  paymentMethod: z.enum(['CASH', 'VIETQR', 'TRANSFER', 'CARD']).default('CASH'),
  receivedAmount: z.number().min(0).optional(),
  referenceCode: z.string().max(100).optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive('Số tiền hoàn trả phải > 0'),
  reason: z.string().min(1, 'Lý do hoàn tiền không được để trống'),
  refundMethod: z.enum(['CASH', 'VIETQR', 'TRANSFER', 'CARD']).default('CASH'),
  referenceCode: z.string().max(100).optional(),
  idempotencyKey: z.string().max(100).optional(),
});

export const generateVietQRSchema = z.object({
  orderId: z.string().uuid(),
  bankBin: z.string().default('970422'), // Ví dụ MBBank
  accountNo: z.string().default('1234567890'),
  accountName: z.string().default('RESTAURANT ASIA'),
});
