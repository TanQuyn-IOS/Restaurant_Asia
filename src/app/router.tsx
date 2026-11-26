import { Suspense, lazy, type ComponentType } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';

/** Nạp trang theo route (code-splitting) từ module có export có tên. */
function page<M extends Record<string, unknown>, K extends keyof M>(
  loader: () => Promise<M>,
  name: K,
) {
  return lazy(async () => ({ default: (await loader())[name] as ComponentType }));
}

const OverviewPage = page(() => import('@/features/overview/OverviewPage'), 'OverviewPage');
const LoginPage = page(() => import('@/features/auth/LoginPage'), 'LoginPage');
const FloorPage = page(() => import('@/features/floor/FloorPage'), 'FloorPage');
const KitchenPage = page(() => import('@/features/kds/KitchenPage'), 'KitchenPage');
const CashierPage = page(() => import('@/features/cashier/CashierPage'), 'CashierPage');
const ShiftSchedulePage = page(() => import('@/features/hr/ShiftSchedulePage'), 'ShiftSchedulePage');
const LeavePage = page(() => import('@/features/hr/LeavePage'), 'LeavePage');
const PayrollPage = page(() => import('@/features/hr/PayrollPage'), 'PayrollPage');
const CashflowPage = page(() => import('@/features/finance/CashflowPage'), 'CashflowPage');
const RevenuePage = page(() => import('@/features/finance/RevenuePage'), 'RevenuePage');
const InventoryPage = page(() => import('@/features/finance/InventoryPage'), 'InventoryPage');
const MenuPage = page(() => import('@/features/menu/MenuPage'), 'MenuPage');
const CustomersPage = page(() => import('@/features/customers/CustomersPage'), 'CustomersPage');
const RbacPage = page(() => import('@/features/rbac/RbacPage'), 'RbacPage');
const QrEntryPage = page(() => import('@/features/qr/QrEntryPage'), 'QrEntryPage');
const QrPortalPage = page(() => import('@/features/qr/QrPortalPage'), 'QrPortalPage');

function FullPageLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas text-ink-muted" role="status" aria-label="Đang tải">
      <Loader2 className="animate-spin" size={28} />
    </div>
  );
}

function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <h1 className="t-page text-ink">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-ink-muted">Đường dẫn không tồn tại hoặc đã thay đổi.</p>
        <a href="/" className="mt-5 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline">
          Về trang chủ
        </a>
      </div>
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<FullPageLoading />}>
        <Routes>
          {/* Cổng khách quét QR: TÁCH RIÊNG, không dùng khung nhân viên (không sidebar, không đăng nhập) */}
          <Route path="/qr" element={<QrEntryPage />} />
          <Route path="/qr/:maBan" element={<QrPortalPage />} />

          {/* Đăng nhập nội bộ 6 vai trò nhân viên (FR-26) */}
          <Route path="/dang-nhap" element={<LoginPage />} />

          {/* Khung nhân viên (bảo vệ bằng route guard trong AppShell) */}
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/tong-quan" replace />} />
            <Route path="/tong-quan" element={<OverviewPage />} />

            <Route path="/so-do-ban" element={<FloorPage />} />
            <Route path="/bep" element={<KitchenPage />} />
            <Route path="/thu-ngan" element={<CashierPage />} />

            <Route path="/nhan-su" element={<Navigate to="/nhan-su/ca-lam" replace />} />
            <Route path="/nhan-su/ca-lam" element={<ShiftSchedulePage />} />
            <Route path="/nhan-su/nghi-phep" element={<LeavePage />} />
            <Route path="/nhan-su/bang-luong" element={<PayrollPage />} />

            <Route path="/tai-chinh" element={<Navigate to="/tai-chinh/so-quy" replace />} />
            <Route path="/tai-chinh/so-quy" element={<CashflowPage />} />
            <Route path="/tai-chinh/doanh-thu" element={<RevenuePage />} />
            <Route path="/tai-chinh/kho" element={<InventoryPage />} />

            <Route path="/thuc-don" element={<MenuPage />} />
            <Route path="/khach-hang" element={<CustomersPage />} />
            <Route path="/phan-quyen" element={<RbacPage />} />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
