import { CalendarClock, LogIn, LogOut, Plus } from 'lucide-react';
import { formatClock, formatDateVi } from '@/lib/format';
import type { CaLamViec, KhuVuc, NhanVien, PhanCongCa } from '@/types/database';
import { Badge, StatusDot } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar, EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import {
  SHIFT_STATUS_META,
  STAFF_POSITION_META,
  cleanStaffName,
  formatExactShiftWindow,
  shortShiftName,
  shortZoneName,
} from '../payroll';

interface ShiftTableProps {
  assignments: PhanCongCa[];
  showDateInName: boolean;
  staffMap: Map<string, NhanVien>;
  shiftMap: Map<string, CaLamViec>;
  zoneMap: Map<string, KhuVuc>;
  onToggleCheckInOut: (maPhanCong: string) => void;
  onAddShift: () => void;
}

export function ShiftTable({
  assignments,
  showDateInName,
  staffMap,
  shiftMap,
  zoneMap,
  onToggleCheckInOut,
  onAddShift,
}: ShiftTableProps) {
  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock size={22} />}
        title="Chưa có lịch phân ca cho lựa chọn này"
        description='Thêm ca làm mới hoặc chọn "Tất cả ngày" để xem toàn bộ lịch trực.'
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={onAddShift}>
            Thêm ca cho ngày này
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
          <Th>Ca làm</Th>
          <Th>Giờ chính xác</Th>
          <Th>Khu vực trực</Th>
          <Th className="text-right">Chấm công</Th>
        </tr>
      </thead>
      <tbody>
        {assignments.map((pc) => {
          const nv = staffMap.get(pc.ma_nhan_vien);
          const ca = shiftMap.get(pc.ma_ca);
          const kv = pc.ma_khu_vuc_truc ? zoneMap.get(pc.ma_khu_vuc_truc) : undefined;
          const displayName = nv ? cleanStaffName(nv.ho_ten) : pc.ma_nhan_vien;
          const posMeta = nv ? STAFF_POSITION_META[nv.chuc_vu] : null;
          const statusMeta = SHIFT_STATUS_META[pc.trang_thai_ca];
          const isDone = Boolean(pc.gio_check_in && pc.gio_check_out);
          const isOnShift = Boolean(pc.gio_check_in && !pc.gio_check_out);

          return (
            <Tr key={pc.ma_phan_cong}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar name={displayName} size="md" />
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{displayName}</p>
                    <p className="num text-xs text-ink-muted">
                      {pc.ma_phan_cong}
                      {showDateInName ? ` · ${formatDateVi(pc.ngay_lam_viec)}` : ''}
                    </p>
                  </div>
                </div>
              </Td>
              <Td>
                <Badge tone={posMeta?.tone ?? 'neutral'} size="sm">
                  {posMeta?.label ?? 'Nhân viên'}
                </Badge>
              </Td>
              <Td>
                <p className="font-medium text-ink">{ca ? shortShiftName(ca.ten_ca) : pc.ma_ca}</p>
                {ca && <p className="num text-xs text-ink-muted">Hệ số x{ca.he_so_luong_ca}</p>}
              </Td>
              <Td>
                <span className="num text-sm text-ink-soft">
                  {ca ? formatExactShiftWindow(ca) : '—'}
                </span>
              </Td>
              <Td>
                <Badge tone="neutral" size="sm">
                  {shortZoneName(kv?.ten_khu_vuc)}
                </Badge>
              </Td>
              <Td>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                    <StatusDot tone={statusMeta.tone} pulse={isOnShift} />
                    <span className="num">
                      {isDone
                        ? `Đã tan ca · ${formatClock(pc.gio_check_in)}–${formatClock(pc.gio_check_out)}`
                        : isOnShift
                          ? `Đang trực · ${formatClock(pc.gio_check_in)}`
                          : statusMeta.label}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant={isOnShift ? 'secondary' : isDone ? 'ghost' : 'primary'}
                    disabled={isDone}
                    icon={isOnShift ? <LogOut size={13} /> : <LogIn size={13} />}
                    onClick={() => onToggleCheckInOut(pc.ma_phan_cong)}
                  >
                    {!pc.gio_check_in ? 'Vào ca' : !pc.gio_check_out ? 'Tan ca' : 'Hoàn tất'}
                  </Button>
                </div>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
