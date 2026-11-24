import { useState } from 'react';
import { Flame, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  CUSTOMER_GROUP_META,
  DISH_AVAILABILITY_META,
  ITEM_STATUS_META,
  SPICE_LEVELS,
  TABLE_STATUS_META,
} from '@/lib/labels';
import type {
  CustomerGroupType,
  DishAvailability,
  OrderItemStatus,
  TableStatus,
} from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { TONE } from '@/components/ui/tone';

/** Pill trạng thái bàn (4 màu FR-02). */
export function TableStatusBadge({ status, className }: { status: TableStatus; className?: string }) {
  const m = TABLE_STATUS_META[status];
  return (
    <Badge tone={m.tone} dot className={className}>
      {m.short}
    </Badge>
  );
}

/** Class viền trên + tô nền nhẹ cho thẻ bàn theo trạng thái. */
export const TABLE_STATUS_CARD: Record<TableStatus, string> = {
  Trong: 'border-t-st-empty',
  DaDat: 'border-t-st-booked',
  DangPhucVu: 'border-t-st-serving',
  ChoThanhToan: 'border-t-st-billing',
};

export function CustomerGroupBadge({
  group,
  className,
}: {
  group: CustomerGroupType;
  className?: string;
}) {
  const m = CUSTOMER_GROUP_META[group];
  return (
    <Badge tone={m.tone} size="sm" className={className}>
      {group === 'VIP' && <span aria-hidden>✦</span>}
      {m.label}
    </Badge>
  );
}

export function ItemStatusBadge({ status }: { status: OrderItemStatus }) {
  const m = ITEM_STATUS_META[status];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

export function DishAvailabilityBadge({ status }: { status: DishAvailability }) {
  const m = DISH_AVAILABILITY_META[status];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

/** Độ cay 0–3 hiển thị bằng ngọn lửa. level 0 → gạch ngang. */
export function SpiceMeter({
  level,
  withLabel,
  className,
}: {
  level: 0 | 1 | 2 | 3;
  withLabel?: boolean;
  className?: string;
}) {
  const meta = SPICE_LEVELS[level];
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-xs text-ink-muted', className)}
      role="img"
      aria-label={`Độ cay: ${meta.label}`}
    >
      {level === 0 ? (
        <span aria-hidden className="w-3 text-center text-ink-faint">
          —
        </span>
      ) : (
        Array.from({ length: level }).map((_, i) => (
          <Flame key={i} size={13} aria-hidden className={cn(TONE.danger.text)} />
        ))
      )}
      {withLabel && <span>{meta.label}</span>}
    </span>
  );
}

/** Ảnh món có fallback khi URL lỗi/offline. */
export function DishImage({
  src,
  alt,
  className,
  grayscale,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  grayscale?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('grid place-items-center bg-sunken text-ink-faint', className)}
      >
        <UtensilsCrossed size={22} aria-hidden />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('object-cover', grayscale && 'grayscale', className)}
    />
  );
}
