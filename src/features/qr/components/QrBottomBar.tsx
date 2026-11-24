import { BellRing, ChevronRight, Clock, ShoppingBag, Utensils } from 'lucide-react';
import { formatVnd } from '@/lib/format';
import { Button } from '@/components/ui/Button';

interface QrBottomBarProps {
  cartItemCount: number;
  cartTotalAmount: number;
  activeKitchenCount: number;
  billPreviewTotal: number;
  onOpenCart: () => void;
  onOpenKitchenStatus: () => void;
  onOpenBillPreview: () => void;
  onOpenCallWaiter: () => void;
}

/** Thanh giỏ hàng dính dưới, 2 tab Tiến độ bếp / Tạm tính và nút nổi Gọi phục vụ (mockups 11–13). */
export function QrBottomBar({
  cartItemCount,
  cartTotalAmount,
  activeKitchenCount,
  billPreviewTotal,
  onOpenCart,
  onOpenKitchenStatus,
  onOpenBillPreview,
  onOpenCallWaiter,
}: QrBottomBarProps) {
  return (
    <div className="relative z-20 shrink-0 border-t border-cream-line bg-paper pb-[env(safe-area-inset-bottom)] shadow-lift">
      {/* Nút nổi Gọi phục vụ */}
      <button
        type="button"
        onClick={onOpenCallWaiter}
        className="absolute -top-14 right-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-cream-line bg-paper px-4 text-sm font-medium text-primary shadow-lift transition-colors hover:bg-paper-warm active:bg-sunken"
      >
        <BellRing size={17} aria-hidden className="text-gold" />
        <span>Gọi phục vụ</span>
      </button>

      {/* Hàng giỏ hàng */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <ShoppingBag size={20} aria-hidden />
            {cartItemCount > 0 && (
              <span className="num absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="eyebrow truncate">
              Bàn của bạn · <span className="num">{cartItemCount}</span> món
            </p>
            <p className="num mt-0.5 truncate text-base font-bold text-ink">
              {cartItemCount > 0 ? formatVnd(cartTotalAmount) : 'Chưa chọn món mới'}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          iconRight={<ChevronRight size={16} />}
          onClick={onOpenCart}
          className="rounded-xl px-4"
        >
          Xem đơn
        </Button>
      </div>

      {/* 2 tab dưới: Tiến độ bếp & Tạm tính */}
      <div className="grid grid-cols-2 divide-x divide-cream-line border-t border-cream-line">
        <button
          type="button"
          onClick={onOpenKitchenStatus}
          className="flex min-h-12 items-center justify-center gap-2 px-2 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-warm active:bg-sunken"
        >
          <Clock size={16} aria-hidden className="shrink-0 text-gold-ink" />
          <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
            Tiến độ bếp
            {activeKitchenCount > 0 && (
              <span
                aria-label={`${activeKitchenCount} món đang được bếp xử lý`}
                className="size-2 rounded-full bg-primary"
              />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenBillPreview}
          className="flex min-h-12 items-center justify-center gap-1.5 px-2 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-warm active:bg-sunken"
        >
          <Utensils size={16} aria-hidden className="shrink-0 text-gold-ink" />
          <span className="whitespace-nowrap">Tạm tính</span>
          {billPreviewTotal > 0 && (
            <span className="num truncate font-bold text-primary whitespace-nowrap">
              {formatVnd(billPreviewTotal)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
