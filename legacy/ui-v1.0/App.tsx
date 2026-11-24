import React, { useEffect } from 'react';
import {
  LayoutGrid,
  Users,
  UtensilsCrossed,
  ChefHat,
  CreditCard,
  CalendarClock,
  Wallet,
  QrCode,
  ShieldCheck,
  BellRing,
  Lock,
  LogOut,
  UserCog,
} from 'lucide-react';
import {
  useRestaurantStore,
  ActiveModuleTab,
} from './store/useRestaurantStore';
import { RoleCode } from './types/database';
import { TableMapView } from './features/tables/TableMapView';
import { CustomerManagerView } from './features/customers/CustomerManagerView';
import { MenuManagerView } from './features/menu/MenuManagerView';
import { KitchenKdsView } from './features/kds/KitchenKdsView';
import { CashierPosView } from './features/cashier/CashierPosView';
import { HrManagementView } from './features/hr/HrManagementView';
import { OwnerCashflowView } from './features/owner/OwnerCashflowView';
import { MobileQrPortalView } from './features/qr-portal/MobileQrPortalView';
import { RbacManagerView } from './features/rbac/RbacManagerView';

const ROLES: { code: RoleCode; label: string; desc: string }[] = [
  { code: 'Owner', label: 'Chủ Nhà Hàng (Owner)', desc: 'Toàn quyền • Độc quyền Sổ quỹ & Kho' },
  { code: 'Manager', label: 'Quản Lý Sảnh (Manager)', desc: 'Điều hành sảnh • Đã ẩn 100% Doanh thu' },
  { code: 'Waitstaff', label: 'Phục Vụ (Waitstaff)', desc: 'Mở bàn, Gọi món, Chốt Bill & DELETE' },
  { code: 'Kitchen', label: 'Bếp Trưởng KDS (Kitchen)', desc: 'Nấu xong → Nạp Bill & Chuông Ting' },
  { code: 'Cashier', label: 'Thu Ngân POS (Read-Only)', desc: 'Khóa cứng thêm/sửa/xóa món' },
  { code: 'HR', label: 'Nhân Sự (HR)', desc: 'Phân ca & Nghỉ phép Đã–Đang–Sắp' },
  { code: 'GuestQR', label: 'Khách Quét QR (Mobile)', desc: 'Khóa số bàn & Ẩn nút Login NV' },
];

