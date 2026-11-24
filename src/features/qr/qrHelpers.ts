import { calculateCompletedOrderBill } from '@/store/useRestaurantStore';
import { CUISINE_META, SPICE_LEVELS, type Tone } from '@/lib/labels';
import type {
  ChiTietDonGoi,
  CuisineSchool,
  DanhMucMon,
  DatabaseSnapshot,
  DonGoiMon,
  MonAn,
  OrderItemStatus,
} from '@/types/database';

export type QrCuisineFilter = 'ALL' | CuisineSchool | 'COMBO';

export interface QrCartItem {
  key: string;
  ma_mon_an: string;
  ten_mon_an: string;
  don_gia: number;
  hinh_anh_url: string | null;
  so_luong: number;
  muc_do_cay_yc: 0 | 1 | 2 | 3;
  ghi_chu_mon: string;
}

export interface QrCartDraft {
  dish: MonAn;
  so_luong: number;
  muc_do_cay_yc: 0 | 1 | 2 | 3;
  ghi_chu_mon: string;
}

export interface KitchenProgressMeta {
  step: 1 | 2 | 3;
  percent: number;
  label: string;
  tone: Tone;
  activeStepLabel: 'Chờ' | 'Đang nấu' | 'Hoàn thành';
}

export interface EnrichedOrderItem {
  item: ChiTietDonGoi;
  dish: MonAn | undefined;
  ten_mon_an: string;
  hinh_anh_url: string | null;
  lineTotal: number;
  spiceLabel: string;
  progress: KitchenProgressMeta;
}

export interface BillPreviewSummary {
  servedItems: EnrichedOrderItem[];
  completedItemsCount: number;
  pendingItemsCount: number;
  servedSubtotal: number;
  tyLeGiamVip: number;
  tienGiamGia: number;
  tienCocTru: number;
  currentPreviewTotal: number;
}

export const CALL_WAITER_COOLDOWN_MS = 20_000;

export const CUISINE_FILTERS: { id: QrCuisineFilter; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'VietNam', label: CUISINE_META.VietNam.label },
  { id: 'TrungHoa', label: CUISINE_META.TrungHoa.label },
  { id: 'NhatBan', label: CUISINE_META.NhatBan.label },
  { id: 'HanQuoc', label: CUISINE_META.HanQuoc.label },
  { id: 'ThaiLan', label: CUISINE_META.ThaiLan.label },
  { id: 'COMBO', label: 'Combo đoàn' },
];

export const DIETARY_TAGS = [
  'Không hành',
  'Chay',
  'Không đậu phộng',
  'Không gluten',
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];

/** Món nổi bật hiển thị nhãn "Yêu thích" trên lưới thực đơn QR. */
export const FEATURED_DISH_IDS = new Set<string>([
  'MON-VN01',
  'MON-TH01',
  'MON-NB01',
  'MON-TL01',
]);

/** Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt hoa/thường và dấu. */
export function normalizeViSearch(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Rút gọn tên khu vực cho pill khóa bàn trên màn hình nhỏ (bỏ phần ngoặc trang trí). */
export function formatShortAreaName(tenKhuVuc: string): string {
  const cleaned = tenKhuVuc.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || tenKhuVuc;
}

/** Xác định món có gắn nhãn nổi bật "Yêu thích" hay không. */
export function isFeaturedDish(dish: MonAn): boolean {
  return !dish.is_combo && FEATURED_DISH_IDS.has(dish.ma_mon_an);
}

/** Lọc thực đơn QR theo trường phái ẩm thực / combo đoàn và từ khóa tìm kiếm. */
export function filterQrMenuDishes(
  dishes: MonAn[],
  categories: DanhMucMon[],
  cuisineFilter: QrCuisineFilter,
  searchQuery: string,
): MonAn[] {
  const categoryMap = new Map(categories.map((c) => [c.ma_danh_muc, c]));
  const normalizedQuery = normalizeViSearch(searchQuery);

  return dishes.filter((dish) => {
    const category = categoryMap.get(dish.ma_danh_muc);
    const isComboDish = dish.is_combo || dish.ma_danh_muc === 'DM-COMBO';

    if (cuisineFilter === 'COMBO') {
      if (!isComboDish) return false;
    } else if (cuisineFilter !== 'ALL') {
      if (isComboDish) return false;
      if (category?.truong_phai_am_thuc !== cuisineFilter) return false;
    }

    if (!normalizedQuery) return true;
    const haystack = normalizeViSearch(
      `${dish.ten_mon_an} ${dish.mo_ta ?? ''} ${category?.ten_danh_muc ?? ''}`,
    );
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return tokens.every((token) => haystack.includes(token));
  });
}

/** Tạo khóa duy nhất cho 1 dòng trong giỏ hàng (cùng món + độ cay + ghi chú sẽ gộp số lượng). */
export function buildCartItemKey(
  maMonAn: string,
  spiceLevel: 0 | 1 | 2 | 3,
  note: string,
): string {
  return `${maMonAn}::${spiceLevel}::${note.trim().toLowerCase()}`;
}

/** Gộp nhãn ghi chú ăn uống + ghi chú tự nhập thành chuỗi gọn gàng. */
export function composeDishNote(selectedTags: string[], customNote: string): string {
  const parts = [...selectedTags.map((t) => t.trim()).filter(Boolean)];
  const trimmedCustom = customNote.trim();
  if (trimmedCustom) parts.push(trimmedCustom);
  return parts.join(' · ');
}

/** Thêm hoặc cộng dồn số lượng món vào giỏ hàng cục bộ. */
export function upsertCartItem(cart: QrCartItem[], draft: QrCartDraft): QrCartItem[] {
  const qtyToAdd = Math.max(1, Math.min(99, Math.round(draft.so_luong)));
  const cleanNote = draft.ghi_chu_mon.trim();
  const key = buildCartItemKey(draft.dish.ma_mon_an, draft.muc_do_cay_yc, cleanNote);
  const existing = cart.find((item) => item.key === key);

  if (existing) {
    return cart.map((item) =>
      item.key === key
        ? { ...item, so_luong: Math.min(99, item.so_luong + qtyToAdd) }
        : item,
    );
  }

  return [
    ...cart,
    {
      key,
      ma_mon_an: draft.dish.ma_mon_an,
      ten_mon_an: draft.dish.ten_mon_an,
      don_gia: draft.dish.don_gia,
      hinh_anh_url: draft.dish.hinh_anh_url,
      so_luong: qtyToAdd,
      muc_do_cay_yc: draft.muc_do_cay_yc,
      ghi_chu_mon: cleanNote,
    },
  ];
}

/** Cập nhật số lượng 1 dòng trong giỏ hàng; nếu <= 0 thì xóa khỏi giỏ. */
export function updateCartItemQty(
  cart: QrCartItem[],
  key: string,
  nextQty: number,
): QrCartItem[] {
  if (nextQty <= 0) {
    return cart.filter((item) => item.key !== key);
  }
  const bounded = Math.min(99, Math.round(nextQty));
  return cart.map((item) => (item.key === key ? { ...item, so_luong: bounded } : item));
}

/** Xóa 1 dòng khỏi giỏ hàng. */
export function removeCartItem(cart: QrCartItem[], key: string): QrCartItem[] {
  return cart.filter((item) => item.key !== key);
}

/** Tính tổng số lượng món và tổng tạm tính trong giỏ hàng cục bộ. */
export function calculateCartTotals(cart: QrCartItem[]): {
  totalItems: number;
  totalAmount: number;
} {
  return cart.reduce(
    (acc, item) => ({
      totalItems: acc.totalItems + item.so_luong,
      totalAmount: acc.totalAmount + item.don_gia * item.so_luong,
    }),
    { totalItems: 0, totalAmount: 0 },
  );
}

/** Tính tổng số lượng của một mã món đang nằm trong giỏ (gộp mọi cấu hình cay/ghi chú). */
export function countDishInCart(cart: QrCartItem[], maMonAn: string): number {
  return cart.reduce(
    (sum, item) => (item.ma_mon_an === maMonAn ? sum + item.so_luong : sum),
    0,
  );
}

/** Quy đổi trạng thái món KDS thành tiến độ 3 mốc (Chờ → Đang nấu → Hoàn thành). */
export function getKitchenProgress(status: OrderItemStatus): KitchenProgressMeta {
  switch (status) {
    case 'ChoCheBien':
      return {
        step: 1,
        percent: 18,
        label: 'Chờ chế biến',
        tone: 'warning',
        activeStepLabel: 'Chờ',
      };
    case 'DangCheBien':
      return {
        step: 2,
        percent: 55,
        label: 'Đang nấu',
        tone: 'billing',
        activeStepLabel: 'Đang nấu',
      };
    case 'HoanThanh':
      return {
        step: 3,
        percent: 100,
        label: 'Hoàn thành',
        tone: 'success',
        activeStepLabel: 'Hoàn thành',
      };
    case 'DaPhucVu':
      return {
        step: 3,
        percent: 100,
        label: 'Đã phục vụ',
        tone: 'success',
        activeStepLabel: 'Hoàn thành',
      };
    case 'DaHuy':
      return {
        step: 1,
        percent: 0,
        label: 'Đã hủy',
        tone: 'neutral',
        activeStepLabel: 'Chờ',
      };
  }
}

/** Ghép chi tiết đơn gọi với bảng món ăn để hiển thị Tiến độ bếp và Tạm tính. */
export function enrichOrderItems(
  items: ChiTietDonGoi[],
  dishes: MonAn[],
): EnrichedOrderItem[] {
  const dishMap = new Map(dishes.map((d) => [d.ma_mon_an, d]));
  return items
    .filter((item) => item.trang_thai_mon !== 'DaHuy')
    .map((item) => {
      const dish = dishMap.get(item.ma_mon_an);
      const spiceMeta = SPICE_LEVELS[item.muc_do_cay_yc] ?? SPICE_LEVELS[0];
      return {
        item,
        dish,
        ten_mon_an: dish?.ten_mon_an ?? item.ma_mon_an,
        hinh_anh_url: dish?.hinh_anh_url ?? null,
        lineTotal: Number(item.don_gia_thoi_diem) * Number(item.so_luong),
        spiceLabel: spiceMeta.label,
        progress: getKitchenProgress(item.trang_thai_mon),
      };
    });
}

/** Tính bảng Tạm tính hóa đơn dựa trên hàm nghiệp vụ chuẩn FR-15 (chỉ tính món HoanThanh/DaPhucVu). */
export function getBillPreviewSummary(
  snapshot: DatabaseSnapshot,
  activeOrder: DonGoiMon | undefined,
  enrichedItems: EnrichedOrderItem[],
): BillPreviewSummary {
  if (!activeOrder) {
    return {
      servedItems: [],
      completedItemsCount: 0,
      pendingItemsCount: 0,
      servedSubtotal: 0,
      tyLeGiamVip: 0,
      tienGiamGia: 0,
      tienCocTru: 0,
      currentPreviewTotal: 0,
    };
  }

  const calc = calculateCompletedOrderBill(snapshot, activeOrder.ma_order);
  const servedItems = enrichedItems.filter(
    (entry) =>
      entry.item.trang_thai_mon === 'HoanThanh' || entry.item.trang_thai_mon === 'DaPhucVu',
  );
  const currentPreviewTotal = Math.max(
    0,
    calc.tongTienMonHoanThanh - calc.tienGiamGia - calc.tienCocTru,
  );

  return {
    servedItems,
    completedItemsCount: calc.completedItemsCount,
    pendingItemsCount: calc.pendingItemsCount,
    servedSubtotal: calc.tongTienMonHoanThanh,
    tyLeGiamVip: calc.tyLeGiamVip,
    tienGiamGia: calc.tienGiamGia,
    tienCocTru: calc.tienCocTru,
    currentPreviewTotal,
  };
}

/** Tính số giây cooldown còn lại cho nút gọi phục vụ (làm tròn lên). */
export function getRemainingCooldownSeconds(
  lastSentAtMs: number | undefined,
  nowMs: number,
  cooldownMs: number = CALL_WAITER_COOLDOWN_MS,
): number {
  if (!lastSentAtMs) return 0;
  const remainingMs = lastSentAtMs + cooldownMs - nowMs;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}
