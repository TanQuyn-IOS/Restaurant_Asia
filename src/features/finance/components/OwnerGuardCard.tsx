import { ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageBody } from '@/components/ui/PageHeader';

interface OwnerGuardCardProps {
  message: string;
}

/** Chốt chặn phòng vệ FR-19 (403) ở tầng màn hình tài chính nếu vai trò không phải Chủ nhà hàng. */
export function OwnerGuardCard({ message }: OwnerGuardCardProps) {
  return (
    <PageBody>
      <Card className="mx-auto max-w-xl border-primary/40 p-8 text-center">
        <span
          aria-hidden
          className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-primary-soft text-primary"
        >
          <ShieldAlert size={24} />
        </span>
        <p className="eyebrow text-primary">MÃ LỖI 403 · BẢO MẬT FR-19</p>
        <h1 className="t-page mt-2 text-ink">Khu vực độc quyền Chủ nhà hàng</h1>
        <p className="mt-3 text-sm text-ink-muted">{message}</p>
      </Card>
    </PageBody>
  );
}
