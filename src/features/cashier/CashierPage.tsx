import { useState } from 'react';
import { CheckCircle2, Clock, FileText, Lock } from 'lucide-react';
import { formatVnd } from '@/lib/format';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/Card';
import { useCashierData } from './useCashierData';
import { PendingBillsList } from './components/PendingBillsList';
import { LockedInvoicePanel } from './components/LockedInvoicePanel';

/** Màn hình Quầy thu ngân POS ở chế độ Chỉ đọc chống thất thoát (MOD-06). */
export function CashierPage() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const {
    currentRole,
    canConfirmPayment,
    stats,
    pendingInvoices,
    paidInvoices,
    selectedInvoice,
    attemptIllegalCashierModification,
    processReadOnlyInvoicePayment,
  } = useCashierData(selectedInvoiceId);

  return (
    <PageBody>
      <PageHeader
        eyebrow="Quầy thu ngân · MOD-06"
        title="Thu ngân POS"
        description="Kiểm tra hóa đơn đã hoàn thành, bảo vệ chế độ chỉ đọc chống thất thoát và thu tiền an toàn."
        actions={
          <Badge
            tone="primary"
            icon={<Lock size={13} aria-hidden />}
            className="border border-primary/30 px-3 py-1.5 uppercase"
          >
            CHẾ ĐỘ CHỈ ĐỌC
          </Badge>
        }
      />

      {/* 3 thẻ KPI tổng quan quầy thu ngân */}
      <div className="no-print grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Chờ thanh toán"
          value={String(stats.pendingCount).padStart(2, '0')}
          hint="hóa đơn sẵn sàng chốt thu"
          tone="billing"
          hintTone="billing"
          icon={<Clock size={18} />}
        />
        <StatCard
          label="Đã thu hôm nay"
          value={formatVnd(stats.collectedTodayVnd)}
          hint={
            <span className="num">
              {stats.paidTransactionsCount} giao dịch đã hoàn tất
            </span>
          }
          tone="success"
          hintTone="success"
          icon={<CheckCircle2 size={18} />}
        />
        <StatCard
          label="Hóa đơn VAT đã xuất"
          value={String(stats.vatIssuedCount).padStart(2, '0')}
          hint={
            stats.pendingVatRequestedCount > 0
              ? `${stats.pendingVatRequestedCount} hóa đơn chờ yêu cầu xuất VAT 8%`
              : 'hóa đơn đỏ điện tử GTGT 8%'
          }
          tone="neutral"
          icon={<FileText size={18} />}
        />
      </div>

      {/* Bố cục 2 cột: Danh sách hóa đơn chờ (trái) + Chi tiết hóa đơn khóa chỉ đọc (phải) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PendingBillsList
            pendingInvoices={pendingInvoices}
            paidInvoices={paidInvoices}
            selectedInvoiceId={selectedInvoiceId}
            onSelect={setSelectedInvoiceId}
          />
        </div>

        <div className="lg:col-span-7">
          <LockedInvoicePanel
            item={selectedInvoice}
            currentRole={currentRole}
            canConfirm={canConfirmPayment}
            onAttemptIllegalModify={attemptIllegalCashierModification}
            onConfirmPayment={processReadOnlyInvoicePayment}
          />
        </div>
      </div>
    </PageBody>
  );
}
