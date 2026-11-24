import { CASHFLOW_META, CUSTOMER_GROUP_META } from '@/lib/labels';
import type {
  CuisineSchool,
  CustomerGroupType,
  DatabaseSnapshot,
  SoQuyDongTien,
} from '@/types/database';

export interface CashflowSummary {
  openingTotal: number;
  cashBalance: number;
  bankBalance: number;
  totalBalance: number;
  cashIn: number;
  cashOut: number;
  bankIn: number;
  bankOut: number;
  totalInflow: number;
  totalOutflow: number;
  billRevenue: number;
  depositInflow: number;
  netCashflow: number;
  netProfit: number;
  profitMarginPct: number;
  lastRecordedAt: string | null;
}

/** Tính toán tổng hợp sổ quỹ dòng tiền từ `tbl_so_quy_dong_tien`. */
export function calculateCashflowSummary(entries: SoQuyDongTien[]): CashflowSummary {
  if (entries.length === 0) {
    return {
      openingTotal: 0,
      cashBalance: 0,
      bankBalance: 0,
      totalBalance: 0,
      cashIn: 0,
      cashOut: 0,
      bankIn: 0,
      bankOut: 0,
      totalInflow: 0,
      totalOutflow: 0,
      billRevenue: 0,
      depositInflow: 0,
      netCashflow: 0,
      netProfit: 0,
      profitMarginPct: 0,
      lastRecordedAt: null,
    };
  }

  const chronological = [...entries].sort((a, b) => a.ngay_ghi_so.localeCompare(b.ngay_ghi_so));
  const first = chronological[0];
  const firstDir = CASHFLOW_META[first.loai_thu_chi].direction;
  const openingTotal = Math.max(
    0,
    Number(first.so_du_quy_sau_gd) - (firstDir === 'in' ? Number(first.so_tien) : -Number(first.so_tien)),
  );
  // Tỷ trọng tồn quỹ đầu kỳ: 25% tiền mặt tại két, 75% tài khoản ngân hàng
  const openingCash = Math.round(openingTotal * 0.25);
  const openingBank = openingTotal - openingCash;

  let cashIn = 0;
  let cashOut = 0;
  let bankIn = 0;
  let bankOut = 0;
  let billRevenue = 0;
  let depositInflow = 0;
  let totalOutflow = 0;

  for (const tx of chronological) {
    const amount = Number(tx.so_tien) || 0;
    const isIn = CASHFLOW_META[tx.loai_thu_chi].direction === 'in';

    if (tx.hinh_thuc_quy === 'TienMat') {
      if (isIn) cashIn += amount;
      else cashOut += amount;
    } else {
      if (isIn) bankIn += amount;
      else bankOut += amount;
    }

    if (tx.loai_thu_chi === 'ThuHoaDon') billRevenue += amount;
    else if (tx.loai_thu_chi === 'ThuTienCoc') depositInflow += amount;
    else totalOutflow += amount;
  }

  const totalInflow = billRevenue + depositInflow;
  const cashBalance = openingCash + cashIn - cashOut;
  const bankBalance = openingBank + bankIn - bankOut;
  const totalBalance = Number(chronological[chronological.length - 1].so_du_quy_sau_gd);
  const netCashflow = totalInflow - totalOutflow;
  const netProfit = billRevenue - totalOutflow;
  const profitMarginPct =
    billRevenue > 0 ? Number(((netProfit / billRevenue) * 100).toFixed(1)) : 0;

  return {
    openingTotal,
    cashBalance,
    bankBalance,
    totalBalance,
    cashIn,
    cashOut,
    bankIn,
    bankOut,
    totalInflow,
    totalOutflow,
    billRevenue,
    depositInflow,
    netCashflow,
    netProfit,
    profitMarginPct,
    lastRecordedAt: chronological[chronological.length - 1].ngay_ghi_so,
  };
}

export interface CustomerGroupSlice {
  group: CustomerGroupType;
  label: string;
  revenue: number;
  ordersCount: number;
  sharePct: number;
  colorVar: string;
  dotClass: string;
}

