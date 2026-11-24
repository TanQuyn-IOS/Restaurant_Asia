import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  canAddMenuDish,
  canToggleDishAvailability,
  computeEffectiveBomQty,
  computeMenuFilterCounts,
  computeMenuStats,
  filterMenuDishes,
  isValidOptionalHttpsUrl,
  validateDishForm,
} from './menuHelpers';

describe('MOD-03 menuHelpers', () => {
  const dishes = INITIAL_DATABASE_SNAPSHOT.tbl_mon_an;
  const categories = INITIAL_DATABASE_SNAPSHOT.tbl_danh_muc_mon;
  const catMap = new Map(categories.map((c) => [c.ma_danh_muc, c]));

  it('enforces role permissions for adding dishes and toggling availability', () => {
    expect(canAddMenuDish('Owner')).toBe(true);
    expect(canAddMenuDish('Manager')).toBe(true);
    expect(canAddMenuDish('Kitchen')).toBe(false);
    expect(canAddMenuDish('Waitstaff')).toBe(false);
    expect(canAddMenuDish('Cashier')).toBe(false);
    expect(canAddMenuDish('HR')).toBe(false);

    expect(canToggleDishAvailability('Owner')).toBe(true);
    expect(canToggleDishAvailability('Manager')).toBe(true);
    expect(canToggleDishAvailability('Kitchen')).toBe(true);
    expect(canToggleDishAvailability('Waitstaff')).toBe(false);
    expect(canToggleDishAvailability('Cashier')).toBe(false);
    expect(canToggleDishAvailability('HR')).toBe(false);
  });

  it('computes menu KPI stats accurately from seed data', () => {
    const stats = computeMenuStats(dishes);
    expect(stats.total).toBe(12);
    expect(stats.available).toBe(11);
    expect(stats.unavailable).toBe(1);
    expect(stats.combos).toBe(1);
    expect(stats.availablePct).toBe(92);
  });

  it('counts dishes cleanly across 5 Asian culinary schools and Combo without double counting', () => {
    const counts = computeMenuFilterCounts(dishes, catMap);
    expect(counts.ALL).toBe(12);
    expect(counts.VietNam).toBe(2);
    expect(counts.TrungHoa).toBe(3);
    expect(counts.NhatBan).toBe(2);
    expect(counts.HanQuoc).toBe(2);
    expect(counts.ThaiLan).toBe(2);
    expect(counts.COMBO).toBe(1);
    const sumBuckets =
      counts.VietNam +
      counts.TrungHoa +
      counts.NhatBan +
      counts.HanQuoc +
      counts.ThaiLan +
      counts.COMBO;
    expect(sumBuckets).toBe(counts.ALL);
  });

  it('filters dishes by cuisine, combo, and accent-insensitive Vietnamese search query', () => {
    const rows = dishes.map((dish) => ({
      dish,
      cuisineSchool: catMap.get(dish.ma_danh_muc)?.truong_phai_am_thuc ?? null,
      ingredientNames: dish.ma_mon_an === 'MON-VN01' ? ['Thăn Bò Wagyu A5 Nhật Bản'] : [],
    }));

    expect(filterMenuDishes(rows, 'COMBO', '')).toHaveLength(1);
    expect(filterMenuDishes(rows, 'VietNam', '')).toHaveLength(2);
    expect(filterMenuDishes(rows, 'ALL', 'pho bo')).toHaveLength(1);
    expect(filterMenuDishes(rows, 'ALL', 'wagyu')).toHaveLength(2);
    expect(filterMenuDishes(rows, 'TrungHoa', 'mapo')).toHaveLength(1);
  });

  it('calculates effective BOM quantity including preparation waste percentage', () => {
    expect(computeEffectiveBomQty({ dinh_luong_tieu_hao: 0.45, ty_le_hao_hut: 4 })).toBe(0.468);
    expect(computeEffectiveBomQty({ dinh_luong_tieu_hao: 1.0, ty_le_hao_hut: 0 })).toBe(1);
  });

  it('validates optional https URLs strictly', () => {
    expect(isValidOptionalHttpsUrl('')).toBe(true);
    expect(isValidOptionalHttpsUrl('https://images.unsplash.com/photo-1.jpg')).toBe(true);
    expect(isValidOptionalHttpsUrl('http://insecure.example.com/a.jpg')).toBe(false);
    expect(isValidOptionalHttpsUrl('javascript:alert(1)')).toBe(false);
    expect(isValidOptionalHttpsUrl('not-a-url')).toBe(false);
  });

  it('validates add-dish form values and returns structured field errors', () => {
    const validCatIds = new Set(categories.map((c) => c.ma_danh_muc));

    const invalidResult = validateDishForm(
      {
        ten_mon_an: ' ',
        ma_danh_muc: 'INVALID',
        don_gia: '0',
        muc_do_cay: 1,
        thoi_gian_nau_tb: '-5',
        hinh_anh_url: 'http://bad.url',
        mo_ta: '',
        is_combo: false,
      },
      validCatIds,
    );
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.ten_mon_an).toBeTruthy();
    expect(invalidResult.errors.ma_danh_muc).toBeTruthy();
    expect(invalidResult.errors.don_gia).toBeTruthy();
    expect(invalidResult.errors.thoi_gian_nau_tb).toBeTruthy();
    expect(invalidResult.errors.hinh_anh_url).toBeTruthy();

    const okResult = validateDishForm(
      {
        ten_mon_an: 'Cá tuyết hấp xì dầu',
        ma_danh_muc: 'DM-TH',
        don_gia: '420000',
        muc_do_cay: 0,
        thoi_gian_nau_tb: '15',
        hinh_anh_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
        mo_ta: 'Cá tuyết Đại Tây Dương hấp nóng',
        is_combo: false,
      },
      validCatIds,
    );
    expect(okResult.valid).toBe(true);
    expect(okResult.parsed?.don_gia).toBe(420000);
    expect(okResult.parsed?.trang_thai_mon).toBe('ConMon');
  });
});
