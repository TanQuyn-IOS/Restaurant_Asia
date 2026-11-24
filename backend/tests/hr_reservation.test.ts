import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';

const app = createApp();
let adminToken: string;

describe('HR & Reservations Integration Tests', () => {
  beforeAll(async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    adminToken = loginRes.body.data.accessToken;
  });

  it('Should detect and reject overlapping employee shift schedules (Conflict Detection)', async () => {
    const emp = await prisma.employee.findFirst();
    expect(emp).not.toBeNull();

    const testDate = '2026-12-01';
    const shift1Start = `${testDate}T08:00:00.000Z`;
    const shift1End = `${testDate}T16:00:00.000Z`;

    // 1. Create first shift
    const sched1Res = await request(app)
      .post('/api/v1/hr/schedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: emp!.id,
        shiftDate: testDate,
        shiftName: 'Ca Sáng Trực Tiếp',
        startTime: shift1Start,
        endTime: shift1End,
      });

    expect(sched1Res.status).toBe(201);
    const sched1Id = sched1Res.body.data.id;

    // 2. Attempt to create overlapping shift for the SAME employee (e.g. 14:00 - 22:00) -> Must fail with 409 Conflict
    const overlappingRes = await request(app)
      .post('/api/v1/hr/schedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        employeeId: emp!.id,
        shiftDate: testDate,
        shiftName: 'Ca Chiều Trùng Lịch',
        startTime: `${testDate}T14:00:00.000Z`,
        endTime: `${testDate}T22:00:00.000Z`,
      });

    expect(overlappingRes.status).toBe(409);
    expect(overlappingRes.body.success).toBe(false);

    // Clean up schedule
    await prisma.employeeSchedule.delete({ where: { id: sched1Id } });
  });

  it('Should detect reservation conflict and prevent double-booking on same table', async () => {
    const area = await prisma.tableArea.findFirst();
    const table = await prisma.restaurantTable.create({
      data: {
        name: `Bàn ResTest ${Date.now().toString().slice(-4)}`,
        areaId: area!.id,
        capacity: 4,
        status: 'AVAILABLE',
      },
    });

    const bookDate = '2026-12-05';
    const res1Start = `${bookDate}T18:00:00.000Z`;
    const res1End = `${bookDate}T20:00:00.000Z`;

    // 1. Create first reservation
    const res1 = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableId: table!.id,
        customerName: 'Nguyễn Văn Đặt Bàn 1',
        phone: '0912345678',
        guestCount: 4,
        startTime: res1Start,
        endTime: res1End,
        notes: 'Tiệc sinh nhật',
      });

    expect(res1.status).toBe(201);
    const reservationId = res1.body.data.id;

    // 2. Attempt to book same table with overlapping time (19:00 - 21:00) -> Must fail with 409 Conflict
    const conflictRes = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableId: table!.id,
        customerName: 'Trần Thị Trùng Lịch',
        phone: '0987654321',
        guestCount: 2,
        startTime: `${bookDate}T19:00:00.000Z`,
        endTime: `${bookDate}T21:00:00.000Z`,
        notes: 'Hẹn ăn tối',
      });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.success).toBe(false);

    // Clean up reservation and test table
    await prisma.reservation.delete({ where: { id: reservationId } });
    await prisma.restaurantTable.delete({ where: { id: table.id } });
  });
});
