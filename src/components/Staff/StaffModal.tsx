import React, { useState, useEffect } from 'react';
import { Staff, StaffRole } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, Plus, User, Phone, Mail, DollarSign, Calendar } from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: Staff | null;
}

const ROLES: StaffRole[] = [
  'Quản lý',
  'Thu ngân',
  'Phục vụ',
  'Bếp trưởng',
  'Đầu bếp',
  'Pha chế'
];

export const SHIFT_OPTIONS = [
  { label: 'Ca Sáng (06:00 - 14:00)', name: 'Ca Sáng', hours: '06:00 - 14:00' },
  { label: 'Ca Chiều (14:00 - 22:00)', name: 'Ca Chiều', hours: '14:00 - 22:00' },
  { label: 'Ca Tối (17:00 - 23:00)', name: 'Ca Tối', hours: '17:00 - 23:00' },
  { label: 'Ca Đêm (22:00 - 06:00)', name: 'Ca Đêm', hours: '22:00 - 06:00' },
  { label: 'Ca Hành Chính (08:00 - 17:30)', name: 'Ca Hành Chính', hours: '08:00 - 17:30' },
  { label: 'Toàn thời gian (08:00 - 22:00)', name: 'Toàn thời gian', hours: '08:00 - 22:00' }
];

const SHIFTS = SHIFT_OPTIONS.map((s) => s.label);

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
];

export const StaffModal: React.FC<StaffModalProps> = ({
  isOpen,
  onClose,
  staffToEdit
}) => {
  const { addStaff, updateStaff } = useRestaurant();

  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('Phục vụ');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [shift, setShift] = useState(SHIFTS[0]);
  const [salaryType, setSalaryType] = useState<'monthly' | 'hourly'>('monthly');
  const [salaryRate, setSalaryRate] = useState<number>(8500000);
  const [status, setStatus] = useState<'active' | 'on_break' | 'off'>('active');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name);
      setRole(staffToEdit.role);
      setPhone(staffToEdit.phone);
      setEmail(staffToEdit.email);
      setShift(staffToEdit.shift);
      setSalaryType(staffToEdit.salaryType);
      setSalaryRate(staffToEdit.salaryRate);
      setStatus(staffToEdit.status);
      setAvatar(staffToEdit.avatar);
      setJoinDate(staffToEdit.joinDate);
    } else {
      setName('');
      setRole('Phục vụ');
      setPhone('');
      setEmail('');
      setShift(SHIFTS[0]);
      setSalaryType('monthly');
      setSalaryRate(8500000);
      setStatus('active');
      setAvatar(PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)]);
      setJoinDate(new Date().toISOString().split('T')[0]);
    }
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const selectedShiftOpt = SHIFT_OPTIONS.find((s) => s.label === shift) || {
      name: shift.split('(')[0]?.trim() || shift,
      hours: shift.match(/\((.*?)\)/)?.[1] || '06:00 - 14:00'
    };

    const staffData = {
      name: name.trim(),
      role,
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@nhahangpro.vn`,
      shift,
      shiftName: selectedShiftOpt.name,
      shiftHours: selectedShiftOpt.hours,
      salaryType,
      salaryRate: Number(salaryRate),
      status,
      avatar,
      joinDate
    };

    if (staffToEdit) {
      updateStaff(staffToEdit.id, staffData);
    } else {
      addStaff(staffData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-500" />
            {staffToEdit ? 'Chỉnh Sửa Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Avatar selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Chọn ảnh đại diện
            </label>
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                    avatar === av ? 'border-amber-500 ring-2 ring-amber-400/50 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={av} alt="avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Full name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Họ và tên nhân viên *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn Nam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Vị trí / Chức vụ *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white font-medium"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email
              </label>
              <input
                type="email"
                placeholder="email@nhahang.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Shift & Join Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Ca làm việc mặc định
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Ngày bắt đầu làm việc
              </label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Salary Type & Rate */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Chế độ Lương & Thù lao
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs text-slate-500 mb-1">Hình thức tính</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSalaryType('monthly');
                      if (salaryRate < 100000) setSalaryRate(8500000);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                      salaryType === 'monthly'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSalaryType('hourly');
                      if (salaryRate > 100000) setSalaryRate(35000);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                      salaryType === 'hourly'
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    Theo Giờ
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-xs text-slate-500 mb-1">
                  Mức lương ({salaryType === 'monthly' ? '₫ / tháng' : '₫ / giờ'})
                </span>
                <input
                  type="number"
                  min={0}
                  step={salaryType === 'monthly' ? 500000 : 5000}
                  value={salaryRate}
                  onChange={(e) => setSalaryRate(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Trạng thái làm việc
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'active', label: 'Đang làm việc', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
                { id: 'on_break', label: 'Nghỉ giải lao', color: 'bg-amber-50 text-amber-700 border-amber-300' },
                { id: 'off', label: 'Nghỉ ca / Nghỉ phép', color: 'bg-slate-100 text-slate-600 border-slate-300' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as any)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    status === st.id
                      ? `${st.color} ring-2 ring-amber-500 ring-offset-1`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {staffToEdit ? 'Lưu Thông Tin' : 'Thêm Nhân Viên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
