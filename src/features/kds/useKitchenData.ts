import { useMemo } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import {
  buildKdsTickets,
  canOperateKitchen,
  computeKdsSummary,
  filterKdsTickets,
  filterMenuDishes,
  type KdsFilter,
} from './kdsHelpers';

/** Hook lấy dữ liệu phái sinh cho Màn hình bếp KDS (MOD-05). */
export function useKitchenData(filter: KdsFilter, menuQuery: string) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const advanceKdsDishStatus = useRestaurantStore((s) => s.advanceKdsDishStatus);
  const toggleDishAvailability = useRestaurantStore((s) => s.toggleDishAvailability);

  const allTickets = useMemo(() => buildKdsTickets(snapshot), [snapshot]);
  const summary = useMemo(() => computeKdsSummary(allTickets), [allTickets]);
  const visibleTickets = useMemo(
    () => filterKdsTickets(allTickets, filter),
    [allTickets, filter],
  );
  const menuRows = useMemo(
    () => filterMenuDishes(snapshot.tbl_mon_an, snapshot.tbl_danh_muc_mon, menuQuery),
    [snapshot.tbl_mon_an, snapshot.tbl_danh_muc_mon, menuQuery],
  );
  const soldOutCount = useMemo(
    () => snapshot.tbl_mon_an.filter((m) => m.trang_thai_mon !== 'ConMon').length,
    [snapshot.tbl_mon_an],
  );

  return {
    currentRole,
    canAct: canOperateKitchen(currentRole),
    summary,
    visibleTickets,
    menuRows,
    totalMenuCount: snapshot.tbl_mon_an.length,
    soldOutCount,
    advanceKdsDishStatus,
    toggleDishAvailability,
  };
}
