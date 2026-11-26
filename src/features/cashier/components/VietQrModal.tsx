import { useMemo } from 'react';
import { CheckCircle2, Info, QrCode } from 'lucide-react';
import { formatVnd } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Overlay';
import { generateDeterministicQrMatrix } from '../cashierHelpers';

interface VietQrModalProps {
  open: boolean;
  onClose: () => void;
  invoiceCode: string;
  tableName: string;
  amountDue: number;
  isPaid: boolean;
  canConfirm: boolean;
  disabledReason?: string;
  onConfirmPayment: () => void;
}

const MATRIX_SIZE = 25;
const QUIET_ZONE = 2;

/** Modal hiển thị mã VietQR mô phỏng tất định (inline SVG) cho thanh toán chuyển khoản. */
export function VietQrModal({
  open,
  onClose,
  invoiceCode,
  tableName,
  amountDue,
  isPaid,
  canConfirm,
  disabledReason,
  onConfirmPayment,
}: VietQrModalProps) {
  const qrPayload = `VIETQR|VCB|0041000999888|${Math.round(amountDue)}|ACRMS-${invoiceCode}`;
  const matrix = useMemo(() => generateDeterministicQrMatrix(qrPayload, MATRIX_SIZE), [qrPayload]);
  const viewBoxSize = MATRIX_SIZE + QUIET_ZONE * 2;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon={<QrCode size={20} />}
      title="Quét mã VietQR"
      description={`${tableName} · ${invoiceCode}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          {!isPaid && (
            <Button
              variant="primary"
              icon={<CheckCircle2 size={15} aria-hidden />}
              disabled={!canConfirm}
              title={!canConfirm ? disabledReason : 'Xác nhận đã nhận tiền chuyển khoản'}
              onClick={onConfirmPayment}
            >
              Xác nhận đã nhận tiền
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Khung mã QR SVG tất định */}
        <div className="flex flex-col items-center rounded-lg border border-line bg-paper-warm p-5">
          <div className="rounded-lg border border-line-strong bg-paper p-3 shadow-card">
            <svg
              viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              className="size-48 sm:size-52"
              role="img"
              aria-label={`Mã VietQR mô phỏng cho hóa đơn ${invoiceCode}, số tiền ${formatVnd(amountDue)}`}
            >
              <rect
                x={0}
                y={0}
                width={viewBoxSize}
                height={viewBoxSize}
                className="fill-paper"
              />
              {matrix.map((row, r) =>
                row.map((filled, c) =>
                  filled ? (
                    <rect
                      key={`${r}-${c}`}
                      x={c + QUIET_ZONE}
                      y={r + QUIET_ZONE}
                      width={1}
                      height={1}
                      className="fill-ink"
                    />
                  ) : null,
                ),
              )}
            </svg>
          </div>

          <Badge tone="warning" icon={<Info size={12} aria-hidden />} className="mt-3">
            Mã VietQR mô phỏng (chỉ dùng kiểm thử)
          </Badge>
        </div>

        {/* Thông tin chuyển khoản đối chiếu */}
        <dl className="space-y-2 rounded-lg border border-line bg-paper-warm px-4 py-3.5 text-xs">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Ngân hàng</dt>
            <dd className="font-medium text-ink">Vietcombank · CN Đà Nẵng</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Số tài khoản</dt>
            <dd className="num font-medium text-ink">0041 0009 99888</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Chủ tài khoản</dt>
            <dd className="font-medium text-ink">NHA HANG ATELIER D'ASIE</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-ink-muted">Nội dung chuyển khoản</dt>
            <dd className="num font-medium text-ink">ACRMS {invoiceCode}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
            <dt className="font-medium text-ink">Số tiền chính xác</dt>
            <dd className="num text-base font-bold text-primary">{formatVnd(amountDue)}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
