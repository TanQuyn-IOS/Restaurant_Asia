import { CustomerType } from '../types';

export interface CustomerTypeMeta {
  type: CustomerType;
  label: string;
  shortLabel: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  tagClass: string;
  icon: string;
  defaultDiscount: number;
  description: string;
}

export const CUSTOMER_TYPE_CONFIG: Record<CustomerType, CustomerTypeMeta> = {
  walk_in: {
    type: 'walk_in',
    label: 'Khách Vãng Lai',
    shortLabel: 'Vãng Lai',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    tagClass: 'bg-slate-100 text-slate-800 border-slate-300',
    icon: '🚶',
    defaultDiscount: 0,
    description: 'Khách ghé qua không đặt trước, thanh toán tiêu chuẩn'
  },
  regular: {
    type: 'regular',
    label: 'Khách Thường',
    shortLabel: 'Thường',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-700',
    tagClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '👤',
    defaultDiscount: 0,
    description: 'Thực khách quen thuộc, tích điểm thẻ thành viên'
  },
  vip: {
    type: 'vip',
    label: 'Khách VIP',
    shortLabel: 'VIP',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-400 dark:border-amber-600',
    tagClass: 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold shadow-xs',
    icon: '⭐',
    defaultDiscount: 10,
    description: 'Khách hàng VIP, ưu tiên phục vụ & chiết khấu VIP 10%'
  },
  group: {
    type: 'group',
    label: 'Khách Đoàn',
    shortLabel: 'Khách Đoàn',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/40',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-400 dark:border-purple-600',
    tagClass: 'bg-purple-50 text-purple-800 border-purple-300 font-bold',
    icon: '👥',
    defaultDiscount: 5,
    description: 'Đoàn du lịch / Tiệc công ty / Hội nhóm đông, chiết khấu 5%'
  }
};

export const CUSTOMER_TYPES: CustomerType[] = ['walk_in', 'regular', 'vip', 'group'];
