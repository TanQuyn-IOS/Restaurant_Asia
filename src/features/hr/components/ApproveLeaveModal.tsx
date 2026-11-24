import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarOff, Check, XCircle } from 'lucide-react';
import { DEMO_TODAY } from '@/lib/clock';
import { LEAVE_STATE_META } from '@/lib/labels';
import { classifyLeaveThreeState, useRestaurantStore } from '@/store/useRestaurantStore';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { Segmented } from '@/components/ui/Tabs';
import { STAFF_POSITION_META, cleanStaffName, shortShiftName } from '../payroll';
import { PendingLeavePanel } from './PendingLeavePanel';

type ModalMode = 'approve' | 'create';

interface ApproveLeaveModalProps {
  open: boolean;
  initialRequestId?: string | null;
  initialMode?: ModalMode;
  onClose: () => void;
}

interface CreateLeaveErrors {
  ma_nhan_vien?: string;
  ngay_nghi?: string;
  ma_ca_nghi?: string;
  ma_nv_thay_ca?: string;
  ly_do?: string;
}

export function ApproveLeaveModal({
  open,
  initialRequestId,
  initialMode,
  onClose,
}: ApproveLeaveModalProps) {
  const staff = useRestaurantStore((s) => s.snapshot.tbl_nhan_vien);
  const shifts = useRestaurantStore((s) => s.snapshot.tbl_ca_lam_viec);
  const leaves = useRestaurantStore((s) => s.snapshot.tbl_don_nghi_phep);
  const submitLeaveRequest = useRestaurantStore((s) => s.submitLeaveRequest);
  const approveOrRejectLeave = useRestaurantStore((s) => s.approveOrRejectLeave);

  const pendingLeaves = useMemo(
    () => leaves.filter((d) => d.trang_thai_duyet === 'ChoDuyet'),
    [leaves],
  );
  const activeStaff = useMemo(
    () => staff.filter((nv) => nv.trang_thai_lam_viec !== 'DaNghiViec'),
    [staff],
  );

  const [mode, setMode] = useState<ModalMode>('approve');
  const [selectedPendingId, setSelectedPendingId] = useState('');
  const [staffId, setStaffId] = useState('NV-PV02');
  const [leaveDate, setLeaveDate] = useState('2026-11-26');
  const [shiftId, setShiftId] = useState('CA-CHIEU');
  const [reason, setReason] = useState('Khám sức khỏe / nghỉ ốm');
  const [replaceId, setReplaceId] = useState('NV-PV01');
  const [approveImmediately, setApproveImmediately] = useState(true);
  const [errors, setErrors] = useState<CreateLeaveErrors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (initialRequestId && pendingLeaves.some((p) => p.ma_don_nghi === initialRequestId)) {
      setMode('approve');
      setSelectedPendingId(initialRequestId);
      return;
    }
    setMode(initialMode ?? (pendingLeaves.length > 0 ? 'approve' : 'create'));
    if (pendingLeaves[0]) setSelectedPendingId(pendingLeaves[0].ma_don_nghi);
  }, [open, initialRequestId, initialMode, pendingLeaves]);

  useEffect(() => {
    if (replaceId === staffId) {
      const candidate = activeStaff.find((nv) => nv.ma_nhan_vien !== staffId);
      if (candidate) setReplaceId(candidate.ma_nhan_vien);
    }
  }, [staffId, replaceId, activeStaff]);

  const selectedPending =
    pendingLeaves.find((p) => p.ma_don_nghi === selectedPendingId) ?? pendingLeaves[0];
  const staffMap = useMemo(() => new Map(staff.map((n) => [n.ma_nhan_vien, n])), [staff]);
  const shiftMap = useMemo(() => new Map(shifts.map((c) => [c.ma_ca, c])), [shifts]);

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: CreateLeaveErrors = {};
    const trimmedReason = reason.trim();

    if (!staffId) nextErrors.ma_nhan_vien = 'Vui lòng chọn nhân viên xin nghỉ.';
    if (!leaveDate) nextErrors.ngay_nghi = 'Vui lòng chọn ngày nghỉ.';
    if (!shiftId) nextErrors.ma_ca_nghi = 'Vui lòng chọn ca nghỉ.';
    if (!replaceId || replaceId === staffId) {
      nextErrors.ma_nv_thay_ca = 'Người trực thay phải khác nhân viên xin nghỉ.';
    }
    if (trimmedReason.length < 3) {
      nextErrors.ly_do = 'Vui lòng nhập lý do nghỉ phép (tối thiểu 3 ký tự).';
    }

    const duplicate = leaves.some(
      (d) =>
        d.ma_nhan_vien === staffId &&
        d.ngay_nghi === leaveDate &&
        d.ma_ca_nghi === shiftId &&
        d.trang_thai_duyet !== 'TuChoi',
    );
    if (duplicate) nextErrors.ngay_nghi = 'Nhân viên đã có đơn nghỉ phép cho ca và ngày này.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    submitLeaveRequest({
      ma_nhan_vien: staffId,
      ngay_nghi: leaveDate,
      ma_ca_nghi: shiftId,
      ly_do: trimmedReason,
      ma_nv_thay_ca: replaceId,
    });

    if (approveImmediately) {
      const created = useRestaurantStore.getState().snapshot.tbl_don_nghi_phep[0];
      if (created && created.ma_nhan_vien === staffId && created.ngay_nghi === leaveDate) {
        approveOrRejectLeave(created.ma_don_nghi, 'DaDuyet');
      }
    }
    onClose();
  };

  const previewThreeState = leaveDate ? classifyLeaveThreeState(leaveDate, DEMO_TODAY) : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<CalendarOff size={20} />}
      eyebrow="QUẢN LÝ NGHỈ PHÉP · MOD-07"
      title="Duyệt nghỉ phép & xếp người thay"
      description="Xác nhận lịch nghỉ của nhân viên và chỉ định người trực thay cho từng ca ảnh hưởng."
      footer={
        mode === 'approve' && selectedPending ? (
          <>
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="ghost"
              icon={<XCircle size={15} />}
              onClick={() => {
                approveOrRejectLeave(selectedPending.ma_don_nghi, 'TuChoi');
                onClose();
              }}
            >
              Từ chối
            </Button>
            <Button
              variant="primary"
              icon={<Check size={15} />}
              onClick={() => {
                approveOrRejectLeave(selectedPending.ma_don_nghi, 'DaDuyet');
                onClose();
              }}
            >
              Duyệt & xếp thay
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" form="create-leave-form" icon={<Check size={15} />}>
              {approveImmediately ? 'Duyệt & xếp thay' : 'Tạo đơn chờ duyệt'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-5">
        <Segmented<ModalMode>
          label="Chế độ xử lý đơn nghỉ phép"
          value={mode}
          onChange={setMode}
          items={[
            { id: 'approve', label: 'Duyệt đơn chờ', count: pendingLeaves.length },
            { id: 'create', label: 'Tạo đơn & xếp người thay' },
          ]}
        />

        {mode === 'approve' ? (
          <PendingLeavePanel
            pendingLeaves={pendingLeaves}
            selectedPending={selectedPending}
            staffMap={staffMap}
            shiftMap={shiftMap}
            onSelectPending={setSelectedPendingId}
            onSwitchToCreate={() => setMode('create')}
          />
        ) : (
          <form id="create-leave-form" onSubmit={handleCreateSubmit} className="space-y-4">
            <Field label="Nhân viên xin nghỉ" error={errors.ma_nhan_vien}>
              {({ id, describedBy, invalid }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={staffId}
                  onChange={(e) => {
                    setStaffId(e.target.value);
                    setErrors((prev) => ({ ...prev, ma_nhan_vien: undefined, ngay_nghi: undefined }));
                  }}
                >
                  {activeStaff.map((nv) => (
                    <option key={nv.ma_nhan_vien} value={nv.ma_nhan_vien}>
                      {cleanStaffName(nv.ho_ten)} · {STAFF_POSITION_META[nv.chuc_vu].label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Ngày nghỉ"
                error={errors.ngay_nghi}
                hint={
                  previewThreeState
                    ? `Phân loại tự động: ${LEAVE_STATE_META[previewThreeState].label}`
                    : undefined
                }
              >
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="date"
                    aria-describedby={describedBy}
                    invalid={invalid}
                    value={leaveDate}
                    onChange={(e) => {
                      setLeaveDate(e.target.value);
                      setErrors((prev) => ({ ...prev, ngay_nghi: undefined }));
                    }}
                  />
                )}
              </Field>

              <Field label="Ca nghỉ" error={errors.ma_ca_nghi}>
                {({ id, describedBy, invalid }) => (
                  <Select
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    value={shiftId}
                    onChange={(e) => {
                      setShiftId(e.target.value);
                      setErrors((prev) => ({ ...prev, ma_ca_nghi: undefined }));
                    }}
                  >
                    {shifts.map((ca) => (
                      <option key={ca.ma_ca} value={ca.ma_ca}>
                        {shortShiftName(ca.ten_ca)} ({ca.gio_bat_dau.slice(0, 5)}–{ca.gio_ket_thuc.slice(0, 5)})
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>

            <Field label="Xếp người trực thay" error={errors.ma_nv_thay_ca}>
              {({ id, describedBy, invalid }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={replaceId}
                  onChange={(e) => {
                    setReplaceId(e.target.value);
                    setErrors((prev) => ({ ...prev, ma_nv_thay_ca: undefined }));
                  }}
                >
                  {activeStaff
                    .filter((nv) => nv.ma_nhan_vien !== staffId)
                    .map((nv) => (
                      <option key={nv.ma_nhan_vien} value={nv.ma_nhan_vien}>
                        {cleanStaffName(nv.ho_ten)} · {STAFF_POSITION_META[nv.chuc_vu].label}
                      </option>
                    ))}
                </Select>
              )}
            </Field>

            <Field label="Lý do nghỉ phép" error={errors.ly_do}>
              {({ id, describedBy, invalid }) => (
                <Textarea
                  id={id}
                  rows={2}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setErrors((prev) => ({ ...prev, ly_do: undefined }));
                  }}
                  placeholder="Nhập lý do xin nghỉ phép..."
                />
              )}
            </Field>

            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-ink-soft">
              <input
                type="checkbox"
                checked={approveImmediately}
                onChange={(e) => setApproveImmediately(e.target.checked)}
                className="size-4 accent-primary"
              />
              Phê duyệt ngay và tự động cập nhật người trực thay vào lịch phân ca
            </label>
          </form>
        )}

        <div className="flex items-start gap-3 rounded-lg border border-st-empty/30 bg-st-empty-soft px-4 py-3">
          <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-st-empty-ink" />
          <div>
            <p className="text-sm font-medium text-st-empty-ink">Đã bật đồng bộ bảng lương</p>
            <p className="mt-0.5 text-xs text-st-empty-ink">
              Đơn nghỉ phép được phê duyệt sẽ tự động cập nhật vào mục khấu trừ nghỉ phép trong bảng
              lương tháng.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
