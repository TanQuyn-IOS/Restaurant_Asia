import { Clock, Lock, Utensils } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { stripTableOriginTag } from '@/features/floor/tableOriginTag';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ProgressBar } from '@/components/ui/Misc';
import { Sheet } from '@/components/ui/Overlay';
import { DishImage } from '@/components/domain/badges';
import type { BillPreviewSummary, EnrichedOrderItem } from '../qrHelpers';

export type OrderTrackingTab = 'kitchen' | 'bill';

interface OrderTrackingSheetProps {
  open: boolean;
  activeTab: OrderTrackingTab;
  onTabChange: (tab: OrderTrackingTab) => void;
  onClose: () => void;
  tableLabel: string;
  areaLabel: string;
  orderItems: EnrichedOrderItem[];
  activeKitchenCount: number;
  billSummary: BillPreviewSummary;
}

const PROGRESS_STEPS: readonly ('Chờ' | 'Đang nấu' | 'Hoàn thành')[] = [
  'Chờ',
  'Đang nấu',
  'Hoàn thành',
];

/** Sheet 2 tab: Tiến độ bếp (mockup 15–16) và Tạm tính hóa đơn (mockup 17). */
export function OrderTrackingSheet({
  open,
  activeTab,
  onTabChange,
  onClose,
  tableLabel,
  areaLabel,
  orderItems,
  activeKitchenCount,
  billSummary,
}: OrderTrackingSheetProps) {
  const sheetTitle =
    activeTab === 'kitchen' ? 'Tiến độ bếp của bạn' : 'Tạm tính hóa đơn';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      frame="mobile"
      eyebrow={`${tableLabel.toUpperCase()} · ${areaLabel.toUpperCase()}`}
      title={<span className="t-display text-ink">{sheetTitle}</span>}
      footer={
        <div className="flex items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)]">
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <Lock size={14} aria-hidden className="shrink-0" />
            Phiên bàn được bảo mật
          </span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-primary hover:underline"
          >
            Quay lại thực đơn
          </button>
        </div>
      }
    >
      {/* Thanh chuyển 2 tab Tiến độ bếp / Tạm tính */}
      <div
        role="tablist"
        aria-label="Theo dõi đơn hàng tại bàn"
        className="mb-4 grid grid-cols-2 border-b border-cream-line"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'kitchen'}
          onClick={() => onTabChange('kitchen')}
          className={cn(
            'relative -mb-px flex min-h-11 items-center justify-center gap-2 border-b-2 px-2 text-sm transition-colors',
            activeTab === 'kitchen'
              ? 'border-primary font-medium text-primary'
              : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          <Clock size={16} aria-hidden />
          <span>Tiến độ bếp</span>
          {activeKitchenCount > 0 && (
            <span
              aria-label={`${activeKitchenCount} món đang chế biến`}
              className="size-2 rounded-full bg-primary"
            />
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'bill'}
          onClick={() => onTabChange('bill')}
          className={cn(
            'relative -mb-px flex min-h-11 items-center justify-center gap-2 border-b-2 px-2 text-sm transition-colors',
            activeTab === 'bill'
              ? 'border-primary font-medium text-primary'
              : 'border-transparent text-ink-muted hover:text-ink',
          )}
        >
          <Utensils size={16} aria-hidden />
          <span>Tạm tính</span>
        </button>
      </div>

      {/* Tab 1: Tiến độ bếp realtime */}
      {activeTab === 'kitchen' ? (
        orderItems.length === 0 ? (
          <EmptyState
            icon={<Clock size={24} />}
            title="Chưa có món nào gửi bếp"
            description="Sau khi bạn chọn món và bấm Gửi bếp, tiến độ chế biến sẽ cập nhật trực tiếp tại đây."
          />
        ) : (
          <ul className="space-y-3" aria-label="Danh sách tiến độ chế biến của bếp">
            {orderItems.map((entry) => (
              <li
                key={entry.item.ma_chi_tiet_order}
                className="rounded-xl border border-cream-line bg-paper p-3.5 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <DishImage
                    src={entry.hinh_anh_url}
                    alt={entry.ten_mon_an}
                    className="size-14 shrink-0 rounded-lg"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug text-ink">
                        <span className="num">{entry.item.so_luong}×</span>{' '}
                        {entry.ten_mon_an}
                      </p>
                      <Badge
                        tone={entry.progress.tone}
                        dot
                        size="sm"
                        className="shrink-0"
                      >
                        {entry.progress.label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {entry.spiceLabel}
                      {(() => {
                        const cleanNote = stripTableOriginTag(entry.item.ghi_chu_mon);
                        return cleanNote ? ` · ${cleanNote}` : '';
                      })()}
                    </p>
                  </div>
                </div>

                {/* Thanh 3 mốc Chờ → Đang nấu → Hoàn thành */}
                <div className="mt-3.5">
                  <ProgressBar
                    value={entry.progress.percent}
                    tone={entry.progress.tone}
                    label={`Tiến độ ${entry.ten_mon_an}: ${entry.progress.label}`}
                  />
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    {PROGRESS_STEPS.map((stepLabel) => {
                      const isCurrent = entry.progress.activeStepLabel === stepLabel;
                      return (
                        <span
                          key={stepLabel}
                          className={cn(
                            isCurrent ? 'font-medium text-ink' : 'text-ink-muted',
                          )}
                        >
                          {stepLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        /* Tab 2: Tạm tính hóa đơn (chỉ món đã hoàn thành / phục vụ) */
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-cream-line bg-cream p-3.5">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-gold-soft text-gold-ink"
            >
              <Utensils size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                Chỉ món đã phục vụ mới được tính vào hóa đơn
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                Tổng tiền tự động cập nhật khi từng món được bếp hoàn thành.
                {billSummary.pendingItemsCount > 0 && (
                  <>
                    {' '}
                    Hiện còn{' '}
                    <span className="num font-medium text-ink-soft">
                      {billSummary.pendingItemsCount}
                    </span>{' '}
                    món đang chờ bếp chưa tính vào đây.
                  </>
                )}
              </p>
            </div>
          </div>

          {billSummary.servedItems.length === 0 ? (
            <EmptyState
              icon={<Utensils size={24} />}
              title="Chưa có món hoàn thành trên hóa đơn"
              description="Khi bếp hoàn thành và phục vụ món lên bàn, từng món sẽ hiển thị minh bạch tại đây."
            />
          ) : (
            <>
              <ul
                aria-label="Các món đã phục vụ tính vào tạm tính"
                className="divide-y divide-cream-line border-y border-cream-line"
              >
                {billSummary.servedItems.map((entry) => (
                  <li
                    key={entry.item.ma_chi_tiet_order}
                    className="flex items-start justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        <span className="num">{entry.item.so_luong}×</span>{' '}
                        {entry.ten_mon_an}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {entry.spiceLabel}
                        {(() => {
                          const cleanNote = stripTableOriginTag(entry.item.ghi_chu_mon);
                          return cleanNote ? ` · ${cleanNote}` : '';
                        })()}
                      </p>
                    </div>
                    <span className="num shrink-0 text-sm font-medium text-ink">
                      {formatVnd(entry.lineTotal)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-muted">Tạm tính món đã phục vụ</span>
                  <span className="num font-medium text-ink">
                    {formatVnd(billSummary.servedSubtotal)}
                  </span>
                </div>

                {billSummary.tienGiamGia > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-muted">
                      Ưu đãi thành viên (
                      <span className="num">
                        −{Math.round(billSummary.tyLeGiamVip * 100)}%
                      </span>
                      )
                    </span>
                    <span className="num font-medium text-st-empty-ink">
                      −{formatVnd(billSummary.tienGiamGia)}
                    </span>
                  </div>
                )}

                {billSummary.tienCocTru > 0 && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-muted">Tiền đặt cọc đã trừ</span>
                    <span className="num font-medium text-st-empty-ink">
                      −{formatVnd(billSummary.tienCocTru)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink-muted">Phí dịch vụ &amp; VAT</span>
                  <span className="text-xs text-ink-muted">
                    Hiển thị ở hóa đơn cuối
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-3 border-t border-cream-line pt-4">
                <span className="text-base font-medium text-ink">
                  Tổng tạm tính hiện tại
                </span>
                <span className="num text-xl font-bold text-primary">
                  {formatVnd(billSummary.currentPreviewTotal)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
