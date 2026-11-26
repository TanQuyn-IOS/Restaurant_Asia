import {
  Check,
  ChefHat,
  Clock,
  Crown,
  MessageSquareText,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatDuration, minutesSince } from '@/lib/format';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CustomerGroupBadge, SpiceMeter } from '@/components/domain/badges';
import { parseTableOriginNote } from '@/features/floor/tableOriginTag';
import { normalizeIsoTimestamp, type KdsDishEntry, type KdsTicket } from '../kdsHelpers';

interface KdsTicketCardProps {
  ticket: KdsTicket;
  nowMs: number;
  canAct: boolean;
  disabledReason?: string;
  onAdvanceStatus: (maChiTietOrder: string, nextStatus: 'DangCheBien' | 'HoanThanh') => void;
}

/** Rút gọn tên khu vực bằng cách bỏ phần chú thích trong ngoặc đơn để tránh tràn chữ trên thẻ bếp. */
function shortAreaName(areaName: string): string {
  return areaName.replace(/\s*\([^)]*\)\s*$/, '').trim();
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
  const { originTableId, cleanNote } = parseTableOriginNote(item.ghi_chu_mon);

  return (
    <li
      className={cn(
        'px-4 transition-colors',
        isDone ? 'bg-paper-warm/70 py-2.5' : 'bg-paper py-3',
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            aria-label={`Số lượng ${item.so_luong}`}
            className={cn(
              'num grid size-8 shrink-0 place-items-center rounded-md text-xs font-medium',
              isDone
                ? 'border border-line bg-sunken text-ink-muted'
                : isCooking
                  ? 'bg-st-serving text-white'
                  : 'bg-chrome text-chrome-ink',
            )}
          >
            {item.so_luong}×
          </span>

          <div className="min-w-0">
            <p
              className={cn(
                'text-sm font-medium leading-snug',
                isDone ? 'text-ink-soft' : 'text-ink',
              )}
            >
              {dishName}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
              {isWaiting && (
                <span className="inline-flex items-center gap-1 font-medium text-st-booked-ink">
                  <StatusDot tone="warning" />
                  Chờ nấu
                </span>
              )}
              {isCooking && (
                <span className="inline-flex items-center gap-1 font-medium text-st-serving-ink">
                  <StatusDot tone="danger" pulse />
                  Đang nấu
                </span>
              )}

              {item.muc_do_cay_yc > 0 && <SpiceMeter level={item.muc_do_cay_yc} withLabel />}

              {item.nguon_goi === 'MobileQR' && (
                <Badge tone="info" size="sm" icon={<QrCode size={10} aria-hidden />}>
                  QR
                </Badge>
              )}

              <span className="num">
                {item.lan_goi > 1 ? `Lượt ${item.lan_goi} · ` : ''}
                {formatClock(orderTimeIso)}
                {!isDone ? ` · ~${cookMinutes}p` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          {isWaiting && (
            <Button
              size="sm"
              variant="secondary"
              icon={<ChefHat size={13} aria-hidden />}
              disabled={!canAct}
              title={!canAct ? disabledReason : 'Bắt đầu chế biến và khóa hủy món'}
              onClick={() => onAdvanceStatus(item.ma_chi_tiet_order, 'DangCheBien')}
            >
              Nấu
            </Button>
          )}

          {isCooking && (
            <Button
              size="sm"
              variant="primary"
              icon={<Check size={13} aria-hidden />}
              disabled={!canAct}
              title={!canAct ? disabledReason : 'Đánh dấu hoàn thành, báo phục vụ và vào bill'}
              onClick={() => onAdvanceStatus(item.ma_chi_tiet_order, 'HoanThanh')}
            >
              Xong
            </Button>
          )}

          {item.trang_thai_mon === 'HoanThanh' && (
            <Badge tone="success" size="sm" dot>
              Hoàn thành
            </Badge>
          )}

          {item.trang_thai_mon === 'DaPhucVu' && (
            <Badge tone="neutral" size="sm">
              Đã phục vụ
            </Badge>
          )}
        </div>
      </div>

      {(originTableId || cleanNote) && (
        <div
          className={cn(
            'mt-2 ml-10 flex flex-wrap items-start gap-1.5 rounded-md border px-2.5 py-1.5 text-xs',
            isDone
              ? 'border-line bg-sunken/70 text-ink-muted'
              : 'border-gold/40 bg-gold-soft/80 text-ink',
          )}
        >
          <MessageSquareText
            size={12}
            aria-hidden
            className={cn('mt-0.5 shrink-0', isDone ? 'text-ink-muted' : 'text-gold-ink')}
          />
          {originTableId && (
            <Badge tone="info" size="sm">
              Bàn {originTableId}
            </Badge>
          )}
          {cleanNote && <span className="min-w-0 leading-snug">{cleanNote}</span>}
        </div>
      )}
    </li>
  );
}

/** Thẻ phiếu bếp tách màu rõ với nền bảng và phân biệt tức thì VIP, đang làm và đã xong. */
export function KdsTicketCard({
  ticket,
  nowMs,
  canAct,
  disabledReason,
  onAdvanceStatus,
}: KdsTicketCardProps) {
  const earliestIso = normalizeIsoTimestamp(ticket.earliestOrderTime);
  const elapsedMinutes = minutesSince(earliestIso, nowMs);
  const isActive = ticket.hasActiveDishes;
  const isCookingTicket = isActive && ticket.cookingCount > 0;
  const isOverdue = isActive && elapsedMinutes >= 20;
  const isDarkHeader = ticket.isVip && isActive;
  const totalCount = ticket.waitingCount + ticket.cookingCount + ticket.doneCount;
  const areaLabel = shortAreaName(ticket.areaName);

  const cardSurface = isActive
    ? ticket.isVip
      ? 'border-gold border-t-4 border-t-gold-bright shadow-lift'
      : isCookingTicket
        ? 'border-st-serving/45 border-t-4 border-t-st-serving shadow-lift'
        : 'border-st-booked/45 border-t-4 border-t-st-booked shadow-lift'
    : ticket.isVip
      ? 'border-gold/50 border-t-4 border-t-gold shadow-card'
      : 'border-line-strong border-t-4 border-t-st-empty shadow-card';

  const headerSurface = isDarkHeader
    ? 'border-chrome-line bg-chrome text-chrome-ink'
    : isActive
      ? isCookingTicket
        ? 'border-st-serving/25 bg-st-serving-soft text-ink'
        : 'border-st-booked/30 bg-st-booked-soft text-ink'
      : ticket.isVip
        ? 'border-gold/35 bg-gold-soft text-ink'
        : 'border-st-empty/25 bg-st-empty-soft/85 text-ink';

  return (
    <Card className={cn('flex flex-col overflow-hidden transition-shadow', cardSurface)}>
      <header className={cn('flex items-start justify-between gap-3 border-b px-4 py-3', headerSurface)}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {ticket.isVip ? (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  isDarkHeader
                    ? 'border border-gold-bright/40 bg-gold/20 text-gold-bright'
                    : 'bg-paper text-gold-ink border border-gold/35',
                )}
              >
                <Crown size={11} aria-hidden />
                VIP ưu tiên
              </span>
            ) : (
              <CustomerGroupBadge group={ticket.customerGroup} />
            )}
          </div>

          <h3
            title={ticket.tableName}
            className={cn(
              'mt-1.5 truncate text-base font-medium leading-tight',
              isDarkHeader ? 'text-chrome-ink' : 'text-ink',
            )}
          >
            {ticket.tableName}
          </h3>

          {areaLabel && (
            <p
              title={ticket.areaName}
              className={cn(
                'mt-0.5 truncate text-xs',
                isDarkHeader ? 'text-chrome-muted' : 'text-ink-soft',
              )}
            >
              {areaLabel}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {isActive ? (
            <span
              title={`Món gọi sớm nhất lúc ${formatClock(earliestIso)}`}
              className={cn(
                'num inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                isOverdue
                  ? 'bg-st-serving text-white'
                  : isDarkHeader
                    ? 'border border-chrome-line bg-chrome-raised text-gold-bright'
                    : 'border border-line-strong bg-paper text-ink',
              )}
            >
              <Clock size={11} aria-hidden />
              {formatDuration(elapsedMinutes)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-st-empty/30 bg-paper px-2.5 py-0.5 text-xs font-medium text-st-empty-ink">
              <Check size={11} aria-hidden />
              Hoàn tất
            </span>
          )}

          <span
            className={cn(
              'num text-xs',
              isDarkHeader ? 'text-chrome-muted' : 'text-ink-soft',
            )}
          >
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

      <footer className="flex items-center justify-between gap-2 border-t border-line bg-sunken/60 px-4 py-2 text-xs text-ink-muted">
        <span className="num font-medium text-ink-soft">#{ticket.maOrder}</span>
        <span className="num">
          {ticket.doneCount}/{totalCount} xong
        </span>
      </footer>
    </Card>
  );
}
