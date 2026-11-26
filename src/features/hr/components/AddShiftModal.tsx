import { useEffect, useState, type FormEvent } from 'react';
import { CalendarPlus, Check } from 'lucide-react';
import { DEMO_TODAY } from '@/lib/clock';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import {
  STAFF_POSITION_META,
  cleanStaffName,
  formatExactShiftWindow,
  hasApprovedLeaveConflict,
  hasDuplicateShift,
  shortShiftName,
  shortZoneName,
} from '../payroll';

interface AddShiftModalProps {
  open: boolean;
  defaultDate: string;
  onClose: () => void;
}

interface ShiftFormErrors {
  ma_nhan_vien?: string;
  ma_ca?: string;
  ngay_lam_viec?: string;
  ma_khu_vuc_truc?: string;
}

export function AddShiftModal({ open, defaultDate, onClose }: AddShiftModalProps) {
  const staff = useRestaurantStore((s) => s.snapshot.tbl_nhan_vien);
  const shifts = useRestaurantStore((s) => s.snapshot.tbl_ca_lam_viec);
  const zones = useRestaurantStore((s) => s.snapshot.tbl_khu_vuc);
  const assignments = useRestaurantStore((s) => s.snapshot.tbl_phan_cong_ca);
  const leaves = useRestaurantStore((s) => s.snapshot.tbl_don_nghi_phep);
  const assignStaffShift = useRestaurantStore((s) => s.assignStaffShift);

  const activeStaff = staff.filter((nv) => nv.trang_thai_lam_viec !== 'DaNghiViec');

  const [staffId, setStaffId] = useState(activeStaff[0]?.ma_nhan_vien ?? '');
  const [shiftId, setShiftId] = useState(shifts[0]?.ma_ca ?? '');
  const [workDate, setWorkDate] = useState(defaultDate || DEMO_TODAY);
  const [zoneId, setZoneId] = useState(zones[0]?.ma_khu_vuc ?? '');
  const [errors, setErrors] = useState<ShiftFormErrors>({});

  useEffect(() => {
    if (!open) return;
    setWorkDate(defaultDate || DEMO_TODAY);
    setErrors({});
    if (!staffId && activeStaff[0]) setStaffId(activeStaff[0].ma_nhan_vien);
    if (!shiftId && shifts[0]) setShiftId(shifts[0].ma_ca);
    if (!zoneId && zones[0]) setZoneId(zones[0].ma_khu_vuc);
  }, [open, defaultDate, activeStaff, shifts, zones, staffId, shiftId, zoneId]);

  const selectedShift = shifts.find((c) => c.ma_ca === shiftId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: ShiftFormErrors = {};

    if (!staffId) nextErrors.ma_nhan_vien = 'Vui lòng chọn nhân viên cần phân ca.';
    if (!shiftId) nextErrors.ma_ca = 'Vui lòng chọn ca làm việc.';
    if (!workDate) nextErrors.ngay_lam_viec = 'Vui lòng chọn ngày trực.';
    if (!zoneId) nextErrors.ma_khu_vuc_truc = 'Vui lòng chọn khu vực trực.';

    if (staffId && shiftId && workDate) {
      if (hasDuplicateShift(assignments, staffId, workDate, shiftId)) {
        nextErrors.ma_ca = 'Nhân viên này đã có lịch trực cho ca và ngày đã chọn.';
      } else if (hasApprovedLeaveConflict(leaves, staffId, workDate, shiftId)) {
        nextErrors.ma_nhan_vien = 'Nhân viên đã có đơn nghỉ phép được duyệt cho ca và ngày này.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    assignStaffShift({
      ma_nhan_vien: staffId,
      ma_ca: shiftId,
      ngay_lam_viec: workDate,
      ma_khu_vuc_truc: zoneId,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<CalendarPlus size={20} />}
      title="Thêm ca làm"
      description="Chọn nhân viên, khung giờ và khu vực trực."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" form="add-shift-form" icon={<Check size={15} />}>
            Lưu lịch phân ca
          </Button>
        </>
      }
    >
      <form id="add-shift-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nhân viên" error={errors.ma_nhan_vien}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setErrors((prev) => ({ ...prev, ma_nhan_vien: undefined, ma_ca: undefined }));
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
          <Field label="Ngày làm việc" error={errors.ngay_lam_viec}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="date"
                aria-describedby={describedBy}
                invalid={invalid}
                value={workDate}
                onChange={(e) => {
                  setWorkDate(e.target.value);
                  setErrors((prev) => ({ ...prev, ngay_lam_viec: undefined, ma_ca: undefined }));
                }}
              />
            )}
          </Field>

          <Field label="Khu vực trực" error={errors.ma_khu_vuc_truc}>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={zoneId}
                onChange={(e) => {
                  setZoneId(e.target.value);
                  setErrors((prev) => ({ ...prev, ma_khu_vuc_truc: undefined }));
                }}
              >
                {zones.map((kv) => (
                  <option key={kv.ma_khu_vuc} value={kv.ma_khu_vuc}>
                    {shortZoneName(kv.ten_khu_vuc)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Field
          label="Ca làm việc & khung giờ"
          error={errors.ma_ca}
          hint={
            selectedShift
              ? `Khung giờ chính xác: ${formatExactShiftWindow(selectedShift)} · Hệ số lương x${selectedShift.he_so_luong_ca}`
              : undefined
          }
        >
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={shiftId}
              onChange={(e) => {
                setShiftId(e.target.value);
                setErrors((prev) => ({ ...prev, ma_ca: undefined }));
              }}
            >
              {shifts.map((ca) => (
                <option key={ca.ma_ca} value={ca.ma_ca}>
                  {shortShiftName(ca.ten_ca)} ({formatExactShiftWindow(ca)}) · x{ca.he_so_luong_ca}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </form>
    </Modal>
  );
}
