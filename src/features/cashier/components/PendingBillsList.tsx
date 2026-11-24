import { ArrowRight, CheckCircle2, Receipt, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { CUSTOMER_GROUP_META } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/Misc';
import type { CashierInvoiceItem } from '../cashierHelpers';

interface PendingBillsListProps {
  pendingInvoices: CashierInvoiceItem[];
  paidInvoices: CashierInvoiceItem[];
  selectedInvoiceId: string | null;
  onSelect: (maHoaDon: string) => void;
}

function InvoiceRowButton({
  item,
  selected,
  onSelect,
}: {
  item: CashierInvoiceItem;
  selected: boolean;
  onSelect: (maHoaDon: string) => void;
}) {
  const isPaid = item.invoice.trang_thai_tt === 'DaThanhToan';
  const groupLabel = CUSTOMER_GROUP_META[item.customerGroup].label;
  const totalDishQty = item.completedLines.reduce((sum, l) => sum + l.item.so_luong, 0);

  return (
    <button
      type="button"
      onClick={() => onSelect(item.invoice.ma_hoa_don)}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors',
        selected
          ? 'border-primary bg-primary-soft/45'
          : 'border-line bg-paper hover:border-line-strong hover:bg-paper-warm',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-lg',
            isPaid
              ? 'bg-st-empty-soft text-st-empty-ink'
              : 'bg-st-billing-soft text-st-billing-ink',
          )}
        >
          {isPaid ? <CheckCircle2 size={18} /> : <Receipt size={18} />}
        </span>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {item.tableName}
            {item.mergedTableNames.length > 0 && (
              <span className="font-normal text-ink-muted">
                {' '}
                (+{item.mergedTableNames.length} bàn ghép)
              </span>
            )}
          </p>
          <p className="num mt-0.5 truncate text-xs text-ink-muted">
            {groupLabel} · {totalDishQty} món
            {item.totalSeats > 0 ? ` · ${item.totalSeats} ghế` : ''}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div className="text-right">
          <p className="num text-sm font-medium text-ink">
            {formatVnd(item.invoice.tong_tien_phai_tra)}
          </p>
          <p
            className={cn(
              'mt-0.5 text-xs',
              isPaid ? 'text-st-empty-ink' : 'text-st-billing-ink',
            )}
          >
            {isPaid
              ? item.tableReleased
                ? 'Đã thanh toán'
                : 'Đã thu · Chờ dọn bàn'
              : 'Sẵn sàng thu'}
          </p>
        </div>
        <ArrowRight
          size={15}
          aria-hidden
          className={cn(selected ? 'text-primary' : 'text-ink-faint')}
        />
      </div>
    </button>
  );
}

/** Cột trái: Danh sách hóa đơn chờ thanh toán (kèm hóa đơn vừa thu để in/xuất VAT) + thẻ FR-17. */
export function PendingBillsList({
  pendingInvoices,
  paidInvoices,
  selectedInvoiceId,
  onSelect,
}: PendingBillsListProps) {
  return (
    <Card className="no-print flex flex-col">
      <CardHeader
        title="Hóa đơn chờ thanh toán"
        subtitle="Bàn đã được phục vụ chốt bill sẵn sàng thu tiền"
        action={
          <Badge tone={pendingInvoices.length > 0 ? 'billing' : 'neutral'} className="num">
            {pendingInvoices.length} ĐANG MỞ
          </Badge>
        }
      />

      <CardBody className="flex flex-1 flex-col justify-between gap-5">
        <div className="space-y-4">
          {pendingInvoices.length === 0 ? (
            <EmptyState
              icon={<Receipt size={22} />}
              title="Không có hóa đơn chờ thanh toán"
              description="Khi Phục vụ chốt bill tại Sơ đồ bàn, hóa đơn đã khóa sẽ tự động xuất hiện tại đây."
              className="py-8"
            />
          ) : (
            <div className="space-y-2.5" role="list" aria-label="Danh sách hóa đơn chờ thanh toán">
              {pendingInvoices.map((item) => (
                <div key={item.invoice.ma_hoa_don} role="listitem">
                  <InvoiceRowButton
                    item={item}
                    selected={selectedInvoiceId === item.invoice.ma_hoa_don}
                    onSelect={onSelect}
                  />
                </div>
              ))}
            </div>
          )}

          {paidInvoices.length > 0 && (
            <div className="space-y-2.5 border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Đã thanh toán hôm nay</p>
                <Badge tone="success" size="sm" className="num">
                  {paidInvoices.length} hóa đơn
                </Badge>
              </div>
              <div className="space-y-2" role="list" aria-label="Danh sách hóa đơn đã thanh toán">
                {paidInvoices.map((item) => (
                  <div key={item.invoice.ma_hoa_don} role="listitem">
                    <InvoiceRowButton
                      item={item}
                      selected={selectedInvoiceId === item.invoice.ma_hoa_don}
                      onSelect={onSelect}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Thẻ "An toàn theo thiết kế" giải thích khóa chống thất thoát FR-17 */}
        <div className="flex items-start gap-3 rounded-lg border border-line bg-paper-warm p-3.5">
          <ShieldCheck size={17} aria-hidden className="mt-0.5 shrink-0 text-ink-soft" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink">An toàn theo thiết kế (FR-17)</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Mọi thay đổi dòng món trên hóa đơn đều bị khóa cứng ở chế độ chỉ đọc. Việc điều chỉnh món ăn
              chỉ được thực hiện bởi Phục vụ hoặc Quản lý trước khi chốt bill.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
