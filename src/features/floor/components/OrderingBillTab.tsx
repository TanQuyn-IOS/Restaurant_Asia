import { Building2, CheckCircle2, UtensilsCrossed, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatVnd } from '@/lib/format';
import {
  calculateCompletedOrderBill,
  canCancelOrderItem,
} from '@/store/useRestaurantStore';
import type { Ban, ChiTietDonGoi, KhachDoan, MonAn } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import { DishImage, ItemStatusBadge, SpiceMeter } from '@/components/domain/badges';
import { parseTableOriginNote } from '../tableOriginTag';

export function OrderingBillTab({
  orderItems,
  dishes,
  tables = [],
  bill,
  groupInfo,
  isServing,
  canOperate,
  readOnlyReason,
  onOpenBrowse,
  onMarkServed,
  onCancelItem,
}: {
  orderItems: ChiTietDonGoi[];
  dishes: MonAn[];
  tables?: Ban[];
  bill: ReturnType<typeof calculateCompletedOrderBill> | null;
  groupInfo: KhachDoan | undefined;
  isServing: boolean;
  canOperate: boolean;
  readOnlyReason: string | null;
  onOpenBrowse: () => void;
  onMarkServed: (maChiTietOrder: string) => void;
  onCancelItem: (maChiTietOrder: string) => void;
}) {
  const tableNameById = new Map(tables.map((t) => [t.ma_ban, t.ten_ban]));
  return (
    <div className="space-y-5">
      {/* Danh sách món đã gọi */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="t-label">Món đã gọi ({orderItems.length})</p>
          {isServing && canOperate && (
            <Button size="sm" variant="secondary" onClick={onOpenBrowse}>
              + Gọi thêm món
            </Button>
          )}
        </div>

        {orderItems.length === 0 ? (
          <EmptyState
            icon={<UtensilsCrossed size={22} />}
            title="Chưa có món ăn nào trong phiên"
            description="Chuyển sang tab Gọi thêm món để chọn thực đơn gửi xuống bếp KDS."
            action={
              isServing && canOperate ? (
                <Button variant="primary" size="sm" onClick={onOpenBrowse}>
                  Mở thực đơn gọi món
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-paper">
            {orderItems.map((item) => {
              const dish = dishes.find((m) => m.ma_mon_an === item.ma_mon_an);
              const cancelCheck = canCancelOrderItem(item.trang_thai_mon);
              const isBillable =
                item.trang_thai_mon === 'HoanThanh' || item.trang_thai_mon === 'DaPhucVu';
              const isCancelled = item.trang_thai_mon === 'DaHuy';

              return (
                <li
                  key={item.ma_chi_tiet_order}
                  className={cn('space-y-2 p-3.5', isCancelled && 'bg-paper-warm opacity-55')}
                >
                  <div className="flex items-start gap-3">
                    <DishImage
                      src={dish?.hinh_anh_url}
                      alt={dish?.ten_mon_an ?? item.ma_mon_an}
                      grayscale={isCancelled}
                      className="size-12 shrink-0 rounded-md"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium text-ink', isCancelled && 'line-through')}>
                          <span className="num">{item.so_luong}×</span>{' '}
                          {dish?.ten_mon_an ?? item.ma_mon_an}
                        </p>
                        <span className="num text-sm font-medium text-ink">
                          {formatVnd(item.don_gia_thoi_diem * item.so_luong)}
                        </span>
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <ItemStatusBadge status={item.trang_thai_mon} />
                        {(() => {
                          const { originTableId } = parseTableOriginNote(item.ghi_chu_mon);
                          if (!originTableId) return null;
                          return (
                            <Badge tone="info" size="sm">
                              Từ {tableNameById.get(originTableId) ?? originTableId}
                            </Badge>
                          );
                        })()}
                        <SpiceMeter level={item.muc_do_cay_yc} withLabel />
                        <span className="num">
                          Đợt {item.lan_goi} · {item.nguon_goi === 'MobileQR' ? 'Khách QR' : 'Phục vụ'} ·{' '}
                          {formatClock(item.thoi_gian_goi)}
                        </span>
                      </div>

                      {(() => {
                        const { cleanNote } = parseTableOriginNote(item.ghi_chu_mon);
                        if (!cleanNote) return null;
                        return <p className="mt-1 text-xs text-ink-soft">Ghi chú: {cleanNote}</p>;
                      })()}

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-xs font-medium',
                            isBillable
                              ? 'text-st-empty-ink'
                              : isCancelled
                                ? 'text-ink-muted'
                                : 'text-st-booked-ink',
                          )}
                        >
                          {isBillable
                            ? 'Đã tính vào bill'
                            : isCancelled
                              ? 'Đã hủy, không tính tiền'
                              : 'Đang chờ bếp hoàn thành'}
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {item.trang_thai_mon === 'HoanThanh' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={!canOperate}
                              title={readOnlyReason ?? 'Xác nhận đã bưng món ra bàn'}
                              onClick={() => onMarkServed(item.ma_chi_tiet_order)}
                              icon={<CheckCircle2 size={13} />}
                            >
                              Đã phục vụ
                            </Button>
                          )}

                          {!isCancelled && isServing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={!canOperate || !cancelCheck.allowed}
                              title={
                                !canOperate
                                  ? (readOnlyReason ?? undefined)
                                  : cancelCheck.allowed
                                    ? 'Hủy món chưa chế biến khỏi hàng đợi bếp'
                                    : cancelCheck.reason
                              }
                              onClick={() => onCancelItem(item.ma_chi_tiet_order)}
                              icon={<XCircle size={13} />}
                            >
                              Hủy món
                            </Button>
                          )}
                        </div>
                      </div>

                      {!isCancelled && isServing && !cancelCheck.allowed && (
                        <p className="mt-1 text-xs text-ink-muted">Khóa hủy: {cancelCheck.reason}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Khối Kiểm bill cùng khách (FR-15 & UC-07) */}
      {bill && (
        <section
          aria-label="Kiểm bill cùng khách"
          className="space-y-3 rounded-lg border border-line bg-paper-warm p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-ink">Kiểm bill cùng khách</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Chỉ tính các món bếp đã hoàn thành hoặc đã phục vụ.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="success" size="sm">
                <span className="num">{bill.completedItemsCount}</span> món tính tiền
              </Badge>
              {bill.pendingItemsCount > 0 && (
                <Badge tone="warning" size="sm">
                  <span className="num">{bill.pendingItemsCount}</span> món chờ bếp (chưa tính)
                </Badge>
              )}
            </div>
          </div>

          {bill.pendingItemsCount > 0 && isServing && (
            <p className="rounded-md border border-st-booked/35 bg-st-booked-soft px-3 py-2 text-xs text-st-booked-ink">
              Còn <span className="num font-medium">{bill.pendingItemsCount}</span> món chưa hoàn thành tại bếp (không
              nằm trong tổng tiền bên dưới). Nếu chốt bill ngay, các món đang Chờ chế biến sẽ tự hủy.
            </p>
          )}

          <dl className="space-y-2 border-t border-line pt-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-soft">
                Tiền món hoàn thành (<span className="num">{bill.completedItemsCount}</span> món)
              </dt>
              <dd className="num font-medium text-ink">{formatVnd(bill.tongTienMonHoanThanh)}</dd>
            </div>

            {bill.tienGiamGia > 0 && (
              <div className="flex items-center justify-between gap-4 text-st-empty-ink">
                <dt>
                  Chiết khấu hạng thẻ (<span className="num">{Math.round(bill.tyLeGiamVip * 100)}%</span>)
                </dt>
                <dd className="num font-medium">−{formatVnd(bill.tienGiamGia)}</dd>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <dt className="text-ink-soft">Thuế GTGT (VAT 8%)</dt>
              <dd className="num text-ink">+{formatVnd(bill.tienThueVat)}</dd>
            </div>

            {bill.tienCocTru > 0 && (
              <div className="flex items-center justify-between gap-4 text-primary">
                <dt>Khấu trừ tiền đặt cọc</dt>
                <dd className="num font-medium">−{formatVnd(bill.tienCocTru)}</dd>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 border-t border-line-strong pt-2.5 text-base font-bold">
              <dt className="text-ink">Tổng phải thanh toán</dt>
              <dd className="num text-lg text-primary">{formatVnd(bill.tongTienPhaiTra)}</dd>
            </div>
          </dl>

          {groupInfo && (
            <div className="flex items-start gap-2 border-t border-line pt-2.5 text-xs text-ink-soft">
              <Building2 size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <span>
                Hóa đơn VAT công ty: <span className="font-medium text-ink">{groupInfo.ten_cong_ty}</span> · MST{' '}
                <span className="num font-medium text-ink">{groupInfo.ma_so_thue}</span>
              </span>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
