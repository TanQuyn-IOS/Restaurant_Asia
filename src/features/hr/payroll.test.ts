import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  buildUtf8Csv,
  calculatePayrollSummary,
  cleanStaffName,
  escapeCsvCell,
  formatExactShiftWindow,
  formatHoursVi,
  getWeekDaysAnchored,
  hasApprovedLeaveConflict,
  hasDuplicateShift,
  parseShiftHours,
} from './payroll';

describe('HR shift & payroll pure helpers (MOD-07)', () => {
  it('cleans parenthetical role suffixes from staff display names', () => {
    expect(cleanStaffName('Lê Hoàng Thiện (Phục Vụ Sảnh T1)')).toBe('Lê Hoàng Thiện');
    expect(cleanStaffName('Nguyễn Thị Mai')).toBe('Nguyễn Thị Mai');
  });

  it('computes exact shift hours and Vietnamese hour labels', () => {
    expect(parseShiftHours('06:00:00', '14:00:00')).toBe(8);
    expect(parseShiftHours('17:00:00', '22:30:00')).toBe(5.5);
    expect(parseShiftHours('22:00:00', '02:00:00')).toBe(4);
    expect(formatHoursVi(8)).toBe('8,0g');
    expect(formatHoursVi(142.5)).toBe('142,5g');
    expect(
      formatExactShiftWindow({ gio_bat_dau: '06:00:00', gio_ket_thuc: '14:00:00' }),
    ).toBe('06:00–14:00 · 8,0g');
    expect(
      formatExactShiftWindow({ gio_bat_dau: '17:00:00', gio_ket_thuc: '22:30:00' }),
    ).toBe('17:00–22:30 · 5,5g');
  });

  it('builds a 7-day Monday..Sunday week anchored on DEMO_TODAY (2026-11-24)', () => {
    const week = getWeekDaysAnchored('2026-11-24', 0);
    expect(week).toHaveLength(7);
    expect(week[0]).toMatchObject({ iso: '2026-11-23', weekdayLabel: 'T2', isToday: false });
    expect(week[1]).toMatchObject({ iso: '2026-11-24', weekdayLabel: 'T3', isToday: true });
    expect(week[6]).toMatchObject({ iso: '2026-11-29', weekdayLabel: 'CN', isToday: false });

    const nextWeek = getWeekDaysAnchored('2026-11-24', 1);
    expect(nextWeek[0].iso).toBe('2026-11-30');
    expect(nextWeek.every((d) => !d.isToday)).toBe(true);
  });

  it('detects duplicate shift assignments and approved leave conflicts', () => {
    expect(
      hasDuplicateShift(INITIAL_DATABASE_SNAPSHOT.tbl_phan_cong_ca, 'NV-PV01', '2026-11-24', 'CA-CHIEU'),
    ).toBe(true);
    expect(
      hasDuplicateShift(INITIAL_DATABASE_SNAPSHOT.tbl_phan_cong_ca, 'NV-PV01', '2026-11-24', 'CA-TOI'),
    ).toBe(false);

    expect(
      hasApprovedLeaveConflict(INITIAL_DATABASE_SNAPSHOT.tbl_don_nghi_phep, 'NV-PV02', '2026-11-24', 'CA-SANG'),
    ).toBe(true);
    // NP-03 is ChoDuyet, not yet approved
    expect(
      hasApprovedLeaveConflict(INITIAL_DATABASE_SNAPSHOT.tbl_don_nghi_phep, 'NV-TN01', '2026-11-27', 'CA-TOI'),
    ).toBe(false);
  });

  it('calculates shift payroll accurately from seed tables and syncs newly approved leave', () => {
    const base = calculatePayrollSummary(INITIAL_DATABASE_SNAPSHOT, '2026-11', '2026-11-24');
    expect(base.staffCount).toBe(7);

    const pv01 = base.rows.find((r) => r.maNhanVien === 'NV-PV01')!;
    expect(pv01).toBeDefined();
    // 10*8 + 12*8 + 4*5.5 = 80 + 96 + 22 = 198.0h
    expect(pv01.exactHours).toBe(198);
    expect(pv01.totalShifts).toBe(26);
    expect(pv01.leaveDays).toBe(1);
    expect(pv01.netPay).toBe(6414000);
    expect(pv01.grossPay - pv01.leaveDeduction).toBe(pv01.netPay);

    // Approve pending leave NP-03 (NV-TN01, 2026-11-27, CA-TOI x1.25 -> 240,000 * 1.25 = 300,000)
    const cloned = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    const np03 = cloned.tbl_don_nghi_phep.find((d) => d.ma_don_nghi === 'NP-03');
    if (np03) np03.trang_thai_duyet = 'DaDuyet';

    const afterApprove = calculatePayrollSummary(cloned, '2026-11', '2026-11-24');
    const tnBefore = base.rows.find((r) => r.maNhanVien === 'NV-TN01')!;
    const tnAfter = afterApprove.rows.find((r) => r.maNhanVien === 'NV-TN01')!;
    expect(tnAfter.leaveDays).toBe(tnBefore.leaveDays + 1);
    expect(tnAfter.leaveDeduction).toBe(tnBefore.leaveDeduction + 300000);
    expect(tnAfter.netPay).toBe(tnBefore.netPay - 300000);
  });

  it('produces valid UTF-8 BOM CSV with proper RFC 4180 escaping', () => {
    expect(escapeCsvCell('Bình thường')).toBe('Bình thường');
    expect(escapeCsvCell('Ca "Sáng", T1')).toBe('"Ca ""Sáng"", T1"');

    const csv = buildUtf8Csv(['Nhân viên', 'Giờ'], [['Lê Hoàng Thiện', '06:00–14:00 · 8,0g']]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Nhân viên,Giờ\r\nLê Hoàng Thiện,"06:00–14:00 · 8,0g"');
  });
});
