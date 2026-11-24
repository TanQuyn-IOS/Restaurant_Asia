import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string = string> {
  id: T;
  label: ReactNode;
  /** nhãn phụ nhỏ cạnh label (vd. "Đã nghỉ" bên cạnh "Past leave") */
  sublabel?: ReactNode;
  /** số thứ tự hiển thị "01" như mockup */
  index?: string;
  /** số đếm dạng chip */
  count?: number;
  /** chấm xanh "live" sau nhãn */
  live?: boolean;
  disabled?: boolean;
}

/** Tab gạch chân đỏ (mockup: "01 Sơ đồ bàn · 02 Màn hình bếp · 03 Thu ngân POS"). */
export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  className,
  label = 'Chuyển mục',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  label?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const enabled = items.filter((it) => !it.disabled);
    const cur = enabled.findIndex((it) => it.id === items[i].id);
    const next = enabled[(cur + (e.key === 'ArrowRight' ? 1 : enabled.length - 1)) % enabled.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('no-scrollbar flex gap-5 overflow-x-auto overflow-y-hidden', className)}
    >
      {items.map((it, i) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            ref={(el) => {
              refs.current[it.id] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            disabled={it.disabled}
            onClick={() => onChange(it.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 border-b-2 py-3 text-sm whitespace-nowrap transition-colors',
              active
                ? 'border-primary font-medium text-primary'
                : 'border-transparent text-ink-muted hover:text-ink disabled:opacity-40',
            )}
          >
            {it.index && <span className="num text-xs text-ink-faint">{it.index}</span>}
            <span>{it.label}</span>
            {it.sublabel && <span className="text-xs font-normal text-ink-muted">{it.sublabel}</span>}
            {it.live && <span aria-hidden className="size-1.5 rounded-full bg-st-empty" />}
            {it.count !== undefined && (
              <span
                className={cn(
                  'num rounded-full px-1.5 py-px text-xs',
                  active ? 'bg-primary-soft text-primary' : 'bg-sunken text-ink-muted',
                )}
              >
                {String(it.count).padStart(2, '0')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Nhóm nút dạng viên thuốc (lọc nhanh: Tất cả / Chờ / Đang nấu / Xong). */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  className,
  label = 'Bộ lọc',
}: {
  items: { id: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex flex-wrap gap-1.5', className)}
    >
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            role="radio"
            type="button"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors',
              active
                ? 'border-ink bg-ink text-white'
                : 'border-line-strong bg-paper text-ink-soft hover:bg-paper-warm',
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn('num', active ? 'text-white/70' : 'text-ink-muted')}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
