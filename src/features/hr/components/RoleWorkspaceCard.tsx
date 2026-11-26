import { Lock } from 'lucide-react';
import { ROLE_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';

/**
 * Dải thông báo nhẹ cho vai trò không phải Chủ ở nhóm trang Nhân sự:
 * cho biết dữ liệu doanh thu và sổ quỹ đang được ẩn.
 */
export function RoleWorkspaceCard() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  if (currentRole === 'Owner') return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 rounded-lg border border-line bg-paper-warm px-4 py-2.5 text-xs text-ink-soft"
    >
      <Lock size={14} aria-hidden className="shrink-0 text-gold-ink" />
      <span>
        Đang xem với quyền <strong className="font-medium text-ink">{ROLE_META[currentRole].label}</strong>: số liệu
        doanh thu, sổ quỹ và giá nhập kho được ẩn.
      </span>
    </div>
  );
}
