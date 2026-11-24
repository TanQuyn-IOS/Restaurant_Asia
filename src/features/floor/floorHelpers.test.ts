import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  canManageFloorSpaceRole,
  canOperateFloorRole,
  computeAvgTurnMinutes,
  computeZoneStats,
  filterCustomersByGroup,
  filterDishesByCategory,
  foldVietnamese,
  formatLocalDateTimeSql,
  formatZoneTabIndex,
  getActiveOrderForTable,
  getActiveReservationForTable,
  getChairDistribution,
  getFloorReadOnlyReason,
  getMergedChildTables,
  resolveEffectiveTableId,
  splitZoneName,
} from './floorHelpers';

describe('floorHelpers — RBAC & vai trò thao tác sảnh', () => {
  it('cho phép Waitstaff, Manager, Owner thao tác và khóa các vai trò khác', () => {
    expect(canOperateFloorRole('Owner')).toBe(true);
    expect(canOperateFloorRole('Manager')).toBe(true);
    expect(canOperateFloorRole('Waitstaff')).toBe(true);
    expect(canOperateFloorRole('Kitchen')).toBe(false);
    expect(canOperateFloorRole('Cashier')).toBe(false);
    expect(canOperateFloorRole('HR')).toBe(false);
    expect(canOperateFloorRole('GuestQR')).toBe(false);
  });

  it('chỉ Owner và Manager được thêm bàn / khu vực mới', () => {
    expect(canManageFloorSpaceRole('Owner')).toBe(true);
    expect(canManageFloorSpaceRole('Manager')).toBe(true);
    expect(canManageFloorSpaceRole('Waitstaff')).toBe(false);
    expect(canManageFloorSpaceRole('Cashier')).toBe(false);
  });

  it('trả về lý do tiếng Việt khi vai trò chỉ được xem', () => {
    expect(getFloorReadOnlyReason('Waitstaff')).toBeNull();
    expect(getFloorReadOnlyReason('Kitchen')).toContain('Bếp');
    expect(getFloorReadOnlyReason('Cashier')).toContain('Thu ngân');
  });
});

describe('floorHelpers — khu vực, bàn ghép & thống kê KPI', () => {
  it('tách tên khu vực và đánh số tab 01..', () => {
    expect(splitZoneName('Sảnh Chính Tầng 1 (Tre Việt)')).toEqual({
      short: 'Sảnh Chính Tầng 1',
      subtitle: 'Tre Việt',
    });
    expect(splitZoneName('Khu Ngoài Trời')).toEqual({
      short: 'Khu Ngoài Trời',
      subtitle: null,
    });
    expect(formatZoneTabIndex(0)).toBe('01');
    expect(formatZoneTabIndex(3)).toBe('04');
  });

  it('giải mã đúng bàn chính cho bàn phụ D-302 -> D-301 và liệt kê bàn con', () => {
    expect(resolveEffectiveTableId(INITIAL_DATABASE_SNAPSHOT, 'D-302')).toBe('D-301');
    expect(resolveEffectiveTableId(INITIAL_DATABASE_SNAPSHOT, 'B-101')).toBe('B-101');

    const children = getMergedChildTables(INITIAL_DATABASE_SNAPSHOT, 'D-301');
    expect(children.map((b) => b.ma_ban)).toEqual(['D-302']);

    const orderFromChild = getActiveOrderForTable(INITIAL_DATABASE_SNAPSHOT, 'D-302');
    expect(orderFromChild?.ma_order).toBe('ORD-DOAN301');
  });

  it('tìm đúng phiếu đặt bàn đang chờ khách đến (DaNhan)', () => {
    expect(getActiveReservationForTable(INITIAL_DATABASE_SNAPSHOT, 'B-201')?.ma_phieu_dat).toBe(
      'PDB-02',
    );
    expect(getActiveReservationForTable(INITIAL_DATABASE_SNAPSHOT, 'VIP-03')?.ma_phieu_dat).toBe(
      'PDB-03',
    );
    // D-301 có PDB-01 trạng thái DaDen → không trả về như phiếu đang chờ
    expect(getActiveReservationForTable(INITIAL_DATABASE_SNAPSHOT, 'D-301')).toBeUndefined();
  });

  it('tính đúng 4 chỉ số KPI cho khu Tầng 1 và khu Đoàn (không đếm trùng khách bàn ghép)', () => {
    const t1 = computeZoneStats(INITIAL_DATABASE_SNAPSHOT, 'KV-T1');
    expect(t1.totalTables).toBe(4);
    expect(t1.availableCount).toBe(2);
    expect(t1.occupiedTablesCount).toBe(2); // B-101 (4 ghế) + B-103 (6 ghế)
    expect(t1.seatedGuests).toBe(10);
    expect(t1.statusCounts).toEqual({
      Trong: 2,
      DaDat: 0,
      DangPhucVu: 1,
      ChoThanhToan: 1,
    });

    const doan = computeZoneStats(INITIAL_DATABASE_SNAPSHOT, 'KV-DOAN');
    expect(doan.totalTables).toBe(3);
    expect(doan.availableCount).toBe(1);
    expect(doan.occupiedTablesCount).toBe(2); // D-301 + D-302
    // Phiếu PDB-01 có 20 khách dùng chung D-301 + D-302 → đúng 20 khách, không nhân đôi
    expect(doan.seatedGuests).toBe(20);
  });

  it('tính thời gian quay bàn trung bình hợp lý từ snapshot mẫu', () => {
    const avgAll = computeAvgTurnMinutes(INITIAL_DATABASE_SNAPSHOT);
    expect(avgAll).toBeGreaterThanOrEqual(20);
    expect(avgAll).toBeLessThanOrEqual(120);

    const emptySnap = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    emptySnap.tbl_don_goi_mon = [];
    expect(computeAvgTurnMinutes(emptySnap)).toBe(45);
  });
});

