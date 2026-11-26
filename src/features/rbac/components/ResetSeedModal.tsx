import { useEffect, useState, type FormEvent } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { isResetConfirmValid, RESET_CONFIRM_KEYWORD } from '../rbacHelpers';

interface ResetSeedModalProps {
  open: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

/**
 * Hộp thoại xác nhận hành động hủy hoại "Khôi phục dữ liệu mẫu" (chỉ Chủ nhà hàng).
 * Yêu cầu người dùng nhập chính xác chuỗi "XOA" trước khi cho phép thực thi.
 */
export function ResetSeedModal({ open, onClose, onConfirmReset }: ResetSeedModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmText('');
      setSubmitting(false);
    }
  }, [open]);

  const canConfirm = isResetConfirmValid(confirmText) && !submitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      await onConfirmReset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      icon={<TriangleAlert size={20} />}
      title="Khôi phục dữ liệu mẫu"
      description="Ghi đè toàn bộ 27 bảng dữ liệu về trạng thái ban đầu. Không thể hoàn tác."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form="reset-seed-form"
            variant="danger"
            icon={<RotateCcw size={15} />}
            disabled={!canConfirm}
            loading={submitting}
          >
            Xác nhận khôi phục
          </Button>
        </>
      }
    >
      <form id="reset-seed-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-st-serving/40 bg-st-serving-soft p-4 text-xs text-st-serving-ink">
          <p className="font-medium">Các dữ liệu sau đây sẽ bị xóa và đặt lại hoàn toàn:</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            <li>Toàn bộ phiên bàn, đơn gọi món, nhật ký bếp KDS và hóa đơn mới phát sinh.</li>
            <li>Món ăn mới thêm, trạng thái hết món, phiếu đặt bàn và yêu cầu khách QR.</li>
            <li>Lịch phân ca, đơn nghỉ phép, phiếu nhập kho và các bút toán sổ quỹ dòng tiền.</li>
            <li>Thay đổi sẽ đồng bộ ngay lập tức tới tất cả các tab và thiết bị đang mở.</li>
          </ul>
        </div>

        <Field
          label={`Nhập "${RESET_CONFIRM_KEYWORD}" để xác nhận`}
          hint="Phân biệt chữ in hoa. Chỉ Chủ nhà hàng được thực hiện."
          error={
            confirmText.length > 0 && !isResetConfirmValid(confirmText)
              ? `Vui lòng nhập đúng chuỗi ${RESET_CONFIRM_KEYWORD} (chữ in hoa).`
              : undefined
          }
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              data-autofocus
              autoComplete="off"
              aria-describedby={describedBy}
              invalid={invalid}
              placeholder={RESET_CONFIRM_KEYWORD}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
