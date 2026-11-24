import { CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { QrToastMessage } from '../useQrSession';

/** Dấu ấn thương hiệu Atelier d'Asie (con dấu chu sa khớp mockup 11). */
export function QrBrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-card',
        className,
      )}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 5h14" />
        <path d="M5 19h14" />
        <path d="M9.5 5v14" />
        <path d="M14.5 5v14" />
        <path d="M5 10.5h4.5M14.5 10.5H19" />
        <path d="M5 14h14" />
      </svg>
    </span>
  );
}

/** Thông báo gọn gàng bên trong khung điện thoại khách QR. */
export function QrToast({
  toast,
  onDismiss,
}: {
  toast: QrToastMessage | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const isSuccess = toast.tone === 'success';
  const isWarning = toast.tone === 'warning';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-3 top-28 z-30 flex justify-center"
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-medium shadow-lift',
          isSuccess && 'border-st-empty/30 bg-chrome text-chrome-ink',
          isWarning && 'border-st-booked/40 bg-st-booked-soft text-st-booked-ink',
          !isSuccess && !isWarning && 'border-st-serving/40 bg-st-serving-soft text-st-serving-ink',
        )}
      >
        {isSuccess ? (
          <CheckCircle2 size={16} aria-hidden className="shrink-0 text-gold-bright" />
        ) : (
          <AlertTriangle size={16} aria-hidden className="shrink-0" />
        )}
        <span className="min-w-0 flex-1 leading-snug">{toast.text}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="grid size-7 shrink-0 place-items-center rounded-full opacity-75 transition-opacity hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
