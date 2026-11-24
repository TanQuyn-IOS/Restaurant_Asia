import type { Tone } from '@/lib/labels';
import { verifyRbacPermission } from '@/store/useRestaurantStore';
import type { DatabaseSnapshot, RoleCode } from '@/types/database';
import { TABLE_3NF_BY_KEY, TABLE_3NF_LIST, type Table3nfMeta } from './schemaMeta';

export { TABLE_3NF_BY_KEY, TABLE_3NF_LIST, type Table3nfMeta };

export type StaffRoleCode = Exclude<RoleCode, 'GuestQR'>;

export const MASKED_SECRET = '••••••••';
export const RESET_CONFIRM_KEYWORD = 'XOA';
export const SCHEMA_PAGE_SIZE = 10;

export type PermissionAccess =
  | 'full'
  | 'operate'
  | 'readonly'
  | 'view'
  | 'blocked403'
  | 'none';

export interface PermissionCell {
  access: PermissionAccess;
  label: string;
  tone: Tone;
  ruleTag?: 'FR-17' | 'FR-19' | 'FR-25';
  detail?: string;
}

export interface RbacMatrixRow {
  id: string;
  moduleCode: string;
  capability: string;
  highlightRule?: 'FR-17' | 'FR-19' | 'FR-25';
  cells: Record<StaffRoleCode, PermissionCell>;
}

const CELL = {
  full: (detail?: string): PermissionCell => ({
    access: 'full',
    label: 'Toàn quyền',
    tone: 'success',
    detail,
  }),
  operate: (label = 'Thao tác', detail?: string): PermissionCell => ({
    access: 'operate',
    label,
    tone: 'info',
    detail,
  }),
  readonly: (ruleTag?: 'FR-17', detail?: string): PermissionCell => ({
    access: 'readonly',
    label: ruleTag ? `Chỉ đọc (${ruleTag})` : 'Chỉ đọc',
    tone: 'warning',
    ruleTag,
    detail,
  }),
  view: (detail?: string): PermissionCell => ({
    access: 'view',
    label: 'Xem',
    tone: 'neutral',
    detail,
  }),
  blocked403: (ruleTag: 'FR-17' | 'FR-19', detail?: string): PermissionCell => ({
    access: 'blocked403',
    label: `Chặn 403 (${ruleTag})`,
    tone: 'danger',
    ruleTag,
    detail,
  }),
  none: (): PermissionCell => ({
    access: 'none',
    label: 'Không',
    tone: 'neutral',
  }),
};

/**
 * Xây dựng ma trận phân quyền 6 vai trò nhân viên × phân hệ,
 * đối chiếu trực tiếp hàm nghiệp vụ verifyRbacPermission() cho FR-17 và FR-19.
 */
