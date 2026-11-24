import type {
  CuisineSchool,
  DanhMucMon,
  DinhMucMon,
  MonAn,
  RoleCode,
} from '@/types/database';

export type MenuFilterKey = 'ALL' | CuisineSchool | 'COMBO';

export interface DishFormValues {
  ten_mon_an: string;
  ma_danh_muc: string;
  don_gia: string;
  muc_do_cay: 0 | 1 | 2 | 3;
  thoi_gian_nau_tb: string;
  hinh_anh_url: string;
  mo_ta: string;
  is_combo: boolean;
}

export interface DishFormErrors {
  ten_mon_an?: string;
  ma_danh_muc?: string;
  don_gia?: string;
  muc_do_cay?: string;
  thoi_gian_nau_tb?: string;
  hinh_anh_url?: string;
}

export interface MenuStats {
  total: number;
  available: number;
  unavailable: number;
  combos: number;
  availablePct: number;
}

/** Chỉ Chủ nhà hàng (Owner) và Quản lý sảnh (Manager) được thêm món mới vào thực đơn. */
export function canAddMenuDish(role: RoleCode): boolean {
  return role === 'Owner' || role === 'Manager';
}

/** Chỉ Chủ, Quản lý và Bếp được bật/tắt trạng thái Còn món / Hết món realtime (FR-09). */
export function canToggleDishAvailability(role: RoleCode): boolean {
  return role === 'Owner' || role === 'Manager' || role === 'Kitchen';
}

/** Tính lượng nguyên liệu thực tế sẽ bị trừ khỏi kho khi Bếp bấm Hoàn thành (có tính hao hụt %). */
export function computeEffectiveBomQty(bom: Pick<DinhMucMon, 'dinh_luong_tieu_hao' | 'ty_le_hao_hut'>): number {
  const qty = Number(bom.dinh_luong_tieu_hao) || 0;
  const waste = Number(bom.ty_le_hao_hut) || 0;
  return Number((qty * (1 + waste / 100)).toFixed(3));
}

/** Tổng hợp 4 KPI cho trang Thực đơn. */
export function computeMenuStats(dishes: MonAn[]): MenuStats {
  const total = dishes.length;
  const available = dishes.filter((d) => d.trang_thai_mon === 'ConMon').length;
  const unavailable = dishes.filter((d) => d.trang_thai_mon !== 'ConMon').length;
  const combos = dishes.filter((d) => d.is_combo).length;
  const availablePct = total > 0 ? Math.round((available / total) * 100) : 0;
  return { total, available, unavailable, combos, availablePct };
}

/** Đếm số món cho từng tab bộ lọc (Tất cả, 5 trường phái ẩm thực và Combo đoàn). */
export function computeMenuFilterCounts(
  dishes: MonAn[],
  categoriesById: Map<string, DanhMucMon>,
): Record<MenuFilterKey, number> {
  const counts: Record<MenuFilterKey, number> = {
    ALL: dishes.length,
    VietNam: 0,
    TrungHoa: 0,
    NhatBan: 0,
    HanQuoc: 0,
    ThaiLan: 0,
    COMBO: 0,
  };

  for (const dish of dishes) {
    if (dish.is_combo) {
      counts.COMBO += 1;
      continue;
    }
    const cat = categoriesById.get(dish.ma_danh_muc);
    if (cat) {
      counts[cat.truong_phai_am_thuc] += 1;
    }
  }
  return counts;
}

/** Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt hoa thường. */
export function normalizeSearchText(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/** Lọc danh sách món theo nhóm trường phái/Combo và từ khóa tìm kiếm (tên, mã, mô tả, nguyên liệu). */
export function filterMenuDishes<
  T extends {
    dish: MonAn;
    cuisineSchool: CuisineSchool | null;
    ingredientNames: string[];
  },
>(rows: T[], filter: MenuFilterKey, query: string): T[] {
  const normalizedQuery = normalizeSearchText(query);

  return rows.filter((row) => {
    if (filter === 'COMBO') {
      if (!row.dish.is_combo) return false;
    } else if (filter !== 'ALL') {
      if (row.dish.is_combo || row.cuisineSchool !== filter) return false;
    }

    if (!normalizedQuery) return true;

    const haystack = [
      row.dish.ten_mon_an,
      row.dish.ma_mon_an,
      row.dish.mo_ta ?? '',
      ...row.ingredientNames,
    ]
      .map(normalizeSearchText)
      .join(' ');

    return haystack.includes(normalizedQuery);
  });
}

/** Kiểm tra hợp lệ URL hình ảnh HTTPS (tùy chọn). */
export function isValidOptionalHttpsUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/** Kiểm tra hợp lệ dữ liệu biểu mẫu thêm món mới vào thực đơn. */
export function validateDishForm(
  values: DishFormValues,
  validCategoryIds: Set<string>,
): { valid: boolean; errors: DishFormErrors; parsed?: Omit<MonAn, 'ma_mon_an'> } {
  const errors: DishFormErrors = {};

  const name = values.ten_mon_an.trim();
  if (name.length < 2) {
    errors.ten_mon_an = 'Vui lòng nhập tên món ăn (tối thiểu 2 ký tự).';
  }

  if (!values.ma_danh_muc || !validCategoryIds.has(values.ma_danh_muc)) {
    errors.ma_danh_muc = 'Vui lòng chọn danh mục ẩm thực hợp lệ.';
  }

  const price = Number(values.don_gia);
  if (!Number.isFinite(price) || price <= 0) {
    errors.don_gia = 'Đơn giá phải lớn hơn 0 ₫.';
  }

  if (![0, 1, 2, 3].includes(values.muc_do_cay)) {
    errors.muc_do_cay = 'Mức độ cay phải từ 0 đến 3.';
  }

  const cookTime = Number(values.thoi_gian_nau_tb);
  if (!Number.isInteger(cookTime) || cookTime <= 0 || cookTime > 240) {
    errors.thoi_gian_nau_tb = 'Thời gian chế biến phải là số nguyên từ 1 đến 240 phút.';
  }

  if (!isValidOptionalHttpsUrl(values.hinh_anh_url)) {
    errors.hinh_anh_url = 'URL hình ảnh không hợp lệ (bắt buộc bắt đầu bằng https://).';
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    parsed: {
      ten_mon_an: name,
      ma_danh_muc: values.ma_danh_muc,
      don_gia: Math.round(price),
      hinh_anh_url: values.hinh_anh_url.trim() || null,
      mo_ta: values.mo_ta.trim() || null,
      muc_do_cay: values.muc_do_cay,
      thoi_gian_nau_tb: cookTime,
      trang_thai_mon: 'ConMon',
      is_combo: values.is_combo,
    },
  };
}
