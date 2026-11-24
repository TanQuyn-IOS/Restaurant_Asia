import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** ESC để đóng · khóa cuộn nền · bẫy focus · trả focus về nút đã mở. */
export function useOverlayBehavior(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const t = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const trapTab = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return;
    const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return { panelRef, trapTab };
}

interface OverlayBase {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** dòng caps nhỏ phía trên tiêu đề (vd. "QUẢN LÝ NGHỈ PHÉP · MOD-07") */
  eyebrow?: ReactNode;
  description?: ReactNode;
  /** icon trong ô vuông màu (như mockup modal "Duyệt nghỉ phép") */
  icon?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

const MODAL_WIDTH = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const;

/** Hộp thoại giữa màn hình. */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  icon,
  footer,
  children,
  size = 'md',
  className,
}: OverlayBase & { size?: keyof typeof MODAL_WIDTH }) {
  const { panelRef, trapTab } = useOverlayBehavior(open, onClose);
  const titleId = useId();
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapTab}
        className={cn(
          'relative flex max-h-[92vh] w-full animate-rise flex-col overflow-hidden rounded-t-2xl bg-paper shadow-pop outline-none sm:rounded-xl',
          MODAL_WIDTH[size],
          className,
        )}
      >
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          {icon && (
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            <h2 id={titleId} className="text-xl font-medium tracking-tight text-ink">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <IconButton label="Đóng" onClick={onClose} className="-mr-2 -mt-1">
            <X size={18} />
          </IconButton>
        </div>
        <div className="scroll-quiet flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-paper-warm px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

const SHEET_WIDTH = { md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-3xl' } as const;

/**
 * Ngăn kéo.
 * side="right"  : trượt từ phải (Desktop — vd. ngăn gọi món)
 * side="bottom" : bottom-sheet (Mobile — vd. QR portal). frame="mobile" giới hạn rộng 430px
 *                 và canh giữa để khớp khung điện thoại khi xem trên desktop.
 */
export function Sheet({
  open,
  onClose,
  title,
  eyebrow,
  description,
  icon,
  footer,
  children,
  side = 'right',
  width = 'md',
  frame = 'full',
  className,
}: OverlayBase & {
  side?: 'right' | 'bottom';
  width?: keyof typeof SHEET_WIDTH;
  frame?: 'full' | 'mobile';
}) {
  const { panelRef, trapTab } = useOverlayBehavior(open, onClose);
  const titleId = useId();
  if (!open) return null;

  const isBottom = side === 'bottom';

  return createPortal(
    <div className={cn('fixed inset-0 z-50 flex', isBottom ? 'items-end justify-center' : 'justify-end')}>
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapTab}
        className={cn(
          'relative flex flex-col bg-paper shadow-pop outline-none',
          isBottom
            ? cn(
                'max-h-[88vh] w-full animate-sheet-up rounded-t-2xl',
                frame === 'mobile' ? 'max-w-[430px]' : 'sm:max-w-xl',
              )
            : cn('h-full w-full animate-slide-left', SHEET_WIDTH[width]),
          className,
        )}
      >
        {isBottom && (
          <span aria-hidden className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line-strong" />
        )}
        <div className="flex items-start gap-4 px-5 pt-5 pb-4">
          {icon && (
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            <h2 id={titleId} className="text-xl font-medium tracking-tight text-ink">
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <IconButton label="Đóng" onClick={onClose} className="-mr-1 -mt-1 rounded-full bg-sunken">
            <X size={18} />
          </IconButton>
        </div>
        <div className="scroll-quiet flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line bg-paper-warm px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
