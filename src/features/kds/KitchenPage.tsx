import { useState } from 'react';
import { BellRing, ChefHat, Lock, UtensilsCrossed } from 'lucide-react';
import { useNow } from '@/lib/clock';
import { ROLE_META } from '@/lib/labels';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/ui/Misc';
import type { KdsFilter } from './kdsHelpers';
import { useKitchenData } from './useKitchenData';
import { KdsTicketCard } from './components/KdsTicketCard';
import { MenuAvailabilityPanel } from './components/MenuAvailabilityPanel';

/** Màn hình bếp KDS thời gian thực (MOD-05). */
export function KitchenPage() {
  const [filter, setFilter] = useState<KdsFilter>('all');
  const [menuQuery, setMenuQuery] = useState('');
  const now = useNow(15_000);

  const {
    currentRole,
    canAct,
    summary,
    visibleTickets,
    menuRows,
    totalMenuCount,
    soldOutCount,
    advanceKdsDishStatus,
    toggleDishAvailability,
  } = useKitchenData(filter, menuQuery);

  const disabledReason = `Vai trò ${ROLE_META[currentRole].label} chỉ có quyền xem. Cần quyền Bếp, Quản lý hoặc Chủ nhà hàng.`;
  const activeDishCount = summary.waitingDishesCount + summary.cookingDishesCount;

  return (
    <PageBody>
      <PageHeader
        title="Bếp KDS"
        description="Ưu tiên bàn VIP trước, sau đó theo thứ tự gọi món."
        actions={
          <Badge tone="success" dot className="px-3 py-1.5">
            Đã kết nối bếp
          </Badge>
        }
      />

      {/* Thanh tóm tắt gọn 1 hàng thay cho nhiều thẻ chồng nhau */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-strong bg-paper px-4 py-3 shadow-card">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-md bg-chrome text-gold-bright"
            >
              <ChefHat size={16} />
            </span>
            <p className="text-sm text-ink-soft">
              <strong className="num font-medium text-ink">{summary.activeTicketsCount}</strong> bàn đang làm
              <span className="num text-ink-muted"> ({activeDishCount} món)</span>
            </p>
          </div>

          <span aria-hidden className="hidden h-5 w-px bg-line sm:block" />

          <div className="flex flex-wrap items-center gap-3.5 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone="warning" />
              <span className="num font-medium text-ink">{summary.waitingDishesCount}</span> chờ
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone="danger" />
              <span className="num font-medium text-ink">{summary.cookingDishesCount}</span> đang nấu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot tone="success" />
              <span className="num font-medium text-ink">{summary.doneDishesCount}</span> xong
            </span>
          </div>
        </div>

        <p className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <BellRing size={13} aria-hidden className="shrink-0 text-gold-ink" />
          <span>Món hoàn thành mới vào bill và trừ kho.</span>
        </p>
      </div>

      {/* Cảnh báo chế độ chỉ xem nếu vai trò không có quyền thao tác bếp */}
      {!canAct && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-line-strong bg-paper-warm px-4 py-2.5 text-xs text-ink-soft"
        >
          <Lock size={14} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          <span>
            <strong className="font-medium text-ink">Chỉ xem ({ROLE_META[currentRole].label}):</strong> Chỉ Bếp, Quản lý và Chủ nhà hàng được cập nhật phiếu bếp và tình trạng món.
          </span>
        </div>
      )}

      {/* Bố cục chính: Bảng phiếu bếp nền trầm tách biệt + Panel Tình trạng món sticky bên phải */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19.5rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section
          aria-label="Danh sách phiếu bếp"
          className="min-w-0 space-y-4 rounded-xl border border-line-strong/80 bg-kds-board p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented<KdsFilter>
              label="Lọc phiếu bếp theo trạng thái món"
              value={filter}
              onChange={setFilter}
              items={[
                { id: 'all', label: 'Tất cả', count: summary.totalDishesCount },
                { id: 'ChoCheBien', label: 'Chờ nấu', count: summary.waitingDishesCount },
                { id: 'DangCheBien', label: 'Đang nấu', count: summary.cookingDishesCount },
                { id: 'HoanThanh', label: 'Xong', count: summary.doneDishesCount },
              ]}
            />
            <span className="num text-xs font-medium text-ink-soft">
              {visibleTickets.length}/{summary.totalTicketsCount} phiếu bàn
            </span>
          </div>

          {visibleTickets.length === 0 ? (
            <Card className="border-line-strong">
              <EmptyState
                icon={<UtensilsCrossed size={24} />}
                title="Không có phiếu nào khớp bộ lọc"
                description={
                  filter === 'all'
                    ? 'Hàng đợi bếp đang trống. Đơn mới từ phục vụ hoặc QR sẽ hiện ngay tại đây.'
                    : 'Không có món nào ở trạng thái đã chọn.'
                }
                action={
                  filter !== 'all' ? (
                    <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                      Xem tất cả phiếu
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {visibleTickets.map((ticket) => (
                <KdsTicketCard
                  key={ticket.maOrder}
                  ticket={ticket}
                  nowMs={now.getTime()}
                  canAct={canAct}
                  disabledReason={disabledReason}
                  onAdvanceStatus={advanceKdsDishStatus}
                />
              ))}
            </div>
          )}
        </section>

        <MenuAvailabilityPanel
          rows={menuRows}
          totalCount={totalMenuCount}
          soldOutCount={soldOutCount}
          query={menuQuery}
          onQueryChange={setMenuQuery}
          canAct={canAct}
          disabledReason={disabledReason}
          onToggleAvailability={toggleDishAvailability}
        />
      </div>
    </PageBody>
  );
}
