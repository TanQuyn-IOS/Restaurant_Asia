import { DEMO_TODAY } from '@/lib/clock';
import type { Tone } from '@/lib/labels';
import { classifyLeaveThreeState } from '@/store/useRestaurantStore';
import type {
  CaLamViec,
  DatabaseSnapshot,
  DonNghiPhep,
  NhanVien,
  PhanCongCa,
} from '@/types/database';

export const STAFF_POSITION_META: Record<
  NhanVien['chuc_vu'],
  { label: string; tone: Tone }
> = {
  ChuNhaHang: { label: 'Chủ nhà hàng', tone: 'gold' },
  QuanLy: { label: 'Quản lý sảnh', tone: 'primary' },
  PhucVu: { label: 'Phục vụ', tone: 'neutral' },
  Bep: { label: 'Bếp', tone: 'warning' },
  ThuNgan: { label: 'Thu ngân', tone: 'info' },
  HR: { label: 'Nhân sự HR', tone: 'success' },
};

export const SHIFT_STATUS_META: Record<
  PhanCongCa['trang_thai_ca'],
  { label: string; tone: Tone }
> = {
  ChuaTruc: { label: 'Chưa vào ca', tone: 'neutral' },
  DangTruc: { label: 'Đang trực', tone: 'success' },
  HoanThanh: { label: 'Đã tan ca', tone: 'neutral' },
  VangCoPhep: { label: 'Vắng có phép', tone: 'warning' },
  VangKhongPhep: { label: 'Vắng không phép', tone: 'danger' },
};

export const LEAVE_APPROVAL_META: Record<
  DonNghiPhep['trang_thai_duyet'],
  { label: string; tone: Tone }
> = {
  ChoDuyet: { label: 'Chờ duyệt', tone: 'warning' },
  DaDuyet: { label: 'Đã duyệt', tone: 'success' },
  TuChoi: { label: 'Từ chối', tone: 'danger' },
};

