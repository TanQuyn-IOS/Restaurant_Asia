import { AlertTriangle, BellRing, Send, ShoppingBag, Trash2 } from 'lucide-react';
import { formatVnd } from '@/lib/format';
import { SPICE_LEVELS } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Misc';
import { Sheet } from '@/components/ui/Overlay';
import { DishImage } from '@/components/domain/badges';
import type { QrCartItem } from '../qrHelpers';
import type { QrSessionBlockReason } from '../useQrSession';

interface CartReviewSheetProps {
  open: boolean;
  onClose: () => void;
  tableLabel: string;
  areaLabel: string;
  cart: QrCartItem[];
  totalItems: number;
  totalAmount: number;
  soldOutCartKeys: Set<string>;
  canSubmitOrder: boolean;
  sessionBlockReason: QrSessionBlockReason;
  callStaffCooldown: number;
  onChangeQty: (key: string, nextQty: number) => void;
  onRemoveItem: (key: string) => void;
  onRemoveSoldOut: () => void;
  onSubmitOrder: () => void;
  onRequestOpenTable: () => void;
}

/** Ngăn xem lại giỏ món cục bộ trước khi bấm "Gửi bếp" (nguon_goi: MobileQR). */
export function CartReviewSheet({
  open,
  onClose,
  tableLabel,
  areaLabel,
  cart,
  totalItems,
  totalAmount,
  soldOutCartKeys,
  canSubmitOrder,
  sessionBlockReason,
  callStaffCooldown,
  onChangeQty,
  onRemoveItem,
  onRemoveSoldOut,
  onSubmitOrder,
  onRequestOpenTable,
}: CartReviewSheetProps) {
  const hasSoldOut = soldOutCartKeys.size > 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      frame="mobile"
      eyebrow={`${tableLabel} · ${areaLabel}`}
      title="Giỏ món"
      footer={
        cart.length > 0 ? (
          <div className="space-y-3 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">
                Tạm tính giỏ món (<span className="num">{totalItems}</span> phần)
              </span>
              <span className="num text-lg font-bold text-primary">
                {formatVnd(totalAmount)}
              </span>
            </div>

            {canSubmitOrder ? (
              <Button
                variant="primary"
                size="lg"
                block
                disabled={hasSoldOut}
                icon={<Send size={16} />}
                onClick={onSubmitOrder}
                className="rounded-xl"
              >
                {hasSoldOut
                  ? 'Vui lòng xóa món đã hết trước khi gửi'
                  : `Gửi bếp · ${formatVnd(totalAmount)}`}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="gold"
                  size="lg"
                  block
                  disabled={callStaffCooldown > 0}
                  icon={<BellRing size={16} />}
                  onClick={onRequestOpenTable}
                  className="rounded-xl"
                >
                  {callStaffCooldown > 0
                    ? `Đã gọi nhân viên · chờ ${callStaffCooldown}s`
                    : sessionBlockReason === 'BILL_LOCKED'
                      ? 'Gọi nhân viên hỗ trợ gọi thêm'
                      : 'Gọi nhân viên mở bàn'}
                </Button>
                <p className="text-center text-xs text-ink-muted">
                  Giỏ món của bạn vẫn được giữ nguyên tại đây sau khi nhân viên mở bàn.
                </p>
              </div>
            )}
          </div>
        ) : undefined
      }
    >
      {cart.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="Giỏ món đang trống"
          description="Chọn món từ thực đơn để tùy chỉnh độ cay và gửi bếp."
          action={
            <Button variant="primary" size="lg" onClick={onClose} className="rounded-xl">
              Quay lại thực đơn
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {!canSubmitOrder && (
            <div
              role="note"
              className="flex items-start gap-2.5 rounded-xl border border-st-booked/35 bg-st-booked-soft px-3.5 py-3 text-xs text-st-booked-ink"
            >
              <AlertTriangle size={16} aria-hidden className="mt-0.5 shrink-0" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-medium">
                  {sessionBlockReason === 'BILL_LOCKED'
                    ? 'Bàn đã chốt hóa đơn.'
                    : 'Bàn chưa mở phiên phục vụ.'}
                </p>
                <p>
                  {sessionBlockReason === 'BILL_LOCKED'
                    ? 'Gọi nhân viên nếu bạn muốn đặt thêm món.'
                    : 'Bấm "Gọi nhân viên mở bàn" bên dưới. Khi bàn mở, bạn có thể gửi bếp ngay.'}
                </p>
              </div>
            </div>
          )}

          {hasSoldOut && (
            <div
              role="alert"
              className="flex items-center justify-between gap-2 rounded-xl border border-st-serving/35 bg-st-serving-soft px-3.5 py-2.5 text-xs text-st-serving-ink"
            >
              <span>Có món trong giỏ vừa hết nguyên liệu tại bếp.</span>
              <Button variant="danger" size="sm" onClick={onRemoveSoldOut}>
                Xóa món hết
              </Button>
            </div>
          )}

          <ul className="space-y-2.5">
            {cart.map((item) => {
              const isSoldOut = soldOutCartKeys.has(item.key);
              const spiceMeta = SPICE_LEVELS[item.muc_do_cay_yc] ?? SPICE_LEVELS[0];

              return (
                <li
                  key={item.key}
                  className="rounded-xl border border-cream-line bg-paper p-3 shadow-card"
                >
                  <div className="flex items-start gap-3">
                    <DishImage
                      src={item.hinh_anh_url}
                      alt={item.ten_mon_an}
                      grayscale={isSoldOut}
                      className="size-14 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug text-ink">
                          {item.ten_mon_an}
                        </p>
                        <IconButton
                          label={`Xóa ${item.ten_mon_an} khỏi giỏ`}
                          onClick={() => onRemoveItem(item.key)}
                          className="-mr-1.5 -mt-1 size-11 text-ink-muted hover:text-st-serving"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </div>

                      <p className="mt-0.5 text-xs text-ink-muted">
                        {spiceMeta.label}
                        {item.ghi_chu_mon ? ` · ${item.ghi_chu_mon}` : ''}
                      </p>

                      {isSoldOut && (
                        <div className="mt-1.5">
                          <Badge tone="danger" size="sm" dot>
                            Vừa hết món
                          </Badge>
                        </div>
                      )}

                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="num text-sm font-medium text-primary">
                          {formatVnd(item.don_gia * item.so_luong)}
                        </span>
                        <QuantityStepper
                          value={item.so_luong}
                          min={0}
                          max={20}
                          size="lg"
                          label={`Số lượng ${item.ten_mon_an}`}
                          onChange={(next) => onChangeQty(item.key, next)}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
