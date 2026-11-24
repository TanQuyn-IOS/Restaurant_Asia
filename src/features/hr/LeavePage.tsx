import { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Check, Plus, ShieldCheck, Users } from 'lucide-react';
import { DEMO_TODAY } from '@/lib/clock';
import { formatDateVi } from '@/lib/format';
import { classifyLeaveThreeState, useRestaurantStore } from '@/store/useRestaurantStore';
import type { LeaveThreeState } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardFooter, CardHeader } from '@/components/ui/Card';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { UnderlineTabs } from '@/components/ui/Tabs';
import { ApproveLeaveModal } from './components/ApproveLeaveModal';
import { LeaveTable } from './components/LeaveTable';
import { RoleWorkspaceCard } from './components/RoleWorkspaceCard';

export function LeavePage() {
  const staff = useRestaurantStore((s) => s.snapshot.tbl_nhan_vien);
  const shifts = useRestaurantStore((s) => s.snapshot.tbl_ca_lam_viec);
  const leaves = useRestaurantStore((s) => s.snapshot.tbl_don_nghi_phep);
  const approveOrRejectLeave = useRestaurantStore((s) => s.approveOrRejectLeave);

  const [activeTab, setActiveTab] = useState<LeaveThreeState>('DangNghi');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'approve' | 'create'>('approve');
  const [modalRequestId, setModalRequestId] = useState<string | null>(null);

  const staffMap = useMemo(() => new Map(staff.map((n) => [n.ma_nhan_vien, n])), [staff]);
  const shiftMap = useMemo(() => new Map(shifts.map((c) => [c.ma_ca, c])), [shifts]);

  const grouped = useMemo(() => {
    const byState: Record<LeaveThreeState, typeof leaves> = {
      DaNghi: [],
      DangNghi: [],
      SapNghi: [],
    };
    for (const d of leaves) {
      byState[classifyLeaveThreeState(d.ngay_nghi, DEMO_TODAY)].push(d);
    }
    return byState;
  }, [leaves]);

  const metrics = useMemo(() => {
    const activeNonRejected = leaves.filter((d) => d.trang_thai_duyet !== 'TuChoi');
    const coveredCount = activeNonRejected.filter((d) => Boolean(d.ma_nv_thay_ca)).length;
    const coveragePct =
      activeNonRejected.length > 0
        ? Math.round((coveredCount / activeNonRejected.length) * 100)
        : 100;
    const activeTodayValid = grouped.DangNghi.filter((d) => d.trang_thai_duyet !== 'TuChoi');
    const allTodayCovered = activeTodayValid.every((d) => Boolean(d.ma_nv_thay_ca));
    const pendingCount = leaves.filter((d) => d.trang_thai_duyet === 'ChoDuyet').length;

    return {
      pastCount: grouped.DaNghi.length,
      todayCount: activeTodayValid.length,
      coveragePct,
      allTodayCovered,
      pendingCount,
    };
  }, [leaves, grouped]);

  const openModal = (mode: 'approve' | 'create', requestId: string | null = null) => {
    setModalMode(mode);
    setModalRequestId(requestId);
    setModalOpen(true);
  };

  return (
    <PageBody>
      <RoleWorkspaceCard />

      <PageHeader
        eyebrow="NHÂN SỰ & VẬN HÀNH · MOD-07"
        title="Quản lý nghỉ phép"
        description="Phân loại tự động 3 trạng thái Đã nghỉ · Đang nghỉ · Sắp nghỉ, xếp người trực thay và đồng bộ bảng lương tháng."
        actions={
          <Button
            variant="primary"
            icon={<Check size={15} />}
            onClick={() => openModal(metrics.pendingCount > 0 ? 'approve' : 'create')}
          >
            Duyệt nghỉ phép & xếp người thay
          </Button>
        }
      />

      <Card className="flex flex-wrap items-center justify-between gap-6 px-5 py-4">
        <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex items-center gap-3.5">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"
            >
              <Calendar size={18} />
            </span>
            <div>
              <p className="eyebrow">Đã nghỉ</p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="t-metric-sm text-ink">
                  {String(metrics.pastCount).padStart(2, '0')}
                </span>
                <span className="text-xs text-ink-muted">ca trong tháng</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-st-booked-soft text-st-booked-ink"
            >
              <Users size={18} />
            </span>
            <div>
              <p className="eyebrow">Đang nghỉ hôm nay</p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="t-metric-sm text-ink">
                  {String(metrics.todayCount).padStart(2, '0')}
                </span>
                <span className="text-xs text-ink-muted">nhân sự ({formatDateVi(DEMO_TODAY)})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <span
              aria-hidden
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-st-empty-soft text-st-empty-ink"
            >
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="eyebrow">Đã xếp người thay</p>
              <p className="mt-1 flex items-baseline gap-1.5">
                <span className="t-metric-sm text-ink">{metrics.coveragePct}%</span>
                <span className="text-xs text-ink-muted">
                  {metrics.coveragePct === 100 ? 'tất cả ca đã phủ' : 'cần bổ sung người thay'}
                </span>
              </p>
            </div>
          </div>
        </div>

        <Badge tone="success" icon={<Check size={13} />} className="rounded-lg px-3 py-1.5">
          Đã đồng bộ lương tháng
        </Badge>
      </Card>

      <Card>
        <CardHeader
          title="Nghỉ phép & bố trí trực thay"
          subtitle="Chọn từng trạng thái để đối chiếu công đã nghỉ, xử lý vắng hôm nay và duyệt kế hoạch sắp nghỉ."
          action={
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => openModal('create')}
            >
              Tạo đơn mới
            </Button>
          }
        />

        <div className="mt-3 border-b border-line px-5">
          <UnderlineTabs<LeaveThreeState>
            label="Phân nhóm 3 trạng thái nghỉ phép"
            value={activeTab}
            onChange={setActiveTab}
            items={[
              {
                id: 'DaNghi',
                label: 'Đã nghỉ',
                sublabel: 'Đối chiếu công',
                count: grouped.DaNghi.length,
              },
              {
                id: 'DangNghi',
                label: 'Đang nghỉ',
                sublabel: 'Hôm nay',
                count: grouped.DangNghi.length,
                live: metrics.todayCount > 0,
              },
              {
                id: 'SapNghi',
                label: 'Sắp nghỉ',
                sublabel: 'Kế hoạch tới',
                count: grouped.SapNghi.length,
              },
            ]}
          />
        </div>

        {metrics.todayCount > 0 && (
          <div className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-st-booked/35 bg-st-booked-soft px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={18}
                aria-hidden
                className="mt-0.5 shrink-0 text-st-booked-ink"
              />
              <div>
                <p className="text-sm font-medium text-st-booked-ink">
                  Có {metrics.todayCount} nhân sự đang nghỉ phép hôm nay ({formatDateVi(DEMO_TODAY)})
                </p>
                <p className="mt-0.5 text-xs text-st-booked-ink">
                  {metrics.allTodayCovered
                    ? 'Người trực thay đã được bố trí cho toàn bộ các khu vực bị ảnh hưởng.'
                    : 'Một số ca nghỉ hôm nay chưa có người trực thay — vui lòng xếp thay ngay.'}
                </p>
              </div>
            </div>
            <Badge
              tone={metrics.allTodayCovered ? 'success' : 'warning'}
              icon={<Check size={12} />}
            >
              {metrics.allTodayCovered ? 'ĐÃ PHỦ CA' : 'CẦN XẾP THAY'}
            </Badge>
          </div>
        )}

        <div className="mt-4">
          <LeaveTable
            leaves={grouped[activeTab]}
            activeTab={activeTab}
            staffMap={staffMap}
            shiftMap={shiftMap}
            onDecide={approveOrRejectLeave}
            onInspect={(id) => openModal('approve', id)}
            onCreateNew={() => openModal('create')}
          />
        </div>

        <CardFooter className="flex-wrap text-xs text-ink-muted">
          <span>
            Mốc phân loại 3 trạng thái:{' '}
            <strong className="num font-medium text-ink">{formatDateVi(DEMO_TODAY)}</strong>
          </span>
          <span className="num">
            Tổng {leaves.length} đơn · {metrics.pendingCount} chờ duyệt
          </span>
        </CardFooter>
      </Card>

      <ApproveLeaveModal
        open={modalOpen}
        initialMode={modalMode}
        initialRequestId={modalRequestId}
        onClose={() => setModalOpen(false)}
      />
    </PageBody>
  );
}
