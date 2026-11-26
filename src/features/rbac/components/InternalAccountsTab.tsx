import { useMemo, useState } from 'react';
import { KeyRound, Lock, LockOpen, Search } from 'lucide-react';
import { formatDateVi } from '@/lib/format';
import { ROLE_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardFooter, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Form';
import { Avatar, EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { MASKED_SECRET } from '../rbacHelpers';
import type { EnrichedAccountRow } from '../useRbacData';

interface InternalAccountsTabProps {
  accounts: EnrichedAccountRow[];
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

/**
 * Tab 02: Danh sách tài khoản nội bộ (tbl_tai_khoan + tbl_nhan_vien + tbl_vai_tro).
 * TUYỆT ĐỐI không nhận và không hiển thị mat_khau_hash — chỉ hiển thị huy hiệu che mật khẩu.
 */
export function InternalAccountsTab({ accounts }: InternalAccountsTabProps) {
  const [query, setQuery] = useState('');
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const authUser = useRestaurantStore((s) => s.authUser);
  const toggleAccountLock = useRestaurantStore((s) => s.toggleAccountLock);
  const isOwner = currentRole === 'Owner';

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return accounts;
    return accounts.filter(({ account, staff, role }) => {
      const haystack = [
        account.ma_tai_khoan,
        account.ten_dang_nhap,
        staff?.ho_ten ?? '',
        staff?.ma_nhan_vien ?? '',
        role ? ROLE_META[role.ten_vai_tro].label : '',
        role?.ten_vai_tro ?? '',
      ]
        .map(normalizeText)
        .join(' ');
      return haystack.includes(q);
    });
  }, [accounts, query]);

  return (
    <Card>
      <CardHeader
        title="Tài khoản đăng nhập nội bộ"
        subtitle="Mật khẩu được mã hóa và ẩn hoàn toàn trên giao diện quản trị"
        action={
          <div className="relative w-full sm:w-72">
            <Search
              size={15}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
            />
            <Input
              type="search"
              aria-label="Tìm tài khoản theo tên đăng nhập, nhân viên hoặc vai trò"
              placeholder="Tìm tài khoản, tên nhân viên..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        }
      />

      <div className="mt-4">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<KeyRound size={22} />}
            title="Không tìm thấy tài khoản phù hợp"
            description="Thử nhập tên đăng nhập hoặc họ tên nhân viên khác."
            action={
              query && (
                <Button size="sm" variant="secondary" onClick={() => setQuery('')}>
                  Xóa từ khóa
                </Button>
              )
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Mã TK</Th>
                <Th>Tên đăng nhập</Th>
                <Th>Nhân viên sở hữu</Th>
                <Th>Vai trò RBAC</Th>
                <Th>Mật khẩu</Th>
                <Th>Ngày kích hoạt</Th>
                <Th>Trạng thái</Th>
                {isOwner && <Th className="text-right">Thao tác</Th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ account, staff, role }) => {
                const roleLabel = role ? ROLE_META[role.ten_vai_tro].label : account.ma_vai_tro;
                const isSelf = authUser?.ma_tai_khoan === account.ma_tai_khoan;
                return (
                  <Tr key={account.ma_tai_khoan}>
                    <Td>
                      <span className="num text-xs font-medium text-ink-muted">
                        {account.ma_tai_khoan}
                      </span>
                    </Td>
                    <Td>
                      <span className="num font-medium text-ink">{account.ten_dang_nhap}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={staff?.ho_ten ?? account.ten_dang_nhap} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {staff?.ho_ten ?? account.ma_nhan_vien}
                          </p>
                          <p className="num text-xs text-ink-muted">
                            {account.ma_nhan_vien}
                            {staff?.so_dien_thoai ? ` · ${staff.so_dien_thoai}` : ''}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col items-start gap-0.5">
                        <Badge
                          tone={role?.ten_vai_tro === 'Owner' ? 'primary' : 'info'}
                          size="sm"
                        >
                          {roleLabel}
                        </Badge>
                        <span className="num text-xs text-ink-muted">{account.ma_vai_tro}</span>
                      </div>
                    </Td>
                    <Td>
                      <Badge
                        tone="neutral"
                        size="sm"
                        icon={<Lock size={11} aria-hidden />}
                        title="Mật khẩu được mã hóa và che giấu"
                      >
                        {MASKED_SECRET}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="num text-xs text-ink-muted">
                        {formatDateVi(account.ngay_kich_hoat)}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={account.trang_thai_khoa ? 'danger' : 'success'} dot size="sm">
                        {account.trang_thai_khoa ? 'Đã khóa' : 'Đang hoạt động'}
                      </Badge>
                    </Td>
                    {isOwner && (
                      <Td className="text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant={account.trang_thai_khoa ? 'gold' : 'secondary'}
                          disabled={isSelf}
                          title={
                            isSelf
                              ? 'Không thể tự khóa tài khoản đang đăng nhập'
                              : account.trang_thai_khoa
                                ? 'Mở khóa tài khoản nhân viên'
                                : 'Khóa tạm thời tài khoản nhân viên'
                          }
                          icon={account.trang_thai_khoa ? <LockOpen size={13} /> : <Lock size={13} />}
                          onClick={() => void toggleAccountLock(account.ma_tai_khoan)}
                        >
                          {account.trang_thai_khoa ? 'Mở khóa' : 'Khóa TK'}
                        </Button>
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </div>

      <CardFooter>
        <span className="text-xs text-ink-muted">
          Hiển thị <span className="num font-medium text-ink">{filtered.length}</span> /{' '}
          <span className="num">{accounts.length}</span> tài khoản nội bộ
        </span>
        <span className="text-xs text-ink-muted">Chuẩn phân quyền RBAC 6 vai trò nhân viên</span>
      </CardFooter>
    </Card>
  );
}
