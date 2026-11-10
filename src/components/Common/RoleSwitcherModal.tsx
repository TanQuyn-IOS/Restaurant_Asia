import React from 'react';
import {
  ShieldCheck,
  Smartphone,
  Users,
  ChefHat,
  Receipt,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { AppRole } from '../../types';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleSelect?: (role: AppRole) => void;
}

interface RoleDefinition {
  id: AppRole;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  permissions: string[];
  features: string[];
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  onRoleSelect
}) => {
  const { currentRole, setCurrentRole } = useRestaurant();

  if (!isOpen) return null;

  const roles: RoleDefinition[] = [
    {
      id: 'admin',
      title: 'Chủ Nhà Hàng / Admin',
      subtitle: 'Toàn quyền quản trị & điều hành toàn diện',
      badge: 'Full Access',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: <ShieldCheck className="w-6 h-6 text-purple-400" />,
      permissions: [
        'Toàn quyền sơ đồ bàn & thiết kế mặt bằng',
        'Quản lý thực đơn & định giá vốn / lãi',
        'Toàn quyền POS, thu ngân & thanh toán',
        'Điều hành Màn hình Bếp & Bar KDS',
        'Quản lý nhân sự, phân ca & bảng lương',
        'Báo cáo phân tích doanh thu & lợi nhuận'
      ],
      features: ['Sơ đồ bàn', 'POS Thu ngân', 'Bếp KDS', 'Menu', 'Nhân viên', 'Báo cáo']
    },
    {
      id: 'customer',
      title: 'Khách Hàng / Thực Khách Tại Bàn',
      subtitle: 'Giao diện gọi món & phục vụ tự động tại bàn (Self-service)',
      badge: 'Customer View',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: <Smartphone className="w-6 h-6 text-amber-400" />,
      permissions: [
        'Xem thực đơn hình ảnh & gọi món trực tiếp vào bếp',
        'Theo dõi tiến độ chế biến món ăn thời gian thực (Live Tracker)',
        'Xem hóa đơn tạm tính & mã QR thanh toán nhanh VietQR',
        '1-Chạm gọi nhân viên hỗ trợ (nước đá, khăn, chén dĩa, tính tiền)'
      ],
      features: ['Gọi món online', 'Theo dõi bếp', 'Xem hóa đơn', 'Gọi nhân viên']
    },
    {
      id: 'cashier',
      title: 'Thu Ngân (Cashier)',
      subtitle: 'Phân hệ POS, xử lý đơn hàng, thanh toán & in hóa đơn',
      badge: 'Cashier & POS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: <Receipt className="w-6 h-6 text-emerald-400" />,
      permissions: [
        'Xem sơ đồ bàn đón khách & kiểm tra trạng thái bàn',
        'POS Tạo đơn, thêm món, gộp bàn & chuyển bàn',
        'Áp dụng mã giảm giá, khuyến mãi, tính thuế VAT',
        'Thanh toán tiền mặt, quẹt thẻ, chuyển khoản VietQR',
        'In phiếu tạm tính & In hóa đơn thanh toán',
        'Nhận và xử lý yêu cầu gọi tính tiền từ khách hàng'
      ],
      features: ['Sơ đồ bàn', 'POS Gọi món', 'Thanh toán & In bill', 'Hỗ trợ khách']
    },
    {
      id: 'waiter',
      title: 'Nhân Viên Phục Vụ (Waiter)',
      subtitle: 'Sơ đồ bàn, gọi món tại bàn, nhận yêu cầu chuông & bưng món',
      badge: 'Waiter Service',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: <Users className="w-6 h-6 text-teal-400" />,
      permissions: [
        'Xem trực quan trạng thái bàn trống, bàn đang dùng, bàn cần dọn',
        'Tạo đơn order nhanh cho khách tại bàn, thêm món vào bếp',
        'Nhận chuông gọi hỗ trợ từ khách (xin đá, dĩa, hỗ trợ gọi món)',
        'Trạm nhận món nấu xong từ bếp và xác nhận đã bưng ra bàn'
      ],
      features: ['Sơ đồ bàn', 'Gọi món tại bàn', 'Chuông phục vụ', 'Trạm bưng món']
    },
    {
      id: 'kitchen',
      title: 'Quản Lý Bếp & Bar (Kitchen KDS)',
      subtitle: 'Màn hình Bếp KDS & điều phối chuẩn bị món ăn',
      badge: 'Kitchen KDS',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      icon: <ChefHat className="w-6 h-6 text-orange-400" />,
      permissions: [
        'Màn hình Kitchen Display System (KDS) hiển thị đơn theo thời gian thực',
        'Chuyển trạng thái chế biến: Đang chờ ➔ Đang nấu ➔ Hoàn thành',
        'Quản lý kho & Bật/Tắt món còn hàng hoặc tạm hết nguyên liệu',
        'Theo dõi thời gian nấu và cảnh báo trễ món'
      ],
      features: ['Màn hình Bếp KDS', 'Kho & Trạng thái món']
    },
    {
      id: 'hr_manager',
      title: 'Quản Lý Nhân Sự (HR Manager)',
      subtitle: 'Quản lý hồ sơ nhân viên, lịch phân ca & tính lương',
      badge: 'Human Resources',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: <Users className="w-6 h-6 text-blue-400" />,
      permissions: [
        'Hồ sơ nhân viên, thông tin liên hệ, chức vụ & mức lương',
        'Lịch phân ca làm việc trong tuần (Ca sáng, chiều, tối)',
        'Chấm công điểm danh & tính bảng lương tự động',
        'Thống kê số lượng đơn và hiệu suất làm việc nhân viên'
      ],
      features: ['Hồ sơ nhân sự', 'Phân ca làm việc', 'Bảng tính lương']
    }
  ];

  const handleSelectRole = (roleId: AppRole) => {
    setCurrentRole(roleId);
    if (onRoleSelect) {
      onRoleSelect(roleId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Phân Quyền & Chuyển Đổi Vai Trò (RBAC)
              </h2>
              <p className="text-xs text-slate-400">
                Chọn vai trò để trải nghiệm đúng quyền hạn và giao diện chuyên biệt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Roles List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
          {roles.map((role) => {
            const isCurrent = currentRole === role.id;

            return (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isCurrent
                    ? 'bg-slate-800/90 border-amber-500 ring-2 ring-amber-500/20 shadow-lg'
                    : 'bg-slate-850/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700/80">
                      {role.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                          {role.title}
                        </h3>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${role.badgeColor}`}>
                          {role.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {role.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                        <Check className="w-3.5 h-3.5" /> Đang sử dụng
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-bold text-slate-300 group-hover:text-white bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 px-3 py-1.5 rounded-xl transition-all"
                      >
                        <span>Chuyển vai trò</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Permissions Bullet Points */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                  {role.permissions.map((p, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                      <span className="text-[11px] leading-tight text-slate-300">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>💡 Bạn có thể đổi vai trò bất cứ lúc nào từ thanh Menu đầu trang.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
