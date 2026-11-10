import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  LogIn,
  CheckCircle2,
  Smartphone,
  Receipt,
  ChefHat,
  Eye,
  EyeOff,
  User,
  Phone,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { AppRole, UserAccount } from '../../types';
import { ConfirmModal } from '../Common/ConfirmModal';

export const AccountManagementView: React.FC = () => {
  const {
    accounts,
    currentUser,
    createAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,
    resetAccountPassword,
    switchAccount,
    tables
  } = useRestaurant();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [resettingPasswordAccount, setResettingPasswordAccount] = useState<UserAccount | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<UserAccount | null>(null);

  // Form states for Add Account
  const [formData, setFormData] = useState({
    username: '',
    password: '123',
    fullName: '',
    role: 'cashier' as AppRole,
    phone: '',
    assignedTableId: '',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('123');
  const [formError, setFormError] = useState('');

  // Role details config
  const roleInfo: Record<
    AppRole,
    { label: string; badgeColor: string; icon: React.ReactNode; desc: string }
  > = {
    admin: {
      label: 'Admin / Quản Trị',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: <ShieldCheck className="w-4 h-4 text-purple-400" />,
      desc: 'Toàn quyền điều hành, phân quyền, cấu hình sơ đồ bàn & tài chính'
    },
    customer: {
      label: 'Thực Khách / Khách Bàn',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: <Smartphone className="w-4 h-4 text-amber-400" />,
      desc: 'Gọi món tại bàn, theo dõi chế biến, xem hóa đơn & gọi chuông hỗ trợ'
    },
    cashier: {
      label: 'Thu Ngân (Cashier)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: <Receipt className="w-4 h-4 text-emerald-400" />,
      desc: 'Tạo đơn POS, in tạm tính, chiết khấu hóa đơn & thanh toán đa phương thức'
    },
    kitchen: {
      label: 'Bếp Trưởng / Bếp Bar (KDS)',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      icon: <ChefHat className="w-4 h-4 text-orange-400" />,
      desc: 'Nhận order KDS, đổi trạng thái nấu ăn, bật/tắt món hết nguyên liệu'
    },
    waiter: {
      label: 'Nhân Viên Phục Vụ (Waiter)',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: <Users className="w-4 h-4 text-teal-400" />,
      desc: 'Sơ đồ bàn, gọi món tại bàn, nhận chuông hỗ trợ khách & trạm bưng món'
    },
    hr_manager: {
      label: 'Quản Lý Nhân Sự (HR)',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: <Users className="w-4 h-4 text-blue-400" />,
      desc: 'Hồ sơ nhân viên, phân ca làm việc, chấm công & bảng lương'
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.phone && acc.phone.includes(searchQuery));
    const matchesRole = selectedRoleFilter === 'all' || acc.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.username.trim()) {
      setFormError('Vui lòng nhập tên đăng nhập!');
      return;
    }

    if (!formData.password) {
      setFormError('Vui lòng nhập mật khẩu!');
      return;
    }

    if (!formData.fullName.trim()) {
      setFormError('Vui lòng nhập họ và tên người dùng!');
      return;
    }

    const res = createAccount({
      username: formData.username.trim(),
      password: formData.password,
      fullName: formData.fullName.trim(),
      role: formData.role,
      phone: formData.phone.trim() || undefined,
      assignedTableId: formData.role === 'customer' ? formData.assignedTableId || undefined : undefined,
      avatar: formData.avatar,
      isActive: formData.isActive
    });

    if (res.success) {
      setIsAddModalOpen(false);
      setFormData({
        username: '',
        password: '',
        fullName: '',
        role: 'cashier',
        phone: '',
        assignedTableId: '',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        isActive: true
      });
    } else {
      setFormError(res.message);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    const res = updateAccount(editingAccount.id, {
      fullName: editingAccount.fullName,
      role: editingAccount.role,
      phone: editingAccount.phone,
      assignedTableId: editingAccount.role === 'customer' ? editingAccount.assignedTableId : undefined,
      isActive: editingAccount.isActive
    });

    if (res.success) {
      setEditingAccount(null);
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordAccount || !newPasswordInput.trim()) return;

    resetAccountPassword(resettingPasswordAccount.id, newPasswordInput.trim());
    setResettingPasswordAccount(null);
    setNewPasswordInput('');
  };

  // Avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-20 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trung Tâm Phân Quyền & Bảo Mật RBAC</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Quản Lý Tài Khoản & Phân Vai Trò Hệ Thống
              </h1>
              <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">
                Quản trị viên có toàn quyền tạo tài khoản nhân viên, cấp vai trò chuyên biệt (Thu ngân, Bếp KDS, Phục vụ, Khách hàng, Nhân sự) và quản lý phiên đăng nhập độc lập.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <UserPlus className="w-5 h-5" />
                <span>Thêm Tài Khoản Mới</span>
              </button>
            </div>
          </div>

          {/* Quick Role Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            {(Object.keys(roleInfo) as AppRole[]).map((r) => {
              const count = accounts.filter((a) => a.role === r).length;
              const isSelected = selectedRoleFilter === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRoleFilter(isSelected ? 'all' : r)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="p-1.5 rounded-xl bg-slate-800 border border-slate-700">
                      {roleInfo[r].icon}
                    </span>
                    <span className="text-lg font-extrabold text-white">{count}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-300 mt-2 truncate">
                    {roleInfo[r].label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên đăng nhập, họ tên, số điện thoại..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedRoleFilter === 'all'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({accounts.length})
            </button>
            {(Object.keys(roleInfo) as AppRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRoleFilter(r)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedRoleFilter === r
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {roleInfo[r].label}
              </button>
            ))}
          </div>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const isCurrent = currentUser?.id === acc.id;
            const targetTable = acc.assignedTableId ? tables.find((t) => t.id === acc.assignedTableId) : null;

            return (
              <div
                key={acc.id}
                className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                  isCurrent
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Current Active Badge */}
                {isCurrent && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-extrabold text-[10px] px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>ĐANG ĐĂNG NHẬP</span>
                  </div>
                )}

                <div>
                  {/* Avatar & User info */}
                  <div className="flex items-start gap-3.5">
                    <img
                      src={acc.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                      alt={acc.fullName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700 bg-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white truncate">{acc.fullName}</h3>
                        {!acc.isActive && (
                          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            Khóa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>@{acc.username}</span>
                      </p>
                    </div>
                  </div>

                  {/* Role Badge & Description */}
                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                        roleInfo[acc.role]?.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {roleInfo[acc.role]?.icon}
                      <span>{roleInfo[acc.role]?.label}</span>
                    </span>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {roleInfo[acc.role]?.desc}
                    </p>
                  </div>

                  {/* Metadata: Phone, Table, Last Login */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                    {acc.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>SĐT: <strong className="text-slate-300 font-normal">{acc.phone}</strong></span>
                      </div>
                    )}
                    {acc.assignedTableId && (
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>Bàn chỉ định: <strong className="text-amber-300">{targetTable?.name || acc.assignedTableId}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Đăng nhập lần cuối:{' '}
                        <span className="text-slate-300">
                          {acc.lastLogin ? new Date(acc.lastLogin).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Chưa đăng nhập'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Quick Switch / Test Login */}
                    {!isCurrent && (
                      <button
                        onClick={() => switchAccount(acc)}
                        title="Đăng nhập thử tài khoản này"
                        className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Chuyển sang</span>
                      </button>
                    )}

                    {/* Change Password */}
                    <button
                      onClick={() => {
                        setResettingPasswordAccount(acc);
                        setNewPasswordInput('');
                      }}
                      title="Đặt lại mật khẩu"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {/* Lock / Unlock */}
                    {acc.username !== 'admin' && (
                      <button
                        onClick={() => toggleAccountStatus(acc.id)}
                        title={acc.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        className={`p-2 rounded-xl text-xs border transition-all cursor-pointer ${
                          acc.isActive
                            ? 'bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border-slate-700 hover:border-rose-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-emerald-500/20 hover:text-emerald-300'
                        }`}
                      >
                        {acc.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Edit Account */}
                    <button
                      onClick={() => setEditingAccount(acc)}
                      title="Chỉnh sửa thông tin"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-all cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Account */}
                    {acc.username !== 'admin' && !isCurrent && (
                      <button
                        onClick={() => setAccountToDelete(acc)}
                        title="Xóa tài khoản"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs border border-slate-700 hover:border-rose-500/30 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create Account Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Thêm Tài Khoản Mới</h2>
                    <p className="text-xs text-slate-400">Tạo tài khoản và gán phân quyền vai trò chuyên biệt</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
                {formError && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="ví dụ: phucvu1, thungan2, beptruong"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Mật khẩu khởi tạo *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mật khẩu đăng nhập (ví dụ: 123)"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Họ và Tên đầy đủ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="ví dụ: Lê Văn Phục Vụ"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Phân quyền Vai trò (Role) *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="admin">Chủ / Admin Tổng (Toàn quyền)</option>
                      <option value="cashier">Thu Ngân (POS & Hóa đơn)</option>
                      <option value="kitchen">Bếp & Bar (KDS Chế biến)</option>
                      <option value="waiter">Nhân Viên Phục Vụ (Waiter)</option>
                      <option value="customer">Khách Hàng (Tự gọi món tại bàn)</option>
                      <option value="hr_manager">Quản Lý Nhân Sự (HR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Số điện thoại liên hệ
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="09xx xxx xxx"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {formData.role === 'customer' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1.5">
                      Bàn chỉ định cho khách (Tùy chọn)
                    </label>
                    <select
                      value={formData.assignedTableId}
                      onChange={(e) => setFormData({ ...formData, assignedTableId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-amber-500/40 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Khách tự chọn bàn khi vào --</option>
                      {tables.map((tbl) => (
                        <option key={tbl.id} value={tbl.id}>
                          {tbl.name} ({tbl.capacity} người)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Avatar Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Chọn Ảnh đại diện
                  </label>
                  <div className="flex items-center gap-2">
                    {avatarPresets.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, avatar: url })}
                        className={`w-10 h-10 rounded-2xl overflow-hidden border-2 transition-all ${
                          formData.avatar === url ? 'border-amber-500 scale-105 shadow-md shadow-amber-500/20' : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Xác Nhận Tạo Tài Khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {editingAccount && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 flex flex-col">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Chỉnh Sửa Tài Khoản: @{editingAccount.username}</h2>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Họ và Tên</label>
                  <input
                    type="text"
                    required
                    value={editingAccount.fullName}
                    onChange={(e) => setEditingAccount({ ...editingAccount, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Vai trò</label>
                    <select
                      value={editingAccount.role}
                      onChange={(e) => setEditingAccount({ ...editingAccount, role: e.target.value as AppRole })}
                      disabled={editingAccount.username === 'admin'}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      <option value="admin">Chủ / Admin Tổng</option>
                      <option value="cashier">Thu Ngân</option>
                      <option value="kitchen">Bếp & Bar</option>
                      <option value="waiter">Nhân Viên Phục Vụ</option>
                      <option value="customer">Khách Hàng</option>
                      <option value="hr_manager">Quản Lý Nhân Sự</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      value={editingAccount.phone || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {editingAccount.role === 'customer' && (
                  <div>
                    <label className="block text-xs font-bold text-amber-300 mb-1.5">Bàn chỉ định</label>
                    <select
                      value={editingAccount.assignedTableId || ''}
                      onChange={(e) => setEditingAccount({ ...editingAccount, assignedTableId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-amber-500/40 rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Không chỉ định bàn cố định --</option>
                      {tables.map((tbl) => (
                        <option key={tbl.id} value={tbl.id}>
                          {tbl.name} ({tbl.capacity} người)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resettingPasswordAccount && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 flex flex-col">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Đặt Lại Mật Khẩu</h2>
                    <p className="text-xs text-slate-400">Tài khoản: @{resettingPasswordAccount.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setResettingPasswordAccount(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Mật khẩu mới *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Nhập mật khẩu mới cho tài khoản"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setResettingPasswordAccount(null)}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/20 cursor-pointer"
                  >
                    Xác Nhận Đổi Mật Khẩu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Account Confirm Modal */}
        <ConfirmModal
          isOpen={!!accountToDelete}
          title={`Xác nhận xóa tài khoản "${accountToDelete?.username}"`}
          message={`Bạn có chắc chắn muốn xóa tài khoản "${accountToDelete?.username}" (${accountToDelete?.fullName}) không? Hành động này không thể khôi phục.`}
          confirmText="Xóa Tài Khoản"
          cancelText="Hủy"
          variant="danger"
          onConfirm={() => {
            if (accountToDelete) {
              deleteAccount(accountToDelete.id);
              setAccountToDelete(null);
            }
          }}
          onClose={() => setAccountToDelete(null)}
        />
      </div>
    </div>
  );
};
