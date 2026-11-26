import { useState, type FormEvent } from 'react';
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  FileText,
  Lock,
  QrCode,
} from 'lucide-react';
import type { PaymentMethodType, RoleCode } from '@/types/database';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { ROLE_META } from '@/lib/labels';
import { Button } from '@/components/ui/Button';
import { ChoiceChip, Field, Input, Switch } from '@/components/ui/Form';
import {
  calculateCashChange,
  computeQuickCashAmounts,
  validateVatInvoiceFields,
  type CashierInvoiceItem,
} from '../cashierHelpers';
import { PaidReceiptSection } from './PaidReceiptSection';
import { VietQrModal } from './VietQrModal';

interface PaymentCheckoutSectionProps {
  item: CashierInvoiceItem;
  currentRole: RoleCode;
  canConfirm: boolean;
  onConfirmPayment: (payload: {
    ma_hoa_don: string;
    phuong_thuc: PaymentMethodType;
    so_tien_nhan: number;
    xuat_vat: boolean;
    ma_so_thue_vat?: string;
    ten_cong_ty_vat?: string;
  }) => void;
}

const PAYMENT_OPTIONS: {
  id: PaymentMethodType;
  label: string;
  desc: string;
  Icon: typeof Banknote;
}[] = [
  { id: 'TienMat', label: 'Tiền mặt', desc: 'Tự tính tiền thối', Icon: Banknote },
  { id: 'TheNganHang', label: 'Thẻ POS', desc: 'Quẹt thẻ ngân hàng', Icon: CreditCard },
  { id: 'ChuyenKhoanQR', label: 'VietQR', desc: 'Quét mã chuyển khoản', Icon: QrCode },
];

