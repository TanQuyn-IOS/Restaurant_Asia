import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowRightLeft,
  Check,
  GitMerge,
  Unlink2,
} from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { formatVnd } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Misc';
import { Modal } from '@/components/ui/Overlay';
import { Segmented } from '@/components/ui/Tabs';
import { ItemStatusBadge } from '@/components/domain/badges';
import { getItemsBelongingToChildTable } from '../tableSplit';

export type TableActionMode = 'merge' | 'detach' | 'transfer';

export function MergeTransferModal({
  open,
  initialMode = 'merge',
  initialSourceId,
  initialTargetId,
  canOperate,
  readOnlyReason,
  onClose,
}: {
  open: boolean;
  initialMode?: TableActionMode;
  initialSourceId?: string | null;
  initialTargetId?: string | null;
  canOperate: boolean;
  readOnlyReason: string | null;
  onClose: () => void;
}) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const transferOrMergeTable = useRestaurantStore((s) => s.transferOrMergeTable);
  const detachMergedTable = useRestaurantStore((s) => s.detachMergedTable);

  const sourceTables = useMemo(
    () =>
      snapshot.tbl_ban.filter(
        (b) => b.trang_thai_ban === 'DangPhucVu' && !b.ma_ban_chinh,
      ),
    [snapshot.tbl_ban],
  );

  const emptyTables = useMemo(
    () => snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'Trong' && !b.ma_ban_chinh),
    [snapshot.tbl_ban],
  );

  const allMergedChildren = useMemo(
    () =>
      snapshot.tbl_ban.filter(
        (b) => b.ma_ban_chinh !== null && b.trang_thai_ban === 'DangPhucVu',
      ),
    [snapshot.tbl_ban],
  );

  const masterTablesWithChildren = useMemo(() => {
    const masterIds = new Set(
      allMergedChildren.map((c) => c.ma_ban_chinh).filter((id): id is string => Boolean(id)),
    );
    return sourceTables.filter((b) => masterIds.has(b.ma_ban));
  }, [sourceTables, allMergedChildren]);

  const dishMap = useMemo(
    () => new Map(snapshot.tbl_mon_an.map((m) => [m.ma_mon_an, m])),
    [snapshot.tbl_mon_an],
  );

  const activeItemCountByTable = useMemo(() => {
    const orderByTable = new Map<string, string>();
    for (const o of snapshot.tbl_don_goi_mon) {
      if (o.trang_thai_order === 'DangPhucVu') {
        orderByTable.set(o.ma_ban, o.ma_order);
      }
    }
    const countByOrder = new Map<string, number>();
    for (const item of snapshot.tbl_chi_tiet_don_goi) {
      if (item.trang_thai_mon === 'DaHuy') continue;
      countByOrder.set(item.ma_order, (countByOrder.get(item.ma_order) ?? 0) + item.so_luong);
    }
    const map = new Map<string, number>();
    for (const [maBan, maOrder] of orderByTable.entries()) {
      map.set(maBan, countByOrder.get(maOrder) ?? 0);
    }
    return map;
  }, [snapshot.tbl_don_goi_mon, snapshot.tbl_chi_tiet_don_goi]);

  const [mode, setMode] = useState<TableActionMode>(initialMode);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wasOpenRef = useRef(false);

  const getMergeTargetsForSource = (masterTableId: string) => {
    const otherOccupiedMasters = sourceTables.filter((b) => b.ma_ban !== masterTableId);
    return {
      empty: emptyTables,
      occupied: otherOccupiedMasters,
      all: [...emptyTables, ...otherOccupiedMasters],
    };
  };

  const resolveDefaultsForMode = (
    nextMode: TableActionMode,
    preferredSourceRaw?: string | null,
    preferredTargetRaw?: string | null,
  ) => {
    const rawInitial = preferredSourceRaw
      ? snapshot.tbl_ban.find((b) => b.ma_ban === preferredSourceRaw)
      : undefined;
    const resolvedMasterId = rawInitial?.ma_ban_chinh || rawInitial?.ma_ban;

    const eligibleSources =
      nextMode === 'detach' ? masterTablesWithChildren : sourceTables;

    const chosenSource =
      eligibleSources.find((b) => b.ma_ban === resolvedMasterId) ?? eligibleSources[0];
    const nextSourceId = chosenSource?.ma_ban ?? '';

    const childrenForSource = snapshot.tbl_ban.filter(
      (b) => b.ma_ban_chinh === nextSourceId && b.trang_thai_ban === 'DangPhucVu',
    );

    const eligibleTargets =
      nextMode === 'detach'
        ? childrenForSource
        : nextMode === 'merge'
          ? getMergeTargetsForSource(nextSourceId).all
          : emptyTables;

    const chosenTarget =
      eligibleTargets.find((b) => b.ma_ban === preferredTargetRaw) ?? eligibleTargets[0];

    return {
      sourceId: nextSourceId,
      targetId: chosenTarget?.ma_ban ?? '',
    };
  };

  // Chỉ khởi tạo lại form khi hộp thoại chuyển từ đóng -> mở (tránh Socket.io realtime xóa dữ liệu đang chọn)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const defaults = resolveDefaultsForMode(initialMode, initialSourceId, initialTargetId);
      setMode(initialMode);
      setSourceId(defaults.sourceId);
      setTargetId(defaults.targetId);
      setError(null);
    }
    wasOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialMode, initialSourceId, initialTargetId]);

  const handleModeChange = (nextMode: TableActionMode) => {
    const defaults = resolveDefaultsForMode(nextMode, sourceId, targetId);
    setMode(nextMode);
    setSourceId(defaults.sourceId);
    setTargetId(defaults.targetId);
    setError(null);
  };

  const handleSourceChange = (nextSourceId: string) => {
    setSourceId(nextSourceId);
    setError(null);

    if (mode === 'detach') {
      const children = snapshot.tbl_ban.filter(
        (b) => b.ma_ban_chinh === nextSourceId && b.trang_thai_ban === 'DangPhucVu',
      );
      if (!children.some((b) => b.ma_ban === targetId)) {
        setTargetId(children[0]?.ma_ban ?? '');
      }
    } else if (mode === 'merge') {
      const mergeTargets = getMergeTargetsForSource(nextSourceId).all;
      if (!mergeTargets.some((b) => b.ma_ban === targetId)) {
        setTargetId(mergeTargets[0]?.ma_ban ?? '');
      }
    }
  };

  const mergedChildrenOfSource = useMemo(
    () =>
      snapshot.tbl_ban.filter(
        (b) => b.ma_ban_chinh === sourceId && b.trang_thai_ban === 'DangPhucVu',
      ),
    [snapshot.tbl_ban, sourceId],
  );

  const mergeTargetGroups = useMemo(
    () => getMergeTargetsForSource(sourceId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sourceId, emptyTables, sourceTables],
  );

  const visibleSources = mode === 'detach' ? masterTablesWithChildren : sourceTables;
  const visibleTargets =
    mode === 'detach'
      ? mergedChildrenOfSource
      : mode === 'merge'
        ? mergeTargetGroups.all
        : emptyTables;

  const sourceTable = snapshot.tbl_ban.find((b) => b.ma_ban === sourceId);
  const targetTable = snapshot.tbl_ban.find((b) => b.ma_ban === targetId);

  const childItemsToRestore = useMemo(() => {
    if (mode !== 'detach' || !targetId) return [];
    return getItemsBelongingToChildTable(snapshot, targetId);
  }, [mode, snapshot, targetId]);

  const restoredSummary = useMemo(() => {
    let units = 0;
    let totalAmount = 0;
    for (const item of childItemsToRestore) {
      units += item.so_luong;
      totalAmount += item.so_luong * Number(item.don_gia_thoi_diem);
    }
    return { units, totalAmount };
  }, [childItemsToRestore]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOperate) return;

    if (mode === 'detach') {
      if (!targetId) {
        setError('Vui lòng chọn bàn phụ cần tách.');
        return;
      }
      const outcome = detachMergedTable(targetId);
      if (!outcome.ok) {
        setError(outcome.reason);
        return;
      }
      onClose();
      return;
    }

    if (!sourceId || !targetId) {
      setError('Vui lòng chọn đầy đủ bàn nguồn và bàn đích hợp lệ.');
      return;
    }
    if (sourceId === targetId) {
      setError('Bàn nguồn và bàn đích phải khác nhau.');
      return;
    }

    transferOrMergeTable(sourceId, targetId, mode);
    onClose();
  };

  const canProceed =
    canOperate &&
    visibleSources.length > 0 &&
    visibleTargets.length > 0 &&
    Boolean(sourceId) &&
    Boolean(targetId);

  const modalIcon =
    mode === 'merge' ? (
      <GitMerge size={20} />
    ) : mode === 'detach' ? (
      <Unlink2 size={20} />
    ) : (
      <ArrowRightLeft size={20} />
    );

  const submitLabel =
    mode === 'merge'
      ? 'Xác nhận ghép bàn'
      : mode === 'transfer'
        ? 'Xác nhận chuyển bàn'
        : childItemsToRestore.length > 0
          ? 'Tách bàn & trả món đã gọi'
          : 'Tách bàn về Trống';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={modalIcon}
      eyebrow="Điều phối sảnh · MOD-01"
      title="Ghép / Tách / Chuyển bàn"
      description="Ghép bàn cho đoàn đông, tách bàn đã ghép (tự động trả về đúng những món bàn đó đã gọi) hoặc chuyển toàn bộ phiên sang bàn trống."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="merge-transfer-form"
            disabled={!canProceed}
            title={readOnlyReason ?? undefined}
            icon={<Check size={16} />}
          >
            {submitLabel}
          </Button>
        </>
      }
    >
      {sourceTables.length === 0 ? (
        <EmptyState
          icon={<GitMerge size={24} />}
          title="Chưa có bàn đang phục vụ"
          description="Cần ít nhất 1 bàn ở trạng thái Đang phục vụ (chưa chốt bill) để ghép, tách hoặc chuyển."
        />
      ) : (
        <form id="merge-transfer-form" onSubmit={handleSubmit} className="space-y-5">
          {readOnlyReason && (
            <div className="rounded-lg border border-st-booked/40 bg-st-booked-soft px-4 py-3 text-xs text-st-booked-ink">
              {readOnlyReason}
            </div>
          )}

          <div className="space-y-2">
            <p className="eyebrow">Chế độ thao tác</p>
            <Segmented
              label="Chọn chế độ ghép, tách hoặc chuyển bàn"
              value={mode}
              onChange={handleModeChange}
              items={[
                { id: 'merge', label: 'Ghép bàn' },
                { id: 'detach', label: 'Tách bàn', count: allMergedChildren.length },
                { id: 'transfer', label: 'Chuyển bàn' },
              ]}
            />
          </div>

          {mode === 'detach' && masterTablesWithChildren.length === 0 ? (
            <EmptyState
              icon={<Unlink2 size={24} />}
              title="Hiện không có bàn nào đang ghép"
              description="Tất cả các bàn đang phục vụ đều hoạt động độc lập."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label={
                    mode === 'merge'
                      ? 'Bàn chính đang phục vụ'
                      : mode === 'detach'
                        ? 'Bàn chính đang có bàn ghép'
                        : 'Bàn nguồn đang phục vụ'
                  }
                >
                  {({ id }) => (
                    <Select
                      id={id}
                      value={sourceId}
                      onChange={(e) => handleSourceChange(e.target.value)}
                    >
                      {visibleSources.map((b) => {
                        const childCount = snapshot.tbl_ban.filter(
                          (c) => c.ma_ban_chinh === b.ma_ban && c.trang_thai_ban === 'DangPhucVu',
                        ).length;
                        return (
                          <option key={b.ma_ban} value={b.ma_ban}>
                            {b.ten_ban} ({b.so_ghe} ghế{childCount > 0 ? ` · ghép ${childCount} bàn` : ''})
                          </option>
                        );
                      })}
                    </Select>
                  )}
                </Field>

                <Field
                  label={
                    mode === 'merge'
                      ? 'Bàn ghép thêm vào'
                      : mode === 'detach'
                        ? 'Bàn phụ cần tách ra'
                        : 'Bàn trống chuyển sang'
                  }
                  error={error}
                >
                  {({ id, describedBy, invalid }) => (
                    <Select
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={targetId}
                      onChange={(e) => {
                        setTargetId(e.target.value);
                        setError(null);
                      }}
                    >
                      {visibleTargets.length === 0 ? (
                        <option value="">Không có bàn đích khả dụng</option>
                      ) : mode === 'merge' ? (
                        <>
                          {mergeTargetGroups.empty.length > 0 && (
                            <optgroup label="Bàn trống">
                              {mergeTargetGroups.empty.map((b) => (
                                <option key={b.ma_ban} value={b.ma_ban}>
                                  {b.ten_ban} ({b.so_ghe} ghế · Trống)
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {mergeTargetGroups.occupied.length > 0 && (
                            <optgroup label="Bàn đang phục vụ khác (gom chung đơn)">
                              {mergeTargetGroups.occupied.map((b) => {
                                const units = activeItemCountByTable.get(b.ma_ban) ?? 0;
                                return (
                                  <option key={b.ma_ban} value={b.ma_ban}>
                                    {b.ten_ban} ({b.so_ghe} ghế · {units} phần món)
                                  </option>
                                );
                              })}
                            </optgroup>
                          )}
                        </>
                      ) : (
                        visibleTargets.map((b) => (
                          <option key={b.ma_ban} value={b.ma_ban}>
                            {b.ten_ban} ({b.so_ghe} ghế)
                          </option>
                        ))
                      )}
                    </Select>
                  )}
                </Field>
              </div>

              {visibleTargets.length === 0 && (
                <div className="rounded-lg border border-st-booked/40 bg-st-booked-soft px-4 py-3 text-xs text-st-booked-ink">
                  Hiện không còn bàn nào khả dụng để thực hiện thao tác này.
                </div>
              )}

              {mode === 'detach' && targetTable && (
                <div className="space-y-2.5 rounded-lg border border-line bg-paper-warm p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="eyebrow">
                      {childItemsToRestore.length > 0
                        ? `Món ${targetTable.ten_ban} đã gọi (tự động trả về)`
                        : `Món của ${targetTable.ten_ban}`}
                    </p>
                    {childItemsToRestore.length > 0 && (
                      <span className="num text-xs font-medium text-primary">
                        {restoredSummary.units} phần · {formatVnd(restoredSummary.totalAmount)}
                      </span>
                    )}
                  </div>

                  {childItemsToRestore.length === 0 ? (
                    <p className="text-xs text-ink-muted">
                      Bàn này chưa gọi món riêng nào. Sau khi tách,{' '}
                      <span className="font-medium text-ink">{targetTable.ten_ban}</span> sẽ trở về trạng thái{' '}
                      <span className="font-medium text-st-empty-ink">Bàn trống</span> và toàn bộ đơn hiện tại vẫn giữ
                      nguyên ở <span className="font-medium text-ink">{sourceTable?.ten_ban}</span>.
                    </p>
                  ) : (
                    <ul className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                      {childItemsToRestore.map((item) => {
                        const dish = dishMap.get(item.ma_mon_an);
                        return (
                          <li
                            key={item.ma_chi_tiet_order}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2 text-xs"
                          >
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="num font-medium text-ink">×{item.so_luong}</span>
                              <span className="truncate font-medium text-ink">
                                {dish?.ten_mon_an ?? item.ma_mon_an}
                              </span>
                              <ItemStatusBadge status={item.trang_thai_mon} />
                            </div>
                            <span className="num font-medium text-ink-soft">
                              {formatVnd(Number(item.don_gia_thoi_diem) * item.so_luong)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {sourceTable && targetTable && (
                <div className="rounded-lg border border-line bg-paper-warm p-4">
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-ink">
                    <span className="rounded-md border border-line-strong bg-paper px-3 py-1.5">
                      {sourceTable.ten_ban} ({sourceTable.so_ghe} ghế)
                    </span>
                    <ArrowRight size={16} className="text-primary" aria-hidden />
                    <span className="rounded-md border border-primary/40 bg-primary-soft px-3 py-1.5 text-primary">
                      {targetTable.ten_ban} ({targetTable.so_ghe} ghế)
                    </span>
                  </div>
                  <p className="mt-3 text-center text-xs text-ink-muted">
                    {mode === 'merge' ? (
                      targetTable.trang_thai_ban === 'DangPhucVu' ? (
                        <>
                          Ghép <span className="font-medium text-ink">{targetTable.ten_ban}</span> vào{' '}
                          <span className="font-medium text-ink">{sourceTable.ten_ban}</span> — gom các món sang 1 hóa
                          đơn tổng và tự lưu nguồn bàn để tách ra trả đúng món nếu cần.
                        </>
                      ) : (
                        <>
                          Ghép <span className="font-medium text-ink">{targetTable.ten_ban}</span> vào bàn chính{' '}
                          <span className="font-medium text-ink">{sourceTable.ten_ban}</span> — tổng{' '}
                          <span className="num font-medium text-ink">
                            {sourceTable.so_ghe + targetTable.so_ghe} ghế
                          </span>
                          , gom chung 1 hóa đơn tổng.
                        </>
                      )
                    ) : mode === 'detach' ? (
                      childItemsToRestore.length > 0 ? (
                        <>
                          Tách <span className="font-medium text-ink">{targetTable.ten_ban}</span> khỏi{' '}
                          <span className="font-medium text-ink">{sourceTable.ten_ban}</span> và tự động trả về{' '}
                          <span className="num font-medium text-ink">{restoredSummary.units} phần món</span> bàn này đã
                          gọi thành đơn độc lập.
                        </>
                      ) : (
                        <>
                          Tách <span className="font-medium text-ink">{targetTable.ten_ban}</span> khỏi{' '}
                          <span className="font-medium text-ink">{sourceTable.ten_ban}</span> và trả về trạng thái{' '}
                          <span className="font-medium text-st-empty-ink">Bàn trống</span>.
                        </>
                      )
                    ) : (
                      <>
                        Chuyển toàn bộ phiên phục vụ
                        {mergedChildrenOfSource.length > 0 &&
                          ` (cùng ${mergedChildrenOfSource.length} bàn phụ đang ghép)`}{' '}
                        sang <span className="font-medium text-ink">{targetTable.ten_ban}</span> và trả{' '}
                        <span className="font-medium text-ink">{sourceTable.ten_ban}</span> về trạng thái Trống.
                      </>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </form>
      )}
    </Modal>
  );
}
