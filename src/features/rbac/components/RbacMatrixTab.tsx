import { Ban, CheckCircle2, Eye, Lock, QrCode, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { ROLE_META, STAFF_ROLES } from '@/lib/labels';
import { verifyRbacPermission } from '@/store/useRestaurantStore';
import type { RoleCode, VaiTro } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Table, Td, Th, Tr } from '@/components/ui/Misc';
import type { PermissionCell, RbacMatrixRow, StaffRoleCode } from '../rbacHelpers';

interface RbacMatrixTabProps {
  matrixRows: RbacMatrixRow[];
  roles: VaiTro[];
  currentRole: RoleCode;
}

const MATRIX_ROLES = STAFF_ROLES as StaffRoleCode[];

function PermissionCellBadge({ cell }: { cell: PermissionCell }) {
  if (cell.access === 'none') {
    return (
      <span className="text-xs text-ink-faint" aria-label="Không truy cập">
        —
      </span>
    );
  }

  const icon =
    cell.access === 'blocked403' ? (
      <Ban size={11} aria-hidden />
    ) : cell.access === 'readonly' ? (
      <Lock size={11} aria-hidden />
    ) : cell.access === 'full' ? (
      <CheckCircle2 size={11} aria-hidden />
    ) : cell.access === 'view' ? (
      <Eye size={11} aria-hidden />
    ) : undefined;

  return (
    <Badge tone={cell.tone} size="sm" icon={icon} title={cell.detail}>
      {cell.label}
    </Badge>
  );
}

