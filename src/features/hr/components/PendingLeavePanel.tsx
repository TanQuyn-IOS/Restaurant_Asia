import { DEMO_TODAY } from '@/lib/clock';
import { formatDateVi } from '@/lib/format';
import { LEAVE_STATE_META } from '@/lib/labels';
import { classifyLeaveThreeState } from '@/store/useRestaurantStore';
import type { CaLamViec, DonNghiPhep, NhanVien } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Form';
import { cleanStaffName, formatExactShiftWindow, shortShiftName } from '../payroll';

interface PendingLeavePanelProps {
  pendingLeaves: DonNghiPhep[];
  selectedPending: DonNghiPhep | undefined;
  staffMap: Map<string, NhanVien>;
  shiftMap: Map<string, CaLamViec>;
  onSelectPending: (id: string) => void;
  onSwitchToCreate: () => void;
}

export function PendingLeavePanel({
  pendingLeaves,
  selectedPending,
  staffMap,
  shiftMap,
  onSelectPending,
  onSwitchToCreate,
}: PendingLeavePanelProps) {
  if (!selectedPending) {
    return (
      <div className="rounded-lg border border-line bg-paper-warm p-5 text-center">
        <p className="text-sm font-medium text-ink">Không còn đơn nghỉ phép nào đang chờ duyệt</p>
        <p className="mt-1 text-xs text-ink-muted">
          Chuyển sang tab “Tạo đơn & xếp người thay” để lập mới và duyệt ngay.
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={onSwitchToCreate}>
          Tạo đơn nghỉ phép mới
        </Button>
      </div>
    );
  }

  const threeState = classifyLeaveThreeState(selectedPending.ngay_nghi, DEMO_TODAY);
  const shift = shiftMap.get(selectedPending.ma_ca_nghi);
  const leavingStaff = staffMap.get(selectedPending.ma_nhan_vien);
  const replacementStaff = selectedPending.ma_nv_thay_ca
    ? staffMap.get(selectedPending.ma_nv_thay_ca)
    : undefined;

  return (
    <div className="space-y-4">
      {pendingLeaves.length > 1 && (
        <Field label="Chọn đơn chờ duyệt">
          {({ id }) => (
            <Select
              id={id}
              value={selectedPending.ma_don_nghi}
              onChange={(e) => onSelectPending(e.target.value)}
            >
              {pendingLeaves.map((p) => {
                const nv = staffMap.get(p.ma_nhan_vien);
                return (
                  <option key={p.ma_don_nghi} value={p.ma_don_nghi}>
                    {p.ma_don_nghi} · {nv ? cleanStaffName(nv.ho_ten) : p.ma_nhan_vien} (
                    {formatDateVi(p.ngay_nghi)})
                  </option>
                );
              })}
            </Select>
          )}
        </Field>
      )}

      <div className="space-y-3 rounded-lg border border-line bg-paper-warm p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="eyebrow">Nhân viên xin nghỉ</p>
            <p className="mt-1 text-base font-medium text-ink">
              {cleanStaffName(leavingStaff?.ho_ten ?? selectedPending.ma_nhan_vien)}
            </p>
          </div>
          <Badge tone={LEAVE_STATE_META[threeState].tone} dot>
            {LEAVE_STATE_META[threeState].label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-line pt-3 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Ngày & ca nghỉ</p>
            <p className="num mt-1 text-sm font-medium text-ink">
              {formatDateVi(selectedPending.ngay_nghi)}
            </p>
            <p className="num text-xs text-ink-muted">
              {shift
                ? `${shortShiftName(shift.ten_ca)} (${formatExactShiftWindow(shift)})`
                : selectedPending.ma_ca_nghi}
            </p>
          </div>
          <div>
            <p className="eyebrow">Người trực thay được chỉ định</p>
            <p className="mt-1 text-sm font-medium text-st-empty-ink">
              {replacementStaff
                ? cleanStaffName(replacementStaff.ho_ten)
                : selectedPending.ma_nv_thay_ca ?? 'Chưa chỉ định'}
            </p>
            <p className="text-xs text-ink-muted">Sẽ tự động gán vào lịch trực khi duyệt</p>
          </div>
        </div>

        <div className="border-t border-line pt-3">
          <p className="eyebrow">Lý do xin nghỉ</p>
          <p className="mt-1 text-sm text-ink-soft">{selectedPending.ly_do}</p>
        </div>
      </div>
    </div>
  );
}
