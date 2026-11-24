import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

const app = createApp();
let adminToken: string;

describe('Inventory & WAC Moving Average Integration Tests', () => {
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    adminToken = loginRes.body.data.accessToken;
  });

  it('Should adjust stock during stock-take and record an append-only stock transaction', async () => {
    const ing = await prisma.ingredient.findFirst();
    expect(ing).not.toBeNull();

    const originalStock = Number(ing!.currentStock);
    const newTargetStock = originalStock + 10;

    const res = await request(app)
      .post('/api/v1/inventory/adjustment')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ingredientId: ing!.id,
        actualStock: newTargetStock,
        notes: 'Kiểm kê kho định kỳ quý 4',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedIng = await prisma.ingredient.findUnique({ where: { id: ing!.id } });
    expect(Number(updatedIng!.currentStock)).toBe(newTargetStock);

    // Verify StockTransaction record
    const lastTx = await prisma.stockTransaction.findFirst({
      where: { ingredientId: ing!.id, transactionType: 'STOCK_TAKE_ADJUSTMENT' },
      orderBy: { createdAt: 'desc' },
    });
    expect(lastTx).toBeDefined();
    expect(Number(lastTx!.quantity)).toBe(10);
    expect(Number(lastTx!.balanceAfter)).toBe(newTargetStock);

    // Revert stock back
    await prisma.ingredient.update({
      where: { id: ing!.id },
      data: { currentStock: originalStock },
    });
  });

  it('Should record waste/damage and verify negative stock prevention', async () => {
    const ing = await prisma.ingredient.findFirst({
      where: { allowNegativeStock: false },
    });
    expect(ing).not.toBeNull();

    const currentStock = Number(ing!.currentStock);

    // 1. Valid waste within stock
    if (currentStock >= 1) {
      const validRes = await request(app)
        .post('/api/v1/inventory/waste')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ingredientId: ing!.id,
          quantity: 1,
          notes: 'Nguyên liệu hỏng do hết hạn',
        });
      expect(validRes.status).toBe(200);
      expect(validRes.body.success).toBe(true);

      // Restore stock
      await prisma.ingredient.update({
        where: { id: ing!.id },
        data: { currentStock },
      });
    }

    // 2. Excessive waste exceeding stock -> Must fail with 400 Bad Request
    const excessiveRes = await request(app)
      .post('/api/v1/inventory/waste')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ingredientId: ing!.id,
        quantity: currentStock + 99999,
        notes: 'Xuất hủy vượt quá tồn kho',
      });

    expect(excessiveRes.status).toBe(400);
    expect(excessiveRes.body.success).toBe(false);
  });

  it('Should create Goods Receipt, update stock and accurately calculate WAC unit cost', async () => {
    const supplier = await prisma.supplier.findFirst();
    const ing = await prisma.ingredient.findFirst();
    expect(supplier).not.toBeNull();
    expect(ing).not.toBeNull();

    const initialStock = Number(ing!.currentStock);
    const initialCost = Number(ing!.costPerUnit);

    const incomingQty = 20;
    const incomingPrice = initialCost + 10000; // Nhập với đơn giá cao hơn

    // Calculate expected WAC:
    // newWac = (initialStock * initialCost + incomingQty * incomingPrice) / (initialStock + incomingQty)
    const expectedStock = initialStock + incomingQty;
    const totalValBefore = initialStock > 0 ? initialStock * initialCost : 0;
    const incomingVal = incomingQty * incomingPrice;
    const expectedWac = expectedStock > 0 ? (totalValBefore + incomingVal) / expectedStock : incomingPrice;

    const receiptRes = await request(app)
      .post('/api/v1/suppliers/receipts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplierId: supplier!.id,
        items: [
          {
            ingredientId: ing!.id,
            quantity: incomingQty,
            unit: ing!.baseUnit,
            unitPrice: incomingPrice,
          },
        ],
        paymentMethod: 'TRANSFER',
        paidAmount: (incomingQty * incomingPrice) / 2, // Trả trước 50%
        notes: 'Kiểm thử nhập kho tính WAC',
      });

    expect(receiptRes.status).toBe(201);
    expect(receiptRes.body.success).toBe(true);
    const receipt = receiptRes.body.data;
    expect(receipt.paymentStatus).toBe('partially_paid');

    // Verify Ingredient updated stock & cost
    const updatedIng = await prisma.ingredient.findUnique({ where: { id: ing!.id } });
    expect(Number(updatedIng!.currentStock)).toBeCloseTo(expectedStock, 2);
    expect(Number(updatedIng!.costPerUnit)).toBeCloseTo(expectedWac, 2);

    // Pay remaining supplier debt
    const remainingDebt = Number(receipt.totalAmount) - Number(receipt.paidAmount);
    const payRes = await request(app)
      .post('/api/v1/suppliers/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        receiptId: receipt.id,
        amount: remainingDebt,
        paymentMethod: 'CASH',
        notes: 'Thanh toán nốt công nợ',
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.success).toBe(true);

    // Verify receipt is fully paid
    const finalReceipt = await prisma.goodsReceipt.findUnique({ where: { id: receipt.id } });
    expect(finalReceipt!.paymentStatus).toBe('paid');

    // Revert stock and cost
    await prisma.ingredient.update({
      where: { id: ing!.id },
      data: { currentStock: initialStock, costPerUnit: initialCost },
    });
  });
});
