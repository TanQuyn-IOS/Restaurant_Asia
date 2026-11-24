import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Tone } from '@/lib/labels';
import { TONE } from './tone';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** hiện chấm trạng thái phía trước */
  dot?: boolean;
  icon?: ReactNode;
  /** 'sm' = chip trong bảng, 'md' = pill trạng thái */
  size?: 'sm' | 'md';
}

export function Badge({
  tone = 'neutral',
  dot,
  icon,
  size = 'md',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap',
        size === 'md' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-px text-xs',
        TONE[tone].badge,
        className,
      )}
      {...rest}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', TONE[tone].dot)} />}
      {icon}
      {children}
    </span>
  );
}

/** Chấm nhỏ trạng thái đứng riêng (live / có thông báo). */
export function StatusDot({
  tone = 'success',
  pulse,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        TONE[tone].dot,
        pulse && 'animate-ping-soft',
        className,
      )}
    />
  );
}
