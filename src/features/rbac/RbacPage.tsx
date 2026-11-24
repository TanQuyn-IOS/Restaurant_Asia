import { useState } from 'react';
import { Lock, RotateCcw, Server } from 'lucide-react';
import { ROLE_META, STAFF_ROLES } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { UnderlineTabs } from '@/components/ui/Tabs';
import { InternalAccountsTab } from './components/InternalAccountsTab';
import { RbacMatrixTab } from './components/RbacMatrixTab';
import { ResetSeedModal } from './components/ResetSeedModal';
import { SchemaBrowserTab } from './components/SchemaBrowserTab';
import { canResetSeedData } from './rbacHelpers';
import { useRbacData } from './useRbacData';

type RbacTabId = 'matrix' | 'accounts' | 'schema';

export function RbacPage() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const backendEngineLabel = useRestaurantStore((s) => s.backendEngineLabel);
  const resetAllDataToSeed = useRestaurantStore((s) => s.resetAllDataToSeed);

  const { matrixRows, roles, accounts, tableSummaries, totalRecords } = useRbacData();

  const [activeTab, setActiveTab] = useState<RbacTabId>('matrix');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const allowReset = canResetSeedData(currentRole);
  const resetDisabledReason = allowReset
    ? undefined
    : `Chỉ Chủ nhà hàng (Owner) được phép khôi phục dữ liệu mẫu (hiện tại: ${ROLE_META[currentRole].label})`;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Bảo mật & cơ sở dữ liệu · MOD-10"
        title="Phân quyền RBAC & 27 bảng 3NF"
        description="Kiểm soát ma trận phân quyền 6 vai trò nhân viên, danh sách tài khoản nội bộ che ẩn mật khẩu và trình duyệt trực tiếp 27 bảng cơ sở dữ liệu chuẩn 3NF."
        actions={
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="success" dot icon={<Server size={12} aria-hidden />}>
                {backendEngineLabel}
              </Badge>
              <Button
                variant={allowReset ? 'danger' : 'secondary'}
                size="sm"
                icon={<RotateCcw size={14} />}
                disabled={!allowReset}
                title={resetDisabledReason}
                onClick={() => setResetModalOpen(true)}
              >
                Khôi phục dữ liệu mẫu
              </Button>
            </div>
            {!allowReset && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <Lock size={12} aria-hidden />
                Chỉ Chủ nhà hàng (Owner) được khôi phục CSDL mẫu
              </span>
            )}
          </div>
        }
      />

      {/* 3 tab gạch chân đỏ: 01 Ma trận RBAC · 02 Tài khoản nội bộ · 03 Trình duyệt 27 bảng 3NF */}
      <div className="border-b border-line">
        <UnderlineTabs<RbacTabId>
          label="Các phân mục quản trị phân quyền và cơ sở dữ liệu"
          value={activeTab}
          onChange={setActiveTab}
          items={[
            {
              id: 'matrix',
              index: '01',
              label: 'Ma trận phân quyền RBAC',
              count: STAFF_ROLES.length,
            },
            {
              id: 'accounts',
              index: '02',
              label: 'Tài khoản nội bộ',
              count: accounts.length,
            },
            {
              id: 'schema',
              index: '03',
              label: 'Trình duyệt 27 bảng 3NF',
              count: tableSummaries.length,
            },
          ]}
        />
      </div>

      {activeTab === 'matrix' && (
        <RbacMatrixTab matrixRows={matrixRows} roles={roles} currentRole={currentRole} />
      )}

      {activeTab === 'accounts' && <InternalAccountsTab accounts={accounts} />}

      {activeTab === 'schema' && (
        <SchemaBrowserTab
          tableSummaries={tableSummaries}
          totalRecords={totalRecords}
          currentRole={currentRole}
        />
      )}

      <ResetSeedModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirmReset={resetAllDataToSeed}
      />
    </PageBody>
  );
}
