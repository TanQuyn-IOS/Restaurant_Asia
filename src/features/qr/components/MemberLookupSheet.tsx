import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Crown, Phone, Sparkles } from 'lucide-react';
import type { GuestMemberProfile } from '@/lib/auth';
import { formatNumber } from '@/lib/format';
import { CUSTOMER_GROUP_META } from '@/lib/labels';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ChoiceChip, Field, Input } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Overlay';

const DEMO_PHONES = [
  { phone: '0988777666', label: 'VIP Diamond (-15%)' },
  { phone: '0977555444', label: 'VIP Gold (-10%)' },
  { phone: '0905123456', label: 'Thành viên Silver (-5%)' },
];

/**
 * Ngăn kéo nhận diện thành viên tùy chọn bằng SĐT trên Cổng QR (FR-04/05/06/25).
 * Không yêu cầu mật khẩu, không có đăng nhập nhân viên; khách vãng lai hoàn toàn bỏ qua được.
 */
export function MemberLookupSheet({
  open,
  onClose,
  tableLabel,
  linkedMember,
  canLinkOrder,
  onIdentify,
}: {
  open: boolean;
  onClose: () => void;
  tableLabel: string;
  linkedMember: GuestMemberProfile | null;
  canLinkOrder: boolean;
  onIdentify: (phone: string) => { ok: boolean; error?: string };
}) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const submitPhone = (value: string) => {
    setError(null);
    const res = onIdentify(value);
    if (!res.ok) {
      setError(res.error ?? 'Không tìm thấy số điện thoại này.');
      return;
    }
    setPhone('');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitPhone(phone);
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      side="bottom"
      frame="mobile"
      icon={<Crown size={20} />}
      title="Tích điểm thành viên"
      description={`Nhập SĐT đã đăng ký để áp dụng ưu đãi tại ${tableLabel}.`}
      footer={
        <Button variant="secondary" block onClick={handleClose} className="min-h-11">
          Quay lại thực đơn
        </Button>
      }
    >
      <div className="space-y-4">
        {linkedMember && (
          <div className="rounded-xl border border-gold/50 bg-gold-soft p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gold-ink">
                <CheckCircle2 size={15} aria-hidden />
                Đã liên kết thành viên với bàn
              </div>
              <Badge tone="gold" size="sm">
                {CUSTOMER_GROUP_META[linkedMember.loai_khach].label} · {linkedMember.hang_the}
              </Badge>
            </div>
            <p className="mt-2 text-base font-medium text-ink">{linkedMember.ho_ten}</p>
            <p className="num mt-0.5 text-xs text-ink-soft">
              SĐT: {linkedMember.so_dien_thoai} · Điểm tích lũy:{' '}
              <strong>{formatNumber(linkedMember.diem_tich_luy)} điểm</strong>
              {linkedMember.discountPercent > 0 && ` · Giảm ${linkedMember.discountPercent}%`}
            </p>
            {linkedMember.loai_khach === 'VIP' && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                <Sparkles size={13} aria-hidden />
                Đã kích hoạt cờ VIP Ưu tiên chế biến tại bếp KDS.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-st-serving/40 bg-st-serving-soft px-3.5 py-2.5 text-xs text-st-serving-ink"
            >
              <AlertCircle size={15} aria-hidden className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Field
            label="Số điện thoại thành viên"
            hint={
              canLinkOrder
                ? 'Không cần mật khẩu.'
                : 'Bàn chưa mở phiên, nhưng bạn vẫn kiểm tra được ưu đãi thẻ.'
            }
          >
            {({ id, describedBy }) => (
              <div className="relative">
                <Phone
                  size={15}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                />
                <Input
                  id={id}
                  type="tel"
                  inputMode="tel"
                  aria-describedby={describedBy}
                  placeholder="Ví dụ: 0988777666"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="min-h-11 pl-9"
                />
              </div>
            )}
          </Field>

          <Button type="submit" variant="primary" block className="min-h-11">
            Xác nhận thành viên
          </Button>
        </form>

        <div className="rounded-xl border border-cream-line bg-cream p-3.5">
          <p className="t-label">SĐT dùng thử</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DEMO_PHONES.map((item) => (
              <ChoiceChip
                key={item.phone}
                onClick={() => {
                  setPhone(item.phone);
                  submitPhone(item.phone);
                }}
              >
                <span className="num">{item.phone}</span> · {item.label}
              </ChoiceChip>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
