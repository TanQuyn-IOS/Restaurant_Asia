import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  QrCode,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { DEFAULT_DEMO_PASSWORD } from '@/lib/auth';
import { cn } from '@/lib/cn';
import { ROLE_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { RoleCode } from '@/types/database';
import { BrandMark } from '@/components/layout/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';

interface DemoAccountCard {
  username: string;
  role: RoleCode;
  name: string;
  scope: string;
}

const DEMO_ACCOUNTS: DemoAccountCard[] = [
  {
    username: 'owner.quyn',
    role: 'Owner',
    name: 'Nguyễn Tấn Quyn',
    scope: 'Toàn quyền · Độc quyền Sổ quỹ & Kho',
  },
  {
    username: 'manager.thang',
    role: 'Manager',
    name: 'Nguyễn Ngọc Thắng',
    scope: 'Điều hành sảnh · Ẩn 100% Doanh thu',
  },
  {
    username: 'waiter.thien',
    role: 'Waitstaff',
    name: 'Lê Hoàng Thiện',
    scope: 'Mở bàn · Gọi món · Chốt Bill & DELETE',
  },
  {
    username: 'chef.hao',
    role: 'Kitchen',
    name: 'Nguyễn Trọng Anh Hào',
    scope: 'Bếp KDS · Nấu xong nạp Bill + Ting',
  },
  {
    username: 'cashier.anh',
    role: 'Cashier',
    name: 'Giản Trần Phước Anh',
    scope: 'POS Chỉ đọc · Khóa thêm/sửa/xóa món',
  },
  {
    username: 'hr.trang',
    role: 'HR',
    name: 'Đỗ Thu Trang',
    scope: 'Phân ca · Nghỉ phép 3 trạng thái · Lương',
  },
];

/** Trang đăng nhập nội bộ 6 vai trò RBAC (/dang-nhap — FR-26). */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useRestaurantStore((s) => s.authUser);
  const loginStaff = useRestaurantStore((s) => s.loginStaff);
  const lockedAccounts = useRestaurantStore((s) => s.snapshot.tbl_tai_khoan);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (authUser) {
    return <Navigate to={ROLE_META[authUser.role].home} replace />;
  }

  const fromPath = (location.state as { from?: string } | null)?.from;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      const res = await loginStaff(username, password);
      if (!res.ok || !res.user) {
        setErrorMsg(res.error ?? 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
        return;
      }
      const fallbackHome = ROLE_META[res.user.role].home;
      const target = fromPath && fromPath !== '/dang-nhap' ? fromPath : fallbackHome;
      navigate(target, { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (acc: DemoAccountCard) => {
    setUsername(acc.username);
    setPassword(DEFAULT_DEMO_PASSWORD);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-12">
      {/* Cột thương hiệu & nguyên tắc bảo mật RBAC (trái) */}
      <aside className="on-chrome flex flex-col justify-between bg-chrome px-6 py-10 text-chrome-ink sm:px-10 lg:col-span-5 lg:px-12 lg:py-14">
        <div>
          <div className="flex items-center gap-3.5">
            <BrandMark />
            <div>
              <p className="text-base font-bold tracking-[0.14em]">AC-RMS</p>
              <p className="text-xs tracking-[0.14em] text-chrome-muted uppercase">
                Atelier d'Asie · Sài Gòn
              </p>
            </div>
          </div>

          <p className="eyebrow mt-12 text-gold-bright">PHÂN QUYỀN NỘI BỘ · FR-26</p>
          <h1 className="t-hero mt-3 text-white">
            Điều hành chuẩn mực, <span className="text-gold-bright">phân quyền</span> rõ ràng.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-chrome-muted">
            Mỗi tài khoản nhân viên được cấp quyền truy cập đúng theo chức năng phòng ban — khóa chặt
            dữ liệu tài chính, quầy thu ngân chỉ đọc và đồng bộ thời gian thực cùng màn hình bếp KDS.
          </p>

          <dl className="mt-10 space-y-4 border-t border-chrome-line pt-8">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-chrome-raised text-gold-bright"
              >
                <ShieldCheck size={16} />
              </span>
              <div>
                <dt className="text-sm font-medium text-white">Bảo mật tài chính đa tầng (FR-19)</dt>
                <dd className="mt-0.5 text-xs text-chrome-muted">
                  Quản lý sảnh & nhân sự bị ẩn hoàn toàn doanh thu, sổ quỹ dòng tiền và giá vốn nhập kho.
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-md bg-chrome-raised text-gold-bright"
              >
                <Lock size={16} />
              </span>
              <div>
                <dt className="text-sm font-medium text-white">Thu ngân Chỉ đọc chống thất thoát (FR-17)</dt>
                <dd className="mt-0.5 text-xs text-chrome-muted">
                  Hóa đơn chốt tại bàn khóa cứng thao tác thêm/sửa/xóa món ở quầy thanh toán.
                </dd>
              </div>
            </div>
          </dl>
        </div>

        {/* Lối vào riêng mô phỏng khách quét QR (khách KHÔNG cần đăng nhập mật khẩu) */}
        <div className="mt-10 rounded-xl border border-chrome-line bg-chrome-raised p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/20 text-gold-bright"
              >
                <QrCode size={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-white">Khách dùng bữa tại bàn?</p>
                <p className="text-xs text-chrome-muted">
                  Khách chỉ cần quét QR trên bàn — không cần tài khoản hay mật khẩu (FR-25).
                </p>
              </div>
            </div>
            <Link
              to="/qr"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-gold-bright/40 px-3 text-xs font-medium text-gold-bright transition-colors hover:bg-gold-bright/10"
            >
              Mở cổng QR
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </aside>

      {/* Cột biểu mẫu đăng nhập & chọn nhanh tài khoản demo (phải) */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8 lg:col-span-7 lg:py-14">
        <div className="w-full max-w-xl space-y-6">
          <section className="rounded-xl border border-line bg-paper p-6 shadow-card sm:p-8">
            <p className="eyebrow">CỔNG NHÂN VIÊN NỘI BỘ · MOD-10</p>
            <h2 className="t-page mt-2 text-ink">Đăng nhập hệ thống</h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Sử dụng tài khoản nội bộ được cấp trong <code className="num">tbl_tai_khoan</code>.
            </p>

            {errorMsg && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-st-serving/40 bg-st-serving-soft px-4 py-3 text-xs text-st-serving-ink"
              >
                <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <Field label="Tên đăng nhập">
                {({ id }) => (
                  <Input
                    id={id}
                    autoComplete="username"
                    autoFocus
                    placeholder="Ví dụ: owner.quyn, manager.thang..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                )}
              </Field>

              <Field label="Mật khẩu">
                {({ id }) => (
                  <div className="relative">
                    <Input
                      id={id}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-11"
                    />
                    <IconButton
                      label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-1 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </div>
                )}
              </Field>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                loading={submitting}
                icon={<KeyRound size={16} />}
                className="mt-2"
              >
                Đăng nhập vào ca làm việc
              </Button>
            </form>
          </section>

          {/* Bảng điền nhanh 6 vai trò demo (hỗ trợ thuyết trình & kiểm thử phân quyền) */}
          <section className="rounded-xl border border-line bg-paper p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserCheck size={16} aria-hidden className="text-primary" />
                <h3 className="t-card-title text-ink">Tài khoản demo theo 6 vai trò</h3>
              </div>
              <Badge tone="gold" size="sm">
                Mật khẩu mặc định: <span className="num font-bold">{DEFAULT_DEMO_PASSWORD}</span>
              </Badge>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Chọn một tài khoản bên dưới để điền sẵn thông tin, sau đó bấm <strong>Đăng nhập</strong> để
              kiểm chứng quyền hạn thực tế từng vai trò.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const liveAcc = lockedAccounts.find((tk) => tk.ten_dang_nhap === acc.username);
                const isLocked = liveAcc?.trang_thai_khoa ?? false;
                const selected = username.trim().toLowerCase() === acc.username;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className={cn(
                      'flex flex-col items-start rounded-lg border px-3.5 py-2.5 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary-soft/70'
                        : 'border-line bg-paper-warm hover:border-line-strong hover:bg-sunken',
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-xs font-medium text-ink">{ROLE_META[acc.role].label}</span>
                      {isLocked ? (
                        <Badge tone="danger" size="sm">
                          Đang khóa
                        </Badge>
                      ) : (
                        <span className="num text-xs text-primary">{acc.username}</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{acc.scope}</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
