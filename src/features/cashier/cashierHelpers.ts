import { calculateCompletedOrderBill } from '@/store/useRestaurantStore';
import type {
  Ban,
  ChiTietDonGoi,
  CustomerGroupType,
  DatabaseSnapshot,
  GiaoDichThanhToan,
  HoaDon,
  KhachDoan,
  KhachHang,
  RoleCode,
} from '@/types/database';

export interface CashierInvoiceLine {
  item: ChiTietDonGoi;
  dishName: string;
  lineTotal: number;
}

export interface CashierInvoiceItem {
  invoice: HoaDon;
  maOrder: string;
  tableName: string;
  maBan: string;
  mergedTableNames: string[];
  totalSeats: number;
  tableReleased: boolean;
  customerGroup: CustomerGroupType;
  customer: KhachHang | null;
  khachDoan: KhachDoan | null;
  completedLines: CashierInvoiceLine[];
  bill: ReturnType<typeof calculateCompletedOrderBill>;
  paymentTx: GiaoDichThanhToan | null;
}

export interface CashierKpiStats {
  pendingCount: number;
  collectedTodayVnd: number;
  paidTransactionsCount: number;
  vatIssuedCount: number;
  pendingVatRequestedCount: number;
}

export interface VatValidationResult {
  valid: boolean;
  companyError?: string;
  taxCodeError?: string;
}

/** Chỉ Thu ngân, Quản lý sảnh và Chủ nhà hàng được xác nhận thanh toán. */
export function canConfirmCashierPayment(role: RoleCode): boolean {
  return role === 'Cashier' || role === 'Manager' || role === 'Owner';
}

/**
 * Xây dựng danh sách hóa đơn cho quầy Thu ngân (chờ thanh toán đứng trước, sau đó là đã thu).
 * Dùng hàm thuần `calculateCompletedOrderBill` để tính minh bạch tiền món hoàn thành − cọc − giảm VIP + VAT 8%.
 */
export function buildCashierInvoiceList(snapshot: DatabaseSnapshot): CashierInvoiceItem[] {
  const orderMap = new Map(snapshot.tbl_don_goi_mon.map((o) => [o.ma_order, o]));
  const tableMap = new Map<string, Ban>(snapshot.tbl_ban.map((b) => [b.ma_ban, b]));
  const dishMap = new Map(snapshot.tbl_mon_an.map((m) => [m.ma_mon_an, m]));
  const customerMap = new Map(snapshot.tbl_khach_hang.map((k) => [k.ma_khach_hang, k]));
  const groupCustomerMap = new Map(snapshot.tbl_khach_doan.map((kd) => [kd.ma_khach_hang, kd]));
  const paymentByInvoice = new Map<string, GiaoDichThanhToan>();
  for (const tx of snapshot.tbl_giao_dich_thanh_toan) {
    if (!paymentByInvoice.has(tx.ma_hoa_don)) {
      paymentByInvoice.set(tx.ma_hoa_don, tx);
    }
  }

  const list: CashierInvoiceItem[] = [];

  for (const invoice of snapshot.tbl_hoa_don) {
    if (invoice.trang_thai_tt === 'DaHuy') continue;
    const order = orderMap.get(invoice.ma_order);
    const mainTable = order ? tableMap.get(order.ma_ban) : undefined;
    const mergedTables = mainTable
      ? snapshot.tbl_ban.filter((b) => b.ma_ban_chinh === mainTable.ma_ban)
      : [];
    const totalSeats =
      (mainTable?.so_ghe ?? 0) + mergedTables.reduce((sum, t) => sum + t.so_ghe, 0);

    const customerId = invoice.ma_khach_hang ?? order?.ma_khach_hang ?? null;
    const customer = customerId ? (customerMap.get(customerId) ?? null) : null;
    const khachDoan = customerId ? (groupCustomerMap.get(customerId) ?? null) : null;

    const completedLines: CashierInvoiceLine[] = snapshot.tbl_chi_tiet_don_goi
      .filter(
        (item) =>
          item.ma_order === invoice.ma_order &&
          (item.trang_thai_mon === 'HoanThanh' || item.trang_thai_mon === 'DaPhucVu'),
      )
      .map((item) => {
        const dish = dishMap.get(item.ma_mon_an);
        return {
          item,
          dishName: dish?.ten_mon_an ?? item.ma_mon_an,
          lineTotal: Number(item.don_gia_thoi_diem) * Number(item.so_luong),
        };
      });

    const bill = calculateCompletedOrderBill(snapshot, invoice.ma_order);

    list.push({
      invoice,
      maOrder: invoice.ma_order,
      tableName: mainTable?.ten_ban ?? order?.ma_ban ?? invoice.ma_order,
      maBan: mainTable?.ma_ban ?? order?.ma_ban ?? '',
      mergedTableNames: mergedTables.map((t) => t.ten_ban),
      totalSeats,
      tableReleased: order?.trang_thai_order === 'DaGiaiPhong' || mainTable?.trang_thai_ban === 'Trong',
      customerGroup: order?.loai_khach_phien ?? customer?.loai_khach ?? 'VangLai',
      customer,
      khachDoan,
      completedLines,
      bill,
      paymentTx: paymentByInvoice.get(invoice.ma_hoa_don) ?? null,
    });
  }

  return list.sort((a, b) => {
    const aPending = a.invoice.trang_thai_tt === 'ChoThanhToan';
    const bPending = b.invoice.trang_thai_tt === 'ChoThanhToan';
    if (aPending !== bPending) return aPending ? -1 : 1;
    return b.invoice.ngay_lap_hoa_don.localeCompare(a.invoice.ngay_lap_hoa_don);
  });
}

