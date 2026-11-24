import { CheckCircle2, FileText, Printer, Trash2 } from 'lucide-react';
import { formatClock, formatVnd } from '@/lib/format';
import { PAYMENT_METHOD_META } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CashierInvoiceItem } from '../cashierHelpers';

interface PaidReceiptSectionProps {
  item: CashierInvoiceItem;
}

/** Hiển thị biên nhận xác nhận đã thanh toán, thông tin VAT đỏ và nút In / Xuất hóa đơn VAT. */
export function PaidReceiptSection({ item }: PaidReceiptSectionProps) {
  const tx = item.paymentTx;

  return (
    <div className="space-y-4 border-t border-line pt-5">
      <div className="rounded-lg border border-st-empty/35 bg-st-empty-soft p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full bg-paper text-st-empty-ink"
            >
              <CheckCircle2 size={18} />
            </span>
            <div>
              <p className="text-sm font-medium text-st-empty-ink">
                Đã thanh toán hoàn tất & ghi nhận vào Sổ quỹ Chủ
              </p>
              <p className="num mt-0.5 text-xs text-st-empty-ink">
                {tx
                  ? `Mã GD ${tx.ma_giao_dich} · ${PAYMENT_METHOD_META[tx.phuong_thuc].label} · Lúc ${formatClock(tx.thoi_gian_giao_dich.replace(' ', 'T'))}`
                  : `Hóa đơn ${item.invoice.ma_hoa_don} đã hoàn tất thanh toán.`}
              </p>
            </div>
          </div>
          <Badge tone="success" dot>
            Đã thu đủ
          </Badge>
        </div>

        {tx && (
          <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-st-empty/25 pt-3 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-st-empty-ink/80">Khách thanh toán</dt>
              <dd className="num mt-0.5 font-medium text-ink">{formatVnd(tx.so_tien_nhan)}</dd>
            </div>
            <div>
              <dt className="text-st-empty-ink/80">Tiền thối lại</dt>
              <dd className="num mt-0.5 font-medium text-ink">{formatVnd(tx.tien_thoi)}</dd>
            </div>
            <div>
              <dt className="text-st-empty-ink/80">Mã tham chiếu NH</dt>
              <dd className="num mt-0.5 font-medium text-ink">
                {tx.ma_tham_chieu_nh ?? 'Tiền mặt'}
              </dd>
            </div>
          </dl>
        )}
      </div>

      {item.invoice.xuat_vat && (
        <div className="rounded-lg border border-gold/40 bg-gold-soft/60 p-4 text-xs">
          <div className="flex items-center gap-2 font-medium text-gold-ink">
            <FileText size={15} aria-hidden />
            Thông tin hóa đơn đỏ điện tử VAT 8%
          </div>
          <dl className="mt-2.5 space-y-1.5 text-ink-soft">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink-muted">Đơn vị nhận hóa đơn:</dt>
              <dd className="font-medium text-ink">{item.invoice.ten_cong_ty_vat ?? '—'}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink-muted">Mã số thuế (MST):</dt>
              <dd className="num font-medium text-ink">{item.invoice.ma_so_thue_vat ?? '—'}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-ink-muted">Tiền thuế GTGT (8%):</dt>
              <dd className="num font-medium text-ink">{formatVnd(item.invoice.tien_thue_vat)}</dd>
            </div>
          </dl>
        </div>
      )}

      {!item.tableReleased && (
        <div className="no-print flex items-start gap-2.5 rounded-lg border border-line bg-paper-warm px-3.5 py-3 text-xs text-ink-soft">
          <Trash2 size={15} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          <span>
            <strong className="font-medium text-ink">Quy tắc giải phóng bàn (FR-02):</strong> Bàn{' '}
            {item.tableName} vẫn giữ trạng thái chờ Phục vụ dọn sạch và bấm nút{' '}
            <strong className="font-medium text-ink">DELETE</strong> trên Sơ đồ bàn.
          </span>
        </div>
      )}

      <div className="no-print flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="primary"
          size="md"
          icon={<Printer size={16} aria-hidden />}
          onClick={() => window.print()}
        >
          In / Xuất hóa đơn VAT
        </Button>
      </div>
    </div>
  );
}
