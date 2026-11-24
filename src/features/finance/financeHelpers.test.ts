import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  buildFinanceCsv,
  calculateCashflowSummary,
  calculateRevenueAnalytics,
  enrichInventoryItems,
  validateImportOrderInput,
} from './financeHelpers';

describe('Finance cashflow, revenue & inventory pure helpers (MOD-08)', () => {
  it('computes cash balance, bank balance, net cashflow, and operating profit consistently', () => {
    const summary = calculateCashflowSummary(INITIAL_DATABASE_SNAPSHOT.tbl_so_quy_dong_tien);

    // Seed: SQ-01 (+68.5M, post 168.5M -> opening 100M), SQ-02 (-20M), SQ-03 (-5.72M cash), SQ-04 (+1.5M), SQ-05 (-19.28M), SQ-06 (+0.5M)
    expect(summary.openingTotal).toBe(100_000_000);
    expect(summary.totalInflow).toBe(70_500_000);
    expect(summary.totalOutflow).toBe(45_000_000);
    expect(summary.netCashflow).toBe(25_500_000);
    // Operating profit excludes refundable deposits (68.5M - 45M = 23.5M)
    expect(summary.netProfit).toBe(23_500_000);
    expect(summary.totalBalance).toBe(125_500_000);
    expect(summary.cashBalance + summary.bankBalance).toBe(summary.totalBalance);
  });

  it('handles empty cashflow ledger safely', () => {
    const empty = calculateCashflowSummary([]);
    expect(empty.totalBalance).toBe(0);
    expect(empty.netCashflow).toBe(0);
    expect(empty.profitMarginPct).toBe(0);
  });

  it('aggregates revenue across 4 customer groups and top dishes using completed/served items only', () => {
    const analytics = calculateRevenueAnalytics(INITIAL_DATABASE_SNAPSHOT, 'ALL', 'month');

    // Completed/served seed items: 290k (VangLai) + 1.32M (Thuong) + 590k (VIP) + 6.5M (Doan) = 8.7M
    expect(analytics.liveSessionRevenue).toBe(8_700_000);
    expect(analytics.settledCashflowRevenue).toBe(68_500_000);
    expect(analytics.totalRevenue).toBe(77_200_000);
    expect(analytics.groupSlices).toHaveLength(4);
    expect(analytics.topGroup?.group).toBe('Doan');
    expect(analytics.topDishes[0].maMonAn).toBe('CB-DOAN01');
    expect(analytics.topDishes[0].pctOfTop).toBe(100);
    // Every slice uses CSS variables only (no hex)
    for (const s of analytics.groupSlices) {
      expect(s.colorVar.startsWith('var(--color-')).toBe(true);
    }

    // Zone filter isolates KV-VIP correctly
    const vipOnly = calculateRevenueAnalytics(INITIAL_DATABASE_SNAPSHOT, 'KV-VIP', 'month');
    expect(vipOnly.liveSessionRevenue).toBe(590_000);
    expect(vipOnly.topGroup?.group).toBe('VIP');
  });

  it('enriches inventory items with low-stock flags, stock values, and latest supplier', () => {
    const items = enrichInventoryItems(INITIAL_DATABASE_SNAPSHOT);
    expect(items).toHaveLength(6);

    const lowStock = items.filter((i) => i.isLowStock);
    expect(lowStock.map((i) => i.ma_nguyen_lieu)).toEqual(['NL-04', 'NL-06']);

    const wagyu = items.find((i) => i.ma_nguyen_lieu === 'NL-01')!;
    expect(wagyu.supplierId).toBe('NCC-01');
    expect(wagyu.stockValue).toBe(Math.round(14.5 * 1_850_000));
    expect(wagyu.category).toBe('Thịt & Gia cầm');
  });

  it('validates warehouse import orders strictly (qty>0, price>0, paid<=total, expiry>today)', () => {
    const ok = validateImportOrderInput(
      {
        ma_nha_cung_cap: 'NCC-01',
        ma_nguyen_lieu: 'NL-04',
        so_luong_nhap: 10,
        don_gia_nhap: 620_000,
        han_su_dung_lo: '2026-12-30',
        tien_da_thanh_toan: 5_000_000,
      },
      '2026-11-24',
    );
    expect(ok.valid).toBe(true);
    expect(ok.totalAmount).toBe(6_200_000);
    expect(ok.debtAmount).toBe(1_200_000);

    const invalid = validateImportOrderInput(
      {
        ma_nha_cung_cap: 'NCC-01',
        ma_nguyen_lieu: 'NL-04',
        so_luong_nhap: 0,
        don_gia_nhap: -100,
        han_su_dung_lo: '2026-11-24',
        tien_da_thanh_toan: 500_000,
      },
      '2026-11-24',
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.so_luong_nhap).toBeDefined();
    expect(invalid.errors.don_gia_nhap).toBeDefined();
    expect(invalid.errors.han_su_dung_lo).toBeDefined();

    const overpaid = validateImportOrderInput(
      {
        ma_nha_cung_cap: 'NCC-01',
        ma_nguyen_lieu: 'NL-04',
        so_luong_nhap: 2,
        don_gia_nhap: 500_000,
        han_su_dung_lo: '2026-12-01',
        tien_da_thanh_toan: 1_500_000,
      },
      '2026-11-24',
    );
    expect(overpaid.valid).toBe(false);
    expect(overpaid.errors.tien_da_thanh_toan).toBeDefined();
  });

  it('builds UTF-8 BOM CSV for cashflow ledger', () => {
    const csv = buildFinanceCsv(['Mã', 'Số tiền'], [['SQ-01', 68500000]]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('SQ-01,68500000');
  });
});
