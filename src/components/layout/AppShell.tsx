import { Suspense, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, X } from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import { IconButton } from '@/components/ui/Button';
import { useOverlayBehavior } from '@/components/ui/Overlay';
import { canAccess, findNavItem } from '@/app/nav.config';
import { ChangePasswordModal } from '@/features/auth/ChangePasswordModal';
import { SidebarContent } from './Sidebar';
import { Topbar } from './Topbar';
import { ModuleTabs } from './ModuleTabs';
import { ToastViewport } from './ToastViewport';
import { AccessRestricted } from './AccessRestricted';

function MobileNav({
  open,
  onClose,
  onChangePassword,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}) {
  const { panelRef, trapTab } = useOverlayBehavior(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade-in bg-ink/50" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu điều hướng"
        tabIndex={-1}
        onKeyDown={trapTab}
        className="relative flex h-full w-72 max-w-[85vw] animate-slide-right flex-col outline-none"
      >
        <div className="min-h-0 flex-1">
          <SidebarContent
            onNavigate={onClose}
            onChangePassword={() => {
              onClose();
              onChangePassword();
            }}
            onLogout={() => {
              onClose();
              onLogout();
            }}
          />
        </div>
        <IconButton
          label="Đóng menu"
          onClick={onClose}
          className="absolute top-4 -right-12 rounded-full bg-paper text-ink hover:bg-sunken"
        >
          <X size={18} />
        </IconButton>
      </div>
    </div>,
    document.body,
  );
}

function PageLoading() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-ink-muted" role="status" aria-label="Đang tải">
      <Loader2 className="animate-spin" size={24} />
    </div>
  );
}

/** Khung ứng dụng nhân viên (được bảo vệ bởi phiên đăng nhập RBAC): Sidebar · Topbar · (Tab vận hành) · Nội dung. */
export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const authUser = useRestaurantStore((s) => s.authUser);
  const role = useRestaurantStore((s) => s.currentRole);
  const accounts = useRestaurantStore((s) => s.snapshot.tbl_tai_khoan);
  const logoutStaff = useRestaurantStore((s) => s.logoutStaff);
  const initRealtimeSync = useRestaurantStore((s) => s.initRealtimeSync);
  const [navOpen, setNavOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);

  useEffect(() => {
    void initRealtimeSync();
  }, [initRealtimeSync]);

  // Nếu tài khoản đang đăng nhập bị Chủ nhà hàng khóa trong phiên realtime → đăng xuất ngay
  useEffect(() => {
    if (!authUser) return;
    const liveAcc = accounts.find((tk) => tk.ma_tai_khoan === authUser.ma_tai_khoan);
    if (liveAcc?.trang_thai_khoa) {
      logoutStaff();
      navigate('/dang-nhap', { replace: true });
    }
  }, [accounts, authUser, logoutStaff, navigate]);

  // đóng drawer khi đổi trang + cuộn lên đầu
  useEffect(() => {
    setNavOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // Chốt chặn đăng nhập cho toàn bộ khu vực nhân viên (FR-26)
  if (!authUser) {
    return <Navigate to="/dang-nhap" state={{ from: pathname }} replace />;
  }

  const handleLogout = () => {
    logoutStaff();
    navigate('/dang-nhap', { replace: true });
  };

  const item = findNavItem(pathname);
  const restricted = item && !canAccess(role, item);

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Bỏ qua điều hướng
      </a>

      <aside className="no-print sticky top-0 hidden h-screen lg:block">
        <SidebarContent onChangePassword={() => setPwdOpen(true)} onLogout={handleLogout} />
      </aside>
      <MobileNav
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onChangePassword={() => setPwdOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-col">
        <Topbar onOpenNav={() => setNavOpen(true)} onLogout={handleLogout} />
        <ModuleTabs />
        <main id="main" tabIndex={-1} className="flex-1 outline-none">
          {restricted ? (
            <AccessRestricted role={role} featureLabel={item.label} allowed={item.roles} />
          ) : (
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          )}
        </main>
        <footer className="no-print flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-4 text-xs text-ink-muted sm:px-8">
          <span className="eyebrow">AC-RMS v2.0 · Xác thực phân quyền RBAC</span>
          <span>© 2026 Atelier d'Asie · Đồ án Phân tích hệ thống thông tin</span>
        </footer>
      </div>

      <ChangePasswordModal open={pwdOpen} onClose={() => setPwdOpen(false)} />
      <ToastViewport />
    </div>
  );
}
