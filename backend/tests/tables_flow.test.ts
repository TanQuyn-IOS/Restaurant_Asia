import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();
let adminToken: string;

describe('Tables & Areas Integration Tests', () => {
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    adminToken = loginRes.body.data.accessToken;
  });

  it('Should fetch all areas and tables', async () => {
    const areasRes = await request(app)
      .get('/api/v1/tables/areas')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(areasRes.status).toBe(200);
    expect(Array.isArray(areasRes.body.data)).toBe(true);

    const tablesRes = await request(app)
      .get('/api/v1/tables')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(tablesRes.status).toBe(200);
    expect(Array.isArray(tablesRes.body.data)).toBe(true);
    expect(tablesRes.body.data.length).toBeGreaterThan(0);
  });

  it('Should create and update a table with optimistic locking (OCC)', async () => {
    const area = await prisma.tableArea.findFirst();
    expect(area).not.toBeNull();

    // 1. Create a new test table
    const createRes = await request(app)
      .post('/api/v1/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: `Bàn Test ${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 6,
        shape: 'ROUND',
        posX: 100,
        posY: 150,
      });

    expect(createRes.status).toBe(201);
    const table = createRes.body.data;
    expect(table.version).toBe(0);

    // 2. Update table with correct version
    const updateRes = await request(app)
      .put(`/api/v1/tables/${table.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        capacity: 8,
        version: 0,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.capacity).toBe(8);
    expect(updateRes.body.data.version).toBe(1);

    // 3. Update table with stale version -> Must return 409 Conflict
    const staleUpdateRes = await request(app)
      .put(`/api/v1/tables/${table.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        capacity: 10,
        version: 0, // Stale!
      });

    expect(staleUpdateRes.status).toBe(409);
    expect(staleUpdateRes.body.success).toBe(false);

    // Clean up test table
    await prisma.restaurantTable.delete({ where: { id: table.id } });
  });

  it('Should transfer order between tables and update statuses atomically', async () => {
    const area = await prisma.tableArea.findFirst();
    const dish = await prisma.menuItem.findFirst({ where: { isDeleted: false } });

    // Create 2 test tables
    const tableA = await prisma.restaurantTable.create({
      data: {
        name: `Bàn A-${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 4,
        status: 'AVAILABLE',
      },
    });

    const tableB = await prisma.restaurantTable.create({
      data: {
        name: `Bàn B-${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 4,
        status: 'AVAILABLE',
      },
    });

    // Create order on Table A
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableId: tableA.id,
        customerName: 'Khách Chuyển Bàn',
        items: [{ menuItemId: dish!.id, quantity: 1 }],
      });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.id;

    // Refresh Table A & B versions
    const freshA = await prisma.restaurantTable.findUnique({ where: { id: tableA.id } });
    const freshB = await prisma.restaurantTable.findUnique({ where: { id: tableB.id } });
    expect(freshA!.status).toBe('OCCUPIED');
    expect(freshB!.status).toBe('AVAILABLE');

    // Transfer from Table A to Table B
    const transferRes = await request(app)
      .post('/api/v1/tables/transfer')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceTableId: tableA.id,
        targetTableId: tableB.id,
        orderId,
        sourceVersion: freshA!.version,
        targetVersion: freshB!.version,
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.success).toBe(true);

    // Verify Table A is now AVAILABLE and Table B is now OCCUPIED
    const finalA = await prisma.restaurantTable.findUnique({ where: { id: tableA.id } });
    const finalB = await prisma.restaurantTable.findUnique({ where: { id: tableB.id } });
    expect(finalA!.status).toBe('AVAILABLE');
    expect(finalB!.status).toBe('OCCUPIED');

    // Clean up
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    await prisma.restaurantTable.deleteMany({ where: { id: { in: [tableA.id, tableB.id] } } });
  });
});
