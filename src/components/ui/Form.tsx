import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';

const CONTROL =
  'w-full rounded-md border border-line-strong bg-paper px-3 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-sunken disabled:text-ink-muted';

/** Nhãn caps nhỏ + control + gợi ý/lỗi (liên kết aria-describedby). */
export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-xs font-medium text-ink-soft">
        {label}
      </label>
      {children({ id, describedBy: note ? noteId : undefined, invalid: Boolean(error) })}
      {note && (
        <p id={noteId} className={cn('text-xs', error ? 'text-st-serving-ink' : 'text-ink-muted')}>
          {note}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'h-10', invalid && 'border-st-serving', className)}
      {...rest}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'min-h-20 py-2.5', invalid && 'border-st-serving', className)}
      {...rest}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <span className="relative block">
      <select
        aria-invalid={invalid || undefined}
        className={cn(CONTROL, 'h-10 cursor-pointer appearance-none pr-9', invalid && 'border-st-serving', className)}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted"
      />
    </span>
  );
}

/** Công tắc bật/tắt (vd. Còn món / Hết món). */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 disabled:opacity-50',
        checked ? 'bg-st-empty' : 'bg-line-strong',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-card transition-transform duration-150',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}

/** Chip chọn (ghi chú ăn uống, bộ lọc nhẹ). */
export function ChoiceChip({
  selected,
  onClick,
  children,
  icon,
  disabled,
  className,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium whitespace-nowrap transition-colors disabled:opacity-40',
        selected
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-line-strong bg-paper text-ink-soft hover:bg-paper-warm',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Bộ tăng giảm số lượng (− 1 +). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  label = 'Số lượng',
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: 'md' | 'lg';
  label?: string;
}) {
  const btn =
    size === 'lg'
      ? 'size-11'
      : 'size-9';
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1 rounded-lg border border-line bg-paper p-1">
      <button
        type="button"
        aria-label="Giảm"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn('grid place-items-center rounded-md bg-sunken text-ink hover:bg-line disabled:opacity-40', btn)}
      >
        <Minus size={16} />
      </button>
      <span className="num w-9 text-center text-base font-medium" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label="Tăng"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn('grid place-items-center rounded-md bg-sunken text-ink hover:bg-line disabled:opacity-40', btn)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
