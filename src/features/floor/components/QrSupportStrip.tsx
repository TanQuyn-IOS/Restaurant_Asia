import { BellRing } from 'lucide-react';
import { formatClock } from '@/lib/format';
import { GUEST_REQUEST_META } from '@/lib/labels';
import type { Ban, YeuCauKhachHang } from '@/types/database';

export function QrSupportStrip({
  requests,
  tables,
  canOperate,
  readOnlyReason,
  onResolve,
}: {
  requests: YeuCauKhachHang[];
  tables: Ban[];
  canOperate: boolean;
  readOnlyReason: string | null;
  onResolve: (maYeuCau: string) => void;
}) {
  if (requests.length === 0) return null;

  return (
    <section
      aria-label="Yêu cầu hỗ trợ từ khách QR"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold-soft/70 px-4 py-3"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-ink">
          <BellRing size={15} aria-hidden />
          Khách QR gọi hỗ trợ ({requests.length}):
        </span>
        {requests.map((req) => {
          const ban = tables.find((b) => b.ma_ban === req.ma_ban);
          return (
            <div
              key={req.ma_yeu_cau}
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-paper px-3 py-1 text-xs text-ink"
            >
              <span className="font-medium">{ban?.ten_ban ?? req.ma_ban}</span>
              <span className="text-ink-muted">
                {GUEST_REQUEST_META[req.loai_yeu_cau].label} · {formatClock(req.thoi_gian_gui)}
              </span>
              <button
                type="button"
                disabled={!canOperate}
                title={readOnlyReason ?? 'Đánh dấu đã phục vụ yêu cầu'}
                onClick={() => onResolve(req.ma_yeu_cau)}
                className="font-medium text-primary underline-offset-2 hover:underline disabled:text-ink-faint disabled:no-underline"
              >
                Đã xong
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
