import { Fragment } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Package,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { CUISINE_META } from '@/lib/labels';
import type { DishAvailability } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Form';
import { EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { DishAvailabilityBadge, DishImage, SpiceMeter } from '@/components/domain/badges';
import type { EnrichedDishRow } from '../useMenuData';
import { DishDetailPanel } from './DishDetailPanel';

interface MenuDishTableProps {
  rows: EnrichedDishRow[];
  expandedId: string | null;
  allowToggle: boolean;
  toggleDisabledReason?: string;
  hasActiveFilters: boolean;
  onToggleExpand: (maMonAn: string) => void;
  onResetFilters: () => void;
  onChangeStatus: (maMonAn: string, nextState: DishAvailability) => void;
}

/** Bảng danh sách món ăn có dòng mở rộng hiển thị định mức BOM hoặc thành phần gói Combo. */
export function MenuDishTable({
  rows,
  expandedId,
  allowToggle,
  toggleDisabledReason,
  hasActiveFilters,
  onToggleExpand,
  onResetFilters,
  onChangeStatus,
}: MenuDishTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<UtensilsCrossed size={22} />}
        title="Không tìm thấy món ăn phù hợp"
        description="Thử đổi trường phái ẩm thực hoặc xóa từ khóa tìm kiếm hiện tại."
        action={
          hasActiveFilters && (
            <Button size="sm" variant="secondary" onClick={onResetFilters}>
              Đặt lại bộ lọc
            </Button>
          )
        }
      />
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-10">
            <span className="sr-only">Mở rộng chi tiết</span>
          </Th>
          <Th>Món ăn</Th>
          <Th>Trường phái</Th>
          <Th className="text-right">Đơn giá</Th>
          <Th>Độ cay</Th>
          <Th>Thời gian nấu</Th>
          <Th>Định mức / Combo</Th>
          <Th>Trạng thái phục vụ</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const { dish, cuisineSchool, bomItems, comboComponents } = row;
          const isExpanded = expandedId === dish.ma_mon_an;
          const isAvailable = dish.trang_thai_mon === 'ConMon';

          return (
            <Fragment key={dish.ma_mon_an}>
              <Tr
                className={cn(
                  !isAvailable && 'bg-paper-warm/50',
                  isExpanded && 'bg-paper-warm',
                )}
              >
                <Td className="w-10 pr-0">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Thu gọn' : 'Xem'} chi tiết ${dish.ten_mon_an}`}
                    onClick={() => onToggleExpand(dish.ma_mon_an)}
                    className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                </Td>

                <Td>
                  <button
                    type="button"
                    onClick={() => onToggleExpand(dish.ma_mon_an)}
                    className="flex items-center gap-3 text-left"
                  >
                    <DishImage
                      src={dish.hinh_anh_url}
                      alt={dish.ten_mon_an}
                      grayscale={!isAvailable}
                      className="size-12 shrink-0 rounded-md border border-line"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'font-medium text-ink',
                            !isAvailable && 'text-ink-muted line-through',
                          )}
                        >
                          {dish.ten_mon_an}
                        </span>
                        {dish.is_combo && (
                          <Badge tone="gold" size="sm">
                            Combo đoàn
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 max-w-md truncate text-xs text-ink-muted">
                        <span className="num">{dish.ma_mon_an}</span>
                        {dish.mo_ta ? ` · ${dish.mo_ta}` : ''}
                      </p>
                    </div>
                  </button>
                </Td>

                <Td>
                  {dish.is_combo ? (
                    <Badge tone="gold" size="sm">
                      Tiệc đoàn
                    </Badge>
                  ) : cuisineSchool ? (
                    <Badge tone="neutral" size="sm">
                      {CUISINE_META[cuisineSchool].label}
                    </Badge>
                  ) : (
                    <span className="text-xs text-ink-muted">—</span>
                  )}
                </Td>

                <Td className="text-right">
                  <span className="num font-medium text-ink">{formatVnd(dish.don_gia)}</span>
                </Td>

                <Td>
                  <SpiceMeter level={dish.muc_do_cay} withLabel />
                </Td>

                <Td>
                  <span className="num inline-flex items-center gap-1.5 text-xs text-ink-soft">
                    <Clock size={13} aria-hidden className="text-ink-muted" />
                    {dish.thoi_gian_nau_tb} phút
                  </span>
                </Td>

                <Td>
                  <button
                    type="button"
                    onClick={() => onToggleExpand(dish.ma_mon_an)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
                  >
                    {dish.is_combo ? (
                      <>
                        <Package size={13} aria-hidden className="text-gold-ink" />
                        <span className="num">{comboComponents.length} món thành phần</span>
                      </>
                    ) : bomItems.length > 0 ? (
                      <>
                        <Layers size={13} aria-hidden className="text-primary" />
                        <span className="num">{bomItems.length} nguyên liệu BOM</span>
                      </>
                    ) : (
                      <span className="text-ink-muted">Chưa có BOM</span>
                    )}
                  </button>
                </Td>

                <Td>
                  <div className="flex items-center gap-3" title={toggleDisabledReason}>
                    <Switch
                      checked={isAvailable}
                      disabled={!allowToggle}
                      label={`Chuyển trạng thái còn món cho ${dish.ten_mon_an}`}
                      onChange={(next) =>
                        onChangeStatus(dish.ma_mon_an, next ? 'ConMon' : 'HetMon')
                      }
                    />
                    <DishAvailabilityBadge status={dish.trang_thai_mon} />
                  </div>
                </Td>
              </Tr>

              {isExpanded && (
                <tr>
                  <td colSpan={8} className="border-b border-line p-0">
                    <DishDetailPanel
                      row={row}
                      canToggle={allowToggle}
                      onChangeStatus={onChangeStatus}
                    />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}
