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
    title: 'Chọn món & tùy chỉnh khẩu vị',
    body: 'Chạm vào món để chọn độ cay từ 0 đến 3, thêm ghi chú ăn uống rồi đưa vào giỏ món.',
  },
  {
    icon: <Clock size={18} aria-hidden />,
    title: 'Theo dõi tiến độ bếp trực tiếp',
    body: 'Sau khi bấm Gửi bếp, trạng thái Chờ → Đang nấu → Hoàn thành sẽ tự động cập nhật theo thời gian thực.',
  },
  {
    icon: <UtensilsCrossed size={18} aria-hidden />,
    title: 'Tạm tính minh bạch theo món đã ra',
    body: 'Chỉ những món bếp đã hoàn thành và phục vụ mới được cộng vào hóa đơn tạm tính của bàn.',
  },
  {
    icon: <Lock size={18} aria-hidden />,
    title: 'Phiên bàn được khóa cố định',
    body: 'Mã QR tại bàn gắn cố định vào đúng số bàn của quý khách để đơn gửi bếp luôn chính xác.',
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
      eyebrow={`${tableLabel.toUpperCase()} · ${areaLabel.toUpperCase()}`}
      title={<span className="t-display text-ink">Hướng dẫn gọi món tại bàn</span>}
      footer={
        <div className="pb-[env(safe-area-inset-bottom)]">
          <Button
            variant="primary"
            size="lg"
            block
            onClick={onClose}
            className="rounded-xl"
          >
            Đã hiểu, tiếp tục xem thực đơn
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
