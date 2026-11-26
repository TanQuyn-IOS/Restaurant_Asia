import { Utensils } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TableStatus, TableType } from '@/types/database';
import { getChairDistribution } from '../floorHelpers';

const SURFACE_BY_STATUS: Record<TableStatus, { fill: string; stroke: string; icon: string; chair: string }> = {
  Trong: {
    fill: 'fill-st-empty-soft',
    stroke: 'stroke-st-empty/35',
    icon: 'text-st-empty-ink',
    chair: 'fill-line-strong',
  },
  DaDat: {
    fill: 'fill-st-booked-soft',
    stroke: 'stroke-st-booked/40',
    icon: 'text-st-booked-ink',
    chair: 'fill-st-booked/35',
  },
  DangPhucVu: {
    fill: 'fill-st-serving-soft',
    stroke: 'stroke-st-serving/40',
    icon: 'text-st-serving-ink',
    chair: 'fill-st-serving/30',
  },
  ChoThanhToan: {
    fill: 'fill-st-billing-soft',
    stroke: 'stroke-st-billing/40',
    icon: 'text-st-billing-ink',
    chair: 'fill-st-billing/35',
  },
};

function distributePositions(count: number, start: number, span: number): number[] {
  if (count <= 0) return [];
  const step = span / (count + 1);
  return Array.from({ length: count }, (_, i) => start + step * (i + 1));
}

/** Minh họa kiến trúc bàn & ghế theo số chỗ ngồi và trạng thái bàn (khớp mockup 01). */
export function TableIllustration({
  status,
  seats,
  tableType,
}: {
  status: TableStatus;
  seats: number;
  tableType: TableType;
}) {
  const dist = getChairDistribution(seats);
  const style = SURFACE_BY_STATUS[status];

  const isWide = tableType === 'BanDai' || seats >= 8;
  const tableW = isWide ? 82 : seats >= 6 ? 68 : 54;
  const tableH = 42;
  const vbW = 128;
  const vbH = 74;
  const tx = (vbW - tableW) / 2;
  const ty = (vbH - tableH) / 2;

  const topXs = distributePositions(dist.top, tx + 4, tableW - 8);
  const bottomXs = distributePositions(dist.bottom, tx + 4, tableW - 8);
  const leftYs = distributePositions(dist.left, ty + 4, tableH - 8);
  const rightYs = distributePositions(dist.right, ty + 4, tableH - 8);

  return (
    <div className="relative mx-auto flex h-14 w-24 items-center justify-center" aria-hidden>
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="h-full w-full"
        fill="none"
        role="presentation"
      >
        {/* Ghế hàng trên */}
        {topXs.map((cx, i) => (
          <rect
            key={`t-${i}`}
            x={cx - 5}
            y={ty - 8}
            width={10}
            height={5}
            rx={2.5}
            className={style.chair}
          />
        ))}

        {/* Ghế hàng dưới */}
        {bottomXs.map((cx, i) => (
          <rect
            key={`b-${i}`}
            x={cx - 5}
            y={ty + tableH + 3}
            width={10}
            height={5}
            rx={2.5}
            className={style.chair}
          />
        ))}

        {/* Ghế bên trái */}
        {leftYs.map((cy, i) => (
          <rect
            key={`l-${i}`}
            x={tx - 8}
            y={cy - 5}
            width={5}
            height={10}
            rx={2.5}
            className={style.chair}
          />
        ))}

        {/* Ghế bên phải */}
        {rightYs.map((cy, i) => (
          <rect
            key={`r-${i}`}
            x={tx + tableW + 3}
            y={cy - 5}
            width={5}
            height={10}
            rx={2.5}
            className={style.chair}
          />
        ))}

        {/* Mặt bàn */}
        <rect
          x={tx}
          y={ty}
          width={tableW}
          height={tableH}
          rx={tableType === 'VIP' ? 12 : 8}
          strokeWidth={1.25}
          className={cn(style.fill, style.stroke)}
        />
      </svg>

      {/* Biểu tượng bộ đồ ăn ở tâm bàn */}
      <span className={cn('pointer-events-none absolute', style.icon)}>
        <Utensils size={14} strokeWidth={1.75} />
      </span>
    </div>
  );
}