/** Tính 3 KPI đầu trang Thu ngân POS. */
export function computeCashierStats(snapshot: DatabaseSnapshot): CashierKpiStats {
  let pendingCount = 0;
  let collectedTodayVnd = 0;
  let paidTransactionsCount = 0;
  let vatIssuedCount = 0;
  let pendingVatRequestedCount = 0;

  for (const hd of snapshot.tbl_hoa_don) {
    if (hd.trang_thai_tt === 'ChoThanhToan') {
      pendingCount++;
      if (hd.xuat_vat) pendingVatRequestedCount++;
    } else if (hd.trang_thai_tt === 'DaThanhToan') {
      paidTransactionsCount++;
      collectedTodayVnd += Number(hd.tong_tien_phai_tra || 0);
      if (hd.xuat_vat) vatIssuedCount++;
    }
  }

  return {
    pendingCount,
    collectedTodayVnd,
    paidTransactionsCount,
    vatIssuedCount,
    pendingVatRequestedCount,
  };
}

/**
 * Kiểm tra Mã số thuế Việt Nam hợp lệ: 10 chữ số (doanh nghiệp) hoặc 13 chữ số (chi nhánh,
 * chấp nhận dấu gạch ngang dạng `0300465937-005`).
 */
export function validateVietnameseTaxCode(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return /^\d{10}$/.test(trimmed) || /^\d{10}-?\d{3}$/.test(trimmed);
}

/** Kiểm tra dữ liệu xuất hóa đơn đỏ VAT khi người dùng bật công tắc VAT. */
export function validateVatInvoiceFields(
  enabled: boolean,
  companyName: string,
  taxCode: string,
): VatValidationResult {
  if (!enabled) return { valid: true };

  const companyError =
    companyName.trim().length < 2
      ? 'Vui lòng nhập đầy đủ tên công ty / đơn vị nhận hóa đơn VAT.'
      : undefined;

  const taxCodeError = validateVietnameseTaxCode(taxCode)
    ? undefined
    : 'Mã số thuế phải gồm đúng 10 hoặc 13 chữ số (ví dụ: 0401987654 hoặc 0300465937-005).';

  return {
    valid: !companyError && !taxCodeError,
    companyError,
    taxCodeError,
  };
}

/** Tính tiền thối lại cho khách khi thanh toán tiền mặt. */
export function calculateCashChange(
  cashReceived: number,
  amountDue: number,
): { sufficient: boolean; change: number; shortfall: number } {
  const safeReceived = Number.isFinite(cashReceived) ? Math.max(0, Math.round(cashReceived)) : 0;
  const safeDue = Number.isFinite(amountDue) ? Math.max(0, Math.round(amountDue)) : 0;
  if (safeReceived >= safeDue) {
    return { sufficient: true, change: safeReceived - safeDue, shortfall: 0 };
  }
  return { sufficient: false, change: 0, shortfall: safeDue - safeReceived };
}

/** Tạo danh sách mệnh giá gợi ý nhanh cho POS tiền mặt (đã lọc trùng & tăng dần). */
export function computeQuickCashAmounts(amountDue: number): number[] {
  const due = Math.max(0, Math.round(amountDue));
  if (due === 0) return [0];

  const roundUp = (step: number) => Math.ceil(due / step) * step;
  const candidates = [
    due,
    roundUp(50_000),
    roundUp(100_000),
    roundUp(500_000),
    due + 50_000,
    due + 200_000,
  ];

  const unique = Array.from(new Set(candidates.filter((n) => n >= due))).sort((a, b) => a - b);
  return unique.slice(0, 4);
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function isFinderCell(row: number, col: number, originR: number, originC: number): boolean | null {
  const dr = row - originR;
  const dc = col - originC;
  if (dr < -1 || dr > 7 || dc < -1 || dc > 7) return null;
  if (dr === -1 || dr === 7 || dc === -1 || dc === 7) return false; // separator ring
  if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
  if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
  return false;
}

/**
 * Tạo ma trận QR mô phỏng tất định (deterministic) kích thước `size x size` từ chuỗi payload.
 * Dùng riêng cho bản mô phỏng VietQR trong giao diện học tập — KHÔNG dùng cho thanh toán thật.
 */
export function generateDeterministicQrMatrix(payload: string, size = 25): boolean[][] {
  const n = Math.max(21, size);
  const matrix: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  const alignmentOrigin = n - 9;

  let state = hashSeed(payload || 'AC-RMS-VIETQR') || 1;
  const nextBit = () => {
    // Xorshift32 PRNG — hoàn toàn tất định theo payload
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) & 1) === 1;
  };

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // 3 góc định vị chuẩn (trên-trái, trên-phải, dưới-trái)
      const tl = isFinderCell(r, c, 0, 0);
      if (tl !== null) {
        matrix[r][c] = tl;
        continue;
      }
      const tr = isFinderCell(r, c, 0, n - 7);
      if (tr !== null) {
        matrix[r][c] = tr;
        continue;
      }
      const bl = isFinderCell(r, c, n - 7, 0);
      if (bl !== null) {
        matrix[r][c] = bl;
        continue;
      }

      // Ô căn chỉnh góc dưới-phải (5x5)
      const ar = r - alignmentOrigin;
      const ac = c - alignmentOrigin;
      if (ar >= 0 && ar < 5 && ac >= 0 && ac < 5) {
        matrix[r][c] =
          ar === 0 || ar === 4 || ac === 0 || ac === 4 || (ar === 2 && ac === 2);
        continue;
      }

      // Đường timing xen kẽ hàng/cột 6
      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }

      matrix[r][c] = nextBit();
    }
  }

  return matrix;
}
