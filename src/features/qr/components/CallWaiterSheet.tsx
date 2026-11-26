import type { ReactNode } from 'react';
import {
  BellRing,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Lock,
  ReceiptText,
  Snowflake,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { GUEST_REQUEST_META } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';
import { Sheet } from '@/components/ui/Overlay';
import type { GuestRequestType } from '@/types/database';

interface CallWaiterSheetProps {
  open: boolean;
  onClose: () => void;
  tableLabel: string;
  getCooldownSeconds: (type: GuestRequestType) => number;
  lastSentMessage: { type: GuestRequestType; text: string } | null;
  onSendRequest: (type: GuestRequestType) => void;
}

const REQUEST_ROWS: {
  type: GuestRequestType;
  icon: ReactNode;
  iconBoxClass: string;
}[] = [
  {
    type: 'GoiNuocLoc',
    icon: <Droplets size={20} aria-hidden />,
    iconBoxClass: 'bg-info-soft text-info-ink',
  },
  {
    type: 'GoiKhanLanh',
    icon: <Snowflake size={20} aria-hidden />,
    iconBoxClass: 'bg-st-empty-soft text-st-empty-ink',
  },
  {
    type: 'YeuCauKiemBill',
    icon: <ReceiptText size={20} aria-hidden />,
    iconBoxClass: 'bg-st-booked-soft text-st-booked-ink',
  },
  {
    type: 'GapPhucVu',
    icon: <BellRing size={20} aria-hidden />,
    iconBoxClass: 'bg-primary-soft text-primary',
  },
];

/** Bottom-sheet gọi hỗ trợ phục vụ tại bàn (khớp mockup 18) có cooldown 20s mỗi hành động. */
export function CallWaiterSheet({
  open,
  onClose,
  tableLabel,
  getCooldownSeconds,
  lastSentMessage,
  onSendRequest,
}: CallWaiterSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      frame="mobile"
      icon={<BellRing size={20} />}
      title="Gọi phục vụ"
      description="Chọn yêu cầu để nhân viên mang đến bàn."
      footer={
        <p className="flex items-center justify-center gap-1.5 pb-[env(safe-area-inset-bottom)] text-xs text-ink-muted">
          <Lock size={13} aria-hidden className="shrink-0" />
          Yêu cầu được gửi trực tiếp từ {tableLabel}
        </p>
      }
    >
      <div className="space-y-3">
        {lastSentMessage && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2.5 rounded-xl border border-st-empty/30 bg-st-empty-soft px-3.5 py-3 text-xs leading-relaxed text-st-empty-ink"
          >
            <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0" />
            <span>{lastSentMessage.text}</span>
          </div>
        )}

        <div className="space-y-2.5">
          {REQUEST_ROWS.map((row) => {
            const meta = GUEST_REQUEST_META[row.type];
            const cooldown = getCooldownSeconds(row.type);
            const isCoolingDown = cooldown > 0;

            return (
              <button
                key={row.type}
                type="button"
                disabled={isCoolingDown}
                onClick={() => onSendRequest(row.type)}
                className={cn(
                  'flex min-h-16 w-full items-center gap-3.5 rounded-xl border border-cream-line bg-paper px-3.5 py-3 text-left shadow-card transition-colors',
                  isCoolingDown
                    ? 'bg-paper-warm opacity-75'
                    : 'hover:border-line-strong hover:bg-paper-warm active:bg-sunken',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-xl',
                    row.iconBoxClass,
                  )}
                >
                  {row.icon}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {meta.hint}
                  </span>
                </span>

                {isCoolingDown ? (
                  <Badge tone="success" size="sm" className="num shrink-0">
                    Đã gửi · {cooldown}s
                  </Badge>
                ) : (
                  <ChevronRight
                    size={18}
                    aria-hidden
                    className="shrink-0 text-ink-muted"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}
