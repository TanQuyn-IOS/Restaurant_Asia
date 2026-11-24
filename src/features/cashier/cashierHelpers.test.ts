import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  buildCashierInvoiceList,
  calculateCashChange,
  canConfirmCashierPayment,
  computeCashierStats,
  computeQuickCashAmounts,
  generateDeterministicQrMatrix,
  validateVatInvoiceFields,
  validateVietnameseTaxCode,
} from './cashierHelpers';

describe('Cashier POS Pure Helpers (MOD-06)', () => {
  it('allows only Cashier, Manager, and Owner to confirm invoice payment', () => {
    expect(canConfirmCashierPayment('Cashier')).toBe(true);
    expect(canConfirmCashierPayment('Manager')).toBe(true);
    expect(canConfirmCashierPayment('Owner')).toBe(true);
    expect(canConfirmCashierPayment('Waitstaff')).toBe(false);
    expect(canConfirmCashierPayment('Kitchen')).toBe(false);
    expect(canConfirmCashierPayment('HR')).toBe(false);
    expect(canConfirmCashierPayment('GuestQR')).toBe(false);
  });

  it('builds cashier invoices with completed items and accurate FR-15 bill breakdown', () => {
    const list = buildCashierInvoiceList(INITIAL_DATABASE_SNAPSHOT);
    expect(list).toHaveLength(1);

    const inv103 = list[0];
    expect(inv103.invoice.ma_hoa_don).toBe('HD-20261124-103');
    expect(inv103.tableName).toBe('Bàn 103');
    expect(inv103.completedLines).toHaveLength(2);
    expect(inv103.bill.tongTienMonHoanThanh).toBe(1_320_000);
    expect(inv103.bill.tienGiamGia).toBe(66_000);
    expect(inv103.bill.tienThueVat).toBe(100_320);
    expect(inv103.bill.tongTienPhaiTra).toBe(1_354_320);
  });

  it('computes 3 Cashier KPIs before and after an invoice with VAT is paid', () => {
    const initialStats = computeCashierStats(INITIAL_DATABASE_SNAPSHOT);
    expect(initialStats.pendingCount).toBe(1);
    expect(initialStats.collectedTodayVnd).toBe(0);
    expect(initialStats.paidTransactionsCount).toBe(0);
    expect(initialStats.vatIssuedCount).toBe(0);

    const paidSnap = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    paidSnap.tbl_hoa_don[0].trang_thai_tt = 'DaThanhToan';
    paidSnap.tbl_hoa_don[0].xuat_vat = true;

    const afterStats = computeCashierStats(paidSnap);
    expect(afterStats.pendingCount).toBe(0);
    expect(afterStats.collectedTodayVnd).toBe(1_354_320);
    expect(afterStats.paidTransactionsCount).toBe(1);
    expect(afterStats.vatIssuedCount).toBe(1);
  });

  it('validates Vietnamese tax codes (10 digits or 13 digits with optional hyphen)', () => {
    expect(validateVietnameseTaxCode('0401987654')).toBe(true);
    expect(validateVietnameseTaxCode('0300465937-005')).toBe(true);
    expect(validateVietnameseTaxCode('0300465937005')).toBe(true);
    expect(validateVietnameseTaxCode('040198765')).toBe(false);
    expect(validateVietnameseTaxCode('04019876541')).toBe(false);
    expect(validateVietnameseTaxCode('04019876AB')).toBe(false);
    expect(validateVietnameseTaxCode('')).toBe(false);
  });

  it('validates VAT e-invoice form only when VAT switch is enabled', () => {
    expect(validateVatInvoiceFields(false, '', '')).toEqual({ valid: true });

    const invalid = validateVatInvoiceFields(true, '', '12345');
    expect(invalid.valid).toBe(false);
    expect(invalid.companyError).toBeTruthy();
    expect(invalid.taxCodeError).toBeTruthy();

    const valid = validateVatInvoiceFields(true, 'Công ty CP Á Châu', '0401987654');
    expect(valid.valid).toBe(true);
    expect(valid.companyError).toBeUndefined();
    expect(valid.taxCodeError).toBeUndefined();
  });

  it('calculates cash change, shortfall, and quick POS denomination suggestions', () => {
    expect(calculateCashChange(1_500_000, 1_354_320)).toEqual({
      sufficient: true,
      change: 145_680,
      shortfall: 0,
    });
    expect(calculateCashChange(1_000_000, 1_354_320)).toEqual({
      sufficient: false,
      change: 0,
      shortfall: 354_320,
    });

    const quick = computeQuickCashAmounts(1_354_320);
    expect(quick[0]).toBe(1_354_320);
    expect(quick.every((n) => n >= 1_354_320)).toBe(true);
    expect(quick.length).toBeGreaterThanOrEqual(2);
    expect(quick.length).toBeLessThanOrEqual(4);
  });

  it('generates a deterministic QR matrix with 3 finder patterns and payload sensitivity', () => {
    const m1 = generateDeterministicQrMatrix('VIETQR|HD-103|1354320', 25);
    const m2 = generateDeterministicQrMatrix('VIETQR|HD-103|1354320', 25);
    const m3 = generateDeterministicQrMatrix('VIETQR|HD-999|500000', 25);

    expect(m1).toHaveLength(25);
    expect(m1[0]).toHaveLength(25);
    // Deterministic for identical payload
    expect(m1).toEqual(m2);
    // Changes for different payload
    expect(m1).not.toEqual(m3);
    // Top-left, top-right, bottom-left finder corners are filled
    expect(m1[0][0]).toBe(true);
    expect(m1[3][3]).toBe(true);
    expect(m1[0][24]).toBe(true);
    expect(m1[24][0]).toBe(true);
  });
});