/** Khu vực chọn phương thức thanh toán, xuất hóa đơn đỏ VAT & trạng thái sau khi thanh toán. */
export function PaymentCheckoutSection({
  item,
  currentRole,
  canConfirm,
  onConfirmPayment,
}: PaymentCheckoutSectionProps) {
  const amountDue = item.invoice.tong_tien_phai_tra;
  const isPaid = item.invoice.trang_thai_tt === 'DaThanhToan';

  const [payMethod, setPayMethod] = useState<PaymentMethodType>('TienMat');
  const [cashInput, setCashInput] = useState<string>(String(amountDue));
  const [issueVat, setIssueVat] = useState<boolean>(
    Boolean(item.invoice.xuat_vat || item.khachDoan),
  );
  const [vatCompany, setVatCompany] = useState<string>(
    item.invoice.ten_cong_ty_vat ?? item.khachDoan?.ten_cong_ty ?? '',
  );
  const [vatTaxCode, setVatTaxCode] = useState<string>(
    item.invoice.ma_so_thue_vat ?? item.khachDoan?.ma_so_thue ?? '',
  );
  const [showErrors, setShowErrors] = useState<boolean>(false);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);

  if (isPaid) {
    return <PaidReceiptSection item={item} />;
  }

  const disabledReason = `Vai trò ${ROLE_META[currentRole].label} không có quyền thu tiền. Cần quyền Thu ngân, Quản lý hoặc Chủ nhà hàng.`;

  const parsedCash = Number(cashInput.replace(/[^\d]/g, '')) || 0;
  const cashCalc = calculateCashChange(parsedCash, amountDue);
  const quickAmounts = computeQuickCashAmounts(amountDue);
  const vatCheck = validateVatInvoiceFields(issueVat, vatCompany, vatTaxCode);
  const cashError =
    showErrors && payMethod === 'TienMat' && !cashCalc.sufficient
      ? `Tiền khách đưa còn thiếu ${formatVnd(cashCalc.shortfall)} so với tổng phải thanh toán.`
      : undefined;

  const submitPayment = (methodOverride?: PaymentMethodType) => {
    const activeMethod = methodOverride ?? payMethod;
    setShowErrors(true);

    if (!canConfirm) return;
    if (!vatCheck.valid) {
      setQrModalOpen(false);
      return;
    }

    const receivedAmount = activeMethod === 'TienMat' ? parsedCash : amountDue;
    if (activeMethod === 'TienMat' && receivedAmount < amountDue) {
      return;
    }

    onConfirmPayment({
      ma_hoa_don: item.invoice.ma_hoa_don,
      phuong_thuc: activeMethod,
      so_tien_nhan: receivedAmount,
      xuat_vat: issueVat,
      ma_so_thue_vat: issueVat ? vatTaxCode.trim() : undefined,
      ten_cong_ty_vat: issueVat ? vatCompany.trim() : undefined,
    });
    setQrModalOpen(false);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitPayment();
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className="no-print space-y-5 border-t border-line pt-5"
      noValidate
    >
      {!canConfirm && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-line-strong bg-paper-warm px-3.5 py-3 text-xs text-ink-soft"
        >
          <Lock size={15} aria-hidden className="mt-0.5 shrink-0 text-primary" />
          <span>{disabledReason}</span>
        </div>
      )}

      {/* 1. Chọn phương thức thanh toán */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-soft">Phương thức thanh toán</p>
        <div
          role="radiogroup"
          aria-label="Chọn phương thức thanh toán"
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
        >
          {PAYMENT_OPTIONS.map(({ id, label, desc, Icon }) => {
            const active = payMethod === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={!canConfirm}
                onClick={() => {
                  setPayMethod(id);
                  if (id === 'ChuyenKhoanQR') setQrModalOpen(true);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors disabled:opacity-50',
                  active
                    ? 'border-primary bg-primary-soft/55 text-ink'
                    : 'border-line-strong bg-paper text-ink-soft hover:bg-paper-warm',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-md',
                    active ? 'bg-primary text-white' : 'bg-sunken text-ink-soft',
                  )}
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">{label}</span>
                  <span className="block truncate text-xs text-ink-muted">{desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Chi tiết theo phương thức */}
      {payMethod === 'TienMat' && (
        <div className="space-y-3 rounded-lg border border-line bg-paper-warm p-4">
          <Field
            label="Tiền khách đưa (VND)"
            error={cashError}
            hint={
              !cashError ? (
                <span className="num">
                  Đã nhập: <strong className="font-medium text-ink">{formatVnd(parsedCash)}</strong> ·
                  Chọn nhanh mệnh giá bên dưới hoặc nhập số tiền thực nhận.
                </span>
              ) : undefined
            }
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                disabled={!canConfirm}
                inputMode="numeric"
                className="num"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Nhập số tiền khách đưa"
              />
            )}
          </Field>

          <div className="flex flex-wrap gap-1.5">
            {quickAmounts.map((amount, idx) => (
              <ChoiceChip
                key={amount}
                selected={parsedCash === amount}
                disabled={!canConfirm}
                onClick={() => setCashInput(String(amount))}
                className="num"
              >
                {idx === 0 ? `Đúng số tiền (${formatVnd(amount)})` : formatVnd(amount)}
              </ChoiceChip>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
            <span className="text-ink-soft">Tiền thối lại cho khách</span>
            <span
              className={cn(
                'num font-bold',
                cashCalc.sufficient ? 'text-st-empty-ink' : 'text-st-serving-ink',
              )}
            >
              {cashCalc.sufficient
                ? formatVnd(cashCalc.change)
                : `Thiếu ${formatVnd(cashCalc.shortfall)}`}
            </span>
          </div>
        </div>
      )}

      {payMethod === 'TheNganHang' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper-warm px-4 py-3.5 text-xs">
          <div className="flex items-center gap-2.5">
            <CreditCard size={17} aria-hidden className="text-info-ink" />
            <div>
              <p className="text-sm font-medium text-ink">Thanh toán quẹt thẻ máy POS</p>
              <p className="text-xs text-ink-muted">
                Thu chính xác số tiền hóa đơn, tự sinh mã tham chiếu giao dịch ngân hàng.
              </p>
            </div>
          </div>
          <span className="num text-sm font-bold text-ink">{formatVnd(amountDue)}</span>
        </div>
      )}

      {payMethod === 'ChuyenKhoanQR' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary-soft/35 px-4 py-3.5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Chuyển khoản VietQR mô phỏng</p>
            <p className="num mt-0.5 text-xs text-ink-soft">
              Vietcombank · 0041 0009 99888 · ND: ACRMS {item.invoice.ma_hoa_don}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<QrCode size={14} aria-hidden />}
            onClick={() => setQrModalOpen(true)}
          >
            Mở mã VietQR
          </Button>
        </div>
      )}

      {/* 3. Xuất hóa đơn điện tử VAT */}
      <div className="space-y-3 rounded-lg border border-gold/40 bg-gold-soft/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <FileText size={15} aria-hidden className="text-gold-ink" />
              Xuất hóa đơn điện tử VAT (8%)
            </p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {item.khachDoan
                ? 'Đã tự điền thông tin công ty & MST từ hồ sơ khách đoàn.'
                : 'Bật để nhập tên công ty và mã số thuế 10 hoặc 13 chữ số.'}
            </p>
          </div>
          <Switch
            checked={issueVat}
            disabled={!canConfirm}
            label="Bật hoặc tắt xuất hóa đơn điện tử VAT"
            onChange={(next) => {
              setIssueVat(next);
              if (!next) setShowErrors(false);
            }}
          />
        </div>

        {issueVat && (
          <div className="grid grid-cols-1 gap-3 border-t border-gold/30 pt-3 sm:grid-cols-2">
            <Field label="Tên công ty / đơn vị" error={showErrors ? vatCheck.companyError : undefined}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  disabled={!canConfirm}
                  value={vatCompany}
                  onChange={(e) => setVatCompany(e.target.value)}
                  placeholder="Ví dụ: Công ty CP Du lịch Á Châu"
                />
              )}
            </Field>

            <Field
              label="Mã số thuế (10 hoặc 13 số)"
              error={showErrors ? vatCheck.taxCodeError : undefined}
            >
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  disabled={!canConfirm}
                  className="num"
                  value={vatTaxCode}
                  onChange={(e) => setVatTaxCode(e.target.value)}
                  placeholder="0401987654"
                />
              )}
            </Field>
          </div>
        )}
      </div>

      {/* 4. Nút xác nhận thanh toán chính */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        block
        disabled={!canConfirm}
        title={!canConfirm ? disabledReason : 'Xác nhận thu tiền và đồng bộ Sổ quỹ Chủ'}
        icon={<CheckCircle2 size={17} aria-hidden />}
      >
        Xác nhận thanh toán · {formatVnd(amountDue)}
      </Button>

      <VietQrModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        invoiceCode={item.invoice.ma_hoa_don}
        tableName={item.tableName}
        amountDue={amountDue}
        isPaid={isPaid}
        canConfirm={canConfirm}
        disabledReason={disabledReason}
        onConfirmPayment={() => submitPayment('ChuyenKhoanQR')}
      />
    </form>
  );
}
