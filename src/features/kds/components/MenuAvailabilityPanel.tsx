import { Search, X } from 'lucide-react';
import type { DishAvailability } from '@/types/database';
import { cn } from '@/lib/cn';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input, Switch } from '@/components/ui/Form';
import { DishImage } from '@/components/domain/badges';
import type { MenuDishRow } from '../kdsHelpers';

interface MenuAvailabilityPanelProps {
  rows: MenuDishRow[];
  totalCount: number;
  soldOutCount: number;
  query: string;
  onQueryChange: (next: string) => void;
  canAct: boolean;
  disabledReason?: string;
  onToggleAvailability: (maMonAn: string, nextState: DishAvailability) => void;
}

/** Cột phải (sticky trên lg+): Bật/tắt tình trạng Còn món ↔ Hết món đồng bộ realtime. */
export function MenuAvailabilityPanel({
  rows,
  totalCount,
  soldOutCount,
  query,
  onQueryChange,
  canAct,
  disabledReason,
  onToggleAvailability,
}: MenuAvailabilityPanelProps) {
  return (
    <Card className="border-line-strong shadow-card lg:sticky lg:top-20">
      <CardHeader
        title="Tình trạng món"
        subtitle="Đồng bộ tức thì lên sảnh và QR"
        className="bg-paper-warm"
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-st-empty-soft px-2.5 py-0.5 text-xs font-medium text-st-empty-ink">
            <StatusDot tone="success" pulse />
            Trực tiếp
          </span>
        }
      />

      <CardBody className="space-y-3.5">
        <div className="relative">
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm món ăn..."
            aria-label="Tìm kiếm món ăn để cập nhật tình trạng"
            className="pl-9 pr-9"
          />
          {query && (
            <IconButton
              label="Xóa từ khóa tìm kiếm"
              onClick={() => onQueryChange('')}
              className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
            >
              <X size={14} />
            </IconButton>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span className="num">
            Còn phục vụ: <strong className="font-medium text-ink">{totalCount - soldOutCount}/{totalCount}</strong>
          </span>
          {soldOutCount > 0 && (
            <Badge tone="danger" size="sm" dot>
              <span className="num">{soldOutCount} hết món</span>
            </Badge>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-line bg-paper-warm px-4 py-8 text-center">
            <p className="text-sm font-medium text-ink">Không tìm thấy món phù hợp</p>
            <p className="mt-1 text-xs text-ink-muted">Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.</p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-3"
              onClick={() => onQueryChange('')}
            >
              Xóa tìm kiếm
            </Button>
          </div>
        ) : (
          <ul
            aria-label="Danh sách tình trạng món ăn"
            className="scroll-quiet max-h-[34rem] divide-y divide-line overflow-y-auto pr-1"
          >
            {rows.map(({ dish, cuisineLabel }) => {
              const isAvailable = dish.trang_thai_mon === 'ConMon';
              return (
                <li
                  key={dish.ma_mon_an}
                  className="flex items-center justify-between gap-2.5 py-2.5 first:pt-1 last:pb-1"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <DishImage
                      src={dish.hinh_anh_url}
                      alt={dish.ten_mon_an}
                      grayscale={!isAvailable}
                      className="size-10 shrink-0 rounded-md border border-line"
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'truncate text-sm font-medium',
                          isAvailable ? 'text-ink' : 'text-ink-muted line-through',
                        )}
                      >
                        {dish.ten_mon_an}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="truncate text-xs text-ink-muted">{cuisineLabel}</span>
                        {!isAvailable && (
                          <Badge tone="danger" size="sm">
                            {dish.trang_thai_mon === 'HetMon' ? 'Hết món' : 'Tạm ngưng'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="shrink-0"
                    title={!canAct ? disabledReason : isAvailable ? 'Chuyển sang Hết món' : 'Mở lại Còn món'}
                  >
                    <Switch
                      checked={isAvailable}
                      disabled={!canAct}
                      label={`Chuyển trạng thái món ${dish.ten_mon_an}: hiện đang ${isAvailable ? 'Còn món' : 'Hết món'}`}
                      onChange={(nextChecked) =>
                        onToggleAvailability(dish.ma_mon_an, nextChecked ? 'ConMon' : 'HetMon')
                      }
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
