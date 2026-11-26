import {
  Boxes,
  CalendarClock,
  CalendarOff,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  ShieldCheck,
  UserRoundCheck,
  UtensilsCrossed,
  Users,
  Wallet,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import type { DatabaseSnapshot, RoleCode } from '@/types/database';
import { DEMO_TODAY } from '@/lib/clock';

const STAFF: RoleCode[] = ['Owner', 'Manager', 'Waitstaff', 'Kitchen', 'Cashier', 'HR'];

export interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  /** Vai trò được xem trang này (hành động chi tiết còn được kiểm tra trong từng màn hình) */
  roles: RoleCode[];
  /** Chữ đứng trước nhãn trên thanh tab (mockup: 01 · 02 · 03) */
  tabIndex?: string;
  badge?: (s: DatabaseSnapshot) => { value: number; alert?: boolean } | undefined;
  /** Mô tả ngắn cho command search */
  keywords?: string;
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
  /** Nhóm chỉ dành cho Chủ — vai trò khác thấy thẻ khóa thay vì danh sách */
  ownerOnly?: boolean;
}

const countIf = (n: number, alert = false) => (n > 0 ? { value: n, alert } : undefined);

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'workspace',
    items: [
      {
        id: 'overview',
        label: 'Tổng quan',
        to: '/tong-quan',
        icon: LayoutDashboard,
        roles: STAFF,
        keywords: 'dashboard trang chủ tổng quan',
      },
    ],
  },
  {
    id: 'ops',
    label: 'Vận hành',
    items: [
      {
        id: 'floor',
        label: 'Sơ đồ bàn',
        to: '/so-do-ban',
        icon: LayoutGrid,
        roles: STAFF,
        tabIndex: '01',
        keywords: 'bàn gọi món mở bàn ghép bàn floor',
        badge: (s) => countIf(s.tbl_ban.filter((b) => b.trang_thai_ban !== 'Trong').length),
      },
      {
        id: 'kds',
        label: 'Bếp KDS',
        to: '/bep',
        icon: ChefHat,
        roles: STAFF,
        tabIndex: '02',
        keywords: 'bếp kds nấu món kitchen màn hình bếp',
        badge: (s) =>
          countIf(
            s.tbl_chi_tiet_don_goi.filter(
              (i) => i.trang_thai_mon === 'ChoCheBien' || i.trang_thai_mon === 'DangCheBien',
            ).length,
          ),
      },
      {
        id: 'cashier',
        label: 'Thu ngân',
        to: '/thu-ngan',
        icon: CreditCard,
        roles: STAFF,
        tabIndex: '03',
        keywords: 'thu ngân thanh toán hóa đơn vat vietqr cashier pos',
        badge: (s) =>
          countIf(s.tbl_ban.filter((b) => b.trang_thai_ban === 'ChoThanhToan').length, true),
      },
    ],
  },
  {
    id: 'people',
    label: 'Nhân sự',
    items: [
      {
        id: 'shifts',
        label: 'Lịch ca làm',
        to: '/nhan-su/ca-lam',
        icon: CalendarClock,
        roles: ['Owner', 'Manager', 'HR'],
        keywords: 'ca kíp phân ca lịch làm việc shift',
      },
      {
        id: 'leave',
        label: 'Nghỉ phép',
        to: '/nhan-su/nghi-phep',
        icon: CalendarOff,
        roles: ['Owner', 'Manager', 'HR'],
        keywords: 'nghỉ phép đã nghỉ đang nghỉ sắp nghỉ leave',
        badge: (s) => countIf(s.tbl_don_nghi_phep.filter((d) => d.ngay_nghi === DEMO_TODAY).length),
      },
      {
        id: 'payroll',
        label: 'Bảng lương',
        to: '/nhan-su/bang-luong',
        icon: Banknote,
        roles: ['Owner', 'Manager', 'HR'],
        keywords: 'lương payroll bảng lương ca',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Tài chính',
    ownerOnly: true,
    items: [
      {
        id: 'cashflow',
        label: 'Sổ quỹ',
        to: '/tai-chinh/so-quy',
        icon: Wallet,
        roles: ['Owner'],
        keywords: 'sổ quỹ dòng tiền thu chi lãi lỗ cashflow',
      },
      {
        id: 'revenue',
        label: 'Doanh thu',
        to: '/tai-chinh/doanh-thu',
        icon: LineChart,
        roles: ['Owner'],
        keywords: 'doanh thu biểu đồ top món revenue phân tích',
      },
      {
        id: 'inventory',
        label: 'Kho hàng',
        to: '/tai-chinh/kho',
        icon: Boxes,
        roles: ['Owner'],
        keywords: 'kho nguyên liệu nhập hàng nhà cung cấp công nợ inventory',
        badge: (s) =>
          countIf(
            s.tbl_nguyen_lieu.filter((n) => n.so_luong_ton_kho < n.nguong_ton_toi_thieu).length,
            true,
          ),
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Quản trị',
    items: [
      {
        id: 'menu',
        label: 'Thực đơn',
        to: '/thuc-don',
        icon: UtensilsCrossed,
        roles: STAFF,
        keywords: 'thực đơn món ăn bom combo hết món menu định mức',
      },
      {
        id: 'customers',
        label: 'Khách hàng',
        to: '/khach-hang',
        icon: Users,
        roles: ['Owner', 'Manager', 'Waitstaff', 'Cashier'],
        keywords: 'khách hàng nhóm khách vip đoàn mã số thuế vat customers',
      },
      {
        id: 'rbac',
        label: 'Phân quyền',
        to: '/phan-quyen',
        icon: ShieldCheck,
        roles: ['Owner', 'Manager'],
        keywords: 'rbac tài khoản phân quyền 27 bảng csdl database',
      },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const OPS_TABS: NavItem[] = NAV_GROUPS.find((g) => g.id === 'ops')!.items;

export function findNavItem(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.find((i) => pathname === i.to || pathname.startsWith(`${i.to}/`));
}

export function canAccess(role: RoleCode, item: NavItem): boolean {
  return item.roles.includes(role);
}

/** Icon dành cho thẻ "ca đang diễn ra" / người dùng */
export const SHIFT_ICON = UserRoundCheck;
