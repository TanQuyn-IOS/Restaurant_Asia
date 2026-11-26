import { Flame, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { DishImage } from '@/components/domain/badges';
import type { MonAn } from '@/types/database';
import { isFeaturedDish } from '../qrHelpers';

interface DishCardProps {
  dish: MonAn;
  qtyInCart: number;
  onSelect: (dish: MonAn) => void;
  onQuickAdd: (dish: MonAn) => void;
}

/** Thẻ món ăn dạng lưới 2 cột khớp mockup 11–12 (hỗ trợ trạng thái Hết món realtime). */
export function DishCard({ dish, qtyInCart, onSelect, onQuickAdd }: DishCardProps) {
  const soldOut = dish.trang_thai_mon !== 'ConMon';
  const featured = isFeaturedDish(dish);
  const topLeftTag = dish.is_combo ? 'Combo đoàn' : featured ? 'Yêu thích' : null;

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-cream-line bg-paper shadow-card transition-colors',
        soldOut ? 'opacity-75' : 'hover:border-line-strong',
      )}
    >
      <button
        type="button"
        disabled={soldOut}
        onClick={() => onSelect(dish)}
        aria-label={
          soldOut
            ? `${dish.ten_mon_an}, đã hết món`
            : `Xem chi tiết và chọn độ cay cho ${dish.ten_mon_an}`
        }
        className="group flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-sunken">
          <DishImage
            src={dish.hinh_anh_url}
            alt={dish.ten_mon_an}
            grayscale={soldOut}
            className="size-full transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {topLeftTag && (
            <span className="absolute top-2 left-2 rounded-full bg-paper/95 px-2.5 py-0.5 text-xs font-medium text-ink shadow-card">
              {topLeftTag}
            </span>
          )}

          <span
            aria-label={`Độ cay mặc định mức ${dish.muc_do_cay}`}
            className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-paper/95 px-2 py-0.5 text-xs font-medium text-ink shadow-card"
          >
            <Flame
              size={12}
              aria-hidden
              className={dish.muc_do_cay > 0 ? 'text-primary' : 'text-ink-faint'}
            />
            <span className="num">{dish.muc_do_cay}</span>
          </span>

          {qtyInCart > 0 && !soldOut && (
            <span
              aria-label={`Đang có ${qtyInCart} phần trong giỏ`}
              className="num absolute right-2 bottom-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white shadow-card"
            >
              ×{qtyInCart}
            </span>
          )}

          {soldOut && (
            <div className="absolute inset-0 grid place-items-center bg-ink/45">
              <span className="rounded-md bg-ink/75 px-3 py-1 text-xs font-bold tracking-[0.06em] text-white uppercase">
                Hết món
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pt-2.5 pb-1">
          <h3
            className={cn(
              'line-clamp-2 text-sm font-medium leading-snug',
              soldOut ? 'text-ink-muted' : 'text-ink',
            )}
          >
            {dish.ten_mon_an}
          </h3>
          {dish.mo_ta && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">
              {dish.mo_ta}
            </p>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between gap-1.5 px-3 pt-2 pb-3">
        <span
          className={cn(
            'num truncate text-sm font-medium whitespace-nowrap',
            soldOut ? 'text-ink-muted line-through' : 'text-primary',
          )}
        >
          {formatVnd(dish.don_gia)}
        </span>

        <button
          type="button"
          disabled={soldOut}
          onClick={() => onQuickAdd(dish)}
          aria-label={
            soldOut
              ? `${dish.ten_mon_an} đã hết món`
              : `Thêm nhanh ${dish.ten_mon_an} vào đơn`
          }
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-full border transition-colors',
            soldOut
              ? 'border-line bg-sunken text-ink-faint'
              : 'border-primary/25 bg-primary-soft text-primary hover:bg-primary hover:text-white active:bg-primary-hover',
          )}
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>
    </article>
  );
}
