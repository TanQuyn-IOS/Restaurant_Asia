import { useState } from 'react';
import { BellRing, ChefHat, Clock, Lock, UtensilsCrossed } from 'lucide-react';
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

  const disabledReason = `Vai trò ${ROLE_META[currentRole].label} chỉ có quyền xem — cần quyền Bếp, Quản lý hoặc Chủ nhà hàng.`;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Hậu bếp · MOD-05"
        title="Màn hình bếp KDS"
        description="Phiếu bếp thời gian thực, tự động ghim bàn VIP lên đầu và điều phối chế biến theo thứ tự FIFO."
        actions={
          <>
            <Badge tone="success" dot className="px-3 py-1.5">
              Bếp đã kết nối
            </Badge>
            <Badge
              tone="neutral"
              icon={<Clock size={13} aria-hidden />}
              className="border border-line bg-paper px-3 py-1.5 text-ink-soft"
            >
              Hàng đợi FIFO
            </Badge>
          </>
        }
      />

      {/* Thẻ tóm tắt hàng đợi KDS */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              aria-hidden
              className="grid size-11 shrink-0 place-items-center rounded-lg border border-gold/30 bg-gold-soft text-gold-ink"
            >
              <ChefHat size={20} />
            </span>
            <div>
              <p className="eyebrow">Phiếu đang chờ</p>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-2">
                <span className="t-metric-sm text-ink">{summary.activeTicketsCount}</span>
                <span className="text-sm text-ink-muted">
                  phiếu bàn đang xử lý ({summary.waitingDishesCount + summary.cookingDishesCount} món)
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <div className="flex flex-wrap items-center gap-4 text-xs text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <StatusDot tone="warning" />
                <span className="num font-medium text-ink">{summary.waitingDishesCount}</span>
                <span>Chờ</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <StatusDot tone="danger" />
                <span className="num font-medium text-ink">{summary.cookingDishesCount}</span>
                <span>Đang nấu</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <StatusDot tone="success" />
                <span className="num font-medium text-ink">{summary.doneDishesCount}</span>
                <span>Hoàn thành</span>
              </span>
            </div>

            <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />

            <div className="text-left sm:text-right">
              <p className="eyebrow">Sắp xếp</p>
              <p className="mt-0.5 text-xs font-medium text-ink">VIP + FIFO</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Banner quy tắc tính tiền FR-15 & BOM */}
      <div
        role="note"
        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/40 bg-gold-soft/75 px-4 py-3.5 sm:px-5"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-md border border-gold/30 bg-paper text-gold-ink"
          >
            <BellRing size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Chỉ món Hoàn thành mới vào bill</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Đánh dấu xong sẽ phát chuông Ting báo phục vụ và tự động trừ kho BOM.
            </p>
          </div>
        </div>
        <span className="eyebrow shrink-0 text-gold-ink">Quy tắc tính tiền · FR-15</span>
      </div>

      {/* Cảnh báo chế độ chỉ xem nếu vai trò không có quyền thao tác bếp */}
      {!canAct && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-line-strong bg-paper-warm px-4 py-3 text-xs text-ink-soft"
        >
          <Lock size={15} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          <span>
            <strong className="font-medium text-ink">Chế độ chỉ xem ({ROLE_META[currentRole].label}):</strong>{' '}
            Các nút chuyển trạng thái nấu và công tắc báo hết món đang bị khóa. Chỉ vai trò Bếp, Quản lý sảnh và
            Chủ nhà hàng được thao tác trên KDS.
          </span>
        </div>
      )}

      {/* Bố cục chính: Phiếu bếp (2 cột) + Panel Tình trạng món sticky bên phải */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented<KdsFilter>
              label="Lọc phiếu bếp theo trạng thái món"
              value={filter}
              onChange={setFilter}
              items={[
                { id: 'all', label: 'Tất cả', count: summary.totalDishesCount },
                { id: 'ChoCheBien', label: 'Chờ chế biến', count: summary.waitingDishesCount },
                { id: 'DangCheBien', label: 'Đang nấu', count: summary.cookingDishesCount },
                { id: 'HoanThanh', label: 'Hoàn thành', count: summary.doneDishesCount },
              ]}
            />
            <span className="num text-xs text-ink-muted">
              Hiển thị {visibleTickets.length}/{summary.totalTicketsCount} phiếu bàn
            </span>
          </div>

          {visibleTickets.length === 0 ? (
            <Card>
              <EmptyState
                icon={<UtensilsCrossed size={24} />}
                title="Không có phiếu bếp nào khớp bộ lọc"
                description={
                  filter === 'all'
                    ? 'Hàng đợi bếp hiện đang trống. Đơn gọi mới từ Phục vụ hoặc Mobile QR sẽ hiển thị tức thì tại đây.'
                    : 'Không còn món nào ở trạng thái đã chọn. Chuyển về Tất cả để xem toàn bộ phiếu bếp.'
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
        </div>

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
