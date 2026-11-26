import {
  Info,
  Lock,
  Pencil,
  Plus,
  ReceiptText,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { PaymentMethodType, RoleCode } from '@/types/database';
import { formatClock, formatDateVi, formatVnd } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { CustomerGroupBadge, ItemStatusBadge } from '@/components/domain/badges';
import type { CashierInvoiceItem } from '../cashierHelpers';
import { PaymentCheckoutSection } from './PaymentCheckoutSection';

interface LockedInvoicePanelProps {
  item: CashierInvoiceItem | null;
  currentRole: RoleCode;
  canConfirm: boolean;
  onAttemptIllegalModify: () => void;
  onConfirmPayment: (payload: {
    ma_hoa_don: string;
    phuong_thuc: PaymentMethodType;
    so_tien_nhan: number;
    xuat_vat: boolean;
    ma_so_thue_vat?: string;
    ten_cong_ty_vat?: string;
  }) => void;
}

/** Cột phải: Trạng thái trống khi chưa chọn bill, hoặc chi tiết hóa đơn ĐÃ KHÓA CHỈ ĐỌC. */
export function LockedInvoicePanel({
  item,
  currentRole,
  canConfirm,
  onAttemptIllegalModify,
  onConfirmPayment,
}: LockedInvoicePanelProps) {
  if (!item) {
    return (
      <Card className="flex min-h-[28rem] flex-col justify-center">
        <EmptyState
          icon={<ReceiptText size={26} />}
          title="Chọn hóa đơn bên trái"
          description="Kiểm tra các món đã khóa và thu tiền tại quầy."
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Lock size={13} aria-hidden />
              Khóa thêm, sửa và xóa món tại quầy
            </span>
          }
        />
      </Card>
    );
  }

  const isPaid = item.invoice.trang_thai_tt === 'DaThanhToan';
  const invoiceIso = item.invoice.ngay_lap_hoa_don.replace(' ', 'T');
  const discountPct = Math.round(item.bill.tyLeGiamVip * 100);

  return (
    <Card className="overflow-hidden">
      {/* Đầu phiếu hóa đơn */}
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-paper-warm px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CustomerGroupBadge group={item.customerGroup} />
            {item.customer?.hang_the && item.customer.hang_the !== 'Standard' && (
              <Badge tone="gold" size="sm">
                Hạng {item.customer.hang_the}
              </Badge>
            )}
          </div>
          <h2 className="t-display mt-1.5 text-ink">
            {item.tableName}
            {item.mergedTableNames.length > 0 && (
              <span className="font-sans text-sm font-normal text-ink-muted">
                {' '}
                · Ghép {item.mergedTableNames.join(', ')}
              </span>
            )}
          </h2>
          <p className="num mt-0.5 text-xs text-ink-muted">
            Mã HĐ: {item.invoice.ma_hoa_don} · Phiên: {item.maOrder} · Lập lúc{' '}
            {formatClock(invoiceIso)} ({formatDateVi(invoiceIso)})
            {item.customer ? ` · ${item.customer.ho_ten}` : ''}
          </p>
        </div>

        <Badge tone={isPaid ? 'success' : 'billing'} dot>
          {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
        </Badge>
      </header>

      <CardBody className="space-y-5">
        {/* Banner Read-Only + Các nút kiểm chứng chốt chặn 403 */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary-soft/45 px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-ink-soft">
            <ShieldAlert size={15} aria-hidden className="shrink-0 text-primary" />
            <span>Hóa đơn chỉ đọc: khóa thêm, sửa và xóa món tại quầy.</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              icon={<Plus size={13} aria-hidden />}
              iconRight={<Lock size={12} aria-hidden className="text-primary" />}
              aria-label="Kiểm chứng khóa 403: thử thêm món trên hóa đơn chỉ đọc"
              onClick={onAttemptIllegalModify}
            >
              Thêm món
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Pencil size={13} aria-hidden />}
              iconRight={<Lock size={12} aria-hidden className="text-primary" />}
              aria-label="Kiểm chứng khóa 403: thử sửa món trên hóa đơn chỉ đọc"
              onClick={onAttemptIllegalModify}
            >
              Sửa món
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<Trash2 size={13} aria-hidden />}
              iconRight={<Lock size={12} aria-hidden className="text-primary" />}
              aria-label="Kiểm chứng khóa 403: thử xóa món trên hóa đơn chỉ đọc"
              onClick={onAttemptIllegalModify}
            >
              Xóa món
            </Button>
          </div>
        </div>

        {/* Bảng dòng món đã hoàn thành (CHỈ ĐỌC) */}
        <div className="overflow-hidden rounded-lg border border-line">
          <Table aria-label="Chi tiết các món đã hoàn thành trong hóa đơn">
            <thead>
              <tr>
                <Th>Món đã hoàn thành</Th>
                <Th className="text-right">SL</Th>
                <Th className="text-right">Đơn giá</Th>
                <Th className="text-right">Thành tiền</Th>
                <Th className="no-print text-right">Khóa</Th>
              </tr>
            </thead>
            <tbody>
              {item.completedLines.map(({ item: line, dishName, lineTotal }) => (
                <Tr key={line.ma_chi_tiet_order}>
                  <Td>
                    <p className="font-medium text-ink">{dishName}</p>
                    <div className="mt-1">
                      <ItemStatusBadge status={line.trang_thai_mon} />
                    </div>
                  </Td>
                  <Td className="num text-right font-medium text-ink">×{line.so_luong}</Td>
                  <Td className="num text-right text-ink-soft">
                    {formatVnd(line.don_gia_thoi_diem)}
                  </Td>
                  <Td className="num text-right font-medium text-ink">{formatVnd(lineTotal)}</Td>
                  <Td className="no-print text-right">
                    <Badge tone="neutral" size="sm" icon={<Lock size={11} aria-hidden />}>
                      Chỉ đọc
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Bảng tính tiền minh bạch từ calculateCompletedOrderBill */}
        <div className="space-y-2.5 rounded-lg border border-line bg-paper-warm p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-soft">
              Tổng tiền món hoàn thành{' '}
              <span className="num text-xs text-ink-muted">
                ({item.bill.completedItemsCount} dòng món)
              </span>
            </span>
            <span className="num font-medium text-ink">
              {formatVnd(item.bill.tongTienMonHoanThanh)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-soft">
              Giảm giá VIP / hạng thẻ
              {discountPct > 0 && <span className="num text-xs text-ink-muted"> ({discountPct}%)</span>}
            </span>
            <span
              className={
                item.bill.tienGiamGia > 0 ? 'num font-medium text-st-empty-ink' : 'num text-ink-muted'
              }
            >
              {item.bill.tienGiamGia > 0 ? `−${formatVnd(item.bill.tienGiamGia)}` : formatVnd(0)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-soft">Thuế GTGT (VAT 8%)</span>
            <span className="num font-medium text-ink">+{formatVnd(item.bill.tienThueVat)}</span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-ink-soft">Tiền đặt cọc trừ vào hóa đơn</span>
            <span
              className={
                item.bill.tienCocTru > 0 ? 'num font-medium text-primary' : 'num text-ink-muted'
              }
            >
              {item.bill.tienCocTru > 0 ? `−${formatVnd(item.bill.tienCocTru)}` : formatVnd(0)}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
            <span className="text-base font-medium text-ink">Tổng phải thanh toán</span>
            <span className="t-metric-sm text-primary">
              {formatVnd(item.invoice.tong_tien_phai_tra)}
            </span>
          </div>

          <p className="flex items-start gap-1.5 pt-1 text-xs text-ink-muted">
            <Info size={13} aria-hidden className="mt-0.5 shrink-0" />
            <span>
              Chỉ tính món bếp đã hoàn thành
              {item.bill.pendingItemsCount > 0 ? (
                <>
                  ; <span className="num font-medium text-ink-soft">{item.bill.pendingItemsCount}</span> món đang chờ bếp chưa cộng vào hóa đơn.
                </>
              ) : (
                '.'
              )}
            </span>
          </p>
        </div>

        {/* Khu vực thanh toán / xác nhận sau thanh toán (key theo mã hóa đơn để tự prefill sạch) */}
        <PaymentCheckoutSection
          key={item.invoice.ma_hoa_don}
          item={item}
          currentRole={currentRole}
          canConfirm={canConfirm}
          onConfirmPayment={onConfirmPayment}
        />
      </CardBody>
    </Card>
  );
}