export const App: React.FC = () => {
  const {
    snapshot,
    currentRole,
    activeTab,
    selectedTableId,
    qrLockedTableId,
    tingNotifications,
    lastBannerAlert,
    backendEngineLabel,
    setRole,
    setActiveTab,
    enterIsolatedQrMode,
    exitIsolatedQrMode,
    clearAlert,
    dismissTingNotification,
    initRealtimeSync,
  } = useRestaurantStore();

  useEffect(() => {
    initRealtimeSync();
  }, [initRealtimeSync]);

  // FR-25 & MOD-09: Khi thực khách quét mã QR tại bàn, cô lập hoàn toàn giao diện Mobile QR
  if (currentRole === 'GuestQR' && qrLockedTableId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <div className="ac-topbar">
          <div className="ac-brand">
            <div className="ac-brand-mark">QR</div>
            <div>
              <div className="ac-brand-title">Mô Phỏng Điện Thoại Thực Khách Quét QR ({qrLockedTableId})</div>
              <div className="ac-brand-sub">Giao diện bên dưới đã khóa cứng số bàn và ẩn 100% nút đăng nhập nội bộ</div>
            </div>
          </div>
          <button
            className="ac-btn ac-btn-outline ac-btn-sm"
            onClick={exitIsolatedQrMode}
          >
            <LogOut size={13} /> Quay lại Màn hình Nhân viên
          </button>
        </div>

        {lastBannerAlert && (
          <div
            style={{
              maxWidth: 440,
              margin: '12px auto 0',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background:
                lastBannerAlert.type === 'error'
                  ? 'var(--primary)'
                  : 'var(--table-empty)',
              color: 'var(--text-inverse)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span className="t-small" style={{ color: 'var(--text-inverse)' }}>
              {lastBannerAlert.text}
            </span>
            <button onClick={clearAlert} style={{ color: 'var(--text-inverse)', fontWeight: 700 }}>
              ✕
            </button>
          </div>
        )}

        <MobileQrPortalView />
      </div>
    );
  }

  const unreadTings = tingNotifications.filter((n) => !n.da_doc);
  const countEmpty = snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'Trong').length;
  const countBooked = snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'DaDat').length;
  const countServing = snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'DangPhucVu').length;
  const countBilling = snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'ChoThanhToan').length;

  const navGroups: {
    groupTitle: string;
    items: {
      id: ActiveModuleTab;
      label: string;
      badge?: string | number;
      icon: React.ReactNode;
      ownerOnly?: boolean;
    }[];
  }[] = [
    {
      groupTitle: 'Tuyến Đầu (POS / KDS / QR)',
      items: [
        {
          id: 'MOD-01-TABLES',
          label: 'Sơ Đồ Bàn & Gọi Món',
          badge: `${countServing}/${snapshot.tbl_ban.length}`,
          icon: <LayoutGrid size={16} />,
        },
        {
          id: 'MOD-05-KDS',
          label: 'Màn Hình Bếp KDS',
          badge: snapshot.tbl_chi_tiet_don_goi.filter(
            (i) => i.trang_thai_mon === 'ChoCheBien' || i.trang_thai_mon === 'DangCheBien',
          ).length,
          icon: <ChefHat size={16} />,
        },
        {
          id: 'MOD-06-CASHIER',
          label: 'Thu Ngân Read-Only',
          badge: countBilling,
          icon: <CreditCard size={16} />,
        },
        {
          id: 'MOD-09-QR',
          label: 'Cổng Mobile QR Bàn',
          icon: <QrCode size={16} />,
        },
      ],
    },
    {
      groupTitle: 'Vận Hành Sảnh & Nhân Sự',
      items: [
        {
          id: 'MOD-03-MENU',
          label: 'Thực Đơn Châu Á & BOM',
          badge: snapshot.tbl_mon_an.length,
          icon: <UtensilsCrossed size={16} />,
        },
        {
          id: 'MOD-02-CUSTOMERS',
          label: '4 Nhóm Khách & VAT',
          icon: <Users size={16} />,
        },
        {
          id: 'MOD-07-HR',
          label: 'Ca Kíp & Nghỉ Phép',
          icon: <CalendarClock size={16} />,
        },
      ],
    },
    {
      groupTitle: 'Tài Chính Chủ & Hệ Thống',
      items: [
        {
          id: 'MOD-08-OWNER',
          label: 'Sổ Quỹ & Kho (Chủ)',
          icon: <Wallet size={16} />,
          ownerOnly: true,
        },
        {
          id: 'MOD-10-RBAC',
          label: 'RBAC & 27 Bảng 3NF',
          badge: '27',
          icon: <ShieldCheck size={16} />,
        },
      ],
    },
  ];

  return (
    <div className="ac-app-shell">
      {/* Top Command Bar (Toast / Square POS Standard) */}
      <header className="ac-topbar">
        <div className="ac-brand">
          <div className="ac-brand-mark">AC</div>
          <div>
            <div className="ac-brand-title">AC-RMS • Asian Culinary POS & KDS</div>
            <div className="ac-brand-sub">{backendEngineLabel} • Realtime Sync</div>
          </div>
        </div>

        {/* Bộ đếm nhanh 4 trạng thái bàn trực tiếp trên thanh Topbar */}
        <div className="ac-topbar-center">
          <span className="ac-status-chip">
            <span className="ac-dot ac-dot-green" /> Trống: <strong>{countEmpty}</strong>
          </span>
          <span className="ac-status-chip">
            <span className="ac-dot ac-dot-yellow" /> Đã đặt: <strong>{countBooked}</strong>
          </span>
          <span className="ac-status-chip">
            <span className="ac-dot ac-dot-red" /> Đang phục vụ: <strong>{countServing}</strong>
          </span>
          <span className="ac-status-chip">
            <span className="ac-dot ac-dot-orange" /> Chờ TT: <strong>{countBilling}</strong>
          </span>
        </div>

        {/* Chuyển nhanh 7 Vai trò RBAC gọn gàng & Mở nhanh Cổng QR */}
        <div className="ac-topbar-right">
          <button
            className="ac-btn ac-btn-gold ac-btn-sm"
            onClick={() => enterIsolatedQrMode(selectedTableId)}
            title="Mở giao diện Điện thoại Khách hàng quét QR tại bàn đang chọn"
          >
            <QrCode size={14} /> Quét QR ({selectedTableId})
          </button>

          <div className="ac-role-select-wrap">
            <UserCog size={14} color="var(--accent)" />
            <select
              className="ac-role-select"
              value={currentRole}
              onChange={(e) => setRole(e.target.value as RoleCode)}
              aria-label="Chuyển đổi vai trò RBAC"
            >
              {ROLES.map((r) => (
                <option key={r.code} value={r.code}>
                  Vai trò: {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Thanh thông báo Chuông Ting từ Bếp KDS & Phản hồi thao tác */}
      {(lastBannerAlert || unreadTings.length > 0) && (
        <div
          style={{
            background:
              lastBannerAlert?.type === 'error'
                ? 'var(--primary)'
                : lastBannerAlert?.type === 'warning'
                  ? 'var(--table-booked)'
                  : 'var(--table-empty)',
            color: 'var(--text-inverse)',
            padding: '8px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <BellRing size={16} />
            {lastBannerAlert && (
              <strong className="t-small" style={{ color: 'var(--text-inverse)' }}>
                {lastBannerAlert.text}
              </strong>
            )}
            {unreadTings.map((t) => (
              <span key={t.id} className="ac-badge ac-badge-vip">
                🔔 TING ({t.thoi_gian}): "{t.ten_mon_an}" đã xong cho {t.ten_ban}
                <button
                  onClick={() => dismissTingNotification(t.id)}
                  style={{ marginLeft: 6, fontWeight: 700 }}
                >
                  ✓ Đã bưng
                </button>
              </span>
            ))}
          </div>
          {lastBannerAlert && (
            <button
              onClick={clearAlert}
              className="ac-btn ac-btn-outline ac-btn-sm"
            >
              Đóng
            </button>
          )}
        </div>
      )}

      {/* Bố cục chính: Sidebar phân tầng 3 nhóm + Workspace */}
      <div className="ac-main-layout">
        <aside className="ac-sidebar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="ac-nav-group">
                <div className="ac-nav-group-label">{group.groupTitle}</div>
                {group.items.map((item) => {
                  const isLocked = item.ownerOnly && currentRole !== 'Owner';
                  return (
                    <button
                      key={item.id}
                      className={`ac-nav-btn ${activeTab === item.id ? 'active' : ''} ${
                        isLocked ? 'locked' : ''
                      }`}
                      onClick={() => setActiveTab(item.id)}
                    >
                      <span className="ac-nav-btn-left">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {isLocked ? (
                        <Lock size={13} color="var(--primary)" />
                      ) : item.badge !== undefined ? (
                        <span
                          className={`ac-badge ${
                            activeTab === item.id ? 'ac-badge-vip' : 'ac-badge-neutral'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div
            style={{
              padding: 'var(--sp-3)',
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div className="t-caption">Quyền hạn đang kích hoạt</div>
            <div className="t-h3" style={{ color: 'var(--primary)', marginTop: 2 }}>
              {ROLES.find((r) => r.code === currentRole)?.label}
            </div>
            <div className="t-caption" style={{ marginTop: 2 }}>
              {ROLES.find((r) => r.code === currentRole)?.desc}
            </div>
          </div>
        </aside>

        <main className="ac-workspace">
          {activeTab === 'MOD-01-TABLES' && <TableMapView />}
          {activeTab === 'MOD-02-CUSTOMERS' && <CustomerManagerView />}
          {activeTab === 'MOD-03-MENU' && <MenuManagerView />}
          {activeTab === 'MOD-05-KDS' && <KitchenKdsView />}
          {activeTab === 'MOD-06-CASHIER' && <CashierPosView />}
          {activeTab === 'MOD-07-HR' && <HrManagementView />}
          {activeTab === 'MOD-08-OWNER' && <OwnerCashflowView />}
          {activeTab === 'MOD-09-QR' && <MobileQrPortalView />}
          {activeTab === 'MOD-10-RBAC' && <RbacManagerView />}
        </main>
      </div>
    </div>
  );
};
