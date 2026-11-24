import { useMemo } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type {
  Ban,
  DonGoiMon,
  HoaDon,
  KhachDoan,
  KhachHang,
  PhieuDatBan,
} from '@/types/database';
import {
  computeActiveDepositsTotal,
  computeCustomerGroupCounts,
  type CustomerFilterKey,
} from './customerHelpers';

export interface CustomerOrderRecord {
  order: DonGoiMon;
  table: Ban | null;
  invoice: HoaDon | null;
  itemCount: number;
  completedAmount: number;
}

export interface CustomerReservationRecord {
  reservation: PhieuDatBan;
  table: Ban | null;
  customer: KhachHang | null;
}

export interface EnrichedCustomerRow {
  customer: KhachHang;
  corporate: KhachDoan | null;
  reservations: CustomerReservationRecord[];
  orders: CustomerOrderRecord[];
  totalDeposit: number;
}

export interface CorporateProfileRecord {
  corporate: KhachDoan;
  customer: KhachHang | null;
  totalDeposit: number;
  reservationCount: number;
}

export function useCustomersData(): {
  rows: EnrichedCustomerRow[];
  corporates: CorporateProfileRecord[];
  reservations: CustomerReservationRecord[];
  groupCounts: Record<CustomerFilterKey, number>;
  totalDeposits: number;
  vipDiamondCount: number;
  vipGoldCount: number;
} {
  const customers = useRestaurantStore((s) => s.snapshot.tbl_khach_hang);
  const corporateList = useRestaurantStore((s) => s.snapshot.tbl_khach_doan);
  const reservationList = useRestaurantStore((s) => s.snapshot.tbl_phieu_dat_ban);
  const orderList = useRestaurantStore((s) => s.snapshot.tbl_don_goi_mon);
  const orderItems = useRestaurantStore((s) => s.snapshot.tbl_chi_tiet_don_goi);
  const invoiceList = useRestaurantStore((s) => s.snapshot.tbl_hoa_don);
  const tables = useRestaurantStore((s) => s.snapshot.tbl_ban);

  return useMemo(() => {
    const tablesById = new Map(tables.map((t) => [t.ma_ban, t]));
    const customersById = new Map(customers.map((c) => [c.ma_khach_hang, c]));
    const corporateByCustomer = new Map(corporateList.map((d) => [d.ma_khach_hang, d]));
    const invoiceByOrder = new Map(invoiceList.map((h) => [h.ma_order, h]));

    const itemsByOrder = new Map<string, { count: number; completedAmount: number }>();
    for (const item of orderItems) {
      if (item.trang_thai_mon === 'DaHuy') continue;
      const cur = itemsByOrder.get(item.ma_order) ?? { count: 0, completedAmount: 0 };
      cur.count += Number(item.so_luong);
      if (item.trang_thai_mon === 'HoanThanh' || item.trang_thai_mon === 'DaPhucVu') {
        cur.completedAmount += Number(item.don_gia_thoi_diem) * Number(item.so_luong);
      }
      itemsByOrder.set(item.ma_order, cur);
    }

    const allReservations: CustomerReservationRecord[] = reservationList.map((reservation) => ({
      reservation,
      table: tablesById.get(reservation.ma_ban) ?? null,
      customer: customersById.get(reservation.ma_khach_hang) ?? null,
    }));

    const reservationsByCustomer = new Map<string, CustomerReservationRecord[]>();
    for (const rec of allReservations) {
      const list = reservationsByCustomer.get(rec.reservation.ma_khach_hang);
      if (list) list.push(rec);
      else reservationsByCustomer.set(rec.reservation.ma_khach_hang, [rec]);
    }

    const ordersByCustomer = new Map<string, CustomerOrderRecord[]>();
    for (const order of orderList) {
      if (!order.ma_khach_hang) continue;
      const itemSummary = itemsByOrder.get(order.ma_order) ?? { count: 0, completedAmount: 0 };
      const rec: CustomerOrderRecord = {
        order,
        table: tablesById.get(order.ma_ban) ?? null,
        invoice: invoiceByOrder.get(order.ma_order) ?? null,
        itemCount: itemSummary.count,
        completedAmount: itemSummary.completedAmount,
      };
      const list = ordersByCustomer.get(order.ma_khach_hang);
      if (list) list.push(rec);
      else ordersByCustomer.set(order.ma_khach_hang, [rec]);
    }

    const rows: EnrichedCustomerRow[] = customers.map((customer) => {
      const custRes = reservationsByCustomer.get(customer.ma_khach_hang) ?? [];
      const custOrders = ordersByCustomer.get(customer.ma_khach_hang) ?? [];
      return {
        customer,
        corporate: corporateByCustomer.get(customer.ma_khach_hang) ?? null,
        reservations: custRes,
        orders: custOrders,
        totalDeposit: computeActiveDepositsTotal(custRes.map((r) => r.reservation)),
      };
    });

    const corporates: CorporateProfileRecord[] = corporateList.map((corporate) => {
      const custRes = reservationsByCustomer.get(corporate.ma_khach_hang) ?? [];
      return {
        corporate,
        customer: customersById.get(corporate.ma_khach_hang) ?? null,
        totalDeposit: computeActiveDepositsTotal(custRes.map((r) => r.reservation)),
        reservationCount: custRes.length,
      };
    });

    const vipCustomers = customers.filter((c) => c.loai_khach === 'VIP');

    return {
      rows,
      corporates,
      reservations: allReservations,
      groupCounts: computeCustomerGroupCounts(customers),
      totalDeposits: computeActiveDepositsTotal(reservationList),
      vipDiamondCount: vipCustomers.filter((c) => c.hang_the === 'Diamond').length,
      vipGoldCount: vipCustomers.filter((c) => c.hang_the === 'Gold').length,
    };
  }, [customers, corporateList, reservationList, orderList, orderItems, invoiceList, tables]);
}
