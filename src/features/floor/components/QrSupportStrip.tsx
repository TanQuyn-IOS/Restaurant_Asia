import { BellRing, ChevronRight } from 'lucide-react';
import { formatClock } from '@/lib/format';
import { GUEST_REQUEST_META } from '@/lib/labels';
import type { Ban, YeuCauKhachHang } from '@/types/database';

interface QrSupportStripProps {
  requests: YeuCauKhachHang[];
  tables: Ban[];
  onOpenSheet: (requestId?: string) => void;
}

function TickerItems({
  requests,
  tables,
  onSelect,
  duplicate = false,
}: {
  requests: YeuCauKhachHang[];
  tables: Ban[];
  onSelect: (requestId: string) => void;
  duplicate?: boolean;
}) {
  return (
    <div
      aria-hidden={duplicate || undefined}
      className="flex min-w-[100cqw] shrink-0 items-center gap-6 pr-6"
    >
      {requests.map((req) => {
        const ban = tables.find((b) => b.ma_ban === req.ma_ban);
        const meta = GUEST_REQUEST_META[req.loai_yeu_cau];
        return (
          <button
            key={duplicate ? `dup-${req.ma_yeu_cau}` : req.ma_yeu_cau}
            type="button"
            tabIndex={duplicate ? -1 : 0}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(req.ma_yeu_cau);
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gold/40 bg-paper px-3 py-1 text-xs whitespace-nowrap text-ink transition-colors hover:border-primary/40 hover:bg-paper-warm"
          >
            <span className="size-1.5 rounded-full bg-primary" aria-hidden />
            <span className="font-medium text-ink">{ban?.ten_ban ?? req.ma_ban}</span>
            <span className="text-ink-soft">{meta.label}</span>
            <span className="num text-ink-muted">· {formatClock(req.thoi_gian_gui)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Dải thông báo 1 dòng chạy ngang từ phải sang trái; bấm vào để mở ngăn kéo chi tiết bên phải. */
export function QrSupportStrip({ requests, tables, onOpenSheet }: QrSupportStripProps) {
  if (requests.length === 0) return null;

  const durationSeconds = Math.max(16, requests.length * 8);

  return (
    <section
      aria-label="Yêu cầu hỗ trợ từ khách QR"
      onClick={() => onOpenSheet()}
      className="group flex h-11 cursor-pointer items-center overflow-hidden rounded-lg border border-gold/40 bg-gold-soft/75 transition-colors hover:border-gold"
    >
      {/* Nhãn cố định bên trái */}
      <div className="flex h-full shrink-0 items-center gap-2 border-r border-gold/30 bg-gold-soft px-3.5 text-xs font-medium whitespace-nowrap text-gold-ink">
        <BellRing size={14} aria-hidden />
        <span>Khách gọi QR</span>
        <span className="num rounded-full bg-primary px-1.5 py-px text-xs font-medium text-white">
          {requests.length}
        </span>
      </div>

      {/* Dải chạy chữ 1 dòng từ phải sang trái (tạm dừng khi rê chuột hoặc focus) */}
      <div className="relative flex-1 overflow-hidden [container-type:inline-size]">
        <div
          className="flex w-max animate-ticker-rtl items-center group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ animationDuration: `${durationSeconds}s` }}
        >
          <TickerItems requests={requests} tables={tables} onSelect={(id) => onOpenSheet(id)} />
          <div className="flex motion-reduce:hidden">
            <TickerItems
              requests={requests}
              tables={tables}
              onSelect={(id) => onOpenSheet(id)}
              duplicate
            />
          </div>
        </div>
      </div>

      {/* Nút mở ngăn kéo chi tiết bên phải */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenSheet();
        }}
        className="flex h-full shrink-0 items-center gap-1 border-l border-gold/30 bg-gold-soft px-3 text-xs font-medium whitespace-nowrap text-primary transition-colors hover:bg-paper-warm"
      >
        <span>Chi tiết</span>
        <ChevronRight size={14} aria-hidden />
      </button>
    </section>
  );
}
