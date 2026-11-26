import { BellRing, Clock, GitMerge, QrCode, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatVnd } from '@/lib/format';
import { TABLE_STATUS_META } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';
import {
  CustomerGroupBadge,
  TABLE_STATUS_CARD,
  TableStatusBadge,
} from '@/components/domain/badges';
import type { FloorTableVM } from '../floorHelpers';
import { TableIllustration } from './TableIllustration';

export function TableCard({
  vm,
  selected,
  onSelect,
}: {
  vm: FloorTableVM;
  selected: boolean;
  onSelect: (vm: FloorTableVM) => void;
}) {
  const {
    ban,
    activeOrder,
    bill,
    reservation,
    customer,
    masterTable,
    mergedChildren,
    pendingRequestCount,
    isPaidAwaitingRelease,
  } = vm;

  const statusMeta = TABLE_STATUS_META[ban.trang_thai_ban];

  const isOccupied = ban.trang_thai_ban === 'DangPhucVu' || ban.trang_thai_ban === 'ChoThanhToan';

  return (
    <article
      className={cn(
        'group relative flex flex-col rounded-lg border border-line border-t-2 bg-paper shadow-card transition-colors hover:border-line-strong hover:bg-paper-warm/40',
        TABLE_STATUS_CARD[ban.trang_thai_ban],
        selected && 'ring-2 ring-primary/35',
      )}
    >
      {/* Nút chọn toàn thẻ (tách riêng khỏi link QR để tránh lồng thẻ tương tác) */}
      <button
        type="button"
        onClick={() => onSelect(vm)}
        aria-label={`Chọn ${ban.ten_ban}, ${statusMeta.label}, ${ban.so_ghe} ghế`}
        className="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col p-3">
        {/* Hàng trên: Tên bàn & trạng thái */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-ink" title={ban.ten_ban}>
              {ban.ten_ban}
            </h3>
            <p className="num text-xs text-ink-muted">{ban.ma_ban}</p>
          </div>
          <TableStatusBadge status={ban.trang_thai_ban} size="sm" className="shrink-0" />
        </div>

        {/* Thẻ phụ: VIP ưu tiên / Ghép bàn / Yêu cầu QR */}
        {(activeOrder?.vip_flag || masterTable || mergedChildren.length > 0 || pendingRequestCount > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {activeOrder?.vip_flag && (
              <Badge tone="gold" size="sm">
                ✦ VIP ưu tiên
              </Badge>
            )}
            {masterTable && (
              <Badge tone="info" size="sm" icon={<GitMerge size={11} aria-hidden />}>
                Ghép {masterTable.ma_ban}
              </Badge>
            )}
            {mergedChildren.length > 0 && (
              <Badge tone="info" size="sm" icon={<GitMerge size={11} aria-hidden />}>
                +{mergedChildren.length} ghép
              </Badge>
            )}
            {pendingRequestCount > 0 && (
              <Badge tone="warning" size="sm" icon={<BellRing size={11} aria-hidden />}>
                {pendingRequestCount} gọi NV
              </Badge>
            )}
          </div>
        )}

        {/* Minh họa bàn & ghế */}
        <div className="my-1.5 flex flex-1 items-center justify-center">
          <TableIllustration status={ban.trang_thai_ban} seats={ban.so_ghe} tableType={ban.loai_ban} />
        </div>

        {/* Hàng giữa: Số ghế + link QR mở tab mới */}
        <div className="flex items-center justify-between gap-2 pb-1.5 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Users size={12} aria-hidden />
            <span className="num">{ban.so_ghe} ghế</span>
          </span>

          <a
            href={`/qr/${ban.ma_ban}`}
            target="_blank"
            rel="noopener"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Mở cổng khách QR cho ${ban.ten_ban}`}
            title={`Mở cổng QR (${ban.ma_qr_code}) ở tab mới`}
            className="pointer-events-auto relative z-20 inline-grid size-7 place-items-center rounded-md text-ink-muted transition-colors hover:bg-sunken hover:text-primary"
          >
            <QrCode size={14} aria-hidden />
          </a>
        </div>

        {/* Chân thẻ: Nhóm khách / Sẵn sàng + Tổng bill / Giờ đặt */}
        <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
          {isOccupied && activeOrder ? (
            <CustomerGroupBadge group={activeOrder.loai_khach_phien} />
          ) : ban.trang_thai_ban === 'DaDat' && customer ? (
            <CustomerGroupBadge group={customer.loai_khach} />
          ) : (
            <span className="inline-flex items-center rounded-md bg-sunken px-2 py-0.5 text-xs text-ink-muted">
              Sẵn sàng
            </span>
          )}

          {isOccupied && isPaidAwaitingRelease ? (
            <span className="inline-flex items-center rounded-md bg-st-empty-soft px-2 py-0.5 text-xs font-medium text-st-empty-ink">
              Chờ dọn
            </span>
          ) : isOccupied && bill ? (
            <span
              className="num text-xs font-medium text-ink"
              title={`${bill.completedItemsCount} món xong, ${bill.pendingItemsCount} món chờ bếp`}
            >
              {formatVnd(bill.tongTienPhaiTra)}
            </span>
          ) : ban.trang_thai_ban === 'DaDat' && reservation ? (
            <span className="num inline-flex items-center gap-1 text-xs font-medium text-st-booked-ink">
              <Clock size={12} aria-hidden />
              {formatClock(reservation.thoi_gian_den)}
            </span>
          ) : (
            <span className="text-xs text-ink-faint">Mở bàn</span>
          )}
        </div>
      </div>
    </article>
  );
}
