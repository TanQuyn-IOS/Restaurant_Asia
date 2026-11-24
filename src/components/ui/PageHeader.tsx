import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Đầu trang chuẩn: eyebrow (mã phân hệ) · tiêu đề · mô tả · hành động bên phải. */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-4', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="t-page text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Vùng nội dung trang: padding + max-width + nhịp dọc thống nhất. */
export function PageBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 sm:px-8 sm:py-8', className)}>{children}</div>;
}
