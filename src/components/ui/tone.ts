import type { Tone } from '@/lib/labels';

/**
 * Bảng tông màu dùng chung (class đầy đủ dạng literal để Tailwind quét được).
 * badge  : nền nhạt + chữ đậm (≥ 4.5:1)
 * dot    : chấm trạng thái
 * solid  : nền đặc + chữ trắng
 * border : viền trạng thái (card bàn)
 * text   : chữ màu trạng thái trên nền trắng
 * soft   : chỉ nền nhạt
 */
export const TONE: Record<
  Tone,
  { badge: string; dot: string; solid: string; border: string; text: string; soft: string }
> = {
  neutral: {
    badge: 'bg-sunken text-ink-soft',
    dot: 'bg-ink-faint',
    solid: 'bg-ink-soft text-white',
    border: 'border-line-strong',
    text: 'text-ink-soft',
    soft: 'bg-sunken',
  },
  primary: {
    badge: 'bg-primary-soft text-primary',
    dot: 'bg-primary',
    solid: 'bg-primary text-white',
    border: 'border-primary',
    text: 'text-primary',
    soft: 'bg-primary-soft',
  },
  gold: {
    badge: 'bg-gold-soft text-gold-ink',
    dot: 'bg-gold',
    solid: 'bg-gold text-ink',
    border: 'border-gold',
    text: 'text-gold-ink',
    soft: 'bg-gold-soft',
  },
  success: {
    badge: 'bg-st-empty-soft text-st-empty-ink',
    dot: 'bg-st-empty',
    solid: 'bg-st-empty text-white',
    border: 'border-st-empty',
    text: 'text-st-empty-ink',
    soft: 'bg-st-empty-soft',
  },
  warning: {
    badge: 'bg-st-booked-soft text-st-booked-ink',
    dot: 'bg-st-booked',
    solid: 'bg-st-booked text-white',
    border: 'border-st-booked',
    text: 'text-st-booked-ink',
    soft: 'bg-st-booked-soft',
  },
  danger: {
    badge: 'bg-st-serving-soft text-st-serving-ink',
    dot: 'bg-st-serving',
    solid: 'bg-st-serving text-white',
    border: 'border-st-serving',
    text: 'text-st-serving-ink',
    soft: 'bg-st-serving-soft',
  },
  billing: {
    badge: 'bg-st-billing-soft text-st-billing-ink',
    dot: 'bg-st-billing',
    solid: 'bg-st-billing text-white',
    border: 'border-st-billing',
    text: 'text-st-billing-ink',
    soft: 'bg-st-billing-soft',
  },
  info: {
    badge: 'bg-info-soft text-info-ink',
    dot: 'bg-info',
    solid: 'bg-info text-white',
    border: 'border-info',
    text: 'text-info-ink',
    soft: 'bg-info-soft',
  },
};