export function buildRbacMatrix(): RbacMatrixRow[] {
  const cashflowCell = (role: StaffRoleCode): PermissionCell => {
    const check = verifyRbacPermission(role, 'VIEW_CASHFLOW');
    return check.allowed
      ? CELL.full('Độc quyền sổ quỹ, doanh thu & lãi/lỗ')
      : CELL.blocked403('FR-19', check.message);
  };

  const inventoryCell = (role: StaffRoleCode): PermissionCell => {
    const check = verifyRbacPermission(role, 'IMPORT_INVENTORY');
    return check.allowed
      ? CELL.full('Lập phiếu nhập kho, quản lý NCC & giá vốn')
      : CELL.blocked403('FR-19', check.message);
  };

  const cashierModifyCheck = verifyRbacPermission('Cashier', 'MODIFY_INVOICE_ITEMS');

  return [
    {
      id: 'mod-01',
      moduleCode: 'MOD-01 / 04',
      capability: 'Sơ đồ bàn, mở/ghép bàn, gọi món & nút DELETE bàn',
      cells: {
        Owner: CELL.full(),
        Manager: CELL.full(),
        Waitstaff: CELL.operate('Phục vụ'),
        Kitchen: CELL.view('Xem bàn'),
        Cashier: CELL.view('Xem bàn'),
        HR: CELL.view('Xem bàn'),
      },
    },
    {
      id: 'mod-02',
      moduleCode: 'MOD-02',
      capability: '4 nhóm khách hàng, hạng thẻ & hồ sơ VAT đoàn',
      cells: {
        Owner: CELL.full(),
        Manager: CELL.operate('Quản trị'),
        Waitstaff: CELL.view('Tra cứu'),
        Kitchen: CELL.none(),
        Cashier: CELL.view('Tra cứu VAT'),
        HR: CELL.none(),
      },
    },
    {
      id: 'mod-03',
      moduleCode: 'MOD-03',
      capability: 'Thực đơn 5 trường phái, định mức BOM & Còn/Hết món',
      cells: {
        Owner: CELL.full('Thêm món + bật/tắt'),
        Manager: CELL.full('Thêm món + bật/tắt'),
        Waitstaff: CELL.view(),
        Kitchen: CELL.operate('Bật/tắt món'),
        Cashier: CELL.view(),
        HR: CELL.view(),
      },
    },
    {
      id: 'mod-05',
      moduleCode: 'MOD-05',
      capability: 'Màn hình bếp KDS realtime (VIP ưu tiên, Hoàn thành → Bill)',
      cells: {
        Owner: CELL.full(),
        Manager: CELL.view('Giám sát'),
        Waitstaff: CELL.view('Nhận Ting'),
        Kitchen: CELL.full('Điều phối KDS'),
        Cashier: CELL.view(),
        HR: CELL.view(),
      },
    },
    {
      id: 'mod-06-pay',
      moduleCode: 'MOD-06',
      capability: 'Thu ngân POS: thu tiền, trừ cọc, giảm VIP & xuất VAT',
      highlightRule: 'FR-17',
      cells: {
        Owner: CELL.full(),
        Manager: CELL.view('Giám sát'),
        Waitstaff: CELL.view('Xem bill'),
        Kitchen: CELL.view(),
        Cashier: CELL.readonly('FR-17', 'Mở bill chỉ đọc để thu tiền & xuất VAT'),
        HR: CELL.view(),
      },
    },
    {
      id: 'mod-06-edit',
      moduleCode: 'MOD-06',
      capability: 'Thêm / sửa / xóa món trên hóa đơn đã chốt (chống thất thoát)',
      highlightRule: 'FR-17',
      cells: {
        Owner: CELL.operate('Kiểm soát'),
        Manager: CELL.operate('Kiểm soát'),
        Waitstaff: CELL.operate('Hủy trước nấu'),
        Kitchen: CELL.none(),
        Cashier: cashierModifyCheck.allowed
          ? CELL.operate()
          : CELL.blocked403('FR-17', cashierModifyCheck.message),
        HR: CELL.none(),
      },
    },
    {
      id: 'mod-07',
      moduleCode: 'MOD-07',
      capability: 'Nhân sự: phân ca (Ca/Giờ/Khu vực), nghỉ phép 3 trạng thái & bảng lương',
      cells: {
        Owner: CELL.full(),
        Manager: CELL.full('Điều hành ca'),
        Waitstaff: CELL.none(),
        Kitchen: CELL.none(),
        Cashier: CELL.none(),
        HR: CELL.full('Chuyên trách HR'),
      },
    },
    {
      id: 'mod-08-cashflow',
      moduleCode: 'MOD-08',
      capability: 'Sổ quỹ dòng tiền, doanh thu & báo cáo lãi/lỗ ròng',
      highlightRule: 'FR-19',
      cells: {
        Owner: cashflowCell('Owner'),
        Manager: cashflowCell('Manager'),
        Waitstaff: cashflowCell('Waitstaff'),
        Kitchen: cashflowCell('Kitchen'),
        Cashier: cashflowCell('Cashier'),
        HR: cashflowCell('HR'),
      },
    },
    {
      id: 'mod-08-inventory',
      moduleCode: 'MOD-08',
      capability: 'Kho nguyên liệu, giá vốn nhập hàng & công nợ nhà cung cấp',
      highlightRule: 'FR-19',
      cells: {
        Owner: inventoryCell('Owner'),
        Manager: inventoryCell('Manager'),
        Waitstaff: inventoryCell('Waitstaff'),
        Kitchen: inventoryCell('Kitchen'),
        Cashier: inventoryCell('Cashier'),
        HR: inventoryCell('HR'),
      },
    },
    {
      id: 'mod-10',
      moduleCode: 'MOD-10',
      capability: 'Quản trị RBAC, tài khoản nội bộ & khôi phục dữ liệu mẫu',
      cells: {
        Owner: CELL.full('Bao gồm khôi phục CSDL'),
        Manager: CELL.view('Xem ma trận & tài khoản'),
        Waitstaff: CELL.none(),
        Kitchen: CELL.none(),
        Cashier: CELL.none(),
        HR: CELL.none(),
      },
    },
  ];
}

