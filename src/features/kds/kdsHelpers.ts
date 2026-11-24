import type {
  Ban,
  ChiTietDonGoi,
  CuisineSchool,
  CustomerGroupType,
  DanhMucMon,
  DatabaseSnapshot,
  MonAn,
  NhatKyBep,
  OrderItemStatus,
  RoleCode,
} from '@/types/database';
import { CUISINE_META } from '@/lib/labels';

export type KdsFilter = 'all' | 'ChoCheBien' | 'DangCheBien' | 'HoanThanh';

export interface KdsDishEntry {
  item: ChiTietDonGoi;
  dishName: string;
  cookMinutes: number;
  isCombo: boolean;
  cuisine: CuisineSchool | null;
  log: NhatKyBep | null;
}

export interface KdsTicket {
  maOrder: string;
  maBan: string;
  tableName: string;
  areaName: string;
  customerGroup: CustomerGroupType;
  customerName: string | null;
  isVip: boolean;
  openedAt: string;
  /** Mốc thời gian sớm nhất dùng để sắp xếp FIFO và tính đồng hồ chờ */
  earliestOrderTime: string;
  items: KdsDishEntry[];
  waitingCount: number;
  cookingCount: number;
  doneCount: number;
  hasActiveDishes: boolean;
}

export interface KdsSummary {
  activeTicketsCount: number;
  totalTicketsCount: number;
  totalDishesCount: number;
  waitingDishesCount: number;
  cookingDishesCount: number;
  doneDishesCount: number;
}

export interface MenuDishRow {
  dish: MonAn;
  cuisineLabel: string;
  categoryName: string;
}

/** Chỉ Bếp, Quản lý sảnh và Chủ nhà hàng được thao tác tiến độ nấu & báo hết món. */
export function canOperateKitchen(role: RoleCode): boolean {
  return role === 'Kitchen' || role === 'Manager' || role === 'Owner';
}

/** Chuẩn hóa chuỗi ngày giờ MySQL ("YYYY-MM-DD HH:mm:ss") sang ISO ("YYYY-MM-DDTHH:mm:ss"). */
export function normalizeIsoTimestamp(ts: string | null | undefined): string {
  if (!ts) return '';
  return ts.includes(' ') && !ts.includes('T') ? ts.replace(' ', 'T') : ts;
}

const ITEM_STATUS_ORDER: Record<OrderItemStatus, number> = {
  DangCheBien: 0,
  ChoCheBien: 1,
  HoanThanh: 2,
  DaPhucVu: 3,
  DaHuy: 4,
};

function isDoneStatus(status: OrderItemStatus): boolean {
  return status === 'HoanThanh' || status === 'DaPhucVu';
}

function isActiveStatus(status: OrderItemStatus): boolean {
  return status === 'ChoCheBien' || status === 'DangCheBien';
}

/**
 * Nhóm chi tiết món theo đơn bàn (ticket), ghim phiếu VIP lên đầu rồi sắp theo FIFO.
 * Các phiếu còn món Chờ/Đang nấu luôn nằm trên phiếu đã hoàn thành toàn bộ.
 */
export function buildKdsTickets(snapshot: DatabaseSnapshot): KdsTicket[] {
  const tableMap = new Map<string, Ban>(snapshot.tbl_ban.map((b) => [b.ma_ban, b]));
  const areaMap = new Map(snapshot.tbl_khu_vuc.map((k) => [k.ma_khu_vuc, k.ten_khu_vuc]));
  const dishMap = new Map<string, MonAn>(snapshot.tbl_mon_an.map((m) => [m.ma_mon_an, m]));
  const categoryMap = new Map<string, DanhMucMon>(
    snapshot.tbl_danh_muc_mon.map((dm) => [dm.ma_danh_muc, dm]),
  );
  const customerMap = new Map(snapshot.tbl_khach_hang.map((kh) => [kh.ma_khach_hang, kh]));
  const logMap = new Map<string, NhatKyBep>(
    snapshot.tbl_nhat_ky_bep.map((l) => [l.ma_chi_tiet_order, l]),
  );

  const itemsByOrder = new Map<string, ChiTietDonGoi[]>();
  for (const item of snapshot.tbl_chi_tiet_don_goi) {
    if (item.trang_thai_mon === 'DaHuy') continue;
    const list = itemsByOrder.get(item.ma_order) ?? [];
    list.push(item);
    itemsByOrder.set(item.ma_order, list);
  }

  const tickets: KdsTicket[] = [];

  for (const order of snapshot.tbl_don_goi_mon) {
    if (order.trang_thai_order === 'DaGiaiPhong') continue;
    const rawItems = itemsByOrder.get(order.ma_order);
    if (!rawItems || rawItems.length === 0) continue;

    const entries: KdsDishEntry[] = rawItems
      .map((item) => {
        const mon = dishMap.get(item.ma_mon_an);
        const category = mon ? categoryMap.get(mon.ma_danh_muc) : undefined;
        return {
          item,
          dishName: mon?.ten_mon_an ?? item.ma_mon_an,
          cookMinutes: mon?.thoi_gian_nau_tb ?? 10,
          isCombo: Boolean(mon?.is_combo),
          cuisine: category?.truong_phai_am_thuc ?? null,
          log: logMap.get(item.ma_chi_tiet_order) ?? null,
        };
      })
      .sort((a, b) => {
        const rankDiff =
          ITEM_STATUS_ORDER[a.item.trang_thai_mon] - ITEM_STATUS_ORDER[b.item.trang_thai_mon];
        if (rankDiff !== 0) return rankDiff;
        return a.item.thoi_gian_goi.localeCompare(b.item.thoi_gian_goi);
      });

    let waitingCount = 0;
    let cookingCount = 0;
    let doneCount = 0;
    let earliestActive: string | null = null;
    let earliestAny = entries[0].item.thoi_gian_goi;

    for (const entry of entries) {
      const st = entry.item.trang_thai_mon;
      if (entry.item.thoi_gian_goi < earliestAny) {
        earliestAny = entry.item.thoi_gian_goi;
      }
      if (st === 'ChoCheBien') {
        waitingCount++;
        if (!earliestActive || entry.item.thoi_gian_goi < earliestActive) {
          earliestActive = entry.item.thoi_gian_goi;
        }
      } else if (st === 'DangCheBien') {
        cookingCount++;
        if (!earliestActive || entry.item.thoi_gian_goi < earliestActive) {
          earliestActive = entry.item.thoi_gian_goi;
        }
      } else if (isDoneStatus(st)) {
        doneCount++;
      }
    }

    const ban = tableMap.get(order.ma_ban);
    const customer = order.ma_khach_hang ? customerMap.get(order.ma_khach_hang) : undefined;

    tickets.push({
      maOrder: order.ma_order,
      maBan: order.ma_ban,
      tableName: ban?.ten_ban ?? order.ma_ban,
      areaName: ban ? (areaMap.get(ban.ma_khu_vuc) ?? '') : '',
      customerGroup: order.loai_khach_phien,
      customerName: customer?.ho_ten ?? null,
      isVip: Boolean(order.vip_flag),
      openedAt: order.thoi_gian_mo_ban,
      earliestOrderTime: earliestActive ?? earliestAny,
      items: entries,
      waitingCount,
      cookingCount,
      doneCount,
      hasActiveDishes: waitingCount + cookingCount > 0,
    });
  }

  return tickets.sort((a, b) => {
    // 1. Phiếu đang chờ/nấu ưu tiên lên trước phiếu đã hoàn tất toàn bộ
    if (a.hasActiveDishes !== b.hasActiveDishes) {
      return a.hasActiveDishes ? -1 : 1;
    }
    // 2. Ghim bàn VIP lên đầu hàng đợi
    if (a.isVip !== b.isVip) {
      return a.isVip ? -1 : 1;
    }
    // 3. Hàng đợi FIFO theo thời điểm gọi món sớm nhất
    const timeDiff = a.earliestOrderTime.localeCompare(b.earliestOrderTime);
    if (timeDiff !== 0) return timeDiff;
    return a.maOrder.localeCompare(b.maOrder);
  });
}

