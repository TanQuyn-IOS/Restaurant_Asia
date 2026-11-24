import { useMemo } from 'react';
import {
  Banknote,
  Calendar,
  Clock,
  Download,
  FileMinus2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { DEMO_TODAY } from '@/lib/clock';
import { formatVnd, formatVndCompact } from '@/lib/format';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardFooter, CardHeader, StatCard } from '@/components/ui/Card';
import { Avatar, EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { PageBody, PageHeader } from '@/components/ui/PageHeader';
import { RoleWorkspaceCard } from './components/RoleWorkspaceCard';
import {
  STAFF_POSITION_META,
  buildUtf8Csv,
  calculatePayrollSummary,
  formatHoursVi,
  triggerCsvDownload,
} from './payroll';

export function PayrollPage() {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const staff = useRestaurantStore((s) => s.snapshot.tbl_nhan_vien);
  const shifts = useRestaurantStore((s) => s.snapshot.tbl_ca_lam_viec);
  const assignments = useRestaurantStore((s) => s.snapshot.tbl_phan_cong_ca);
  const leaves = useRestaurantStore((s) => s.snapshot.tbl_don_nghi_phep);
  const payrollRecords = useRestaurantStore((s) => s.snapshot.tbl_bang_luong);

  const isOwner = currentRole === 'Owner';

  const summary = useMemo(
    () =>
      calculatePayrollSummary(
        {
          tbl_nhan_vien: staff,
          tbl_ca_lam_viec: shifts,
          tbl_phan_cong_ca: assignments,
          tbl_don_nghi_phep: leaves,
          tbl_bang_luong: payrollRecords,
        },
        '2026-11',
        DEMO_TODAY,
      ),
    [staff, shifts, assignments, leaves, payrollRecords],
  );

  const handleExportCsv = () => {
    const headers = [
      'Mã NV',
      'Nhân viên',
      'Chức vụ',
      'Giờ chính xác',
      'Tổng số ca',
      'Ca sáng / chiều / tối',
      'Số ca nghỉ trừ lương',
      'Lương gộp (VND)',
      'Khấu trừ nghỉ phép (VND)',
      'Thực lĩnh (VND)',
      'Trạng thái chi trả',
    ];
    const rows = summary.rows.map((r) => [
      r.maNhanVien,
      r.hoTen,
      STAFF_POSITION_META[r.chucVu].label,
      formatHoursVi(r.exactHours),
      r.totalShifts,
      `${r.shiftsMorning}S / ${r.shiftsAfternoon}C / ${r.shiftsEvening}T`,
      r.leaveDays,
      r.grossPay,
      r.leaveDeduction,
      r.netPay,
      r.paidAt ? 'Đã chi trả' : 'Đang rà soát',
    ]);
    triggerCsvDownload('bang-luong-ca-2026-11.csv', buildUtf8Csv(headers, rows));
  };

  return (
    <PageBody>
      <RoleWorkspaceCard />

      <PageHeader
        eyebrow="NHÂN SỰ & VẬN HÀNH · MOD-07"
        title="Bảng lương theo ca"
        description="Tổng hợp giờ làm chính xác, số ca sáng – chiều – tối và khấu trừ nghỉ phép tự động cho kỳ lương tháng 11/2026."
        actions={
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={handleExportCsv}
            disabled={summary.rows.length === 0}
          >
            Xuất bảng lương CSV
          </Button>
        }
      />

      {/* 4 KPI Cards (mockup 07) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Kỳ lương"
          value="Tháng 11/2026"
          hint="01/11 – 30/11/2026"
          tone="neutral"
          icon={<Calendar size={18} />}
        />
        <StatCard
          label="Tổng giờ ca"
          value={formatHoursVi(summary.totalHours)}
          hint={`trên ${summary.staffCount} nhân sự · ${summary.totalShifts} ca`}
          tone="neutral"
          icon={<Clock size={18} />}
        />
        <StatCard
          label="Khấu trừ nghỉ phép"
          value={formatVndCompact(summary.totalDeduction)}
          hint={`${summary.totalLeaveDays} ca nghỉ · đã đồng bộ`}
          tone="gold"
          icon={<FileMinus2 size={18} />}
        />
        <StatCard
          label="Trạng thái"
          value={summary.allPaid ? 'Đã chi trả' : 'Bản nháp'}
          hint={
            summary.allPaid
              ? 'Toàn bộ phiếu lương đã quyết toán'
              : `${summary.paidCount}/${summary.staffCount} phiếu đã chi · rà soát trước 30/11`
          }
          hintTone={summary.allPaid ? 'success' : 'danger'}
          tone="danger"
          icon={<Banknote size={18} />}
        />
      </div>

      {/* Bảng lương ca hàng tháng (mockup 07) */}
      <Card>
        <CardHeader
          title="Bảng lương ca tháng 11/2026"
          subtitle="Giờ chấm công thực tế và khấu trừ ngày nghỉ đã duyệt · Tháng 11/2026"
          action={
            !isOwner ? (
              <Badge tone="success" icon={<Lock size={12} />} className="rounded-lg px-3 py-1.5">
                Chế độ Quản lý — đã ẩn doanh thu
              </Badge>
            ) : (
              <Badge tone="gold" icon={<ShieldCheck size={12} />} className="rounded-lg px-3 py-1.5">
                Phân hệ Nhân sự · MOD-07
              </Badge>
            )
          }
        />

        <div className="mt-4">
          {summary.rows.length === 0 ? (
            <EmptyState
              icon={<Banknote size={22} />}
              title="Chưa có dữ liệu bảng lương trong kỳ này"
              description="Phân công ca làm việc cho nhân sự để hệ thống tự động tính giờ và lương ca."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Nhân viên</Th>
                  <Th>Chức vụ</Th>
                  <Th>Giờ chính xác</Th>
                  <Th>Số ca</Th>
                  <Th className="text-right">Lương gộp</Th>
                  <Th className="text-right">Khấu trừ nghỉ phép</Th>
                  <Th className="text-right">Thực lĩnh</Th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map((row) => {
                  const posMeta = STAFF_POSITION_META[row.chucVu];
                  return (
                    <Tr key={row.maNhanVien}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar name={row.hoTen} size="md" />
                          <div className="min-w-0">
                            <p className="font-medium text-ink">{row.hoTen}</p>
                            <p className="num text-xs text-ink-muted">
                              {row.maBangLuong ?? 'Tạm tính từ lịch ca'}
                              {row.paidAt ? ' · Đã chi trả' : ''}
                            </p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Badge tone={posMeta.tone} size="sm">
                          {posMeta.label}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="num font-medium text-ink">
                          {formatHoursVi(row.exactHours)}
                        </span>
                      </Td>
                      <Td>
                        <p className="num text-sm text-ink">{row.totalShifts} ca</p>
                        <p className="num text-xs text-ink-muted">
                          {row.shiftsMorning}S · {row.shiftsAfternoon}C · {row.shiftsEvening}T
                        </p>
                      </Td>
                      <Td className="text-right">
                        <span className="num text-ink-soft">{formatVnd(row.grossPay)}</span>
                      </Td>
                      <Td className="text-right">
                        <span
                          className={
                            row.leaveDeduction > 0
                              ? 'num font-medium text-st-serving-ink'
                              : 'num text-ink-muted'
                          }
                        >
                          {row.leaveDeduction > 0
                            ? `−${formatVnd(row.leaveDeduction)}`
                            : formatVnd(0)}
                        </span>
                        {row.leaveDays > 0 && (
                          <p className="num text-xs text-ink-muted">{row.leaveDays} ca nghỉ</p>
                        )}
                      </Td>
                      <Td className="text-right">
                        <span className="num font-medium text-ink">{formatVnd(row.netPay)}</span>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-paper-warm">
                  <td colSpan={2} className="px-5 py-4">
                    <p className="text-sm font-medium text-ink">Tổng quỹ lương ca</p>
                    <p className="num text-xs text-ink-muted">
                      {summary.staffCount} nhân sự · đã đối trừ nghỉ phép
                    </p>
                  </td>
                  <td className="num px-4 py-4 text-sm font-medium text-ink">
                    {formatHoursVi(summary.totalHours)}
                  </td>
                  <td className="num px-4 py-4 text-sm font-medium text-ink">
                    {summary.totalShifts} ca
                  </td>
                  <td className="num px-4 py-4 text-right text-sm font-medium text-ink-soft">
                    {formatVnd(summary.totalGrossPay)}
                  </td>
                  <td className="num px-4 py-4 text-right text-sm font-medium text-st-serving-ink">
                    {summary.totalDeduction > 0
                      ? `−${formatVnd(summary.totalDeduction)}`
                      : formatVnd(0)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="t-metric-sm text-ink">{formatVnd(summary.totalNetPay)}</span>
                  </td>
                </tr>
              </tfoot>
            </Table>
          )}
        </div>

        <CardFooter className="flex-wrap text-xs text-ink-muted">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={14} aria-hidden className="text-st-empty-ink" />
            Hồ sơ nghỉ phép đã đồng bộ tự động · Cập nhật tức thì theo dữ liệu phân ca
          </span>
          {!isOwner && (
            <span>Bảo mật FR-19: Số liệu doanh thu và sổ quỹ được ẩn hoàn toàn với vai trò hiện tại</span>
          )}
        </CardFooter>
      </Card>
    </PageBody>
  );
}
