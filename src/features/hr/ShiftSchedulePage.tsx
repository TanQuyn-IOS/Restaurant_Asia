import { useMemo, useState } from 'react';
import {
  Activity,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Plus,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { DEMO_TODAY } from '@/lib/clock';
import { formatClock, formatDateVi, formatDayMonth } from '@/lib/format';
import { classifyLeaveThreeState, useRestaurantStore } from '@/store/useRestaurantStore';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardFooter, CardHeader, StatCard } from '@/components/ui/Card';
import { Select } from '@/components/ui/Form';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { AddShiftModal } from './components/AddShiftModal';
import { RoleWorkspaceCard } from './components/RoleWorkspaceCard';
import { ShiftTable } from './components/ShiftTable';
import {
  SHIFT_STATUS_META,
  STAFF_POSITION_META,
  buildUtf8Csv,
  cleanStaffName,
  formatExactShiftWindow,
  formatHoursVi,
  getWeekDaysAnchored,
  parseShiftHours,
  shortShiftName,
  shortZoneName,
  triggerCsvDownload,
} from './payroll';

export function ShiftSchedulePage() {
  const staff = useRestaurantStore((s) => s.snapshot.tbl_nhan_vien);
  const shifts = useRestaurantStore((s) => s.snapshot.tbl_ca_lam_viec);
  const assignments = useRestaurantStore((s) => s.snapshot.tbl_phan_cong_ca);
  const leaves = useRestaurantStore((s) => s.snapshot.tbl_don_nghi_phep);
  const zones = useRestaurantStore((s) => s.snapshot.tbl_khu_vuc);
  const toggleShiftCheckInOut = useRestaurantStore((s) => s.toggleShiftCheckInOut);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string>(DEMO_TODAY);
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [addOpen, setAddOpen] = useState(false);

  const weekDays = useMemo(() => getWeekDaysAnchored(DEMO_TODAY, weekOffset), [weekOffset]);
  const staffMap = useMemo(() => new Map(staff.map((n) => [n.ma_nhan_vien, n])), [staff]);
  const shiftMap = useMemo(() => new Map(shifts.map((c) => [c.ma_ca, c])), [shifts]);
  const zoneMap = useMemo(() => new Map(zones.map((z) => [z.ma_khu_vuc, z])), [zones]);
  const weekIsoSet = useMemo(() => new Set(weekDays.map((d) => d.iso)), [weekDays]);

  const kpis = useMemo(() => {
    const activeStaffCount = staff.filter((n) => n.trang_thai_lam_viec !== 'DaNghiViec').length;
    const todayShifts = assignments.filter((p) => p.ngay_lam_viec === DEMO_TODAY);
    const onShiftToday = todayShifts.filter((p) => p.trang_thai_ca === 'DangTruc').length;
    const completedToday = todayShifts.filter((p) => p.trang_thai_ca === 'HoanThanh').length;

    const totalScheduledHours = Number(
      assignments
        .reduce((sum, p) => {
          const ca = shiftMap.get(p.ma_ca);
          return sum + (ca ? parseShiftHours(ca.gio_bat_dau, ca.gio_ket_thuc) : 8);
        }, 0)
        .toFixed(1),
    );

    const leavesToday = leaves.filter(
      (d) =>
        classifyLeaveThreeState(d.ngay_nghi, DEMO_TODAY) === 'DangNghi' &&
        d.trang_thai_duyet !== 'TuChoi',
    );
    const replacedToday = leavesToday.filter((d) => Boolean(d.ma_nv_thay_ca)).length;
    const uncoveredLeaves = leavesToday.length - replacedToday;
    const totalPlannedSlots = todayShifts.length + uncoveredLeaves;
    const coveragePct =
      totalPlannedSlots > 0 ? Math.round((todayShifts.length / totalPlannedSlots) * 100) : 100;

    return {
      activeStaffCount,
      onShiftToday,
      completedToday,
      totalScheduledHours,
      coveragePct,
      uncoveredLeaves,
      absentToday: leavesToday.length,
      replacedToday,
    };
  }, [staff, assignments, shiftMap, leaves]);

  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const pc of assignments) {
      if (zoneFilter !== 'ALL' && pc.ma_khu_vuc_truc !== zoneFilter) continue;
      map.set(pc.ngay_lam_viec, (map.get(pc.ngay_lam_viec) ?? 0) + 1);
    }
    return map;
  }, [assignments, zoneFilter]);

  const visibleAssignments = useMemo(() => {
    return assignments
      .filter((pc) => {
        if (zoneFilter !== 'ALL' && pc.ma_khu_vuc_truc !== zoneFilter) return false;
        if (selectedDay === 'ALL') return true;
        return pc.ngay_lam_viec === selectedDay;
      })
      .sort((a, b) => {
        if (a.ngay_lam_viec !== b.ngay_lam_viec) {
          return a.ngay_lam_viec.localeCompare(b.ngay_lam_viec);
        }
        const caA = shiftMap.get(a.ma_ca)?.gio_bat_dau ?? '00:00';
        const caB = shiftMap.get(b.ma_ca)?.gio_bat_dau ?? '00:00';
        return caA.localeCompare(caB);
      });
  }, [assignments, zoneFilter, selectedDay, shiftMap]);

  const handleExportCsv = () => {
    const headers = [
      'Mã phân công',
      'Ngày làm việc',
      'Nhân viên',
      'Chức vụ',
      'Ca làm',
      'Giờ chính xác',
      'Khu vực trực',
      'Giờ vào ca',
      'Giờ tan ca',
      'Trạng thái',
    ];
    const rows = visibleAssignments.map((pc) => {
      const nv = staffMap.get(pc.ma_nhan_vien);
      const ca = shiftMap.get(pc.ma_ca);
      const kv = pc.ma_khu_vuc_truc ? zoneMap.get(pc.ma_khu_vuc_truc) : undefined;
      return [
        pc.ma_phan_cong,
        formatDateVi(pc.ngay_lam_viec),
        nv ? cleanStaffName(nv.ho_ten) : pc.ma_nhan_vien,
        nv ? STAFF_POSITION_META[nv.chuc_vu].label : '—',
        ca ? shortShiftName(ca.ten_ca) : pc.ma_ca,
        ca ? formatExactShiftWindow(ca) : '—',
        shortZoneName(kv?.ten_khu_vuc),
        pc.gio_check_in ? formatClock(pc.gio_check_in) : '—',
        pc.gio_check_out ? formatClock(pc.gio_check_out) : '—',
        SHIFT_STATUS_META[pc.trang_thai_ca].label,
      ];
    });
    const suffix = selectedDay === 'ALL' ? 'tat-ca' : selectedDay;
    triggerCsvDownload(`lich-ca-lam-${suffix}.csv`, buildUtf8Csv(headers, rows));
  };

  const weekRangeLabel = `${formatDayMonth(weekDays[0].iso)} – ${formatDateVi(weekDays[6].iso)}`;
  const weekTotalCount = Array.from(weekIsoSet).reduce(
    (sum, iso) => sum + (countByDate.get(iso) ?? 0),
    0,
  );
  const allFilteredCount = assignments.filter(
    (a) => zoneFilter === 'ALL' || a.ma_khu_vuc_truc === zoneFilter,
  ).length;

  return (
    <PageBody>
      <RoleWorkspaceCard />

      <PageHeader
        eyebrow="NHÂN SỰ & VẬN HÀNH · MOD-07"
        title="Nhân sự & lịch ca làm"
        description="Phân công rõ ca nào, giờ nào và khu vực phụ trách cho toàn đội ngũ sảnh, bếp và thu ngân."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download size={15} />}
              onClick={handleExportCsv}
              disabled={visibleAssignments.length === 0}
            >
              Xuất lịch CSV
            </Button>
            <Button variant="primary" icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
              Thêm ca
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Đang trực hôm nay"
          value={String(kpis.onShiftToday).padStart(2, '0')}
          hint={`trên ${kpis.activeStaffCount} nhân sự · ${kpis.completedToday} ca đã hoàn tất`}
          hintTone="success"
          tone="success"
          icon={<Users size={18} />}
        />
        <StatCard
          label="Tổng giờ phân ca"
          value={formatHoursVi(kpis.totalScheduledHours)}
          hint={`phân bổ trên ${zones.length} khu vực phục vụ`}
          tone="neutral"
          icon={<Clock size={18} />}
        />
        <StatCard
          label="Tỷ lệ phủ ca"
          value={`${kpis.coveragePct}%`}
          hint={
            kpis.uncoveredLeaves === 0
              ? 'Toàn bộ ca hôm nay đã được phủ đủ'
              : `${kpis.uncoveredLeaves} ca cần bố trí người thay`
          }
          hintTone={kpis.uncoveredLeaves > 0 ? 'warning' : 'neutral'}
          tone="gold"
          icon={<Activity size={18} />}
        />
        <StatCard
          label="Vắng hôm nay"
          value={String(kpis.absentToday).padStart(2, '0')}
          hint={
            kpis.absentToday > 0
              ? `đã xếp người thay ${kpis.replacedToday}/${kpis.absentToday}`
              : 'Đủ quân số trong ngày'
          }
          hintTone={kpis.absentToday > 0 ? 'danger' : 'success'}
          tone="danger"
          icon={<CalendarOff size={18} />}
        />
      </div>

      <Card>
        <CardHeader
          title="Lịch ca làm trong tuần"
          subtitle={`${weekRangeLabel} · ${zoneFilter === 'ALL' ? 'Tất cả khu vực' : shortZoneName(zoneMap.get(zoneFilter)?.ten_khu_vuc)}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center rounded-md border border-line-strong bg-paper">
                <IconButton
                  label="Tuần trước"
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="size-8 rounded-r-none"
                >
                  <ChevronLeft size={15} />
                </IconButton>
                <IconButton
                  label="Tuần sau"
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="size-8 rounded-l-none border-l border-line"
                >
                  <ChevronRight size={15} />
                </IconButton>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setWeekOffset(0);
                  setSelectedDay(DEMO_TODAY);
                }}
              >
                Tuần này
              </Button>
              <Select
                aria-label="Lọc theo khu vực trực"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="h-8 w-44 text-xs"
              >
                <option value="ALL">Tất cả khu vực</option>
                {zones.map((z) => (
                  <option key={z.ma_khu_vuc} value={z.ma_khu_vuc}>
                    {shortZoneName(z.ten_khu_vuc)}
                  </option>
                ))}
              </Select>
            </div>
          }
        />

        <div
          role="tablist"
          aria-label="Chọn ngày trong tuần"
          className="scroll-quiet mt-4 flex items-center gap-2 overflow-x-auto border-y border-line px-5"
        >
          <button
            role="tab"
            type="button"
            aria-selected={selectedDay === 'ALL'}
            onClick={() => setSelectedDay('ALL')}
            className={cn(
              'relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium whitespace-nowrap transition-colors',
              selectedDay === 'ALL'
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            <span>Tất cả ngày</span>
            <span
              className={cn(
                'num rounded-full px-1.5 py-px text-xs',
                selectedDay === 'ALL' ? 'bg-primary-soft text-primary' : 'bg-sunken text-ink-muted',
              )}
            >
              {allFilteredCount}
            </span>
          </button>

          <span aria-hidden className="h-5 w-px shrink-0 bg-line" />

          {weekDays.map((day) => {
            const active = selectedDay === day.iso;
            const count = countByDate.get(day.iso) ?? 0;
            return (
              <button
                key={day.iso}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setSelectedDay(day.iso)}
                className={cn(
                  'relative -mb-px flex min-w-20 flex-1 shrink-0 flex-col items-center justify-center gap-1 border-b-2 px-3 py-3 transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-ink-muted hover:text-ink',
                )}
              >
                <span className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium">{day.weekdayLabel}</span>
                  <span className={cn('num text-sm font-medium', active ? 'text-primary' : 'text-ink')}>
                    {day.dayNumber}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs">
                  {day.isToday && <span aria-label="Hôm nay" className="size-1.5 rounded-full bg-primary" />}
                  <span className="num text-ink-muted">{count > 0 ? `${count} ca` : '—'}</span>
                </span>
              </button>
            );
          })}
        </div>

        <ShiftTable
          assignments={visibleAssignments}
          showDateInName={selectedDay === 'ALL'}
          staffMap={staffMap}
          shiftMap={shiftMap}
          zoneMap={zoneMap}
          onToggleCheckInOut={toggleShiftCheckInOut}
          onAddShift={() => setAddOpen(true)}
        />

        <CardFooter className="flex-wrap text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {shifts.map((ca) => (
              <span key={ca.ma_ca} className="num">
                <strong className="font-medium text-ink-soft">{shortShiftName(ca.ten_ca)}:</strong>{' '}
                {formatExactShiftWindow(ca)}
              </span>
            ))}
          </div>
          <span className="num">
            Hiển thị {visibleAssignments.length} ca · Tuần này: {weekTotalCount} ca
          </span>
        </CardFooter>
      </Card>

      <AddShiftModal
        open={addOpen}
        defaultDate={selectedDay === 'ALL' ? DEMO_TODAY : selectedDay}
        onClose={() => setAddOpen(false)}
      />
    </PageBody>
  );
}
