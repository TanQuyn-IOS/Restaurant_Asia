import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  buildCartItemKey,
  calculateCartTotals,
  composeDishNote,
  countDishInCart,
  enrichOrderItems,
  filterQrMenuDishes,
  formatShortAreaName,
  getBillPreviewSummary,
  getKitchenProgress,
  getRemainingCooldownSeconds,
  isFeaturedDish,
  normalizeViSearch,
  removeCartItem,
  updateCartItemQty,
  upsertCartItem,
} from './qrHelpers';

describe('qrHelpers', () => {
  const dishes = INITIAL_DATABASE_SNAPSHOT.tbl_mon_an;
  const categories = INITIAL_DATABASE_SNAPSHOT.tbl_danh_muc_mon;

  it('normalizes Vietnamese diacritics and đ for search', () => {
    expect(normalizeViSearch('Phở Bò Wagyu')).toBe('pho bo wagyu');
    expect(normalizeViSearch('  Đậu Hũ Tứ Xuyên  ')).toBe('dau hu tu xuyen');
    expect(normalizeViSearch('Gỏi Đu Đủ Somtum')).toBe('goi du du somtum');
  });

  it('shortens area names by stripping decorative parenthetical text', () => {
    expect(formatShortAreaName('Sảnh Chính Tầng 1 (Tre Việt)')).toBe('Sảnh Chính Tầng 1');
    expect(formatShortAreaName('Phòng VIP Hoàng Gia (Sakura & Lotus)')).toBe('Phòng VIP Hoàng Gia');
  });

  it('filters dishes by cuisine, combo, and accent-insensitive search', () => {
    const all = filterQrMenuDishes(dishes, categories, 'ALL', '');
    expect(all.length).toBe(dishes.length);

    const vn = filterQrMenuDishes(dishes, categories, 'VietNam', '');
    expect(vn.every((d) => !d.is_combo)).toBe(true);
    expect(vn.map((d) => d.ma_mon_an)).toEqual(['MON-VN01', 'MON-VN02']);

    const combos = filterQrMenuDishes(dishes, categories, 'COMBO', '');
    expect(combos.map((d) => d.ma_mon_an)).toEqual(['CB-DOAN01']);

    const searchPho = filterQrMenuDishes(dishes, categories, 'ALL', 'pho wagyu');
    expect(searchPho.map((d) => d.ma_mon_an)).toEqual(['MON-VN01']);

    const searchDauHu = filterQrMenuDishes(dishes, categories, 'TrungHoa', 'dau hu');
    expect(searchDauHu.map((d) => d.ma_mon_an)).toEqual(['MON-TH03']);
  });

  it('flags signature dishes as featured and excludes combos', () => {
    const pho = dishes.find((d) => d.ma_mon_an === 'MON-VN01')!;
    const combo = dishes.find((d) => d.ma_mon_an === 'CB-DOAN01')!;
    expect(isFeaturedDish(pho)).toBe(true);
    expect(isFeaturedDish(combo)).toBe(false);
  });

  it('composes dietary tags and custom note cleanly', () => {
    expect(composeDishNote(['Không hành', 'Không đậu phộng'], 'Ít dầu')).toBe(
      'Không hành · Không đậu phộng · Ít dầu',
    );
    expect(composeDishNote([], '   ')).toBe('');
  });

  it('manages local cart upsert, merge by key, quantity updates, removal, and totals', () => {
    const pho = dishes.find((d) => d.ma_mon_an === 'MON-VN01')!;
    const dimsum = dishes.find((d) => d.ma_mon_an === 'MON-TH02')!;

    let cart = upsertCartItem([], {
      dish: pho,
      so_luong: 1,
      muc_do_cay_yc: 1,
      ghi_chu_mon: 'Không hành',
    });
    // Same dish + same spice + same note merges quantity
    cart = upsertCartItem(cart, {
      dish: pho,
      so_luong: 2,
      muc_do_cay_yc: 1,
      ghi_chu_mon: '  không hành ',
    });
    expect(cart).toHaveLength(1);
    expect(cart[0].so_luong).toBe(3);

    // Different spice creates separate line
    cart = upsertCartItem(cart, {
      dish: pho,
      so_luong: 1,
      muc_do_cay_yc: 2,
      ghi_chu_mon: '',
    });
    cart = upsertCartItem(cart, {
      dish: dimsum,
      so_luong: 1,
      muc_do_cay_yc: 0,
      ghi_chu_mon: '',
    });
    expect(cart).toHaveLength(3);
    expect(countDishInCart(cart, 'MON-VN01')).toBe(4);
    expect(calculateCartTotals(cart)).toEqual({
      totalItems: 5,
      totalAmount: 4 * 145000 + 165000,
    });

    const key = buildCartItemKey('MON-VN01', 1, 'Không hành');
    cart = updateCartItemQty(cart, key, 1);
    expect(cart.find((i) => i.key === key)?.so_luong).toBe(1);

    cart = updateCartItemQty(cart, key, 0);
    expect(cart.find((i) => i.key === key)).toBeUndefined();

    const dimsumKey = buildCartItemKey('MON-TH02', 0, '');
    cart = removeCartItem(cart, dimsumKey);
    expect(cart).toHaveLength(1);
  });

  it('maps kitchen statuses to 3-step progress accurately', () => {
    expect(getKitchenProgress('ChoCheBien')).toMatchObject({
      step: 1,
      activeStepLabel: 'Chờ',
      tone: 'warning',
    });
    expect(getKitchenProgress('DangCheBien')).toMatchObject({
      step: 2,
      activeStepLabel: 'Đang nấu',
      tone: 'billing',
    });
    expect(getKitchenProgress('HoanThanh')).toMatchObject({
      step: 3,
      percent: 100,
      activeStepLabel: 'Hoàn thành',
      tone: 'success',
    });
    expect(getKitchenProgress('DaPhucVu')).toMatchObject({
      step: 3,
      percent: 100,
      activeStepLabel: 'Hoàn thành',
      tone: 'success',
    });
  });

  it('computes bill preview using only completed/served dishes (FR-15)', () => {
    const order101 = INITIAL_DATABASE_SNAPSHOT.tbl_don_goi_mon.find(
      (o) => o.ma_order === 'ORD-101',
    )!;
    const rawItems = INITIAL_DATABASE_SNAPSHOT.tbl_chi_tiet_don_goi.filter(
      (i) => i.ma_order === order101.ma_order,
    );
    const enriched = enrichOrderItems(rawItems, dishes);
    const bill = getBillPreviewSummary(INITIAL_DATABASE_SNAPSHOT, order101, enriched);

    // ORD-101 has 1 DaPhucVu (2x 145k = 290k), 1 DangCheBien, 1 ChoCheBien
    expect(bill.completedItemsCount).toBe(1);
    expect(bill.pendingItemsCount).toBe(2);
    expect(bill.servedItems).toHaveLength(1);
    expect(bill.servedSubtotal).toBe(290000);
    expect(bill.currentPreviewTotal).toBe(290000);

    // No active order returns zeroed summary safely
    expect(getBillPreviewSummary(INITIAL_DATABASE_SNAPSHOT, undefined, [])).toEqual({
      servedItems: [],
      completedItemsCount: 0,
      pendingItemsCount: 0,
      servedSubtotal: 0,
      tyLeGiamVip: 0,
      tienGiamGia: 0,
      tienCocTru: 0,
      currentPreviewTotal: 0,
    });

    // ORD-DOAN301 has Gold 10% discount + 1.5M deposit deducted from 6.5M completed combos
    const groupOrder = INITIAL_DATABASE_SNAPSHOT.tbl_don_goi_mon.find(
      (o) => o.ma_order === 'ORD-DOAN301',
    )!;
    const groupItems = enrichOrderItems(
      INITIAL_DATABASE_SNAPSHOT.tbl_chi_tiet_don_goi.filter(
        (i) => i.ma_order === groupOrder.ma_order,
      ),
      dishes,
    );
    const groupBill = getBillPreviewSummary(
      INITIAL_DATABASE_SNAPSHOT,
      groupOrder,
      groupItems,
    );
    expect(groupBill.servedSubtotal).toBe(6500000);
    expect(groupBill.tienGiamGia).toBe(650000);
    expect(groupBill.tienCocTru).toBe(1500000);
    expect(groupBill.currentPreviewTotal).toBe(4350000);
  });

  it('calculates remaining cooldown seconds for guest support requests', () => {
    expect(getRemainingCooldownSeconds(undefined, 50_000)).toBe(0);
    expect(getRemainingCooldownSeconds(35_000, 50_000, 20_000)).toBe(5);
    expect(getRemainingCooldownSeconds(30_000, 50_000, 20_000)).toBe(0);
    expect(getRemainingCooldownSeconds(49_500, 50_000, 20_000)).toBe(20);
  });
});
