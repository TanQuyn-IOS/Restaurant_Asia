import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { LeaveStatus, StaffRole } from '../../types';
import { X, Calendar, User, FileText, CheckCircle2 } from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEAVE_TYPES = ['Phép năm', 'Nghỉ ốm', 'Việc gia đình', 'Nghỉ bù'] as const;

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({ isOpen, onClose }) => {
  const { staffList, addLeaveRequest, currentUser } = useRestaurant();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [leaveType, setLeaveType] = useState<typeof LEAVE_TYPES[number]>('Phép năm');
  const [status, setStatus] = useState<LeaveStatus>('upcoming');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffList.find((s) => s.id === selectedStaffId);
    if (!staff || !reason.trim()) return;

    addLeaveRequest({
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role as StaffRole,
      startDate,
      endDate,
      status,
      reason: reason.trim(),
      leaveType,
      approvedBy: currentUser?.fullName || 'Quản lý nhà hàng'
    });

    onClose();
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Tạo Đơn Nghỉ Phép Mới
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nhân viên */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Chọn nhân viên *
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role} - {s.shiftName || s.shift})
                </option>
              ))}
            </select>
          </div>

          {/* Loại nghỉ & Trạng thái (Đã, Đang, Sắp) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Loại nghỉ phép
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as typeof LEAVE_TYPES[number])}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Trạng thái nghỉ
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as LeaveStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
              >
                <option value="upcoming" className="text-blue-700">
                  ⏳ Sắp nghỉ (Chưa đến ngày)
                </option>
                <option value="active" className="text-amber-700">
                  🏖️ Đang nghỉ (Hiện tại)
                </option>
                <option value="completed" className="text-emerald-700">
                  ✅ Đã nghỉ (Đã hoàn tất)
                </option>
              </select>
            </div>
          </div>

          {/* Ngày bắt đầu - Ngày kết thúc */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Từ ngày
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Đến hết ngày
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Lý do */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Lý do xin nghỉ *
            </label>
            <textarea
              required
              rows={3}
              placeholder="VD: Nghỉ về quê cưới em gái, đã bàn giao ca trực cho anh Hùng..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu Đơn Nghỉ Phép
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
