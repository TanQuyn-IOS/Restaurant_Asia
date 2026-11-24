import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/labels';
import { TONE } from './tone';

/** Khối nội dung chuẩn: nền trắng, viền hairline, bo 12px. */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn('rounded-lg border border-line bg-paper shadow-card', className)}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="t-card-title text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn('flex items-center justify-between gap-3 border-t border-line px-5 py-3', className)}
      {...rest}
    >
      {children}
    </footer>
  );
}

/** Thẻ KPI: nhãn caps nhỏ · số lớn · chú thích · icon góc phải (như mockup). */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  className,
  hintTone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  hintTone?: Tone;
  className?: string;
}) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon && (
          <span
            aria-hidden
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-lg',
              TONE[tone].soft,
              TONE[tone].text,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="t-metric mt-2 text-ink">{value}</p>
      {hint && (
        <p className={cn('mt-1 text-xs', hintTone ? TONE[hintTone].text : 'text-ink-muted')}>{hint}</p>
      )}
    </Card>
  );
}
