import {
  BellRing,
  Check,
  ChefHat,
  Clock,
  Crown,
  Lock,
  MessageSquareText,
  QrCode,
  Utensils,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatDuration, minutesSince } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CustomerGroupBadge, ItemStatusBadge, SpiceMeter } from '@/components/domain/badges';
import { parseTableOriginNote } from '@/features/floor/tableOriginTag';
import { normalizeIsoTimestamp, type KdsDishEntry, type KdsTicket } from '../kdsHelpers';

interface KdsTicketCardProps {
  ticket: KdsTicket;
  nowMs: number;
  canAct: boolean;
  disabledReason?: string;
  onAdvanceStatus: (maChiTietOrder: string, nextStatus: 'DangCheBien' | 'HoanThanh') => void;
}

function DishRow({
  entry,
  canAct,
  disabledReason,
  onAdvanceStatus,
}: {
  entry: KdsDishEntry;
  canAct: boolean;
  disabledReason?: string;
  onAdvanceStatus: (maChiTietOrder: string, nextStatus: 'DangCheBien' | 'HoanThanh') => void;
}) {
  const { item, dishName, cookMinutes } = entry;
  const isWaiting = item.trang_thai_mon === 'ChoCheBien';
  const isCooking = item.trang_thai_mon === 'DangCheBien';
  const isDone = item.trang_thai_mon === 'HoanThanh' || item.trang_thai_mon === 'DaPhucVu';
  const orderTimeIso = normalizeIsoTimestamp(item.thoi_gian_goi);

  return (
    <li className="space-y-2.5 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-label={`Số lượng ${item.so_luong}`}
            className={cn(
              'num grid size-9 shrink-0 place-items-center rounded-md border text-sm font-medium',
              isDone
                ? 'border-line bg-paper-warm text-ink-muted'
                : 'border-line-strong bg-sunken text-ink',
            )}
          >
            <span>
              {item.so_luong}
              <span className="text-xs font-normal text-ink-muted">×</span>
            </span>
          </span>

          <div className="min-w-0">
            <p className={cn('text-sm font-medium leading-snug', isDone ? 'text-ink-soft' : 'text-ink')}>
              {dishName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-ink-muted">
              <SpiceMeter level={item.muc_do_cay_yc} withLabel />
              <span aria-hidden className="text-ink-faint">·</span>
              <Badge
                tone={item.nguon_goi === 'MobileQR' ? 'info' : 'neutral'}
                size="sm"
                icon={
                  item.nguon_goi === 'MobileQR' ? (
                    <QrCode size={11} aria-hidden />
                  ) : (
                    <Utensils size={11} aria-hidden />
                  )
                }
              >
                {item.nguon_goi === 'MobileQR' ? 'Mobile QR' : 'Phục vụ'}
              </Badge>
              <span className="num">
                Lượt #{item.lan_goi} · {formatClock(orderTimeIso)}
              </span>
              {!isDone && <span className="num">~{cookMinutes}p</span>}
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <ItemStatusBadge status={item.trang_thai_mon} />
        </div>
      </div>

      {(() => {
        const { originTableId, cleanNote } = parseTableOriginNote(item.ghi_chu_mon);
        if (!originTableId && !cleanNote) return null;
        return (
          <div className="flex flex-wrap items-start gap-2 rounded-md border border-line bg-paper-warm px-3 py-2 text-xs text-ink-soft">
            <MessageSquareText size={13} aria-hidden className="mt-0.5 shrink-0 text-gold-ink" />
            {originTableId && (
              <Badge tone="info" size="sm">
                Bàn {originTableId}
              </Badge>
            )}
            {cleanNote && <span className="min-w-0">{cleanNote}</span>}
          </div>
        );
      })()}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <span className="text-xs text-ink-muted">
          {isWaiting && 'Chưa khóa hủy món · Chờ bếp tiếp nhận'}
          {isCooking && (
            <span className="inline-flex items-center gap-1 text-st-serving-ink">
              <Lock size={12} aria-hidden />
              Đã khóa quyền hủy món (FR-11)
            </span>
          )}
          {item.trang_thai_mon === 'HoanThanh' && (
            <span className="inline-flex items-center gap-1 text-st-empty-ink">
              <BellRing size={12} aria-hidden />
              Đã nạp bill · Trừ kho BOM · Báo Ting
            </span>
          )}
          {item.trang_thai_mon === 'DaPhucVu' && 'Đã phục vụ tại bàn · Đã nạp hóa đơn'}
        </span>

        {isWaiting && (
          <Button
            size="sm"
            variant="secondary"
            icon={<ChefHat size={14} aria-hidden />}
            disabled={!canAct}
            title={!canAct ? disabledReason : 'Bắt đầu chế biến và khóa hủy món'}
            onClick={() => onAdvanceStatus(item.ma_chi_tiet_order, 'DangCheBien')}
          >
            Bắt đầu nấu
          </Button>
        )}

        {isCooking && (
          <Button
            size="sm"
            variant="primary"
            icon={<Check size={14} aria-hidden />}
            disabled={!canAct}
            title={!canAct ? disabledReason : 'Đánh dấu xong, phát chuông Ting và nạp vào bill'}
            onClick={() => onAdvanceStatus(item.ma_chi_tiet_order, 'HoanThanh')}
          >
            Hoàn thành
          </Button>
        )}
      </div>
    </li>
  );
}

/** Thẻ phiếu bếp nhóm theo đơn bàn (ghim bàn VIP bằng nền gold-soft + nhãn VIP ƯU TIÊN). */
export function KdsTicketCard({
  ticket,
  nowMs,
  canAct,
  disabledReason,
  onAdvanceStatus,
}: KdsTicketCardProps) {
  const earliestIso = normalizeIsoTimestamp(ticket.earliestOrderTime);
  const elapsedMinutes = minutesSince(earliestIso, nowMs);
  const isOverdue = ticket.hasActiveDishes && elapsedMinutes >= 20;

  return (
    <Card
      className={cn(
        'flex flex-col overflow-hidden transition-colors',
        ticket.isVip ? 'border-gold/60' : 'border-line',
      )}
    >
      <header
        className={cn(
          'flex items-start justify-between gap-3 border-b px-5 py-3.5',
          ticket.isVip
            ? 'border-gold/30 bg-gold-soft'
            : 'border-line bg-paper-warm',
        )}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {ticket.isVip ? (
              <Badge tone="gold" size="sm" icon={<Crown size={11} aria-hidden />}>
                VIP ƯU TIÊN
              </Badge>
            ) : (
              <span className="eyebrow">Phiếu gọi món</span>
            )}
            <CustomerGroupBadge group={ticket.customerGroup} />
          </div>
          <h3 className="mt-1.5 truncate text-base font-medium text-ink">
            {ticket.tableName}
          </h3>
          {ticket.areaName && (
            <p className="truncate text-xs text-ink-muted">{ticket.areaName}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            title={`Món gọi sớm nhất lúc ${formatClock(earliestIso)}`}
            className={cn(
              'num inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
              isOverdue
                ? 'bg-st-serving-soft text-st-serving-ink'
                : ticket.isVip
                  ? 'bg-paper text-gold-ink'
                  : 'bg-paper text-ink-soft',
            )}
          >
            <Clock size={12} aria-hidden />
            {formatDuration(elapsedMinutes)}
          </span>
          <span className="num text-xs text-ink-muted">
            Gọi {formatClock(earliestIso)}
          </span>
        </div>
      </header>

      <ul className="flex-1 divide-y divide-line">
        {ticket.items.map((entry) => (
          <DishRow
            key={entry.item.ma_chi_tiet_order}
            entry={entry}
            canAct={canAct}
            disabledReason={disabledReason}
            onAdvanceStatus={onAdvanceStatus}
          />
        ))}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-paper-warm/70 px-5 py-2.5 text-xs text-ink-muted">
        <span className="num font-medium text-ink-soft">Phiếu #{ticket.maOrder}</span>
        <span className="num">
          {ticket.doneCount}/{ticket.waitingCount + ticket.cookingCount + ticket.doneCount} món xong
        </span>
      </footer>
    </Card>
  );
}
