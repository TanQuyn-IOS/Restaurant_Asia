// ============================================================================
// Nhãn tiếng Việt + tông màu cho các enum trong CSDL (single source of truth cho UI).
// ============================================================================
import type {
  CuisineSchool,
  CustomerGroupType,
  DishAvailability,
  GuestRequestType,
  LeaveThreeState,
  OrderItemStatus,
  RoleCode,
  TableStatus,
  CashflowType,
  PaymentMethodType,
} from '@/types/database';

export type Tone =
  | 'neutral'
  | 'primary'
  | 'gold'
  | 'success'
  | 'warning'
  | 'danger'
  | 'billing'
  | 'info';

/** FR-02 — 4 trạng thái bàn */
export const TABLE_STATUS_META: Record<TableStatus, { label: string; short: string; tone: Tone }> = {
  Trong: { label: 'Bàn trống', short: 'Trống', tone: 'success' },
  DaDat: { label: 'Đã đặt trước', short: 'Đã đặt', tone: 'warning' },
  DangPhucVu: { label: 'Đang phục vụ', short: 'Đang phục vụ', tone: 'danger' },
  ChoThanhToan: { label: 'Chờ thanh toán', short: 'Chờ thanh toán', tone: 'billing' },
};

export const ITEM_STATUS_META: Record<OrderItemStatus, { label: string; tone: Tone }> = {
  ChoCheBien: { label: 'Chờ chế biến', tone: 'warning' },
  DangCheBien: { label: 'Đang nấu', tone: 'danger' },
  HoanThanh: { label: 'Hoàn thành', tone: 'success' },
  DaPhucVu: { label: 'Đã phục vụ', tone: 'neutral' },
  DaHuy: { label: 'Đã hủy', tone: 'neutral' },
};

export const CUSTOMER_GROUP_META: Record<
  CustomerGroupType,
  { label: string; hint: string; tone: Tone }
> = {
  VangLai: { label: 'Vãng lai', hint: 'Khách đi lẻ, không tích điểm', tone: 'neutral' },
  Thuong: { label: 'Khách thường', hint: 'Thành viên tích điểm', tone: 'info' },
  VIP: { label: 'VIP', hint: 'Ưu tiên bếp + giảm giá hạng thẻ', tone: 'gold' },
  Doan: { label: 'Đoàn / Sự kiện', hint: 'Combo, tiền cọc, xuất VAT công ty', tone: 'primary' },
};

export const CUISINE_META: Record<CuisineSchool, { label: string; native: string }> = {
  VietNam: { label: 'Việt Nam', native: 'Vietnamese' },
  TrungHoa: { label: 'Trung Hoa', native: 'Chinese' },
  NhatBan: { label: 'Nhật Bản', native: 'Japanese' },
  HanQuoc: { label: 'Hàn Quốc', native: 'Korean' },
  ThaiLan: { label: 'Thái Lan', native: 'Thai' },
};

export const DISH_AVAILABILITY_META: Record<DishAvailability, { label: string; tone: Tone }> = {
  ConMon: { label: 'Còn món', tone: 'success' },
  HetMon: { label: 'Hết món', tone: 'danger' },
  TamNgung: { label: 'Tạm ngưng', tone: 'neutral' },
};

/** Độ cay 0–3 (FR-08) */
export const SPICE_LEVELS: { level: 0 | 1 | 2 | 3; label: string; short: string }[] = [
  { level: 0, label: 'Không cay', short: '0 · Không cay' },
  { level: 1, label: 'Cay nhẹ', short: '1 · Nhẹ' },
  { level: 2, label: 'Cay vừa', short: '2 · Vừa' },
  { level: 3, label: 'Rất cay', short: '3 · Cay' },
];

export const LEAVE_STATE_META: Record<
  LeaveThreeState,
  { label: string; en: string; tone: Tone }
> = {
  DaNghi: { label: 'Đã nghỉ', en: 'Past leave', tone: 'neutral' },
  DangNghi: { label: 'Đang nghỉ', en: 'Active today', tone: 'warning' },
  SapNghi: { label: 'Sắp nghỉ', en: 'Upcoming leave', tone: 'info' },
};

export const CASHFLOW_META: Record<
  CashflowType,
  { label: string; direction: 'in' | 'out'; tone: Tone }
> = {
  ThuTienCoc: { label: 'Thu tiền cọc', direction: 'in', tone: 'success' },
  ThuHoaDon: { label: 'Thu hóa đơn', direction: 'in', tone: 'success' },
  ChiNhapHang: { label: 'Chi nhập hàng', direction: 'out', tone: 'billing' },
  ChiLuong: { label: 'Chi lương', direction: 'out', tone: 'danger' },
  ChiVanHanhKhac: { label: 'Chi vận hành', direction: 'out', tone: 'danger' },
};

export const PAYMENT_METHOD_META: Record<PaymentMethodType, { label: string }> = {
  TienMat: { label: 'Tiền mặt' },
  TheNganHang: { label: 'Thẻ POS' },
  ChuyenKhoanQR: { label: 'VietQR' },
};

export const GUEST_REQUEST_META: Record<GuestRequestType, { label: string; hint: string }> = {
  GoiNuocLoc: { label: 'Xin nước', hint: 'Nước lọc hoặc nước có ga' },
  GoiKhanLanh: { label: 'Khăn lạnh', hint: 'Một chút mát lành' },
  YeuCauKiemBill: { label: 'Kiểm tra hóa đơn', hint: 'Xem lại các món đã gọi' },
  GapPhucVu: { label: 'Gọi nhân viên', hint: 'Chúng tôi sẽ đến ngay' },
};

export const ROLE_META: Record<
  RoleCode,
  { label: string; short: string; desc: string; home: string }
> = {
  Owner: {
    label: 'Chủ nhà hàng',
    short: 'Chủ',
    desc: 'Toàn quyền · độc quyền sổ quỹ & kho',
    home: '/tong-quan',
  },
  Manager: {
    label: 'Quản lý sảnh',
    short: 'Quản lý',
    desc: 'Điều hành sảnh · ẩn 100% doanh thu',
    home: '/so-do-ban',
  },
  Waitstaff: {
    label: 'Phục vụ',
    short: 'Phục vụ',
    desc: 'Mở bàn · gọi món · chốt bill · DELETE bàn',
    home: '/so-do-ban',
  },
  Kitchen: {
    label: 'Bếp',
    short: 'Bếp',
    desc: 'KDS · nấu xong tự nạp bill + chuông Ting',
    home: '/bep',
  },
  Cashier: {
    label: 'Thu ngân',
    short: 'Thu ngân',
    desc: 'POS chỉ đọc · khóa thêm/sửa/xóa món',
    home: '/thu-ngan',
  },
  HR: {
    label: 'Nhân sự',
    short: 'Nhân sự',
    desc: 'Phân ca · nghỉ phép · bảng lương ca',
    home: '/nhan-su/ca-lam',
  },
  GuestQR: {
    label: 'Khách quét QR',
    short: 'Khách',
    desc: 'Khóa số bàn · ẩn đăng nhập nhân viên',
    home: '/qr',
  },
};

/** 6 vai trò nhân viên (không gồm khách) — dùng cho Role switcher */
export const STAFF_ROLES: RoleCode[] = ['Owner', 'Manager', 'Waitstaff', 'Kitchen', 'Cashier', 'HR'];
