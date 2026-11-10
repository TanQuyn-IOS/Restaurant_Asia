import React, { useState } from 'react';
import {
  UtensilsCrossed,
  LayoutGrid,
  ChefHat,
  Receipt,
  Users,
  BarChart3,
  RotateCcw,
  Sparkles,
  Flame,
  ShieldCheck,
  Smartphone,
  Bell,
  ChevronDown,
  LogOut,
  KeyRound,
  UserCheck,
  User
} from 'lucide-react';
import { useRestaurant } from '../context/RestaurantContext';
import { AppRole } from '../types';
import { RoleSwitcherModal } from './Common/RoleSwitcherModal';
import { ServiceRequestModal } from './Common/ServiceRequestModal';
import { ConfirmModal } from './Common/ConfirmModal';

export type TabType =
  | 'accounts'
  | 'floor'
  | 'menu'
  | 'pos'
  | 'kitchen'
  | 'waiter'
  | 'staff'
  | 'analytics'
  | 'customer';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenPOSForTable?: (tableId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    tables,
    activeOrders,
    todayRevenue,
    resetToSampleData,
    currentRole,
    setCurrentRole,
    currentUser,
    logout,
    openLoginModal,
    serviceRequests,
    customerTableId
  } = useRestaurant();

  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [showServiceModal, setShowServiceModal] = useState<boolean>(false);
  const [showConfirmResetData, setShowConfirmResetData] = useState<boolean>(false);

  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const cookingItemsCount = activeOrders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'cooking' || i.status === 'pending').length,
    0
  );

  const readyItemsCount = activeOrders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'ready').length,
    0
  );

  const pendingRequests = serviceRequests.filter((r) => r.status !== 'resolved');

  // Role metadata
  const roleConfig: Record<
    AppRole,
    { label: string; shortLabel: string; badgeColor: string; icon: React.ReactNode; defaultTab: TabType }
  > = {
    admin: {
      label: 'Chủ Nhà Hàng / Admin (Quản lý dòng tiền, doanh thu, hàng nhập)',
      shortLabel: 'Chủ / Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
      defaultTab: 'analytics'
    },
    customer: {
      label: 'Khách Hàng (Tại Bàn - Vãng lai / Thường / VIP / Đoàn)',
      shortLabel: 'Khách Hàng',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: <Smartphone className="w-4 h-4 text-amber-400" />,
      defaultTab: 'customer'
    },
    cashier: {
      label: 'Thu Ngân (Thanh toán bảo mật - Không sửa món)',
      shortLabel: 'Thu Ngân',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <Receipt className="w-4 h-4 text-emerald-400" />,
      defaultTab: 'pos'
    },
    kitchen: {
      label: 'Quản Lý Bếp & Bar (KDS)',
      shortLabel: 'Bếp Trưởng',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      icon: <ChefHat className="w-4 h-4 text-orange-400" />,
      defaultTab: 'kitchen'
    },
    waiter: {
      label: 'Nhân Viên Phục Vụ (Đặt bàn • Chọn món • Bill • Dọn bàn)',
      shortLabel: 'Phục Vụ',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      icon: <Users className="w-4 h-4 text-teal-400" />,
      defaultTab: 'waiter'
    },
    hr_manager: {
      label: 'Quản Lý Vận Hành & Nhân Sự (Chỉ điều hành ca & nhân viên)',
      shortLabel: 'Quản Lý (HR)',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: <Users className="w-4 h-4 text-blue-400" />,
      defaultTab: 'staff'
    }
  };

  // All possible navigation items filtered by roles
  const allNavItems: {
    id: TabType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    roles: AppRole[];
  }[] = [
    {
      id: 'analytics',
      label: '💰 Dòng Tiền, Doanh Thu & Hàng Nhập (Chủ)',
      icon: <BarChart3 className="w-4 h-4 text-amber-400" />,
      roles: ['admin'] // Only Owner / Admin can access full cash flow, revenue, and goods receipt
    },
    {
      id: 'accounts',
      label: '🔑 Quản Lý Tài Khoản',
      icon: <KeyRound className="w-4 h-4 text-purple-400" />,
      roles: ['admin']
    },
    {
      id: 'customer',
      label: '📱 Thực Khách Gọi Món Tại Bàn',
      icon: <Smartphone className="w-4 h-4 text-amber-400" />,
      roles: ['admin', 'customer', 'hr_manager', 'waiter']
    },
    {
      id: 'waiter',
      label: '🛎️ Trạm Phục Vụ (Đặt Bàn • Món • Bill • Dọn)',
      icon: <Users className="w-4 h-4 text-teal-400" />,
      badge: readyItemsCount > 0 ? readyItemsCount : undefined,
      roles: ['admin', 'waiter', 'hr_manager']
    },
    {
      id: 'floor',
      label: 'Sơ Đồ Bàn & Khách',
      icon: <LayoutGrid className="w-4 h-4" />,
      badge: occupiedTables > 0 ? occupiedTables : undefined,
      roles: ['admin', 'cashier', 'waiter', 'hr_manager']
    },
    {
      id: 'pos',
      label: 'POS Thu Ngân (Khóa Sửa Món)',
      icon: <Receipt className="w-4 h-4" />,
      roles: ['admin', 'cashier', 'waiter']
    },
    {
      id: 'kitchen',
      label: 'Màn Hình Bếp (KDS)',
      icon: <ChefHat className="w-4 h-4" />,
      badge: cookingItemsCount > 0 ? cookingItemsCount : undefined,
      roles: ['admin', 'kitchen', 'hr_manager']
    },
    {
      id: 'menu',
      label: 'Quản Lý Thực Đơn',
      icon: <UtensilsCrossed className="w-4 h-4" />,
      roles: ['admin', 'kitchen']
    },
    {
      id: 'staff',
      label: '👥 Điều Hành Nhân Sự & Nghỉ Phép',
      icon: <Users className="w-4 h-4" />,
      roles: ['admin', 'hr_manager']
    }
  ];

  // Filter nav items based on current role
  const visibleNavItems = allNavItems.filter((item) => item.roles.includes(currentRole));

  const handleSwitchRole = (role: AppRole) => {
    setCurrentRole(role);
    const targetTab = roleConfig[role].defaultTab;
    setActiveTab(targetTab);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar with Branding & Live User Session */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between py-3 border-b border-slate-800/80 gap-3">
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <UtensilsCrossed className="w-5 h-5 text-slate-950 font-bold" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-white">
                      Quản Lý Nhà Hàng <span className="text-amber-400 font-extrabold text-sm px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/20">PRO</span>
                    </h1>
                  </div>
                  <p className="text-xs text-slate-400">
                    Phân quyền đa tài khoản: Admin • Thu Ngân • Bếp • Phục Vụ • Khách Bàn • HR
                  </p>
                </div>
              </div>

              {/* Service Request Bell Button (For Staff/Admin/Cashier/Waiter) */}
              <button
                onClick={() => setShowServiceModal(true)}
                title="Yêu cầu hỗ trợ từ khách"
                className={`relative p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
                  pendingRequests.length > 0
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Hỗ trợ</span>
                {pendingRequests.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Session Info, Role Switcher & Logout */}
            <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end">
              {/* CURRENT USER BADGE */}
              {currentUser ? (
                <div className="flex items-center gap-2 bg-slate-800/90 pl-1.5 pr-3 py-1 rounded-2xl border border-slate-700/80">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                    alt={currentUser.fullName}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-xl object-cover border border-slate-600"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      @{currentUser.username}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowRoleModal(true)}
                    className={`ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold shadow-sm transition-all hover:scale-[1.02] cursor-pointer ${
                      roleConfig[currentRole]?.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {roleConfig[currentRole]?.icon}
                    <span>{roleConfig[currentRole]?.shortLabel}</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  <button
                    onClick={handleLogout}
                    title="Đăng xuất phiên làm việc"
                    className="ml-1 p-1.5 rounded-xl bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-600/40 hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Đăng Nhập Quản Lý / NV</span>
                </button>
              )}

              {/* Live Metrics for Admin / Cashier / Staff */}
              {currentRole !== 'customer' && (
                <>
                  <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-slate-400">Bàn:</span>
                    <span className="font-semibold text-emerald-400">{occupiedTables}/{tables.length}</span>
                  </div>

                  <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-400">Bếp:</span>
                    <span className="font-semibold text-amber-300">{cookingItemsCount} món</span>
                  </div>

                  {/* Revenue is restricted to Owner (admin) and Cashier - hidden from Manager and Waiter as required */}
                  {currentRole === 'admin' || currentRole === 'cashier' ? (
                    <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300">Doanh thu:</span>
                      <span className="font-bold text-amber-400">{todayRevenue.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ) : currentRole === 'hr_manager' ? (
                    <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 text-xs">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-slate-300">Quản lý:</span>
                      <span className="font-bold text-blue-300">Điều hành nhân sự</span>
                    </div>
                  ) : null}
                </>
              )}

              {/* Sample Data Reset */}
              <button
                onClick={() => setShowConfirmResetData(true)}
                title="Khôi phục lại dữ liệu mẫu của hệ thống"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-700/50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dữ liệu mẫu</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation based on Role */}
          <div className="py-2.5 flex items-center justify-between overflow-x-auto scrollbar-none">
            <nav className="flex items-center space-x-1.5 sm:space-x-2">
              {visibleNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap relative cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold ${
                          isActive
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Admin Quick Switch Helper */}
            {currentRole === 'admin' && (
              <div className="hidden xl:flex items-center gap-1 bg-slate-850 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] text-purple-300 font-bold px-2 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                  Admin xem thử vai trò:
                </span>
                <button
                  onClick={() => handleSwitchRole('admin')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                    activeTab === 'accounts' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('customer');
                    setActiveTab('customer');
                  }}
                  className="px-2 py-0.5 rounded-lg font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Khách Hàng
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('waiter');
                    setActiveTab('waiter');
                  }}
                  className="px-2 py-0.5 rounded-lg font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                >
                  Phục Vụ
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('kitchen');
                    setActiveTab('kitchen');
                  }}
                  className="px-2 py-0.5 rounded-lg font-bold text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
                >
                  Bếp KDS
                </button>
                <button
                  onClick={() => {
                    setCurrentRole('cashier');
                    setActiveTab('pos');
                  }}
                  className="px-2 py-0.5 rounded-lg font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  Thu Ngân
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onRoleSelect={(role) => handleSwitchRole(role)}
      />

      {/* Service Requests Modal */}
      <ServiceRequestModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
      />

      {/* Reset Sample Data Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmResetData}
        title="Khôi phục dữ liệu mẫu"
        message="Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu (tài khoản admin/123, sơ đồ bàn, thực đơn, danh sách nhân viên và hóa đơn mẫu)? Mọi dữ liệu tạm thời sẽ được khôi phục về trạng thái ban đầu."
        confirmText="Khôi Phục Dữ Liệu"
        cancelText="Hủy Bỏ"
        variant="warning"
        onConfirm={resetToSampleData}
        onClose={() => setShowConfirmResetData(false)}
      />
    </>
  );
};
