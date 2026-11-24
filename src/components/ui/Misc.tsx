import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { initialsOf } from '@/lib/format';
import type { Tone } from '@/lib/labels';
import { TONE } from './tone';

/* ───────────────────────── Avatar ───────────────────────── */

const AVATAR_TONES = [
  'bg-primary-soft text-primary',
  'bg-gold-soft text-gold-ink',
  'bg-st-empty-soft text-st-empty-ink',
  'bg-info-soft text-info-ink',
  'bg-st-billing-soft text-st-billing-ink',
  'bg-sunken text-ink-soft',
] as const;

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const AVATAR_SIZE = { sm: 'size-7 text-xs', md: 'size-9 text-xs', lg: 'size-11 text-sm' } as const;

/** Avatar chữ cái đầu; màu ổn định theo tên. */
export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZE;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-medium',
        AVATAR_SIZE[size],
        AVATAR_TONES[hash(name) % AVATAR_TONES.length],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/* ───────────────────────── ProgressBar ───────────────────────── */

export function ProgressBar({
  value,
  tone = 'primary',
  label,
  className,
}: {
  /** 0–100 */
  value: number;
  tone?: Tone;
  label: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', TONE[tone].dot)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ───────────────────────── EmptyState ───────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && (
        <span aria-hidden className="mb-4 grid size-14 place-items-center rounded-full bg-sunken text-ink-muted">
          {icon}
        </span>
      )}
      <p className="text-base font-medium text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-sm text-xs text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ───────────────────────── Table ───────────────────────── */

/** Bảng dữ liệu chuẩn: cuộn ngang trên màn nhỏ, header caps nhỏ, hàng hover. */
export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="scroll-quiet overflow-x-auto">
      <table className={cn('w-full border-collapse text-left text-sm', className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, children, ...rest }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'eyebrow border-y border-line bg-paper-warm px-4 py-3 text-left font-medium whitespace-nowrap first:pl-5 last:pr-5',
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...rest }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('border-b border-line px-4 py-3.5 align-middle first:pl-5 last:pr-5', className)} {...rest}>
      {children}
    </td>
  );
}

export function Tr({ className, children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-paper-warm/70', className)} {...rest}>
      {children}
    </tr>
  );
}