/** Tab 01: Ma trận phân quyền 6 vai trò nhân viên & 3 chốt chặn bảo mật trọng yếu (FR-17, FR-19, FR-25). */
export function RbacMatrixTab({ matrixRows, roles, currentRole }: RbacMatrixTabProps) {
  const cashierGuard = verifyRbacPermission('Cashier', 'MODIFY_INVOICE_ITEMS');
  const managerGuard = verifyRbacPermission('Manager', 'VIEW_CASHFLOW');

  return (
    <div className="space-y-6">
      {/* Khối chốt chặn bảo mật cốt lõi: bố cục danh sách chia đường mảnh (không dùng 3 card icon giống nhau) */}
      <Card>
        <CardHeader
          title="3 chốt chặn bảo mật & chống thất thoát trọng yếu"
          subtitle="Kiểm chứng trực tiếp qua hàm verifyRbacPermission() và kiến trúc tách route AppShell / Mobile QR"
          action={
            <Badge tone="success" dot>
              Đang kích hoạt
            </Badge>
          }
        />
        <CardBody className="p-0">
          <ul className="divide-y divide-line">
            <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-st-booked-soft text-st-booked-ink"
                >
                  <Lock size={15} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      FR-17 · Thu ngân POS chế độ Chỉ đọc (Read-Only)
                    </span>
                    <Badge tone="warning" size="sm">
                      HTTP {cashierGuard.statusCode}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Quầy Thu ngân chỉ được xem bill đã chốt, áp dụng trừ cọc / giảm VIP, thu tiền và
                    xuất VAT — khóa cứng mọi thao tác thêm, sửa hoặc xóa món đã gọi.
                  </p>
                </div>
              </div>
              <Badge tone="danger" size="sm" className="self-start">
                Chặn sửa món
              </Badge>
            </li>

            <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary"
                >
                  <ShieldAlert size={15} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      FR-19 · Quản lý sảnh ẩn 100% Doanh thu, Sổ quỹ & Giá vốn kho
                    </span>
                    <Badge tone="danger" size="sm">
                      HTTP {managerGuard.statusCode}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Toàn bộ phân hệ MOD-08 (Sổ quỹ dòng tiền, Doanh thu, Lãi/Lỗ, Nhập kho & Công nợ
                    NCC) chỉ dành độc quyền cho Chủ nhà hàng (Owner).
                  </p>
                </div>
              </div>
              <Badge tone="primary" size="sm" className="self-start">
                Độc quyền Owner
              </Badge>
            </li>

            <li className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-info-soft text-info-ink"
                >
                  <QrCode size={15} />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      FR-25 · Cổng khách hàng Mobile QR khóa cứng theo bàn
                    </span>
                    <Badge tone="info" size="sm">
                      Route /qr/:maBan
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Tách hoàn toàn khỏi khung điều hướng nhân viên (AppShell), ẩn tuyệt đối nút đăng
                    nhập nội bộ và khóa cố định số bàn theo mã QR trên mặt bàn.
                  </p>
                </div>
              </div>
              <Badge tone="info" size="sm" className="self-start">
                Cô lập phiên khách
              </Badge>
            </li>
          </ul>
        </CardBody>
      </Card>

      {/* Ma trận 6 vai trò nhân viên × phân hệ */}
      <Card>
        <CardHeader
          title="Ma trận phân quyền 6 vai trò nhân viên"
          subtitle="Cột có viền nền ấm thể hiện vai trò bạn đang sử dụng trong phiên hiện tại"
          action={
            <Badge tone="gold" icon={<ShieldCheck size={12} aria-hidden />}>
              Đang dùng: {ROLE_META[currentRole].label}
            </Badge>
          }
        />
        <div className="mt-4">
          <Table>
            <thead>
              <tr>
                <Th>Phân hệ & quyền thao tác</Th>
                {MATRIX_ROLES.map((role) => (
                  <Th
                    key={role}
                    className={cn(
                      'text-center',
                      role === currentRole && 'bg-primary-soft/60 text-primary',
                    )}
                  >
                    {ROLE_META[role].short}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <Tr
                  key={row.id}
                  className={cn(row.highlightRule && 'bg-paper-warm/45')}
                >
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="num text-xs font-medium text-ink-muted">
                        {row.moduleCode}
                      </span>
                      {row.highlightRule && (
                        <Badge
                          tone={row.highlightRule === 'FR-19' ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {row.highlightRule}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-ink">{row.capability}</p>
                  </Td>

                  {MATRIX_ROLES.map((role) => (
                    <Td
                      key={role}
                      className={cn(
                        'text-center',
                        role === currentRole && 'bg-primary-soft/25',
                      )}
                    >
                      <PermissionCellBadge cell={row.cells[role]} />
                    </Td>
                  ))}
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Bảng tham chiếu chi tiết tbl_vai_tro */}
      <Card>
        <CardHeader
          title="Danh mục vai trò hệ thống (tbl_vai_tro)"
          subtitle="Mô tả phạm vi nghiệp vụ từng vai trò nội bộ trong cơ sở dữ liệu 3NF"
        />
        <div className="mt-4">
          <Table>
            <thead>
              <tr>
                <Th>Mã vai trò</Th>
                <Th>Vai trò</Th>
                <Th>Phạm vi phân hệ</Th>
                <Th>Mô tả quyền hạn</Th>
              </tr>
            </thead>
            <tbody>
              {roles.map((vt) => {
                const isActive = vt.ten_vai_tro === currentRole;
                return (
                  <Tr key={vt.ma_vai_tro}>
                    <Td>
                      <span className="num text-xs font-medium text-ink-soft">
                        {vt.ma_vai_tro}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Badge tone={vt.ten_vai_tro === 'Owner' ? 'primary' : 'neutral'} size="sm">
                          {ROLE_META[vt.ten_vai_tro].label}
                        </Badge>
                        {isActive && (
                          <Badge tone="success" dot size="sm">
                            Hiện tại
                          </Badge>
                        )}
                      </div>
                    </Td>
                    <Td>
                      <span className="num text-xs font-medium text-ink">
                        {vt.pham_vi_truy_cap}
                      </span>
                    </Td>
                    <Td>
                      <p className="text-xs text-ink-muted">{vt.mo_ta_quyen_han}</p>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
