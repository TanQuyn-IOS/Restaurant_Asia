import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:bg-line-strong disabled:text-ink-muted',
  secondary:
    'bg-paper text-ink border border-line-strong hover:bg-paper-warm disabled:text-ink-faint disabled:bg-paper-warm',
  ghost: 'text-ink-soft hover:bg-sunken disabled:text-ink-faint disabled:hover:bg-transparent',
  danger: 'bg-st-serving text-white hover:bg-primary-hover disabled:bg-line-strong disabled:text-ink-muted',
  gold: 'bg-gold-soft text-gold-ink border border-gold/40 hover:bg-gold/15 disabled:opacity-50',
  dark: 'bg-chrome text-chrome-ink hover:bg-chrome-raised disabled:bg-line-strong disabled:text-ink-muted',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-sm gap-2',
  icon: 'size-9 p-0',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** icon đứng trước chữ */
  icon?: ReactNode;
  /** icon đứng sau chữ */
  iconRight?: ReactNode;
  loading?: boolean;
  /** chiếm toàn chiều ngang */
  block?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading,
  block,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors duration-150 [&_svg]:shrink-0',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon}
      {children}
      {iconRight}
    </button>
  );
}

/** Nút chỉ có icon (bắt buộc truyền aria-label). */
export function IconButton({
  label,
  className,
  children,
  variant = 'ghost',
  ...rest
}: Omit<ButtonProps, 'size' | 'icon' | 'iconRight' | 'block'> & { label: string }) {
  return (
    <Button
      variant={variant}
      size="icon"
      aria-label={label}
      title={label}
      className={className}
      {...rest}
    >
      {children}
    </Button>
  );
}