export interface TopDishMetric {
  maMonAn: string;
  tenMonAn: string;
  cuisine: CuisineSchool;
  hinhAnhUrl: string | null;
  unitsSold: number;
  revenue: number;
  pctOfTop: number;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  settledCashflowRevenue: number;
  liveSessionRevenue: number;
  closedInvoicesCount: number;
  paidInvoicesCount: number;
  pendingInvoicesCount: number;
  avgCheck: number;
  serviceDays: number;
  avgDailyRevenue: number;
  groupSlices: CustomerGroupSlice[];
  topGroup: CustomerGroupSlice | null;
  topDishes: TopDishMetric[];
}

const GROUP_CHART_STYLE: Record<CustomerGroupType, { colorVar: string; dotClass: string }> = {
  VangLai: { colorVar: 'var(--color-primary)', dotClass: 'bg-primary' },
  Thuong: { colorVar: 'var(--color-gold)', dotClass: 'bg-gold' },
  VIP: { colorVar: 'var(--color-ink)', dotClass: 'bg-ink' },
  Doan: { colorVar: 'var(--color-st-empty)', dotClass: 'bg-st-empty' },
};

const GROUP_ORDER: CustomerGroupType[] = ['VangLai', 'Thuong', 'VIP', 'Doan'];

/**
 * Tính toán phân tích doanh thu theo 4 nhóm khách & top món bán chạy (chỉ tính món HoanThanh/DaPhucVu theo FR-15).
 */