describe('floorHelpers — lọc thực đơn, khách hàng & sơ đồ ghế', () => {
  it('lọc đúng món ăn theo trường phái ẩm thực, Combo và tìm kiếm tiếng Việt không dấu', () => {
    const { tbl_mon_an, tbl_danh_muc_mon } = INITIAL_DATABASE_SNAPSHOT;

    const all = filterDishesByCategory(tbl_mon_an, tbl_danh_muc_mon, 'ALL');
    expect(all.length).toBe(tbl_mon_an.length);

    const combos = filterDishesByCategory(tbl_mon_an, tbl_danh_muc_mon, 'COMBO');
    expect(combos.every((m) => m.is_combo)).toBe(true);
    expect(combos.length).toBe(1);

    // Việt Nam không lẫn gói Combo dù DM-COMBO gắn truong_phai_am_thuc = VietNam
    const vn = filterDishesByCategory(tbl_mon_an, tbl_danh_muc_mon, 'VietNam');
    expect(vn.every((m) => !m.is_combo)).toBe(true);
    expect(vn.map((m) => m.ma_mon_an)).toEqual(['MON-VN01', 'MON-VN02']);

    const search = filterDishesByCategory(tbl_mon_an, tbl_danh_muc_mon, 'ALL', 'pho bo wagyu');
    expect(search.map((m) => m.ma_mon_an)).toEqual(['MON-VN01']);
  });

  it('tìm kiếm khách hàng theo nhóm, tên không dấu và số điện thoại', () => {
    const { tbl_khach_hang } = INITIAL_DATABASE_SNAPSHOT;
    expect(foldVietnamese('Đặng Văn Khoa')).toBe('dang van khoa');

    const byName = filterCustomersByGroup(tbl_khach_hang, 'Thuong', 'minh tuan');
    expect(byName.map((c) => c.ma_khach_hang)).toEqual(['KH-TH01']);

    const byPhone = filterCustomersByGroup(tbl_khach_hang, 'VIP', '0988777666');
    expect(byPhone.map((c) => c.ma_khach_hang)).toEqual(['KH-VIP01']);
  });

  it('phân bổ ghế cân đối quanh bàn cho SVG minh họa', () => {
    expect(getChairDistribution(2)).toEqual({ top: 1, bottom: 1, left: 0, right: 0 });
    expect(getChairDistribution(4)).toEqual({ top: 2, bottom: 2, left: 0, right: 0 });
    expect(getChairDistribution(6)).toEqual({ top: 2, bottom: 2, left: 1, right: 1 });
    expect(getChairDistribution(12)).toEqual({ top: 5, bottom: 5, left: 1, right: 1 });
  });

  it('chuẩn hóa ngày giờ sang chuỗi SQL', () => {
    expect(formatLocalDateTimeSql('2026-11-24', '19:30')).toBe('2026-11-24 19:30:00');
  });
});