/** Chỉ Chủ nhà hàng (Owner) mới được khôi phục dữ liệu mẫu toàn hệ thống. */
export function canResetSeedData(role: RoleCode): boolean {
  return role === 'Owner';
}

/** Xác thực chuỗi xác nhận "XOA" (chính xác chữ in hoa, bỏ khoảng trắng đầu cuối). */
export function isResetConfirmValid(input: string): boolean {
  return input.trim() === RESET_CONFIRM_KEYWORD;
}

/** Kiểm tra bảng có chứa dữ liệu tài chính/giá vốn độc quyền Owner (FR-19) hay không. */
export function isTableRestrictedForRole(
  tableKey: keyof DatabaseSnapshot,
  role: RoleCode,
): boolean {
  const meta = TABLE_3NF_BY_KEY.get(tableKey);
  if (!meta?.ownerFinancialOnly) return false;
  return !verifyRbacPermission(role, 'VIEW_CASHFLOW').allowed;
}

/**
 * Chuẩn hóa giá trị ô trong trình duyệt 27 bảng 3NF:
 * - TUYỆT ĐỐI ẩn cột `mat_khau_hash` ở mọi vai trò.
 * - Ẩn cột `don_gia_nhap_bq` (giá vốn nhập kho) nếu không phải Owner (FR-19).
 */
export function formatSchemaCell(
  tableKey: keyof DatabaseSnapshot,
  column: string,
  rawValue: unknown,
  role: RoleCode,
): { display: string; tooltip: string; masked: boolean; isNull: boolean } {
  if (column === 'mat_khau_hash') {
    return {
      display: MASKED_SECRET,
      tooltip: 'Mật khẩu băm đã được che giấu vì lý do bảo mật',
      masked: true,
      isNull: false,
    };
  }

  if (
    tableKey === 'tbl_nguyen_lieu' &&
    column === 'don_gia_nhap_bq' &&
    !verifyRbacPermission(role, 'IMPORT_INVENTORY').allowed
  ) {
    return {
      display: 'Ẩn (FR-19)',
      tooltip: 'Giá vốn nhập kho chỉ hiển thị với vai trò Chủ nhà hàng (Owner)',
      masked: true,
      isNull: false,
    };
  }

  if (rawValue === null || rawValue === undefined) {
    return { display: 'NULL', tooltip: 'NULL', masked: false, isNull: true };
  }

  if (typeof rawValue === 'boolean') {
    const text = rawValue ? 'TRUE' : 'FALSE';
    return { display: text, tooltip: text, masked: false, isNull: false };
  }

  const text = String(rawValue);
  return { display: text, tooltip: text, masked: false, isNull: false };
}

/** Phân trang mảng bản ghi với trang 1-indexed an toàn biên. */
export function paginateRecords<T>(
  rows: T[],
  page: number,
  pageSize = SCHEMA_PAGE_SIZE,
): {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
} {
  const safeSize = Math.max(1, pageSize);
  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (safePage - 1) * safeSize;
  const items = rows.slice(start, start + safeSize);

  return {
    items,
    page: safePage,
    totalPages,
    totalItems,
    startIndex: totalItems === 0 ? 0 : start + 1,
    endIndex: totalItems === 0 ? 0 : start + items.length,
  };
}
