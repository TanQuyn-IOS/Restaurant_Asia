import type {
  Ban,
  CuisineSchool,
  DanhMucMon,
  DatabaseSnapshot,
  DonGoiMon,
  HoaDon,
  KhachDoan,
  KhachHang,
  KhuVuc,
  MonAn,
  PhieuDatBan,
  RoleCode,
  TableStatus,
} from '@/types/database';
import { ROLE_META } from '@/lib/labels';
import { calculateCompletedOrderBill } from '@/store/useRestaurantStore';

export type DishFilterKey = 'ALL' | CuisineSchool | 'COMBO';
export type ZoneFilterKey = 'ALL' | string;

export interface ZoneStats {
  totalTables: number;
  availableCount: number;
  occupiedTablesCount: number;
  seatedGuests: number;
  avgTurnMinutes: number;
  statusCounts: Record<TableStatus, number>;
}

export interface ChairDistribution {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Vai trò được phép thao tác sảnh: Mở bàn, đặt bàn, ghép/chuyển, gọi món, chốt bill, DELETE bàn. */
export function canOperateFloorRole(role: RoleCode): boolean {
  return role === 'Owner' || role === 'Manager' || role === 'Waitstaff';
}

/** Vai trò được phép cấu hình thêm bàn / khu vực mới. */
export function canManageFloorSpaceRole(role: RoleCode): boolean {
  return role === 'Owner' || role === 'Manager';
}

/** Lý do chế độ chỉ xem nếu vai trò không được thao tác tại sơ đồ bàn. */
export function getFloorReadOnlyReason(role: RoleCode): string | null {
  if (canOperateFloorRole(role)) return null;
  const label = ROLE_META[role]?.label ?? role;
  return `Vai trò ${label} chỉ có quyền xem sơ đồ bàn. Chuyển sang Phục vụ, Quản lý hoặc Chủ nhà hàng để thao tác.`;
}

/** Tách tên ngắn và phụ đề trong ngoặc của khu vực (vd: "Sảnh Chính Tầng 1 (Tre Việt)"). */
export function splitZoneName(tenKhuVuc: string): { short: string; subtitle: string | null } {
  const match = tenKhuVuc.match(/^(.+?)\s*\((.+)\)\s*$/);
  if (!match) return { short: tenKhuVuc.trim(), subtitle: null };
  return { short: match[1].trim(), subtitle: match[2].trim() };
}

/** Số thứ tự 2 chữ số cho tab khu vực: 01, 02, 03... */
export function formatZoneTabIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/** Trả về mã bàn chính nếu là bàn phụ được ghép. */
export function resolveEffectiveTableId(snapshot: DatabaseSnapshot, maBan: string): string {
  const ban = snapshot.tbl_ban.find((b) => b.ma_ban === maBan);
  return ban?.ma_ban_chinh || maBan;
}

/** Danh sách các bàn phụ đang ghép vào bàn chính. */
export function getMergedChildTables(snapshot: DatabaseSnapshot, masterTableId: string): Ban[] {
  return snapshot.tbl_ban.filter((b) => b.ma_ban_chinh === masterTableId);
}

/** Lấy đơn đang hoạt động (chưa giải phóng) cho bàn (hỗ trợ cả bàn phụ ghép). */
export function getActiveOrderForTable(
  snapshot: DatabaseSnapshot,
  maBan: string,
): DonGoiMon | undefined {
  const effectiveId = resolveEffectiveTableId(snapshot, maBan);
  return snapshot.tbl_don_goi_mon.find(
    (o) => o.ma_ban === effectiveId && o.trang_thai_order !== 'DaGiaiPhong',
  );
}

/** Lấy hóa đơn mới nhất của đơn hàng. */
export function getInvoiceForOrder(
  snapshot: DatabaseSnapshot,
  maOrder: string,
): HoaDon | undefined {
  return snapshot.tbl_hoa_don.find((h) => h.ma_order === maOrder && h.trang_thai_tt !== 'DaHuy');
}

/** Lấy phiếu đặt bàn đang chờ khách đến (DaNhan) của bàn. */
export function getActiveReservationForTable(
  snapshot: DatabaseSnapshot,
  maBan: string,
): PhieuDatBan | undefined {
  return snapshot.tbl_phieu_dat_ban.find(
    (p) => p.ma_ban === maBan && p.trang_thai_dat === 'DaNhan',
  );
}

/** Chuẩn hóa chuỗi ngày giờ dạng "YYYY-MM-DD HH:mm:ss" sang milliseconds. */
export function parseSqlTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Ước tính thời gian quay bàn trung bình (phút) từ dữ liệu snapshot thực:
 * - Ưu tiên khoảng cách từ lúc mở bàn đến lúc lập hóa đơn đối với bàn đã chốt bill.
 * - Với bàn đang phục vụ, tính đến mốc hoạt động mới nhất của sảnh (hoặc tối thiểu 15p).
 * - Nếu chưa có phiên nào, trả về 45 phút (mốc chuẩn nhà hàng Á).
 */
export function computeAvgTurnMinutes(
  snapshot: DatabaseSnapshot,
  scopedTableIds?: Set<string>,
): number {
  const activeOrders = snapshot.tbl_don_goi_mon.filter((o) => {
    if (o.trang_thai_order === 'DaGiaiPhong') return false;
    if (scopedTableIds && !scopedTableIds.has(o.ma_ban)) return false;
    return true;
  });

  if (activeOrders.length === 0) {
    // Fallback toàn bộ đơn đang mở nếu khu đang chọn hiện chưa có khách
    if (scopedTableIds) {
      return computeAvgTurnMinutes(snapshot);
    }
    return 45;
  }

  // Tìm mốc tham chiếu mới nhất từ nhật ký bếp / chi tiết gọi món / hóa đơn để ổn định với dữ liệu demo
  const timestamps: number[] = [];
  for (const o of snapshot.tbl_don_goi_mon) {
    const t = parseSqlTimestamp(o.thoi_gian_mo_ban);
    if (t !== null) timestamps.push(t);
  }
  for (const i of snapshot.tbl_chi_tiet_don_goi) {
    const t = parseSqlTimestamp(i.thoi_gian_goi);
    if (t !== null) timestamps.push(t);
  }
  for (const log of snapshot.tbl_nhat_ky_bep) {
    const t = parseSqlTimestamp(log.thoi_gian_hoan_thanh || log.thoi_gian_bat_dau);
    if (t !== null) timestamps.push(t);
  }
  for (const hd of snapshot.tbl_hoa_don) {
    const t = parseSqlTimestamp(hd.ngay_lap_hoa_don);
    if (t !== null) timestamps.push(t);
  }

  const latestActivityMs =
    timestamps.length > 0 ? Math.max(...timestamps) + 8 * 60_000 : Date.now();

  const durations: number[] = [];
  for (const order of activeOrders) {
    const startMs = parseSqlTimestamp(order.thoi_gian_mo_ban);
    if (startMs === null) continue;
    const invoice = getInvoiceForOrder(snapshot, order.ma_order);
    const endMs = invoice ? parseSqlTimestamp(invoice.ngay_lap_hoa_don) : latestActivityMs;
    if (endMs === null) continue;
    const mins = Math.round((endMs - startMs) / 60_000);
    if (mins > 0 && mins <= 360) {
      durations.push(mins);
    }
  }

  if (durations.length === 0) return 45;
  const total = durations.reduce((sum, m) => sum + m, 0);
  return Math.max(10, Math.round(total / durations.length));
}

/** Tổng hợp 4 chỉ số KPI cho khu vực đang chọn (hoặc toàn bộ sảnh nếu 'ALL'). */
export function computeZoneStats(
  snapshot: DatabaseSnapshot,
  zoneId: ZoneFilterKey,
): ZoneStats {
  const tables =
    zoneId === 'ALL'
      ? snapshot.tbl_ban
      : snapshot.tbl_ban.filter((b) => b.ma_khu_vuc === zoneId);

  const statusCounts: Record<TableStatus, number> = {
    Trong: 0,
    DaDat: 0,
    DangPhucVu: 0,
    ChoThanhToan: 0,
  };

  let occupiedTablesCount = 0;
  let seatedGuests = 0;

  // Đếm khách theo từng đơn chủ để không đếm trùng khi nhiều bàn ghép chung 1 phiếu đặt
  const countedReservationIds = new Set<string>();

  for (const ban of tables) {
    statusCounts[ban.trang_thai_ban] += 1;
    if (ban.trang_thai_ban === 'DangPhucVu' || ban.trang_thai_ban === 'ChoThanhToan') {
      occupiedTablesCount += 1;
      const order = getActiveOrderForTable(snapshot, ban.ma_ban);
      const reservation = order?.ma_phieu_dat
        ? snapshot.tbl_phieu_dat_ban.find((p) => p.ma_phieu_dat === order.ma_phieu_dat)
        : undefined;

      if (reservation && !ban.ma_ban_chinh) {
        if (!countedReservationIds.has(reservation.ma_phieu_dat)) {
          countedReservationIds.add(reservation.ma_phieu_dat);
          seatedGuests += reservation.so_nguoi;
        }
      } else if (reservation && ban.ma_ban_chinh) {
        // Bàn phụ đã tính vào số người của phiếu đặt bàn chính nếu bàn chính nằm cùng khu
        const masterInScope = tables.some((t) => t.ma_ban === ban.ma_ban_chinh);
        if (!masterInScope && !countedReservationIds.has(reservation.ma_phieu_dat)) {
          countedReservationIds.add(reservation.ma_phieu_dat);
          seatedGuests += reservation.so_nguoi;
        }
      } else {
        seatedGuests += ban.so_ghe;
      }
    }
  }

  const scopedIds = new Set(tables.map((t) => t.ma_ban));
  const avgTurnMinutes = computeAvgTurnMinutes(snapshot, scopedIds);

  return {
    totalTables: tables.length,
    availableCount: statusCounts.Trong,
    occupiedTablesCount,
    seatedGuests,
    avgTurnMinutes,
    statusCounts,
  };
}

/** Chuẩn hóa tiếng Việt không dấu để tìm kiếm nhanh món ăn / khách hàng. */
export function foldVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Lọc danh sách món ăn theo trường phái ẩm thực, Combo và từ khóa tìm kiếm. */
export function filterDishesByCategory(
  dishes: MonAn[],
  categories: DanhMucMon[],
  filter: DishFilterKey,
  query = '',
): MonAn[] {
  const categoryMap = new Map(categories.map((c) => [c.ma_danh_muc, c]));
  const needle = foldVietnamese(query.trim());

  return dishes.filter((dish) => {
    if (filter === 'COMBO') {
      if (!dish.is_combo) return false;
    } else if (filter !== 'ALL') {
      if (dish.is_combo) return false;
      const cat = categoryMap.get(dish.ma_danh_muc);
      if (cat?.truong_phai_am_thuc !== filter) return false;
    }

    if (!needle) return true;
    const haystack = foldVietnamese(`${dish.ten_mon_an} ${dish.mo_ta ?? ''} ${dish.ma_mon_an}`);
    return haystack.includes(needle);
  });
}

/** Lọc hồ sơ khách hàng theo nhóm và từ khóa (tên hoặc số điện thoại). */
export function filterCustomersByGroup(
  customers: KhachHang[],
  group: KhachHang['loai_khach'],
  query = '',
): KhachHang[] {
  const needle = foldVietnamese(query.trim());
  return customers.filter((c) => {
    if (c.loai_khach !== group) return false;
    if (!needle) return true;
    const haystack = foldVietnamese(
      `${c.ho_ten} ${c.so_dien_thoai ?? ''} ${c.ma_khach_hang} ${c.hang_the}`,
    );
    return haystack.includes(needle);
  });
}

/** Phân bổ vị trí ghế quanh bàn cho minh họa SVG (tối ưu từ 2 đến 16 ghế). */
export function getChairDistribution(seats: number): ChairDistribution {
  const clamped = Math.max(2, Math.min(16, Math.round(seats)));
  if (clamped <= 2) return { top: 1, bottom: 1, left: 0, right: 0 };
  if (clamped <= 4) return { top: 2, bottom: 2, left: 0, right: 0 };
  if (clamped <= 6) return { top: 2, bottom: 2, left: 1, right: 1 };
  if (clamped <= 8) return { top: 3, bottom: 3, left: 1, right: 1 };
  if (clamped <= 10) return { top: 4, bottom: 4, left: 1, right: 1 };
  if (clamped <= 12) return { top: 5, bottom: 5, left: 1, right: 1 };
  return { top: 6, bottom: 6, left: 2, right: 2 };
}

/** Ghép ngày YYYY-MM-DD và giờ HH:mm thành định dạng SQL "YYYY-MM-DD HH:mm:00". */
export function formatLocalDateTimeSql(date: string, time: string): string {
  const cleanDate = date.trim() || '2026-11-24';
  const cleanTime = /^\d{2}:\d{2}$/.test(time.trim()) ? `${time.trim()}:00` : '19:00:00';
  return `${cleanDate} ${cleanTime}`;
}

export interface FloorTableVM {
  ban: Ban;
  zone: KhuVuc | undefined;
  effectiveTableId: string;
  masterTable: Ban | undefined;
  mergedChildren: Ban[];
  activeOrder: DonGoiMon | undefined;
  invoice: HoaDon | undefined;
  bill: ReturnType<typeof calculateCompletedOrderBill> | null;
  reservation: PhieuDatBan | undefined;
  customer: KhachHang | undefined;
  groupInfo: KhachDoan | undefined;
  pendingRequestCount: number;
  isPaidAwaitingRelease: boolean;
}
