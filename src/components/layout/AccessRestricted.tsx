import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { ROLE_META } from '@/lib/labels';
import type { RoleCode } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { PageBody } from '@/components/ui/PageHeader';

/** Màn hình thay thế khi vai trò hiện tại không được xem phân hệ (FR-19 / FR-17). */
export function AccessRestricted({
  role,
  featureLabel,
  allowed,
}: {
  role: RoleCode;
  featureLabel: string;
  allowed: RoleCode[];
}) {
  const navigate = useNavigate();
  return (
    <PageBody>
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-xl border border-line bg-paper px-8 py-14 text-center shadow-card">
        <span aria-hidden className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
          <Lock size={24} />
        </span>
        <h1 className="t-display mt-5 text-ink">Không có quyền xem "{featureLabel}"</h1>
        <p className="mt-2.5 text-sm text-ink-muted">
          Vai trò <strong className="font-medium text-ink">{ROLE_META[role].label}</strong> không truy cập được mục này.
          Chỉ dành cho: {allowed.map((r) => ROLE_META[r].label).join(', ')}.
        </p>
        <Button variant="primary" className="mt-7" onClick={() => navigate(ROLE_META[role].home)}>
          Về màn hình của tôi
        </Button>
      </div>
    </PageBody>
  );
}
