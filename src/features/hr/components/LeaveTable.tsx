import { CalendarOff, Check, Plus, XCircle } from 'lucide-react';
import { DEMO_TODAY } from '@/lib/clock';
import { formatDateVi } from '@/lib/format';
import { LEAVE_STATE_META } from '@/lib/labels';
import { classifyLeaveThreeState } from '@/store/useRestaurantStore';
import type { CaLamViec, DonNghiPhep, LeaveThreeState, NhanVien } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar, EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import {
  LEAVE_APPROVAL_META,
  STAFF_POSITION_META,
  cleanStaffName,
  formatExactShiftWindow,
  shortShiftName,
} from '../payroll';

interface LeaveTableProps {
  leaves: DonNghiPhep[];
  activeTab: LeaveThreeState;
  staffMap: Map<string, NhanVien>;
  shiftMap: Map<string, CaLamViec>;
  onDecide: (maDonNghi: string, decision: 'DaDuyet' | 'TuChoi') => void;
  onInspect: (maDonNghi: string) => void;
  onCreateNew: () => void;
}

export function LeaveTable({
  leaves,
  activeTab,
  staffMap,
  shiftMap,
  onDecide,
  onInspect,
  onCreateNew,
}: LeaveTableProps) {
  if (leaves.length === 0) {
    return (
      <EmptyState
        icon={<CalendarOff size={22} />}
        title={`Không có đơn thuộc mục "${LEAVE_STATE_META[activeTab].label}"`}
        description="Khi tạo mới hoặc duyệt đơn nghỉ phép, hệ thống sẽ tự động phân loại theo mốc ngày hôm nay."
        action={
          <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={onCreateNew}>
            Tạo đơn nghỉ phép
          </Button>
        }
      />
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Nhân viên</Th>
          <Th>Chức vụ</Th>
          <Th>Ngày nghỉ</Th>
          <Th>Ca nghỉ</Th>
          <Th>Lý do</Th>
          <Th>Người trực thay</Th>
          <Th className="text-right">Trạng thái & thao tác</Th>
        </tr>
      </thead>
      <tbody>
        {leaves.map((don) => {
          const nv = staffMap.get(don.ma_nhan_vien);
          const thay = don.ma_nv_thay_ca ? staffMap.get(don.ma_nv_thay_ca) : undefined;
          const ca = shiftMap.get(don.ma_ca_nghi);
          const displayName = nv ? cleanStaffName(nv.ho_ten) : don.ma_nhan_vien;
          const posMeta = nv ? STAFF_POSITION_META[nv.chuc_vu] : null;
          const threeState = classifyLeaveThreeState(don.ngay_nghi, DEMO_TODAY);
          const stateMeta = LEAVE_STATE_META[threeState];
          const approvalMeta = LEAVE_APPROVAL_META[don.trang_thai_duyet];

          return (
            <Tr key={don.ma_don_nghi}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={displayName} size="md" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{displayName}</p>
                    <p className="num text-xs text-ink-muted">{don.ma_don_nghi}</p>
                  </div>
                </div>
              </Td>
              <Td>
                <Badge tone={posMeta?.tone ?? 'neutral'} size="sm">
                  {posMeta?.label ?? 'Nhân viên'}
                </Badge>
              </Td>
              <Td>
                <span className="num font-medium text-ink">{formatDateVi(don.ngay_nghi)}</span>
              </Td>
              <Td>
                <p className="font-medium text-ink">
                  {ca ? shortShiftName(ca.ten_ca) : don.ma_ca_nghi}
                </p>
                {ca && <p className="num text-xs text-ink-muted">{formatExactShiftWindow(ca)}</p>}
              </Td>
              <Td className="max-w-xs">
                <p className="text-sm text-ink-soft">{don.ly_do}</p>
              </Td>
              <Td>
                {thay ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-st-empty-ink">
                    <Check size={14} aria-hidden />
                    {cleanStaffName(thay.ho_ten)}
                  </span>
                ) : (
                  <Badge tone="danger" dot>
                    Chưa xếp thay
                  </Badge>
                )}
              </Td>
              <Td>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge tone={stateMeta.tone} dot size="sm">
                    {stateMeta.label}
                  </Badge>
                  <Badge tone={approvalMeta.tone} size="sm">
                    {approvalMeta.label}
                  </Badge>
                  {don.trang_thai_duyet === 'ChoDuyet' && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Check size={13} />}
                        onClick={() => onDecide(don.ma_don_nghi, 'DaDuyet')}
                      >
                        Duyệt
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<XCircle size={13} />}
                        onClick={() => onDecide(don.ma_don_nghi, 'TuChoi')}
                      >
                        Từ chối
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onInspect(don.ma_don_nghi)}
                      >
                        Chi tiết
                      </Button>
                    </div>
                  )}
                </div>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
