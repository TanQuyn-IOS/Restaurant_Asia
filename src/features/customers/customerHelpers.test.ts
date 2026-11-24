import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  computeActiveDepositsTotal,
  computeCustomerGroupCounts,
  filterCustomerRows,
  getCardDiscountPercent,
} from './customerHelpers';

describe('MOD-02 customerHelpers', () => {
  const customers = INITIAL_DATABASE_SNAPSHOT.tbl_khach_hang;
  const corporates = INITIAL_DATABASE_SNAPSHOT.tbl_khach_doan;
  const reservations = INITIAL_DATABASE_SNAPSHOT.tbl_phieu_dat_ban;
  const corporateMap = new Map(corporates.map((c) => [c.ma_khach_hang, c]));

  it('returns exact loyalty card discount rates matching store rules', () => {
    expect(getCardDiscountPercent('Standard')).toBe(0);
    expect(getCardDiscountPercent('Silver')).toBe(5);
    expect(getCardDiscountPercent('Gold')).toBe(10);
    expect(getCardDiscountPercent('Diamond')).toBe(15);
  });

  it('counts all 4 customer groups from seed data', () => {
    const counts = computeCustomerGroupCounts(customers);
    expect(counts.ALL).toBe(7);
    expect(counts.VangLai).toBe(1);
    expect(counts.Thuong).toBe(2);
    expect(counts.VIP).toBe(2);
    expect(counts.Doan).toBe(2);
  });

  it('sums active deposits and ignores cancelled reservations', () => {
    expect(computeActiveDepositsTotal(reservations)).toBe(2000000);
    expect(
      computeActiveDepositsTotal([
        ...reservations,
        {
          ma_phieu_dat: 'PDB-CANCELLED',
          ma_khach_hang: 'KH-TH01',
          ma_ban: 'B-102',
          thoi_gian_dat: '2026-11-24 10:00:00',
          thoi_gian_den: '2026-11-24 19:00:00',
          so_nguoi: 4,
          tien_dat_coc: 999000,
          ghi_chu_tiec: null,
          trang_thai_dat: 'DaHuy',
        },
      ]),
    ).toBe(2000000);
  });

  it('filters customers by group, Vietnamese name, phone, company name, and tax ID (MST)', () => {
    const rows = customers.map((customer) => ({
      customer,
      corporate: corporateMap.get(customer.ma_khach_hang) ?? null,
    }));

    expect(filterCustomerRows(rows, 'VIP', '')).toHaveLength(2);
    expect(filterCustomerRows(rows, 'Doan', '')).toHaveLength(2);
    expect(filterCustomerRows(rows, 'ALL', 'quoc bao')).toHaveLength(1);
    expect(filterCustomerRows(rows, 'ALL', '0905123456')).toHaveLength(1);
    expect(filterCustomerRows(rows, 'ALL', '0401987654')).toHaveLength(1);
    expect(filterCustomerRows(rows, 'Doan', 'vietravel')).toHaveLength(1);
    expect(filterCustomerRows(rows, 'VIP', 'vietravel')).toHaveLength(0);
  });
});