export function calculateRevenueAnalytics(
  snapshot: DatabaseSnapshot,
  zoneFilter: string = 'ALL',
  scope: 'month' | 'today' = 'month',
): RevenueAnalytics {
  const tableMap = new Map(snapshot.tbl_ban.map((b) => [b.ma_ban, b]));
  const dishMap = new Map(snapshot.tbl_mon_an.map((m) => [m.ma_mon_an, m]));
  const catMap = new Map(snapshot.tbl_danh_muc_mon.map((c) => [c.ma_danh_muc, c]));
  const orderMap = new Map(snapshot.tbl_don_goi_mon.map((o) => [o.ma_order, o]));

  const filteredOrders = snapshot.tbl_don_goi_mon.filter((o) => {
    if (zoneFilter === 'ALL') return true;
    return tableMap.get(o.ma_ban)?.ma_khu_vuc === zoneFilter;
  });
  const allowedOrderIds = new Set(filteredOrders.map((o) => o.ma_order));

  const groupRevenue: Record<CustomerGroupType, number> = {
    VangLai: 0,
    Thuong: 0,
    VIP: 0,
    Doan: 0,
  };
  const groupOrders: Record<CustomerGroupType, Set<string>> = {
    VangLai: new Set(),
    Thuong: new Set(),
    VIP: new Set(),
    Doan: new Set(),
  };

  const dishStats = new Map<string, { units: number; revenue: number }>();

  for (const item of snapshot.tbl_chi_tiet_don_goi) {
    if (item.trang_thai_mon !== 'HoanThanh' && item.trang_thai_mon !== 'DaPhucVu') continue;
    if (!allowedOrderIds.has(item.ma_order)) continue;
    const order = orderMap.get(item.ma_order);
    if (!order) continue;

    const lineTotal = Number(item.don_gia_thoi_diem) * Number(item.so_luong);
    groupRevenue[order.loai_khach_phien] += lineTotal;
    groupOrders[order.loai_khach_phien].add(order.ma_order);

    const prev = dishStats.get(item.ma_mon_an) ?? { units: 0, revenue: 0 };
    prev.units += Number(item.so_luong);
    prev.revenue += lineTotal;
    dishStats.set(item.ma_mon_an, prev);
  }

  const liveSessionRevenue = GROUP_ORDER.reduce((sum, g) => sum + groupRevenue[g], 0);

  const groupSlices: CustomerGroupSlice[] = GROUP_ORDER.map((group) => {
    const revenue = groupRevenue[group];
    const sharePct =
      liveSessionRevenue > 0 ? Number(((revenue / liveSessionRevenue) * 100).toFixed(1)) : 0;
    return {
      group,
      label: CUSTOMER_GROUP_META[group].label,
      revenue,
      ordersCount: groupOrders[group].size,
      sharePct,
      colorVar: GROUP_CHART_STYLE[group].colorVar,
      dotClass: GROUP_CHART_STYLE[group].dotClass,
    };
  });

  const topGroup =
    [...groupSlices].filter((s) => s.revenue > 0).sort((a, b) => b.revenue - a.revenue)[0] ?? null;

  const sortedDishes = Array.from(dishStats.entries())
    .map(([maMonAn, stat]) => {
      const dish = dishMap.get(maMonAn);
      const cat = dish ? catMap.get(dish.ma_danh_muc) : undefined;
      return {
        maMonAn,
        tenMonAn: dish?.ten_mon_an ?? maMonAn,
        cuisine: cat?.truong_phai_am_thuc ?? 'VietNam',
        hinhAnhUrl: dish?.hinh_anh_url ?? null,
        unitsSold: stat.units,
        revenue: stat.revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold);

  const maxDishRevenue = sortedDishes[0]?.revenue ?? 1;
  const topDishes: TopDishMetric[] = sortedDishes.slice(0, 6).map((d) => ({
    ...d,
    pctOfTop: Math.round((d.revenue / maxDishRevenue) * 100),
  }));

  // Doanh thu sổ quỹ đã kết sổ lịch sử (loại trừ các giao dịch đã gắn với tbl_giao_dich_thanh_toan để không tính trùng)
  const paymentTxIds = new Set(snapshot.tbl_giao_dich_thanh_toan.map((g) => g.ma_giao_dich));
  const historicalSettledRevenue = snapshot.tbl_so_quy_dong_tien
    .filter((tx) => tx.loai_thu_chi === 'ThuHoaDon' && !paymentTxIds.has(tx.ma_chung_tu_goc ?? ''))
    .reduce((sum, tx) => sum + Number(tx.so_tien), 0);

  const settledCashflowRevenue =
    scope === 'month' && zoneFilter === 'ALL' ? historicalSettledRevenue : 0;
  const totalRevenue = settledCashflowRevenue + liveSessionRevenue;

  const validInvoices = snapshot.tbl_hoa_don.filter((h) => {
    if (h.trang_thai_tt === 'DaHuy') return false;
    if (zoneFilter === 'ALL') return true;
    const order = orderMap.get(h.ma_order);
    return order ? tableMap.get(order.ma_ban)?.ma_khu_vuc === zoneFilter : false;
  });
  const paidInvoicesCount = validInvoices.filter((h) => h.trang_thai_tt === 'DaThanhToan').length;
  const pendingInvoicesCount = validInvoices.filter(
    (h) => h.trang_thai_tt === 'ChoThanhToan',
  ).length;
  const invoiceSum = validInvoices.reduce((s, h) => s + Number(h.tong_tien_phai_tra), 0);
  const avgCheck =
    validInvoices.length > 0
      ? Math.round(invoiceSum / validInvoices.length)
      : filteredOrders.length > 0
        ? Math.round(liveSessionRevenue / filteredOrders.length)
        : 0;

  const distinctDays = new Set<string>();
  if (scope === 'month') {
    snapshot.tbl_so_quy_dong_tien.forEach((tx) => distinctDays.add(tx.ngay_ghi_so.slice(0, 10)));
  }
  filteredOrders.forEach((o) => distinctDays.add(o.thoi_gian_mo_ban.slice(0, 10)));
  const serviceDays = Math.max(1, distinctDays.size);
  const avgDailyRevenue = Math.round(totalRevenue / serviceDays);

  return {
    totalRevenue,
    settledCashflowRevenue,
    liveSessionRevenue,
    closedInvoicesCount: validInvoices.length,
    paidInvoicesCount,
    pendingInvoicesCount,
    avgCheck,
    serviceDays,
    avgDailyRevenue,
    groupSlices,
    topGroup,
    topDishes,
  };
}

export {
  enrichInventoryItems,
  inferIngredientCategory,
  shortSupplierName,
  validateImportOrderInput,
  type EnrichedIngredient,
  type ImportOrderInput,
  type ImportOrderValidationResult,
  type IngredientCategory,
} from './inventoryHelpers';

export function buildFinanceCsv(
  headers: string[],
  rows: (string | number | null | undefined)[][],
): string {
  const esc = (v: string | number | null | undefined) => {
    const raw = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
  };
  return `\uFEFF${[headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\r\n')}`;
}

export function downloadFinanceCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
