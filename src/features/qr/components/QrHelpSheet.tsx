import { Clock, Flame, Lock, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Overlay';

interface QrHelpSheetProps {
  open: boolean;
  onClose: () => void;
  tableLabel: string;
  areaLabel: string;
}

const GUIDE_STEPS = [
  {
    icon: <Flame size={18} aria-hidden />,
    title: 'Chọn món & độ cay',
    body: 'Chạm vào món để chọn độ cay (0–3), ghi chú cho bếp rồi thêm vào giỏ.',
  },
  {
    icon: <Clock size={18} aria-hidden />,
    title: 'Theo dõi tiến độ bếp',
    body: 'Trạng thái Chờ, Đang nấu và Hoàn thành tự động cập nhật sau khi gửi bếp.',
  },
  {
    icon: <UtensilsCrossed size={18} aria-hidden />,
    title: 'Tạm tính theo món đã ra',
    body: 'Chỉ những món bếp đã hoàn thành mới cộng vào hóa đơn tạm tính.',
  },
  {
    icon: <Lock size={18} aria-hidden />,
    title: 'Khóa cố định theo bàn',
    body: 'Mỗi mã QR gắn riêng với một bàn để đơn gửi bếp luôn chính xác.',
  },
];

/** Bảng hướng dẫn nhanh khi khách chạm biểu tượng "?" trên đầu trang QR. */
export function QrHelpSheet({
  open,
  onClose,
  tableLabel,
  areaLabel,
}: QrHelpSheetProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="bottom"
      frame="mobile"
      eyebrow={`${tableLabel} · ${areaLabel}`}
      title="Hướng dẫn gọi món"
      footer={
        <div className="pb-[env(safe-area-inset-bottom)]">
          <Button
            variant="primary"
            size="lg"
            block
            onClick={onClose}
            className="rounded-xl"
          >
            Đóng
          </Button>
        </div>
      }
    >
      <ul className="space-y-3">
        {GUIDE_STEPS.map((step) => (
          <li
            key={step.title}
            className="flex items-start gap-3 rounded-xl border border-cream-line bg-cream p-3.5"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-paper text-primary shadow-card">
              {step.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{step.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