/** Lọc danh sách phiếu bếp theo trạng thái món (giữ lại đúng món khớp bộ lọc). */
export function filterKdsTickets(tickets: KdsTicket[], filter: KdsFilter): KdsTicket[] {
  if (filter === 'all') return tickets;

  const filtered: KdsTicket[] = [];
  for (const ticket of tickets) {
    const matchedItems = ticket.items.filter(({ item }) => {
      if (filter === 'HoanThanh') return isDoneStatus(item.trang_thai_mon);
      return item.trang_thai_mon === filter;
    });
    if (matchedItems.length === 0) continue;

    let earliest = matchedItems[0].item.thoi_gian_goi;
    for (const entry of matchedItems) {
      if (entry.item.thoi_gian_goi < earliest) {
        earliest = entry.item.thoi_gian_goi;
      }
    }

    filtered.push({
      ...ticket,
      items: matchedItems,
      earliestOrderTime: earliest,
      hasActiveDishes: matchedItems.some((e) => isActiveStatus(e.item.trang_thai_mon)),
    });
  }

  return filtered;
}

/** Tổng hợp chỉ số cho thẻ tóm tắt KDS và bộ lọc Segmented. */
export function computeKdsSummary(tickets: KdsTicket[]): KdsSummary {
  let activeTicketsCount = 0;
  let waitingDishesCount = 0;
  let cookingDishesCount = 0;
  let doneDishesCount = 0;

  for (const ticket of tickets) {
    if (ticket.hasActiveDishes) activeTicketsCount++;
    waitingDishesCount += ticket.waitingCount;
    cookingDishesCount += ticket.cookingCount;
    doneDishesCount += ticket.doneCount;
  }

  return {
    activeTicketsCount,
    totalTicketsCount: tickets.length,
    totalDishesCount: waitingDishesCount + cookingDishesCount + doneDishesCount,
    waitingDishesCount,
    cookingDishesCount,
    doneDishesCount,
  };
}

function stripDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Tìm kiếm món theo tên, mã món hoặc trường phái ẩm thực (hỗ trợ gõ không dấu). */
export function filterMenuDishes(
  dishes: MonAn[],
  categories: DanhMucMon[],
  query: string,
): MenuDishRow[] {
  const categoryMap = new Map(categories.map((c) => [c.ma_danh_muc, c]));
  const normalizedQuery = stripDiacritics(query.trim());

  const rows: MenuDishRow[] = dishes.map((dish) => {
    const category = categoryMap.get(dish.ma_danh_muc);
    const cuisineLabel = dish.is_combo
      ? 'Combo tiệc'
      : category
        ? CUISINE_META[category.truong_phai_am_thuc].label
        : 'Ẩm thực Á Châu';
    return {
      dish,
      cuisineLabel,
      categoryName: category?.ten_danh_muc ?? cuisineLabel,
    };
  });

  if (!normalizedQuery) return rows;

  return rows.filter((row) => {
    const haystack = stripDiacritics(
      `${row.dish.ten_mon_an} ${row.dish.ma_mon_an} ${row.cuisineLabel} ${row.categoryName}`,
    );
    return haystack.includes(normalizedQuery);
  });
}
