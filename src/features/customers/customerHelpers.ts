import type { Tone } from '@/lib/labels';
import type {
  CardTier,
  CustomerGroupType,
  KhachDoan,
  KhachHang,
  OrderStatus,
  PhieuDatBan,
} from '@/types/database';

export type CustomerFilterKey = 'ALL' | CustomerGroupType;

export interface CardTierRule {
  tier: CardTier;
  label: string;
  discountPercent: number;
  tone: Tone;
  privilege: string;
}

export const CARD_TIER_RULES: Record<CardTier, CardTierRule> = {
  Standard: {
    tier: 'Standard',
    label: 'Tiêu chuẩn',
    discountPercent: 0,
    tone: 'neutral',
    privilege: 'Tích 1 điểm / 10.000 ₫ hóa đơn',
  },
  Silver: {
    tier: 'Silver',
    label: 'Hạng Bạc (Silver)',
    discountPercent: 5,
    tone: 'info',
    privilege: 'Giảm 5% tổng món ăn + tích điểm thành viên',
  },
  Gold: {
    tier: 'Gold',
    label: 'Hạng Vàng (Gold)',
    discountPercent: 10,
    tone: 'gold',
    privilege: 'Giảm 10% tổng món ăn · ưu tiên phòng VIP & KDS',
  },
  Diamond: {
    tier: 'Diamond',
    label: 'Kim Cương (Diamond)',
    discountPercent: 15,
    tone: 'primary',
    privilege: 'Giảm 15% tổng món ăn · VIP Flag đẩy đầu bếp KDS',
  },
};

export const DISCOUNT_TIER_LIST: CardTierRule[] = [
  CARD_TIER_RULES.Silver,
  CARD_TIER_RULES.Gold,
  CARD_TIER_RULES.Diamond,
];

export const RESERVATION_STATUS_META: Record<
  PhieuDatBan['trang_thai_dat'],
  { label: string; tone: Tone }
> = {
  DaNhan: { label: 'Đã nhận đặt bàn', tone: 'warning' },
  DaDen: { label: 'Khách đã đến', tone: 'success' },
  DaHuy: { label: 'Đã hủy', tone: 'neutral' },
};

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  DangPhucVu: { label: 'Đang phục vụ', tone: 'danger' },
  ChoThanhToan: { label: 'Chờ thanh toán', tone: 'billing' },
  DaThanhToan: { label: 'Đã thanh toán', tone: 'success' },
  DaGiaiPhong: { label: 'Đã giải phóng bàn', tone: 'neutral' },
};

export function getCardDiscountPercent(tier: CardTier): number {
  return CARD_TIER_RULES[tier].discountPercent;
}

export function normalizeCustomerSearch(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function computeCustomerGroupCounts(
  customers: KhachHang[],
): Record<CustomerFilterKey, number> {
  const counts: Record<CustomerFilterKey, number> = {
    ALL: customers.length,
    VangLai: 0,
    Thuong: 0,
    VIP: 0,
    Doan: 0,
  };
  for (const kh of customers) {
    counts[kh.loai_khach] += 1;
  }
  return counts;
}

export function computeActiveDepositsTotal(reservations: PhieuDatBan[]): number {
  return reservations
    .filter((r) => r.trang_thai_dat !== 'DaHuy')
    .reduce((sum, r) => sum + Number(r.tien_dat_coc || 0), 0);
}

export function filterCustomerRows<
  T extends {
    customer: KhachHang;
    corporate: KhachDoan | null;
  },
>(rows: T[], group: CustomerFilterKey, query: string): T[] {
  const q = normalizeCustomerSearch(query);
  return rows.filter(({ customer, corporate }) => {
    if (group !== 'ALL' && customer.loai_khach !== group) return false;
    if (!q) return true;

    const haystack = [
      customer.ma_khach_hang,
      customer.ho_ten,
      customer.so_dien_thoai ?? '',
      customer.email ?? '',
      corporate?.ten_cong_ty ?? '',
      corporate?.nguoi_dai_dien ?? '',
      corporate?.ma_so_thue ?? '',
      corporate?.email_nhan_hoa_don ?? '',
    ]
      .map(normalizeCustomerSearch)
      .join(' ');

    return haystack.includes(q);
  });
}
