import { describe, it, expect } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '../data/seedData';
import {
  calculateCompletedOrderBill,
  canCancelOrderItem,
  canReleaseTableWithDeleteButton,
  verifyRbacPermission,
  classifyLeaveThreeState,
} from '../store/useRestaurantStore';

describe('AC-RMS Core Business Rules & 27-Table 3NF Integrity', () => {
  it('contains all 27 tables required by the 3NF database design in Chapter 4', () => {
    const tableNames = Object.keys(INITIAL_DATABASE_SNAPSHOT);
    expect(tableNames).toHaveLength(27);
    expect(tableNames).toContain('tbl_khu_vuc');
    expect(tableNames).toContain('tbl_ban');
    expect(tableNames).toContain('tbl_khach_doan');
    expect(tableNames).toContain('tbl_dinh_muc_mon');
    expect(tableNames).toContain('tbl_nhat_ky_bep');
    expect(tableNames).toContain('tbl_so_quy_dong_tien');
    expect(tableNames).toContain('tbl_yeu_cau_khach_hang');
  });

  it('FR-15 & UC-05: only includes KDS completed/served dishes in bill calculation', () => {
    // ORD-101 has 3 items: CT-101-1 (DaPhucVu: 2 * 145000 = 290000), CT-101-2 (DangCheBien), CT-101-3 (ChoCheBien)
    const bill = calculateCompletedOrderBill(INITIAL_DATABASE_SNAPSHOT, 'ORD-101');
    expect(bill.completedItemsCount).toBe(1);
    expect(bill.pendingItemsCount).toBe(2);
    expect(bill.tongTienMonHoanThanh).toBe(290000);
  });

  it('FR-07 & UC-08: automatically deducts group deposit (tien_dat_coc) and applies VIP card discount', () => {
    // ORD-DOAN301 is linked to PDB-01 (deposit 1,500,000) and KH-DOAN01 (Gold card: 10% discount)
    const bill = calculateCompletedOrderBill(INITIAL_DATABASE_SNAPSHOT, 'ORD-DOAN301');
    expect(bill.tongTienMonHoanThanh).toBe(6500000);
    expect(bill.tienGiamGia).toBe(650000);
    expect(bill.tienCocTru).toBe(1500000);
    expect(bill.tongTienPhaiTra).toBe(6500000 - 650000 + Math.round(5850000 * 0.08) - 1500000);
  });

  it('FR-11 & UC-03: allows cancelling ChoCheBien dishes but locks cancellation once KDS starts cooking', () => {
    expect(canCancelOrderItem('ChoCheBien').allowed).toBe(true);
    expect(canCancelOrderItem('DangCheBien').allowed).toBe(false);
    expect(canCancelOrderItem('HoanThanh').allowed).toBe(false);
  });

  it('FR-02 & UC-09: blocks DELETE table release button until invoice is paid (DaThanhToan)', () => {
    const unpaidCheck = canReleaseTableWithDeleteButton(INITIAL_DATABASE_SNAPSHOT, 'B-103');
    expect(unpaidCheck.allowed).toBe(false);

    const paidSnapshot = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    const inv = paidSnapshot.tbl_hoa_don.find((h) => h.ma_order === 'ORD-103');
    if (inv) inv.trang_thai_tt = 'DaThanhToan';

    const paidCheck = canReleaseTableWithDeleteButton(paidSnapshot, 'B-103');
    expect(paidCheck.allowed).toBe(true);
  });

  it('FR-17 & FR-19: enforces RBAC blocks (Manager hidden from Cashflow 403; Cashier Read-Only 403)', () => {
    const mgrCashflow = verifyRbacPermission('Manager', 'VIEW_CASHFLOW');
    expect(mgrCashflow.allowed).toBe(false);
    expect(mgrCashflow.statusCode).toBe(403);

    const ownerCashflow = verifyRbacPermission('Owner', 'VIEW_CASHFLOW');
    expect(ownerCashflow.allowed).toBe(true);
    expect(ownerCashflow.statusCode).toBe(200);

    const cashierEdit = verifyRbacPermission('Cashier', 'MODIFY_INVOICE_ITEMS');
    expect(cashierEdit.allowed).toBe(false);
    expect(cashierEdit.statusCode).toBe(403);
  });

  it('FR-21 & UC-11: classifies leave requests into 3 states (DaNghi, DangNghi, SapNghi)', () => {
    expect(classifyLeaveThreeState('2026-11-20', '2026-11-24')).toBe('DaNghi');
    expect(classifyLeaveThreeState('2026-11-24', '2026-11-24')).toBe('DangNghi');
    expect(classifyLeaveThreeState('2026-11-27', '2026-11-24')).toBe('SapNghi');
  });
});
