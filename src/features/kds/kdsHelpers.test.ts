import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  buildKdsTickets,
  canOperateKitchen,
  computeKdsSummary,
  filterKdsTickets,
  filterMenuDishes,
  normalizeIsoTimestamp,
} from './kdsHelpers';

describe('KDS Pure Helpers (MOD-05)', () => {
  it('allows Kitchen, Manager, and Owner to operate KDS while blocking other roles', () => {
    expect(canOperateKitchen('Kitchen')).toBe(true);
    expect(canOperateKitchen('Manager')).toBe(true);
    expect(canOperateKitchen('Owner')).toBe(true);
    expect(canOperateKitchen('Waitstaff')).toBe(false);
    expect(canOperateKitchen('Cashier')).toBe(false);
    expect(canOperateKitchen('HR')).toBe(false);
    expect(canOperateKitchen('GuestQR')).toBe(false);
  });

  it('normalizes MySQL timestamps to ISO-8601 format safely', () => {
    expect(normalizeIsoTimestamp('2026-11-24 17:36:00')).toBe('2026-11-24T17:36:00');
    expect(normalizeIsoTimestamp('2026-11-24T17:36:00')).toBe('2026-11-24T17:36:00');
    expect(normalizeIsoTimestamp(null)).toBe('');
  });

  it('pins VIP orders first ahead of earlier non-VIP active orders, then sorts FIFO', () => {
    const tickets = buildKdsTickets(INITIAL_DATABASE_SNAPSHOT);

    // Seed has active orders: ORD-VIP01 (vip_flag=true, 17:36) and ORD-101 (vip_flag=false, 17:25)
    expect(tickets.length).toBe(4);
    expect(tickets[0].maOrder).toBe('ORD-VIP01');
    expect(tickets[0].isVip).toBe(true);
    expect(tickets[1].maOrder).toBe('ORD-101');
    expect(tickets[1].hasActiveDishes).toBe(true);

    // Completed orders sit after active orders in FIFO order
    expect(tickets[2].maOrder).toBe('ORD-103');
    expect(tickets[3].maOrder).toBe('ORD-DOAN301');
  });

  it('excludes cancelled dishes and released orders from KDS tickets', () => {
    const snap = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    snap.tbl_chi_tiet_don_goi.forEach((item) => {
      if (item.ma_order === 'ORD-101') item.trang_thai_mon = 'DaHuy';
    });
    const order103 = snap.tbl_don_goi_mon.find((o) => o.ma_order === 'ORD-103');
    if (order103) order103.trang_thai_order = 'DaGiaiPhong';

    const tickets = buildKdsTickets(snap);
    expect(tickets.map((t) => t.maOrder)).not.toContain('ORD-101');
    expect(tickets.map((t) => t.maOrder)).not.toContain('ORD-103');
  });

  it('computes accurate summary counts and filters tickets by dish status', () => {
    const tickets = buildKdsTickets(INITIAL_DATABASE_SNAPSHOT);
    const summary = computeKdsSummary(tickets);

    // Seed: 2 ChoCheBien (CT-101-3, CT-VIP01-1), 1 DangCheBien (CT-101-2), 5 HoanThanh/DaPhucVu
    expect(summary.activeTicketsCount).toBe(2);
    expect(summary.waitingDishesCount).toBe(2);
    expect(summary.cookingDishesCount).toBe(1);
    expect(summary.doneDishesCount).toBe(5);
    expect(summary.totalDishesCount).toBe(8);

    const waitingTickets = filterKdsTickets(tickets, 'ChoCheBien');
    expect(waitingTickets).toHaveLength(2);
    expect(waitingTickets[0].maOrder).toBe('ORD-VIP01');
    expect(waitingTickets[0].items.every((e) => e.item.trang_thai_mon === 'ChoCheBien')).toBe(true);

    const cookingTickets = filterKdsTickets(tickets, 'DangCheBien');
    expect(cookingTickets).toHaveLength(1);
    expect(cookingTickets[0].maOrder).toBe('ORD-101');

    const doneTickets = filterKdsTickets(tickets, 'HoanThanh');
    expect(doneTickets).toHaveLength(4);
  });

  it('filters menu availability with Vietnamese diacritic-insensitive search', () => {
    const allRows = filterMenuDishes(
      INITIAL_DATABASE_SNAPSHOT.tbl_mon_an,
      INITIAL_DATABASE_SNAPSHOT.tbl_danh_muc_mon,
      '',
    );
    expect(allRows).toHaveLength(INITIAL_DATABASE_SNAPSHOT.tbl_mon_an.length);

    const phoRows = filterMenuDishes(
      INITIAL_DATABASE_SNAPSHOT.tbl_mon_an,
      INITIAL_DATABASE_SNAPSHOT.tbl_danh_muc_mon,
      'pho bo',
    );
    expect(phoRows).toHaveLength(1);
    expect(phoRows[0].dish.ma_mon_an).toBe('MON-VN01');

    const thaiRows = filterMenuDishes(
      INITIAL_DATABASE_SNAPSHOT.tbl_mon_an,
      INITIAL_DATABASE_SNAPSHOT.tbl_danh_muc_mon,
      'thai lan',
    );
    expect(thaiRows.length).toBeGreaterThanOrEqual(2);
  });
});
