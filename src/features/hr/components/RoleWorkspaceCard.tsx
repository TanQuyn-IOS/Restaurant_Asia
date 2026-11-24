import { CheckCircle2, Lock, ShieldCheck, Users } from 'lucide-react';
import { ROLE_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

/**
 * Thẻ trạng thái RBAC đầu các trang Nhân sự (FR-19 & FR-26).
 * Chỉ đọc — không cho phép tự nâng quyền từ Quản lý / HR sang Chủ nhà hàng;
 * muốn đổi vai trò cần Đăng xuất và đăng nhập bằng tài khoản tương ứng.
 */
export function RoleWorkspaceCard() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const authUser = useRestaurantStore((s) => s.authUser);

  const isOwner = currentRole === 'Owner';
  const roleLabel = ROLE_META[currentRole].label;

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-lg bg-sunken text-ink-soft"
        >
          <ShieldCheck size={18} />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">
            Phiên làm việc đã xác thực · {authUser?.ho_ten ?? roleLabel}
          </p>
          <p className="text-xs text-ink-muted">
            {isOwner
              ? 'Tài khoản Chủ nhà hàng có toàn quyền điều hành nhân sự, sổ quỹ và kho nhập hàng.'
              : 'Phân quyền FR-19 đang bật — doanh thu, sổ quỹ dòng tiền và giá vốn nhập kho bị ẩn hoàn toàn.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isOwner ? (
          <Badge tone="gold" icon={<CheckCircle2 size={13} aria-hidden />}>
            {roleLabel} · Toàn quyền
          </Badge>
        ) : (
          <>
            <Badge tone="primary" icon={<Users size={13} aria-hidden />}>
              {roleLabel} · Ẩn doanh thu
            </Badge>
            <Badge tone="neutral" icon={<Lock size={12} aria-hidden />}>
              Khóa nâng quyền
            </Badge>
          </>
        )}
      </div>
    </Card>
  );
}
