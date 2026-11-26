import { useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Lock,
  Package,
  Plus,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import { CUISINE_META, ROLE_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { CuisineSchool } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardFooter, CardHeader, StatCard } from '@/components/ui/Card';
import { Input } from '@/components/ui/Form';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { Segmented } from '@/components/ui/Tabs';
import { AddDishModal } from './components/AddDishModal';
import { MenuDishTable } from './components/MenuDishTable';
import {
  canAddMenuDish,
  canToggleDishAvailability,
  filterMenuDishes,
  type MenuFilterKey,
} from './menuHelpers';
import { useMenuData } from './useMenuData';

const CUISINE_ORDER: CuisineSchool[] = ['VietNam', 'TrungHoa', 'NhatBan', 'HanQuoc', 'ThaiLan'];

export function MenuPage() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const toggleDishAvailability = useRestaurantStore((s) => s.toggleDishAvailability);
  const addDishToMenu = useRestaurantStore((s) => s.addDishToMenu);

  const { rows, categories, stats, filterCounts } = useMenuData();

  const [filter, setFilter] = useState<MenuFilterKey>('ALL');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const allowAdd = canAddMenuDish(currentRole);
  const allowToggle = canToggleDishAvailability(currentRole);

  const filteredRows = useMemo(
    () => filterMenuDishes(rows, filter, query),
    [rows, filter, query],
  );

  const filterItems = useMemo(
    () => [
      { id: 'ALL' as const, label: 'Tất cả', count: filterCounts.ALL },
      ...CUISINE_ORDER.map((school) => ({
        id: school as MenuFilterKey,
        label: CUISINE_META[school].label,
        count: filterCounts[school],
      })),
      { id: 'COMBO' as const, label: 'Combo', count: filterCounts.COMBO },
    ],
    [filterCounts],
  );

  const addDisabledReason = allowAdd
    ? undefined
    : `Chỉ Chủ nhà hàng hoặc Quản lý sảnh được thêm món mới (vai trò hiện tại: ${ROLE_META[currentRole].label})`;

  const toggleDisabledReason = allowToggle
    ? undefined
    : 'Chỉ Chủ, Quản lý hoặc Bếp mới được bật/tắt trạng thái còn món';

  const handleToggleRow = (maMonAn: string) => {
    setExpandedId((prev) => (prev === maMonAn ? null : maMonAn));
  };

  return (
    <PageBody>
      <PageHeader
        title="Thực đơn"
        description="Danh mục món ăn theo 5 trường phái Á Châu, gói combo và định mức kho."
        actions={
          <div className="flex flex-col items-end gap-1">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              disabled={!allowAdd}
              title={addDisabledReason}
              onClick={() => setAddOpen(true)}
            >
              Thêm món
            </Button>
            {!allowAdd && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <Lock size={12} aria-hidden />
                Chỉ Chủ / Quản lý được thêm món
              </span>
            )}
          </div>
        }
      />

      {/* 4 StatCards KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng số món"
          value={String(stats.total).padStart(2, '0')}
          hint="Thuộc 5 trường phái ẩm thực Á Châu"
          tone="neutral"
          icon={<UtensilsCrossed size={18} />}
        />
        <StatCard
          label="Đang phục vụ"
          value={String(stats.available).padStart(2, '0')}
          hint={`${stats.availablePct}% thực đơn đang mở bán`}
          tone="success"
          hintTone="success"
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Hết / Tạm ngưng"
          value={String(stats.unavailable).padStart(2, '0')}
          hint={
            stats.unavailable > 0
              ? 'Đã tự động khóa gọi trên POS & QR'
              : 'Toàn bộ thực đơn sẵn sàng'
          }
          tone={stats.unavailable > 0 ? 'danger' : 'neutral'}
          hintTone={stats.unavailable > 0 ? 'danger' : undefined}
          icon={<Ban size={18} />}
        />
        <StatCard
          label="Gói Combo đoàn"
          value={String(stats.combos).padStart(2, '0')}
          hint="Áp dụng bàn ghép & đặt cọc tiệc"
          tone="gold"
          icon={<Package size={18} />}
        />
      </div>

      {/* Bảng danh mục món ăn + định mức BOM mở rộng */}
      <Card>
        <CardHeader
          title="Danh sách món ăn"
          subtitle="Chọn một dòng để xem định mức nguyên liệu hoặc thành phần combo"
          action={
            !allowToggle && (
              <Badge tone="neutral" icon={<Lock size={12} aria-hidden />}>
                Chế độ chỉ xem ({ROLE_META[currentRole].short})
              </Badge>
            )
          }
        />

        <CardBody className="pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented
              label="Lọc theo trường phái ẩm thực"
              items={filterItems}
              value={filter}
              onChange={setFilter}
            />

            <div className="relative w-full lg:w-72">
              <Search
                size={15}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
              />
              <Input
                type="search"
                aria-label="Tìm kiếm món ăn hoặc nguyên liệu BOM"
                placeholder="Tìm tên món, mã món, nguyên liệu..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
          </div>
        </CardBody>

        <MenuDishTable
          rows={filteredRows}
          expandedId={expandedId}
          allowToggle={allowToggle}
          toggleDisabledReason={toggleDisabledReason}
          hasActiveFilters={filter !== 'ALL' || Boolean(query)}
          onToggleExpand={handleToggleRow}
          onResetFilters={() => {
            setFilter('ALL');
            setQuery('');
          }}
          onChangeStatus={toggleDishAvailability}
        />

        <CardFooter>
          <span className="text-xs text-ink-muted">
            Hiển thị <span className="num font-medium text-ink">{filteredRows.length}</span> /{' '}
            <span className="num">{rows.length}</span> món · Đồng bộ với bếp và QR
          </span>
          {!allowToggle && (
            <span className="text-xs text-ink-muted">
              Chỉ Chủ, Quản lý hoặc Bếp được bật/tắt còn món.
            </span>
          )}
        </CardFooter>
      </Card>

      <AddDishModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={categories}
        onSubmit={addDishToMenu}
      />
    </PageBody>
  );
}
