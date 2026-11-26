import { HelpCircle, Lock, QrCode } from 'lucide-react';
import { QrBrandMark } from './QrBrandMark';

interface QrPortalHeaderProps {
  tableLabel: string;
  areaLabel: string;
  parentTableLabel?: string;
  onOpenHelp: () => void;
}

/** Header khóa bàn cố định khớp mockup 11 — không có đăng nhập NV hay đổi bàn (FR-25). */
export function QrPortalHeader({
  tableLabel,
  areaLabel,
  parentTableLabel,
  onOpenHelp,
}: QrPortalHeaderProps) {
  return (
    <header className="z-20 shrink-0 border-b border-cream-line bg-cream px-4 pt-4 pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <QrBrandMark />
          <div className="min-w-0">
            <p className="t-brand truncate text-ink">Atelier d&apos;Asie</p>
            <p className="truncate text-xs text-ink-muted">Ẩm thực Á Châu · Sài Gòn</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Hướng dẫn gọi món tại bàn"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-cream-line bg-paper text-ink-soft shadow-card transition-colors hover:bg-sunken"
        >
          <HelpCircle size={20} aria-hidden />
        </button>
      </div>

      <div
        aria-label={`Phiên bàn đã khóa: ${tableLabel}, ${areaLabel}`}
        className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-cream-line bg-paper px-3 py-2 shadow-card"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-sunken text-gold-ink"
          >
            <Lock size={15} />
          </span>
          <div className="flex min-w-0 items-center gap-1.5 text-sm">
            <span className="truncate font-medium text-ink">{tableLabel}</span>
            <span aria-hidden className="text-gold">
              ·
            </span>
            <span className="truncate text-xs text-ink-muted">{areaLabel}</span>
          </div>
        </div>

        <span className="shrink-0 rounded-md border border-line bg-paper-warm px-2 py-1 text-xs font-medium text-ink-muted">
          Đã khóa
        </span>
      </div>

      {parentTableLabel && (
        <p className="mt-1.5 px-1 text-xs text-ink-muted">
          Bàn ghép chung đơn cùng{' '}
          <span className="font-medium text-ink-soft">{parentTableLabel}</span>
        </p>
      )}
    </header>
  );
}

/** Màn hình thông báo mã bàn không tồn tại (tuyệt đối không dẫn tới khu vực nhân viên). */
export function QrUnknownTableView({ maBan }: { maBan: string | undefined }) {
  return (
    <div className="min-h-screen bg-chrome sm:flex sm:items-center sm:justify-center sm:px-4 sm:py-6">
      <div className="flex min-h-dvh w-full flex-col bg-cream sm:min-h-[640px] sm:max-w-[430px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-cream-line sm:shadow-pop">
        <header className="flex items-center gap-3 border-b border-cream-line px-4 py-4">
          <QrBrandMark />
          <div>
            <p className="t-brand text-ink">Atelier d&apos;Asie</p>
            <p className="text-xs text-ink-muted">Ẩm thực Á Châu · Sài Gòn</p>
          </div>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span
            aria-hidden
            className="mb-5 grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary"
          >
            <QrCode size={30} />
          </span>
          <h1 className="t-display text-ink">Không tìm thấy bàn này</h1>
          <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-ink-muted">
            Mã bàn <span className="num font-medium text-ink">{maBan || '—'}</span>{' '}
            không tồn tại. Vui lòng quét lại mã QR trên bàn hoặc gọi nhân viên hỗ trợ.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cream-line bg-paper px-4 py-2 text-xs text-ink-muted">
            <Lock size={14} aria-hidden className="text-gold-ink" />
            Thực đơn QR tại bàn
          </div>
        </main>
      </div>
    </div>
  );
}
