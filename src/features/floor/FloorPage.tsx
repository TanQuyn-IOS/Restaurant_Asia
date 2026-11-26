import { useState } from 'react';
import {
  ArrowRight,
  CalendarPlus,
  CheckCircle2,
  Clock,
  GitMerge,
  LayoutGrid,
  Lock,
  Plus,
  PlusCircle,
  QrCode,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDuration } from '@/lib/format';
import { TABLE_STATUS_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { TableStatus } from '@/types/database';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Misc';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { UnderlineTabs } from '@/components/ui/Tabs';
import {
  canManageFloorSpaceRole,
  canOperateFloorRole,
  getFloorReadOnlyReason,
  splitZoneName,
  type FloorTableVM,
  type ZoneFilterKey,
} from './floorHelpers';
import { useFloorData } from './useFloorData';
import { TableCard } from './components/TableCard';
import { QrSupportStrip } from './components/QrSupportStrip';
import { QrSupportSheet } from './components/QrSupportSheet';
import { OpenTableModal } from './components/OpenTableModal';
import { ReservationModal } from './components/ReservationModal';
import { MergeTransferModal, type TableActionMode } from './components/MergeTransferModal';
import { OrderingSheet } from './components/OrderingSheet';
import { AddSpaceModal } from './components/AddSpaceModal';

const STATUS_ORDER: TableStatus[] = ['Trong', 'DaDat', 'DangPhucVu', 'ChoThanhToan'];

export function FloorPage() {
  const firstZoneId = useRestaurantStore((s) => s.snapshot.tbl_khu_vuc[0]?.ma_khu_vuc ?? 'ALL');
  const setSelectedTableId = useRestaurantStore((s) => s.setSelectedTableId);
  const resolveGuestQrRequest = useRestaurantStore((s) => s.resolveGuestQrRequest);
  const backendConnected = useRestaurantStore((s) => s.backendConnected);

  const [selectedZone, setSelectedZone] = useState<ZoneFilterKey>(firstZoneId);
  const [statusFilter, setStatusFilter] = useState<TableStatus | 'ALL'>('ALL');
  const [openTableModal, setOpenTableModal] = useState<{ open: boolean; tableId: string | null }>({
    open: false,
    tableId: null,
  });
  const [reservationOpen, setReservationOpen] = useState(false);
  const [mergeModalState, setMergeModalState] = useState<{
    open: boolean;
    mode: TableActionMode;
    sourceId: string | null;
    targetId: string | null;
  }>({ open: false, mode: 'merge', sourceId: null, targetId: null });
  const [addSpaceOpen, setAddSpaceOpen] = useState(false);
  const [orderingSheetTableId, setOrderingSheetTableId] = useState<string | null>(null);
  const [qrSupportSheet, setQrSupportSheet] = useState<{ open: boolean; requestId: string | null }>({
    open: false,
    requestId: null,
  });

  const {
    snapshot,
    currentRole,
    selectedTableId,
    tableVMs,
    zoneTabs,
    zoneStats,
    visibleTables,
    pendingQrRequests,
    selectedTableVM,
  } = useFloorData(selectedZone, statusFilter);

  const canOperate = canOperateFloorRole(currentRole);
  const canManageSpace = canManageFloorSpaceRole(currentRole);
  const readOnlyReason = getFloorReadOnlyReason(currentRole);

  const activeZoneRecord =
    selectedZone === 'ALL'
      ? undefined
      : snapshot.tbl_khu_vuc.find((z) => z.ma_khu_vuc === selectedZone);
  const activeZoneShort = activeZoneRecord
    ? splitZoneName(activeZoneRecord.ten_khu_vuc).short
    : 'Toàn bộ khu vực';

  const orderingVM = orderingSheetTableId
    ? tableVMs.find((vm) => vm.ban.ma_ban === orderingSheetTableId)
    : undefined;

  const handleSelectTable = (vm: FloorTableVM) => {
    setSelectedTableId(vm.ban.ma_ban);
    if (vm.ban.trang_thai_ban === 'Trong' || vm.ban.trang_thai_ban === 'DaDat') {
      setOpenTableModal({ open: true, tableId: vm.ban.ma_ban });
    } else {
      setOrderingSheetTableId(vm.ban.ma_ban);
    }
  };

  const turnDiff = zoneStats.avgTurnMinutes - 45;
  const turnHint =
    turnDiff <= 0
      ? `${Math.abs(turnDiff)}p nhanh hơn mục tiêu 45p`
      : `+${turnDiff}p so với mục tiêu 45p`;

  return (
    <PageBody>
      <PageHeader
        title="Sơ đồ bàn"
        actions={
          <>
            {canManageSpace && (
              <Button variant="ghost" onClick={() => setAddSpaceOpen(true)} icon={<PlusCircle size={16} />}>
                Thêm bàn / khu
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={!canOperate}
              title={readOnlyReason ?? 'Tạo phiếu đặt bàn trước và thu tiền cọc'}
              onClick={() => setReservationOpen(true)}
              icon={<CalendarPlus size={16} />}
            >
              Đặt bàn
            </Button>
            <Button
              variant="secondary"
              disabled={!canOperate}
              title={readOnlyReason ?? 'Ghép bàn phụ, tách bàn hoặc chuyển bàn đang phục vụ'}
              onClick={() =>
                setMergeModalState({
                  open: true,
                  mode: 'merge',
                  sourceId:
                    selectedTableVM?.ban.trang_thai_ban === 'DangPhucVu'
                      ? selectedTableVM.effectiveTableId
                      : null,
                  targetId: null,
                })
              }
              icon={<GitMerge size={16} />}
            >
              Ghép / Chuyển
            </Button>
            <Button
              variant="primary"
              disabled={!canOperate}
              title={readOnlyReason ?? 'Mở bàn mới đón khách'}
              onClick={() => setOpenTableModal({ open: true, tableId: null })}
              icon={<Plus size={16} />}
            >
              Mở bàn
            </Button>
          </>
        }
      />

      {readOnlyReason && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-2.5 rounded-lg border border-st-booked/40 bg-st-booked-soft px-4 py-3 text-xs text-st-booked-ink"
        >
          <Lock size={15} className="shrink-0" aria-hidden />
          <span className="font-medium">Chế độ chỉ xem:</span>
          <span>{readOnlyReason}</span>
        </div>
      )}

      {/* 4 thẻ KPI (khớp mockup 01) */}
      <section aria-label="Thống kê sơ đồ bàn" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng số bàn trong khu"
          value={String(zoneStats.totalTables).padStart(2, '0')}
          hint={activeZoneShort}
          icon={<LayoutGrid size={18} />}
          tone="neutral"
        />
        <StatCard
          label="Còn trống"
          value={String(zoneStats.availableCount).padStart(2, '0')}
          hint="Sẵn sàng đón khách"
          hintTone="success"
          icon={<CheckCircle2 size={18} />}
          tone="success"
        />
        <StatCard
          label="Khách đang ngồi"
          value={String(zoneStats.seatedGuests).padStart(2, '0')}
          hint={`trên ${zoneStats.occupiedTablesCount} bàn đang phục vụ`}
          icon={<Users size={18} />}
          tone="primary"
        />
        <StatCard
          label="Thời gian quay bàn TB"
          value={formatDuration(zoneStats.avgTurnMinutes)}
          hint={turnHint}
          hintTone={turnDiff <= 0 ? 'success' : 'warning'}
          icon={<Clock size={18} />}
          tone="gold"
        />
      </section>

      <QrSupportStrip
        requests={pendingQrRequests}
        tables={snapshot.tbl_ban}
        onOpenSheet={(requestId) =>
          setQrSupportSheet({ open: true, requestId: requestId ?? null })
        }
      />

      {/* Tab khu vực 01.. + Lưới bàn */}
      <div className="space-y-4">
        <div className="border-b border-line">
          <UnderlineTabs
            label="Chọn khu vực sảnh"
            value={selectedZone}
            onChange={(next) => setSelectedZone(next)}
            items={zoneTabs}
          />
        </div>

        {/* Hàng lọc 4 trạng thái bàn + Gọi món QR */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
                statusFilter === 'ALL'
                  ? 'bg-ink font-medium text-white'
                  : 'text-ink-soft hover:bg-sunken/70 hover:text-ink',
              )}
            >
              <span>Tất cả</span>
              <span className={cn('num', statusFilter === 'ALL' ? 'text-white/75' : 'text-ink-muted')}>
                ({zoneStats.totalTables})
              </span>
            </button>
            {STATUS_ORDER.map((st) => {
              const meta = TABLE_STATUS_META[st];
              const count = zoneStats.statusCounts[st];
              const isActive = statusFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(isActive ? 'ALL' : st)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
                    isActive
                      ? 'bg-sunken font-medium text-ink ring-1 ring-line-strong'
                      : 'text-ink-soft hover:bg-sunken/70 hover:text-ink',
                  )}
                >
                  <StatusDot tone={meta.tone} />
                  <span>{meta.short}</span>
                  <span className="num text-ink-muted">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
            <QrCode size={14} aria-hidden className="text-ink-soft" />
            <span>QR tại bàn: bật</span>
          </div>
        </div>

        {visibleTables.length === 0 ? (
          <div className="rounded-lg border border-line bg-paper">
            <EmptyState
              icon={<LayoutGrid size={24} />}
              title="Không có bàn nào khớp bộ lọc"
              description="Thử chuyển sang khu vực khác hoặc đặt lại bộ lọc trạng thái bàn."
              action={
                statusFilter !== 'ALL' ? (
                  <Button variant="secondary" size="sm" onClick={() => setStatusFilter('ALL')}>
                    Hiện tất cả trạng thái
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 min-[1400px]:grid-cols-5">
            {visibleTables.map((vm) => (
              <TableCard
                key={vm.ban.ma_ban}
                vm={vm}
                selected={vm.ban.ma_ban === selectedTableId}
                onSelect={handleSelectTable}
              />
            ))}
          </div>
        )}

        {/* Chân sảnh đồng bộ trực tiếp */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <StatusDot tone="success" pulse />
              Đồng bộ trực tiếp
            </span>
            <Badge tone="neutral" size="sm">
              {backendConnected ? 'MySQL' : 'Cục bộ'}
            </Badge>
          </div>

          <button
            type="button"
            disabled={!canOperate}
            title={readOnlyReason ?? 'Ghép, tách hoặc chuyển bàn'}
            onClick={() =>
              setMergeModalState({
                open: true,
                mode: 'merge',
                sourceId:
                  selectedTableVM?.ban.trang_thai_ban === 'DangPhucVu'
                    ? selectedTableVM.effectiveTableId
                    : null,
                targetId: null,
              })
            }
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-2 hover:underline disabled:text-ink-faint disabled:no-underline"
          >
            <span>Ghép / tách / chuyển bàn</span>
            <ArrowRight size={13} aria-hidden />
          </button>
        </div>
      </div>

      <OpenTableModal
        open={openTableModal.open}
        initialTableId={openTableModal.tableId}
        canOperate={canOperate}
        readOnlyReason={readOnlyReason}
        onClose={() => setOpenTableModal({ open: false, tableId: null })}
        onOpened={(maBan) => {
          setSelectedTableId(maBan);
          setOrderingSheetTableId(maBan);
        }}
      />

      <ReservationModal
        open={reservationOpen}
        canOperate={canOperate}
        readOnlyReason={readOnlyReason}
        onClose={() => setReservationOpen(false)}
      />

      <MergeTransferModal
        open={mergeModalState.open}
        initialMode={mergeModalState.mode}
        initialSourceId={mergeModalState.sourceId}
        initialTargetId={mergeModalState.targetId}
        canOperate={canOperate}
        readOnlyReason={readOnlyReason}
        onClose={() =>
          setMergeModalState((prev) => ({ ...prev, open: false }))
        }
      />

      {canManageSpace && (
        <AddSpaceModal
          open={addSpaceOpen}
          defaultZoneId={selectedZone === 'ALL' ? firstZoneId : selectedZone}
          onCreatedZone={(maKhuVuc) => setSelectedZone(maKhuVuc)}
          onClose={() => setAddSpaceOpen(false)}
        />
      )}

      <QrSupportSheet
        open={qrSupportSheet.open}
        highlightedId={qrSupportSheet.requestId}
        requests={pendingQrRequests}
        tables={snapshot.tbl_ban}
        zones={snapshot.tbl_khu_vuc}
        canOperate={canOperate}
        readOnlyReason={readOnlyReason}
        onResolve={resolveGuestQrRequest}
        onOpenTable={(maBan) => {
          setSelectedTableId(maBan);
          setOrderingSheetTableId(maBan);
        }}
        onClose={() => setQrSupportSheet({ open: false, requestId: null })}
      />

      <OrderingSheet
        open={Boolean(orderingSheetTableId)}
        vm={orderingVM}
        canOperate={canOperate}
        readOnlyReason={readOnlyReason}
        onOpenDetachTable={(sourceTableId, preferredTargetId) =>
          setMergeModalState({
            open: true,
            mode: 'detach',
            sourceId: sourceTableId,
            targetId: preferredTargetId ?? null,
          })
        }
        onClose={() => setOrderingSheetTableId(null)}
      />
    </PageBody>
  );
}
