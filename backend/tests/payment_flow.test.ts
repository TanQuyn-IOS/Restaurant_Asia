import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();
let cashierToken: string;

describe('Payment & Cashflow Integration Tests', () => {
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'cashier1', password: 'Staff@123' });
    cashierToken = loginRes.body.data.accessToken;
  });

  it('Should process payment, update order status to PAID, and transition table to CLEANING', async () => {
    // 1. Create a dedicated test table and dish
    const area = await prisma.tableArea.findFirst();
    const table = await prisma.restaurantTable.create({
      data: {
        name: `Bàn PayTest ${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    const dish = await prisma.menuItem.findFirst({ where: { isDeleted: false } });

    // 2. Create Order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        tableId: table!.id,
        customerName: 'Khách Thanh Toán Test',
        customerPhone: '0988888888',
        items: [{ menuItemId: dish!.id, quantity: 1 }],
      });

    const order = orderRes.body.data;
    expect(order.paymentStatus).toBe('UNPAID');

    // 3. Process Cash Payment
    const totalAmount = Number(order.finalTotal);
    const payRes = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({
        orderId: order.id,
        amount: totalAmount,
        paymentMethod: 'CASH',
        receivedAmount: totalAmount + 50000,
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.data.changeAmount).toBe(50000);
    expect(payRes.body.data.order.paymentStatus).toBe('PAID');
    expect(payRes.body.data.order.status).toBe('COMPLETED');

    // 4. Verify Table transitioned to CLEANING
    const updatedTable = await prisma.restaurantTable.findUnique({
      where: { id: table!.id },
    });
    expect(updatedTable!.status).toBe('CLEANING');

    // 5. Verify CashFlowRecord was created
    const cashFlow = await prisma.cashFlowRecord.findFirst({
      where: { paymentId: payRes.body.data.payment.id },
    });
    expect(cashFlow).not.toBeNull();
    expect(cashFlow!.type).toBe('INFLOW');
    expect(Number(cashFlow!.amount)).toBe(totalAmount);

    // Clean up test data
    await prisma.cashFlowRecord.deleteMany({ where: { paymentId: payRes.body.data.payment.id } });
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.restaurantTable.delete({ where: { id: table.id } });
  });
});
