import { useMemo } from 'react';
import {
  useRestaurantStore,
  calculateCompletedOrderBill,
} from '@/store/useRestaurantStore';
import type { TableStatus } from '@/types/database';
import {
  computeZoneStats,
  formatZoneTabIndex,
  getActiveOrderForTable,
  getActiveReservationForTable,
  getInvoiceForOrder,
  getMergedChildTables,
  resolveEffectiveTableId,
  splitZoneName,
  type FloorTableVM,
  type ZoneFilterKey,
} from './floorHelpers';

export function useFloorData(selectedZone: ZoneFilterKey, statusFilter: TableStatus | 'ALL') {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const selectedTableId = useRestaurantStore((s) => s.selectedTableId);

  const tableVMs = useMemo<FloorTableVM[]>(() => {
    const zoneMap = new Map(snapshot.tbl_khu_vuc.map((z) => [z.ma_khu_vuc, z]));
    const tableMap = new Map(snapshot.tbl_ban.map((b) => [b.ma_ban, b]));
    const customerMap = new Map(snapshot.tbl_khach_hang.map((c) => [c.ma_khach_hang, c]));
    const groupMap = new Map(snapshot.tbl_khach_doan.map((g) => [g.ma_khach_hang, g]));

    const pendingReqByTable = new Map<string, number>();
    for (const req of snapshot.tbl_yeu_cau_khach_hang) {
      if (req.trang_thai_xu_ly !== 'DaHoanTat') {
        pendingReqByTable.set(req.ma_ban, (pendingReqByTable.get(req.ma_ban) ?? 0) + 1);
      }
    }

    return snapshot.tbl_ban.map((ban) => {
      const effectiveTableId = resolveEffectiveTableId(snapshot, ban.ma_ban);
      const masterTable = ban.ma_ban_chinh ? tableMap.get(ban.ma_ban_chinh) : undefined;
      const mergedChildren = getMergedChildTables(snapshot, ban.ma_ban);
      const activeOrder = getActiveOrderForTable(snapshot, ban.ma_ban);
      const invoice = activeOrder ? getInvoiceForOrder(snapshot, activeOrder.ma_order) : undefined;
      const bill = activeOrder ? calculateCompletedOrderBill(snapshot, activeOrder.ma_order) : null;
      const reservation = getActiveReservationForTable(snapshot, ban.ma_ban);

      const customerId = activeOrder?.ma_khach_hang ?? reservation?.ma_khach_hang ?? null;
      const customer = customerId ? customerMap.get(customerId) : undefined;
      const groupInfo = customerId ? groupMap.get(customerId) : undefined;

      const isPaidAwaitingRelease =
        invoice?.trang_thai_tt === 'DaThanhToan' && ban.trang_thai_ban !== 'Trong';

      return {
        ban,
        zone: zoneMap.get(ban.ma_khu_vuc),
        effectiveTableId,
        masterTable,
        mergedChildren,
        activeOrder,
        invoice,
        bill,
        reservation,
        customer,
        groupInfo,
        pendingRequestCount: pendingReqByTable.get(ban.ma_ban) ?? 0,
        isPaidAwaitingRelease,
      };
    });
  }, [snapshot]);

  const zoneTabs = useMemo(() => {
    const countByZone = new Map<string, number>();
    for (const ban of snapshot.tbl_ban) {
      countByZone.set(ban.ma_khu_vuc, (countByZone.get(ban.ma_khu_vuc) ?? 0) + 1);
    }

    const compactZoneLabel = (raw: string): string => {
      const base = splitZoneName(raw).short;
      return base
        .replace(/^Sảnh Chính Tầng\s+/i, 'Sảnh Tầng ')
        .replace(/^Sảnh Gia Đình Tầng\s+/i, 'Gia Đình T')
        .replace(/^Khu Phòng\s+/i, 'Phòng ')
        .replace(/^Sảnh Đại Tiệc\s+/i, 'Khu ');
    };

    const items = snapshot.tbl_khu_vuc.map((kv, idx) => ({
      id: kv.ma_khu_vuc as ZoneFilterKey,
      index: formatZoneTabIndex(idx),
      label: compactZoneLabel(kv.ten_khu_vuc),
      count: countByZone.get(kv.ma_khu_vuc) ?? 0,
    }));

    items.push({
      id: 'ALL',
      index: '00',
      label: 'Tất cả',
      count: snapshot.tbl_ban.length,
    });

    return items;
  }, [snapshot.tbl_khu_vuc, snapshot.tbl_ban]);

  const zoneStats = useMemo(
    () => computeZoneStats(snapshot, selectedZone),
    [snapshot, selectedZone],
  );

  const visibleTables = useMemo(() => {
    return tableVMs.filter((vm) => {
      if (selectedZone !== 'ALL' && vm.ban.ma_khu_vuc !== selectedZone) return false;
      if (statusFilter !== 'ALL' && vm.ban.trang_thai_ban !== statusFilter) return false;
      return true;
    });
  }, [tableVMs, selectedZone, statusFilter]);

  const selectedTableVM = useMemo(
    () => tableVMs.find((vm) => vm.ban.ma_ban === selectedTableId) ?? tableVMs[0],
    [tableVMs, selectedTableId],
  );

  const pendingQrRequests = useMemo(
    () => snapshot.tbl_yeu_cau_khach_hang.filter((r) => r.trang_thai_xu_ly !== 'DaHoanTat'),
    [snapshot.tbl_yeu_cau_khach_hang],
  );

  const openableTables = useMemo(
    () => snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'Trong' || b.trang_thai_ban === 'DaDat'),
    [snapshot.tbl_ban],
  );

  const emptyTables = useMemo(
    () => snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'Trong'),
    [snapshot.tbl_ban],
  );

  const masterServingTables = useMemo(
    () =>
      snapshot.tbl_ban.filter(
        (b) => b.trang_thai_ban === 'DangPhucVu' && !b.ma_ban_chinh,
      ),
    [snapshot.tbl_ban],
  );

  return {
    snapshot,
    currentRole,
    selectedTableId,
    tableVMs,
    zoneTabs,
    zoneStats,
    visibleTables,
    selectedTableVM,
    pendingQrRequests,
    openableTables,
    emptyTables,
    masterServingTables,
  };
}
