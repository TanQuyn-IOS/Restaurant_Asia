import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();
let adminToken: string;

describe('Kitchen KDS & BOM Inventory Tests', () => {
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    adminToken = loginRes.body.data.accessToken;
  });

  it('Should deduct BOM ingredients atomically and prevent duplicate cooking', async () => {
    // 1. Create a dedicated test table and dish
    const area = await prisma.tableArea.findFirst();
    const table = await prisma.restaurantTable.create({
      data: {
        name: `Bàn KitchenTest ${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 4,
        status: 'AVAILABLE',
      },
    });

    const dish = await prisma.menuItem.findFirst({
      where: { name: { contains: 'Bò Bít Tết' }, isDeleted: false },
      include: { recipes: { include: { ingredient: true } } },
    });
    expect(dish).not.toBeNull();
    expect(dish!.recipes.length).toBeGreaterThan(0);

    const initialStockMap = new Map<string, number>();
    for (const r of dish!.recipes) {
      initialStockMap.set(r.ingredientId, Number(r.ingredient.currentStock));
    }

    // 2. Create Order
    const orderRes = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableId: table!.id,
        customerName: 'Khách Kiểm Thử BOM',
        items: [{ menuItemId: dish!.id, quantity: 1 }],
      });

    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.data.id;

    // 3. Get item in KDS queue
    const kdsRes = await request(app)
      .get('/api/v1/kitchen/queue')
      .set('Authorization', `Bearer ${adminToken}`);

    const item = kdsRes.body.data.find((i: any) => i.orderId === orderId);
    expect(item).toBeDefined();
    expect(item.status).toBe('PENDING');

    // 4. Start Cooking -> Deducts stock via BOM
    const cookRes = await request(app)
      .post(`/api/v1/kitchen/items/${item.id}/cook`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(cookRes.status).toBe(200);
    expect(cookRes.body.data.stockTransactions.length).toBe(dish!.recipes.length);

    // Verify each ingredient stock decreased correctly
    for (const r of dish!.recipes) {
      const updatedIng = await prisma.ingredient.findUnique({
        where: { id: r.ingredientId },
      });
      const expected = initialStockMap.get(r.ingredientId)! - Number(r.quantityRequired);
      expect(Number(updatedIng!.currentStock)).toBeCloseTo(expected, 2);
    }

    // 5. Test Anti-Double Cooking: Calling cook a second time MUST FAIL
    const secondCookRes = await request(app)
      .post(`/api/v1/kitchen/items/${item.id}/cook`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(secondCookRes.status).toBe(409); // ConflictError

    // Clean up test data
    await prisma.stockTransaction.deleteMany({ where: { sourceId: orderId } });
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    await prisma.restaurantTable.delete({ where: { id: table.id } });
  });
});