/** Loại bỏ phần chức vụ trong ngoặc ở cuối họ tên dữ liệu mẫu để hiển thị gọn và lấy chữ cái đầu chuẩn. */
export function cleanStaffName(hoTen: string): string {
  return hoTen.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Rút gọn tên ca: "Ca Sáng (06:00 – 14:00)" → "Ca Sáng". */
export function shortShiftName(tenCa: string): string {
  return tenCa.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Rút gọn tên khu vực: "Sảnh Chính Tầng 1 (Tre Việt)" → "Sảnh Chính Tầng 1". */
export function shortZoneName(tenKhuVuc: string | null | undefined): string {
  if (!tenKhuVuc) return 'Toàn sảnh';
  return tenKhuVuc.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/** Tính số giờ của một ca làm việc từ HH:mm(:ss). */
export function parseShiftHours(gioBatDau: string, gioKetThuc: string): number {
  const toMinutes = (time: string) => {
    const [h = 0, m = 0] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const start = toMinutes(gioBatDau);
  let end = toMinutes(gioKetThuc);
  if (end <= start) end += 24 * 60;
  return Number(((end - start) / 60).toFixed(1));
}

/** Định dạng số giờ chuẩn tiếng Việt: 8 → "8,0g", 5.5 → "5,5g". */
export function formatHoursVi(hours: number): string {
  return `${hours.toFixed(1).replace('.', ',')}g`;
}

/** "06:00:00", "14:00:00" → "06:00–14:00 · 8,0g" */
export function formatExactShiftWindow(ca: Pick<CaLamViec, 'gio_bat_dau' | 'gio_ket_thuc'>): string {
  const hours = parseShiftHours(ca.gio_bat_dau, ca.gio_ket_thuc);
  return `${ca.gio_bat_dau.slice(0, 5)}–${ca.gio_ket_thuc.slice(0, 5)} · ${formatHoursVi(hours)}`;
}

export interface WeekDaySlot {
  iso: string;
  weekdayLabel: string;
  dayNumber: string;
  isToday: boolean;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/** Parse YYYY-MM-DD ở UTC để tránh lệch múi giờ khi cộng trừ ngày. */
function parseIsoDateUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function toIsoDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Tạo 7 ngày T2..CN của tuần chứa `anchorDate`, cộng thêm `weekOffset` tuần. */
export function getWeekDaysAnchored(
  anchorDate: string = DEMO_TODAY,
  weekOffset = 0,
): WeekDaySlot[] {
  const base = parseIsoDateUtc(anchorDate);
  const utcDay = base.getUTCDay(); // 0=CN, 1=T2..6=T7
  const diffToMonday = utcDay === 0 ? -6 : 1 - utcDay;
  const monday = new Date(base.getTime());
  monday.setUTCDate(base.getUTCDate() + diffToMonday + weekOffset * 7);

  return WEEKDAY_LABELS.map((weekdayLabel, idx) => {
    const d = new Date(monday.getTime());
    d.setUTCDate(monday.getUTCDate() + idx);
    const iso = toIsoDateUtc(d);
    return {
      iso,
      weekdayLabel,
      dayNumber: String(d.getUTCDate()).padStart(2, '0'),
      isToday: iso === anchorDate,
    };
  });
}

/** Kiểm tra trùng ca (cùng nhân viên + ngày + ca). */
export function hasDuplicateShift(
  assignments: PhanCongCa[],
  maNhanVien: string,
  ngayLamViec: string,
  maCa: string,
): boolean {
  return assignments.some(
    (pc) =>
      pc.ma_nhan_vien === maNhanVien &&
      pc.ngay_lam_viec === ngayLamViec &&
      pc.ma_ca === maCa,
  );
}

/** Kiểm tra xung đột đơn nghỉ phép đã duyệt cho cùng nhân viên + ngày + ca. */
export function hasApprovedLeaveConflict(
  leaves: DonNghiPhep[],
  maNhanVien: string,
  ngayLamViec: string,
  maCa: string,
): boolean {
  return leaves.some(
    (np) =>
      np.ma_nhan_vien === maNhanVien &&
      np.ngay_nghi === ngayLamViec &&
      np.ma_ca_nghi === maCa &&
      np.trang_thai_duyet === 'DaDuyet',
  );
}

export interface PayrollRow {
  maNhanVien: string;
  maBangLuong: string | null;
  hoTen: string;
  chucVu: NhanVien['chuc_vu'];
  exactHours: number;
  totalShifts: number;
  shiftsMorning: number;
  shiftsAfternoon: number;
  shiftsEvening: number;
  leaveDays: number;
  grossPay: number;
  leaveDeduction: number;
  allowance: number;
  netPay: number;
  paidAt: string | null;
  source: 'payroll_record' | 'shift_derived';
}

export interface PayrollSummary {
  periodMonth: string;
  rows: PayrollRow[];
  staffCount: number;
  totalHours: number;
  totalShifts: number;
  totalLeaveDays: number;
  totalGrossPay: number;
  totalDeduction: number;
  totalNetPay: number;
  paidCount: number;
  allPaid: boolean;
}

/**
 * Hàm thuần tính bảng lương ca theo tháng từ 5 bảng Nhân sự (không chạm bất kỳ bảng doanh thu/sổ quỹ nào — FR-19).
 * Đồng bộ trực tiếp với đơn nghỉ phép đã duyệt trong tháng.
 */
export function calculatePayrollSummary(
  snapshot: Pick<
    DatabaseSnapshot,
    'tbl_nhan_vien' | 'tbl_ca_lam_viec' | 'tbl_phan_cong_ca' | 'tbl_don_nghi_phep' | 'tbl_bang_luong'
  >,
  periodMonth = '2026-11',
  referenceDate: string = DEMO_TODAY,
): PayrollSummary {
  const shiftMap = new Map(snapshot.tbl_ca_lam_viec.map((c) => [c.ma_ca, c]));
  const hoursOf = (maCa: string) => {
    const ca = shiftMap.get(maCa);
    return ca ? parseShiftHours(ca.gio_bat_dau, ca.gio_ket_thuc) : 8;
  };
  const rateOf = (maCa: string) => shiftMap.get(maCa)?.he_so_luong_ca ?? 1;

  const sangHours = hoursOf('CA-SANG');
  const chieuHours = hoursOf('CA-CHIEU');
  const toiHours = hoursOf('CA-TOI');

  const payrollByStaff = new Map(
    snapshot.tbl_bang_luong
      .filter((b) => b.thang_nam === periodMonth)
      .map((b) => [b.ma_nhan_vien, b]),
  );

  const rows: PayrollRow[] = snapshot.tbl_nhan_vien
    .filter((nv) => nv.trang_thai_lam_viec !== 'DaNghiViec')
    .map((nv): PayrollRow => {
      const bl = payrollByStaff.get(nv.ma_nhan_vien);
      const approvedLeaves = snapshot.tbl_don_nghi_phep.filter(
        (d) =>
          d.ma_nhan_vien === nv.ma_nhan_vien &&
          d.ngay_nghi.startsWith(periodMonth) &&
          d.trang_thai_duyet === 'DaDuyet',
      );

      if (bl) {
        const exactHours = Number(
          (
            bl.so_ca_sang * sangHours +
            bl.so_ca_chieu * chieuHours +
            bl.so_ca_toi * toiHours
          ).toFixed(1),
        );
        // Đơn đã nghỉ (DaNghi) đã được tính vào bl.so_ngay_da_nghi; các đơn Đang/Sắp nghỉ mới duyệt cộng thêm đồng bộ tức thì.
        const newlySyncedLeaves = approvedLeaves.filter(
          (d) => classifyLeaveThreeState(d.ngay_nghi, referenceDate) !== 'DaNghi',
        );
        const baseDeduction = bl.so_ngay_da_nghi * nv.luong_co_ban_ca;
        const extraDeduction = newlySyncedLeaves.reduce(
          (sum, d) => sum + Math.round(nv.luong_co_ban_ca * rateOf(d.ma_ca_nghi)),
          0,
        );
        const grossPay = bl.tong_luong_thuc_linh + baseDeduction;
        const leaveDeduction = baseDeduction + extraDeduction;
        const netPay = Math.max(0, grossPay - leaveDeduction);

        return {
          maNhanVien: nv.ma_nhan_vien,
          maBangLuong: bl.ma_bang_luong,
          hoTen: cleanStaffName(nv.ho_ten),
          chucVu: nv.chuc_vu,
          exactHours,
          totalShifts: bl.tong_so_ca,
          shiftsMorning: bl.so_ca_sang,
          shiftsAfternoon: bl.so_ca_chieu,
          shiftsEvening: bl.so_ca_toi,
          leaveDays: bl.so_ngay_da_nghi + newlySyncedLeaves.length,
          grossPay,
          leaveDeduction,
          allowance: bl.tien_phu_cap,
          netPay,
          paidAt: bl.ngay_chi_tra,
          source: 'payroll_record',
        };
      }

      // Nhân viên chưa có phiếu lương tháng cố định → tính trực tiếp từ bảng phân ca & đơn nghỉ đã duyệt.
      const staffShifts = snapshot.tbl_phan_cong_ca.filter(
        (pc) =>
          pc.ma_nhan_vien === nv.ma_nhan_vien &&
          pc.ngay_lam_viec.startsWith(periodMonth) &&
          pc.trang_thai_ca !== 'VangCoPhep' &&
          pc.trang_thai_ca !== 'VangKhongPhep',
      );
      const shiftsMorning = staffShifts.filter((s) => s.ma_ca === 'CA-SANG').length;
      const shiftsAfternoon = staffShifts.filter((s) => s.ma_ca === 'CA-CHIEU').length;
      const shiftsEvening = staffShifts.filter((s) => s.ma_ca === 'CA-TOI').length;
      const exactHours = Number(
        staffShifts.reduce((sum, s) => sum + hoursOf(s.ma_ca), 0).toFixed(1),
      );
      const grossPay = staffShifts.reduce(
        (sum, s) => sum + Math.round(nv.luong_co_ban_ca * rateOf(s.ma_ca)),
        0,
      );
      const leaveDeduction = approvedLeaves.reduce(
        (sum, d) => sum + Math.round(nv.luong_co_ban_ca * rateOf(d.ma_ca_nghi)),
        0,
      );
      const netPay = Math.max(0, grossPay - leaveDeduction);

      return {
        maNhanVien: nv.ma_nhan_vien,
        maBangLuong: null,
        hoTen: cleanStaffName(nv.ho_ten),
        chucVu: nv.chuc_vu,
        exactHours,
        totalShifts: staffShifts.length,
        shiftsMorning,
        shiftsAfternoon,
        shiftsEvening,
        leaveDays: approvedLeaves.length,
        grossPay,
        leaveDeduction,
        allowance: 0,
        netPay,
        paidAt: null,
        source: 'shift_derived',
      };
    })
    .sort((a, b) => {
      if (a.source !== b.source) return a.source === 'payroll_record' ? -1 : 1;
      return b.netPay - a.netPay;
    });

  const totalHours = Number(rows.reduce((s, r) => s + r.exactHours, 0).toFixed(1));
  const totalShifts = rows.reduce((s, r) => s + r.totalShifts, 0);
  const totalLeaveDays = rows.reduce((s, r) => s + r.leaveDays, 0);
  const totalGrossPay = rows.reduce((s, r) => s + r.grossPay, 0);
  const totalDeduction = rows.reduce((s, r) => s + r.leaveDeduction, 0);
  const totalNetPay = rows.reduce((s, r) => s + r.netPay, 0);
  const paidCount = rows.filter((r) => Boolean(r.paidAt)).length;

  return {
    periodMonth,
    rows,
    staffCount: rows.length,
    totalHours,
    totalShifts,
    totalLeaveDays,
    totalGrossPay,
    totalDeduction,
    totalNetPay,
    paidCount,
    allPaid: rows.length > 0 && paidCount === rows.length,
  };
}

export { buildUtf8Csv, escapeCsvCell, triggerCsvDownload } from './csv';
