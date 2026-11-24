import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();
let adminToken: string;

describe('Order Lifecycle & Split Bill Integration Tests', () => {
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    adminToken = loginRes.body.data.accessToken;
  });

  it('Should create order, add items, apply discount, and split bill atomically', async () => {
    const area = await prisma.tableArea.findFirst();
    const tableA = await prisma.restaurantTable.create({
      data: {
        name: `Bàn SplitA ${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 4,
        status: 'AVAILABLE',
      },
    });

    const dishes = await prisma.menuItem.findMany({
      where: { isDeleted: false, isAvailable: true },
      take: 2,
    });
    expect(dishes.length).toBeGreaterThanOrEqual(2);

    // 1. Create Order with 2 items of Dish 0
    const createRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableId: tableA.id,
        customerName: 'Khách Tách Bill Test',
        items: [{ menuItemId: dishes[0].id, quantity: 2, note: 'Ít cay' }],
      });

    expect(createRes.status).toBe(201);
    const order = createRes.body.data;
    expect(order.items.length).toBe(1);
    expect(order.items[0].quantity).toBe(2);

    // 2. Add Dish 1
    const addRes = await request(app)
      .post(`/api/v1/orders/${order.id}/items`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        items: [{ menuItemId: dishes[1].id, quantity: 3 }],
      });

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.items.length).toBe(2);

    // 3. Apply 10% Discount
    const discountRes = await request(app)
      .post(`/api/v1/orders/${order.id}/discount`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ discountPercent: 10 });

    expect(discountRes.status).toBe(200);
    expect(Number(discountRes.body.data.discountPercent)).toBe(10);
    expect(Number(discountRes.body.data.discountAmount)).toBeGreaterThan(0);

    // 4. Split Bill: split 1 portion of Dish 0 to a new sub-order
    const dish0Item = addRes.body.data.items.find((i: any) => i.menuItemId === dishes[0].id);
    const splitRes = await request(app)
      .post(`/api/v1/orders/${order.id}/split`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        splits: [{ orderItemId: dish0Item.id, quantity: 1 }],
      });

    expect(splitRes.status).toBe(200);
    expect(splitRes.body.success).toBe(true);
    const { sourceOrder, newOrder } = splitRes.body.data;

    expect(newOrder.parentOrderId).toBe(order.id);
    expect(newOrder.items.length).toBe(1);
    expect(newOrder.items[0].quantity).toBe(1);

    // Clean up test data
    await prisma.orderItem.deleteMany({ where: { orderId: { in: [sourceOrder.id, newOrder.id] } } });
    await prisma.order.deleteMany({ where: { id: { in: [sourceOrder.id, newOrder.id] } } });
    await prisma.restaurantTable.delete({ where: { id: tableA.id } });
  });
});
