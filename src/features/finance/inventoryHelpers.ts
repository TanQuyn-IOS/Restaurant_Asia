import { DEMO_TODAY } from '@/lib/clock';
import type { DatabaseSnapshot, NguyenLieu } from '@/types/database';

export type IngredientCategory = 'Hải sản tươi' | 'Thịt & Gia cầm' | 'Gia vị & Khác';

export interface EnrichedIngredient extends NguyenLieu {
  isLowStock: boolean;
  stockValue: number;
  supplierId: string | null;
  supplierName: string;
  category: IngredientCategory;
}

export function inferIngredientCategory(tenNguyenLieu: string): IngredientCategory {
  const lower = tenNguyenLieu.toLowerCase();
  if (/(cá|tôm|hải sản|sò|mực|bạch tuộc|cua|hàu)/.test(lower)) return 'Hải sản tươi';
  if (/(bò|vịt|gà|heo|sườn|thịt|thăn)/.test(lower)) return 'Thịt & Gia cầm';
  return 'Gia vị & Khác';
}

export function shortSupplierName(fullName: string): string {
  return fullName
    .replace(/^Công ty TNHH\s+/i, '')
    .replace(/^Nhà Phân Phối\s+/i, '')
    .trim();
}

/** Kết nối `tbl_nguyen_lieu` với phiếu nhập gần nhất và nhà cung cấp tương ứng. */
export function enrichInventoryItems(snapshot: DatabaseSnapshot): EnrichedIngredient[] {
  const receiptMap = new Map(snapshot.tbl_phieu_nhap_hang.map((p) => [p.ma_phieu_nhap, p]));
  const supplierMap = new Map(snapshot.tbl_nha_cung_cap.map((c) => [c.ma_nha_cung_cap, c]));

  const latestSupplierByIngredient = new Map<
    string,
    { ngayNhap: string; id: string; name: string }
  >();

  for (const line of snapshot.tbl_chi_tiet_phieu_nhap) {
    const receipt = receiptMap.get(line.ma_phieu_nhap);
    if (!receipt) continue;
    const supplier = supplierMap.get(receipt.ma_nha_cung_cap);
    if (!supplier) continue;

    const existing = latestSupplierByIngredient.get(line.ma_nguyen_lieu);
    if (!existing || receipt.ngay_nhap >= existing.ngayNhap) {
      latestSupplierByIngredient.set(line.ma_nguyen_lieu, {
        ngayNhap: receipt.ngay_nhap,
        id: supplier.ma_nha_cung_cap,
        name: shortSupplierName(supplier.ten_nha_cung_cap),
      });
    }
  }

  return snapshot.tbl_nguyen_lieu.map((nl) => {
    const sup = latestSupplierByIngredient.get(nl.ma_nguyen_lieu);
    const qty = Number(nl.so_luong_ton_kho);
    const minQty = Number(nl.nguong_ton_toi_thieu);
    const price = Number(nl.don_gia_nhap_bq);

    return {
      ...nl,
      isLowStock: qty < minQty,
      stockValue: Math.round(qty * price),
      supplierId: sup?.id ?? null,
      supplierName: sup?.name ?? 'Chưa gắn phiếu nhập',
      category: inferIngredientCategory(nl.ten_nguyen_lieu),
    };
  });
}

export interface ImportOrderInput {
  ma_nha_cung_cap: string;
  ma_nguyen_lieu: string;
  so_luong_nhap: number;
  don_gia_nhap: number;
  han_su_dung_lo: string;
  tien_da_thanh_toan: number;
}

export interface ImportOrderValidationResult {
  valid: boolean;
  totalAmount: number;
  debtAmount: number;
  errors: Partial<Record<keyof ImportOrderInput, string>>;
}

/** Validate dữ liệu lập phiếu nhập kho (qty > 0, price > 0, 0 <= paid <= total, expiry > today). */
export function validateImportOrderInput(
  input: ImportOrderInput,
  todayIso: string = DEMO_TODAY,
): ImportOrderValidationResult {
  const errors: Partial<Record<keyof ImportOrderInput, string>> = {};
  const qty = Number(input.so_luong_nhap);
  const price = Number(input.don_gia_nhap);
  const paid = Number(input.tien_da_thanh_toan);

  if (!input.ma_nha_cung_cap) errors.ma_nha_cung_cap = 'Vui lòng chọn nhà cung cấp.';
  if (!input.ma_nguyen_lieu) errors.ma_nguyen_lieu = 'Vui lòng chọn nguyên liệu nhập kho.';

  if (!Number.isFinite(qty) || qty <= 0) {
    errors.so_luong_nhap = 'Số lượng nhập phải lớn hơn 0.';
  }
  if (!Number.isFinite(price) || price <= 0) {
    errors.don_gia_nhap = 'Đơn giá nhập phải lớn hơn 0 ₫.';
  }

  const totalAmount =
    Number.isFinite(qty) && qty > 0 && Number.isFinite(price) && price > 0
      ? Math.round(qty * price)
      : 0;

  if (!Number.isFinite(paid) || paid < 0) {
    errors.tien_da_thanh_toan = 'Số tiền thanh toán không được âm.';
  } else if (totalAmount > 0 && paid > totalAmount) {
    errors.tien_da_thanh_toan = 'Tiền thanh toán ngay không được vượt quá tổng giá trị lô hàng.';
  }

  if (!input.han_su_dung_lo) {
    errors.han_su_dung_lo = 'Vui lòng nhập hạn sử dụng lô hàng.';
  } else if (input.han_su_dung_lo <= todayIso) {
    errors.han_su_dung_lo = `Hạn sử dụng lô hàng phải sau ngày hôm nay (${todayIso}).`;
  }

  const safePaid = Number.isFinite(paid) && paid > 0 ? Math.min(paid, totalAmount) : 0;

  return {
    valid: Object.keys(errors).length === 0,
    totalAmount,
    debtAmount: Math.max(0, totalAmount - safePaid),
    errors,
  };
}
