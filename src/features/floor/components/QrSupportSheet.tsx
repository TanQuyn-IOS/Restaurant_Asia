import type { ReactNode } from 'react';
import {
  BellRing,
  Check,
  CheckCheck,
  Clock,
  Droplets,
  Lock,
  ReceiptText,
  Snowflake,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock } from '@/lib/format';
import { GUEST_REQUEST_META } from '@/lib/labels';
import type { Ban, GuestRequestType, KhuVuc, YeuCauKhachHang } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import { Sheet } from '@/components/ui/Overlay';
import { splitZoneName } from '../floorHelpers';

interface QrSupportSheetProps {
  open: boolean;
  highlightedId: string | null;
  requests: YeuCauKhachHang[];
  tables: Ban[];
  zones: KhuVuc[];
  canOperate: boolean;
  readOnlyReason: string | null;
  onResolve: (maYeuCau: string) => void;
  onOpenTable?: (maBan: string) => void;
  onClose: () => void;
}

const REQUEST_STYLE: Record<GuestRequestType, { icon: ReactNode; boxClass: string }> = {
  GoiNuocLoc: {
    icon: <Droplets size={17} aria-hidden />,
    boxClass: 'bg-info-soft text-info-ink',
  },
  GoiKhanLanh: {
    icon: <Snowflake size={17} aria-hidden />,
    boxClass: 'bg-st-empty-soft text-st-empty-ink',
  },
  YeuCauKiemBill: {
    icon: <ReceiptText size={17} aria-hidden />,
    boxClass: 'bg-st-booked-soft text-st-booked-ink',
  },
  GapPhucVu: {
    icon: <BellRing size={17} aria-hidden />,
    boxClass: 'bg-primary-soft text-primary',
  },
};

/** Ngăn kéo trượt từ bên phải hiển thị đầy đủ các yêu cầu khách QR tại bàn. */
export function QrSupportSheet({
  open,
  highlightedId,
  requests,
  tables,
  zones,
  canOperate,
  readOnlyReason,
  onResolve,
  onOpenTable,
  onClose,
}: QrSupportSheetProps) {
  const tableMap = new Map(tables.map((b) => [b.ma_ban, b]));
  const zoneMap = new Map(zones.map((z) => [z.ma_khu_vuc, z]));

  const sortedRequests = [...requests].sort((a, b) => {
    if (a.ma_yeu_cau === highlightedId) return -1;
    if (b.ma_yeu_cau === highlightedId) return 1;
    return b.thoi_gian_gui.localeCompare(a.thoi_gian_gui);
  });

  const handleResolveAll = () => {
    if (!canOperate) return;
    for (const req of requests) {
      onResolve(req.ma_yeu_cau);
    }
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      width="md"
      icon={<BellRing size={20} />}
      eyebrow="Hỗ trợ tại bàn"
      title="Yêu cầu khách QR"
      description={
        requests.length > 0
          ? `${requests.length} yêu cầu đang chờ phục vụ`
          : 'Không còn yêu cầu nào đang chờ'
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="num text-xs text-ink-muted">{requests.length} yêu cầu chờ</span>
          <div className="flex items-center gap-2">
            {requests.length > 1 && canOperate && (
              <Button
                variant="secondary"
                size="sm"
                icon={<CheckCheck size={14} />}
                onClick={handleResolveAll}
              >
                Xong tất cả
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {readOnlyReason && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-lg border border-st-booked/40 bg-st-booked-soft px-3.5 py-2.5 text-xs text-st-booked-ink"
          >
            <Lock size={14} aria-hidden className="mt-0.5 shrink-0" />
            <span>{readOnlyReason}</span>
          </div>
        )}

        {sortedRequests.length === 0 ? (
          <EmptyState
            icon={<BellRing size={22} />}
            title="Đã xử lý hết yêu cầu"
            description="Khi khách bấm Gọi phục vụ trên thực đơn QR, yêu cầu sẽ hiện ngay tại đây."
          />
        ) : (
          <ul className="space-y-3" aria-label="Danh sách yêu cầu hỗ trợ từ khách QR">
            {sortedRequests.map((req) => {
              const ban = tableMap.get(req.ma_ban);
              const zone = ban ? zoneMap.get(ban.ma_khu_vuc) : undefined;
              const zoneShort = zone ? splitZoneName(zone.ten_khu_vuc).short : undefined;
              const meta = GUEST_REQUEST_META[req.loai_yeu_cau];
              const style = REQUEST_STYLE[req.loai_yeu_cau];
              const isHighlighted = req.ma_yeu_cau === highlightedId;
              const canOpenOrder =
                ban && (ban.trang_thai_ban === 'DangPhucVu' || ban.trang_thai_ban === 'ChoThanhToan');

              return (
                <li
                  key={req.ma_yeu_cau}
                  className={cn(
                    'space-y-3 rounded-lg border p-4 transition-colors',
                    isHighlighted
                      ? 'border-primary bg-primary-soft/35'
                      : 'border-line bg-paper',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        'grid size-10 shrink-0 place-items-center rounded-lg',
                        style.boxClass,
                      )}
                    >
                      {style.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {ban?.ten_ban ?? req.ma_ban}
                        </p>
                        <Badge tone="warning" size="sm" icon={<Clock size={11} aria-hidden />}>
                          <span className="num">{formatClock(req.thoi_gian_gui)}</span>
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        <span className="num">{req.ma_ban}</span>
                        {zoneShort ? ` · ${zoneShort}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-md bg-paper-warm px-3 py-2">
                    <p className="text-sm font-medium text-ink">{meta.label}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {req.ghi_chu_yeu_cau || meta.hint}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {canOpenOrder && onOpenTable && (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<UtensilsCrossed size={13} />}
                        onClick={() => {
                          onClose();
                          onOpenTable(req.ma_ban);
                        }}
                      >
                        Mở bàn
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!canOperate}
                      title={readOnlyReason ?? 'Đánh dấu đã phục vụ yêu cầu này'}
                      icon={<Check size={14} />}
                      onClick={() => onResolve(req.ma_yeu_cau)}
                    >
                      Đã xong
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Sheet>
  );
}
