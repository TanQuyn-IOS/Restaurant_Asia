import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();
let cashierToken: string;
let adminToken: string;

describe('Security, RBAC & Idempotency Integration Tests', () => {
  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    adminToken = adminLogin.body.data.accessToken;

    const cashierLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'cashier1', password: 'Staff@123' });
    cashierToken = cashierLogin.body.data.accessToken;
  });

  it('Should enforce RBAC and reject unauthorized role access with 403 Forbidden', async () => {
    // Cashier attempts to access HR Employee Management endpoint
    const hrAccessRes = await request(app)
      .get('/api/v1/hr/employees')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(hrAccessRes.status).toBe(403);
    expect(hrAccessRes.body.success).toBe(false);

    // Cashier attempts to delete table area
    const areaDelRes = await request(app)
      .delete('/api/v1/tables/areas/some-area-id')
      .set('Authorization', `Bearer ${cashierToken}`);

    expect(areaDelRes.status).toBe(403);
    expect(areaDelRes.body.success).toBe(false);
  });

  it('Should reject request without Bearer token with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/tables');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Should enforce Idempotency via X-Idempotency-Key and prevent duplicate execution', async () => {
    const area = await prisma.tableArea.findFirst();
    const table = await prisma.restaurantTable.create({
      data: {
        name: `Bàn IdempTest ${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 4,
        status: 'AVAILABLE',
      },
    });
    const dish = await prisma.menuItem.findFirst({ where: { isDeleted: false } });
    expect(table).not.toBeNull();
    expect(dish).not.toBeNull();

    const idempotencyKey = `IDEMP-TEST-${Date.now()}`;

    // 1. First execution
    const firstCall = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Idempotency-Key', idempotencyKey)
      .send({
        tableId: table!.id,
        customerName: 'Khách Idempotent',
        items: [{ menuItemId: dish!.id, quantity: 1 }],
      });

    expect(firstCall.status).toBe(201);
    const orderId = firstCall.body.data.id;

    // 2. Second execution with identical X-Idempotency-Key -> MUST return cached result
    const secondCall = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Idempotency-Key', idempotencyKey)
      .send({
        tableId: table!.id,
        customerName: 'Khách Idempotent',
        items: [{ menuItemId: dish!.id, quantity: 1 }],
      });

    expect(secondCall.status).toBe(201);
    expect(secondCall.body.data.id).toBe(orderId);

    // Verify IdempotencyRecord was created in DB
    const rec = await prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey },
    });
    expect(rec).not.toBeNull();
    expect(rec!.statusCode).toBe(201);

    // Clean up
    await prisma.idempotencyRecord.delete({ where: { idempotencyKey } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    await prisma.restaurantTable.update({
      where: { id: table!.id },
      data: { status: 'AVAILABLE', occupiedSince: null },
    });
  });
});
