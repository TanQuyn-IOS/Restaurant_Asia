import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronRight,
  ShieldCheck,
  Receipt,
  ChefHat,
  Users
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';

interface LoginViewProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ isOpen = true, onClose }) => {
  const { login, quickLoginAsGuestCustomer, tables, closeLoginModal } = useRestaurant();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Guest table selector
  const [selectedGuestTable] = useState(tables[1]?.id || 't-102');

  if (!isOpen) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeLoginModal();
    }
  };

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message);
      } else {
        handleClose();
      }
    }, 150);
  };

  const handleGuestContinue = () => {
    quickLoginAsGuestCustomer(selectedGuestTable, 'Thực Khách');
    handleClose();
  };

  const systemRoles = [
    { name: 'Quản Trị / Admin', user: 'admin', icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
    { name: 'Thu Ngân (POS)', user: 'thungan', icon: <Receipt className="w-4 h-4 text-emerald-400" /> },
    { name: 'Bếp Trưởng & Bar', user: 'bep', icon: <ChefHat className="w-4 h-4 text-orange-400" /> },
    { name: 'Nhân Viên Phục Vụ', user: 'phucvu', icon: <Users className="w-4 h-4 text-teal-400" /> }
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full bg-slate-950/90 rounded-3xl border border-slate-800 shadow-2xl relative z-10 my-auto overflow-hidden">
        {/* Top bar with close button & Guest fallback */}
        <div className="px-6 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Đăng Nhập Quản Lý & Nhân Viên Nhà Hàng
            </span>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer border border-slate-700"
          >
            <span>Tiếp tục xem Thực Đơn (Khách)</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          {/* Left Side: Brand Intro & System Info */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <UtensilsCrossed className="w-5 h-5 text-slate-950 font-bold" />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold text-white tracking-tight">
                    Quản Lý Nhà Hàng <span className="text-amber-400">PRO</span>
                  </h1>
                  <p className="text-[11px] text-slate-400">Hệ thống phân quyền & quản trị bàn ăn</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Đăng nhập tài khoản nhân viên hoặc quản lý để vào các trạm làm việc (Thu Ngân, Bếp KDS, Phục Vụ, Nhân Sự, Sơ Đồ Bàn).
              </p>

              {/* Roles badge guide */}
              <div className="mt-4 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Các vai trò hệ thống:
                </span>
                <div className="space-y-1.5">
                  {systemRoles.map((role, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300"
                    >
                      <div className="flex items-center gap-2">
                        {role.icon}
                        <span>{role.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        {role.user}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Instant Order Without Account */}
            <div className="bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white">
                    Chế Độ Khách Hàng (Không Cần TK)
                  </h3>
                  <p className="text-[10px] text-slate-300">
                    Xem toàn bộ thực đơn món, thêm giỏ và đăng ký bàn khi order.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGuestContinue}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xem Thực Đơn Ngay (Không Cần Đăng Nhập)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Side: Main Login Form */}
          <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-2xl flex flex-col justify-center">
            <div className="mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Đăng Nhập Tài Khoản
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhập tên đăng nhập và mật khẩu (mật khẩu: <strong className="text-amber-400">123</strong>)
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 mb-4 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tên đăng nhập (Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin, thungan, bep, phucvu, nhansu..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật khẩu (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu (mặc định: 123)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Đang xác thực...</span>
                  ) : (
                    <>
                      <span>Đăng Nhập Ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Helper Tips */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Mật khẩu mặc định cho tất cả tài khoản:</span>
              </div>
              <p className="pl-5 text-slate-400 font-mono text-[11px]">
                Mật khẩu: <strong className="text-amber-300">123</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
