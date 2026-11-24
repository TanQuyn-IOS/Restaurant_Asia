import { useMemo } from 'react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import {
  buildCashierInvoiceList,
  canConfirmCashierPayment,
  computeCashierStats,
} from './cashierHelpers';

/** Hook lấy dữ liệu phái sinh cho màn hình Thu ngân POS Read-Only (MOD-06). */
export function useCashierData(selectedInvoiceId: string | null) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const attemptIllegalCashierModification = useRestaurantStore(
    (s) => s.attemptIllegalCashierModification,
  );
  const processReadOnlyInvoicePayment = useRestaurantStore(
    (s) => s.processReadOnlyInvoicePayment,
  );

  const invoices = useMemo(() => buildCashierInvoiceList(snapshot), [snapshot]);
  const stats = useMemo(() => computeCashierStats(snapshot), [snapshot]);

  const pendingInvoices = useMemo(
    () => invoices.filter((item) => item.invoice.trang_thai_tt === 'ChoThanhToan'),
    [invoices],
  );
  const paidInvoices = useMemo(
    () => invoices.filter((item) => item.invoice.trang_thai_tt === 'DaThanhToan'),
    [invoices],
  );

  const selectedInvoice = useMemo(
    () => (selectedInvoiceId ? invoices.find((i) => i.invoice.ma_hoa_don === selectedInvoiceId) ?? null : null),
    [invoices, selectedInvoiceId],
  );

  return {
    currentRole,
    canConfirmPayment: canConfirmCashierPayment(currentRole),
    stats,
    pendingInvoices,
    paidInvoices,
    selectedInvoice,
    attemptIllegalCashierModification,
    processReadOnlyInvoicePayment,
  };
}
