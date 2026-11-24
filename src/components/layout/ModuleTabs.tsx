import { useLocation, useNavigate } from 'react-router-dom';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { UnderlineTabs } from '@/components/ui/Tabs';
import { OPS_TABS, findNavItem } from '@/app/nav.config';

/** Thanh tab "01 Sơ đồ bàn · 02 Màn hình bếp · 03 Thu ngân POS" (chỉ hiện ở nhóm Vận hành). */
export function ModuleTabs() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const current = findNavItem(pathname);

  if (!current || !OPS_TABS.some((t) => t.id === current.id)) return null;

  const hasActiveTickets = snapshot.tbl_chi_tiet_don_goi.some(
    (i) => i.trang_thai_mon === 'ChoCheBien' || i.trang_thai_mon === 'DangCheBien',
  );

  return (
    <div className="no-print border-b border-line bg-paper px-4 sm:px-8">
      <UnderlineTabs
        label="Phân hệ vận hành"
        value={current.id}
        onChange={(id) => {
          const target = OPS_TABS.find((t) => t.id === id);
          if (target) navigate(target.to);
        }}
        items={OPS_TABS.map((t) => ({
          id: t.id,
          label: t.label,
          index: t.tabIndex,
          live: t.id === 'kds' && hasActiveTickets,
        }))}
      />
    </div>
  );
}
