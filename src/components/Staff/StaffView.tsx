import React, { useState } from 'react';
import { Staff, StaffRole, LeaveStatus, LeaveRequest } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { StaffModal } from './StaffModal';
import { LeaveRequestModal } from './LeaveRequestModal';
import { ConfirmModal } from '../Common/ConfirmModal';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Briefcase,
  Award,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCheck2,
  CalendarCheck,
  CalendarClock
} from 'lucide-react';

const ROLES: ('all' | StaffRole)[] = [
  'all',
  'Quản lý',
  'Thu ngân',
  'Phục vụ',
  'Bếp trưởng',
  'Đầu bếp',
  'Pha chế'
];

export const StaffView: React.FC = () => {
  const {
    staffList,
    updateStaff,
    deleteStaff,
    leaveRequests,
    updateLeaveRequestStatus,
    deleteLeaveRequest
  } = useRestaurant();

  const [selectedRole, setSelectedRole] = useState<'all' | StaffRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'on_break' | 'off'>('all');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedStaffForEdit, setSelectedStaffForEdit] = useState<Staff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [leaveToDelete, setLeaveToDelete] = useState<LeaveRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'roster' | 'schedule' | 'leaves'>('roster');
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<'all' | LeaveStatus>('all');

  const filteredStaff = staffList.filter((staff) => {
    if (selectedRole !== 'all' && staff.role !== selectedRole) return false;
    if (filterStatus !== 'all' && staff.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = staff.name.toLowerCase().includes(q);
      const matchPhone = staff.phone.includes(q);
      const matchRole = staff.role.toLowerCase().includes(q);
      return matchName || matchPhone || matchRole;
    }

    return true;
  });

  const activeStaffCount = staffList.filter((s) => s.status === 'active').length;
  const breakStaffCount = staffList.filter((s) => s.status === 'on_break').length;

  // Leave counters
  const activeLeavesCount = leaveRequests.filter((l) => l.status === 'active').length;
  const upcomingLeavesCount = leaveRequests.filter((l) => l.status === 'upcoming').length;
  const completedLeavesCount = leaveRequests.filter((l) => l.status === 'completed').length;

  const filteredLeaveRequests = leaveRequests.filter((l) => {
    if (leaveFilterStatus !== 'all' && l.status !== leaveFilterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.staffName.toLowerCase().includes(q) ||
        l.reason.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tổng số nhân sự</div>
            <div className="text-lg font-bold text-slate-800">{staffList.length} nhân viên</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Đang trong ca trực</div>
            <div className="text-lg font-bold text-emerald-600">{activeStaffCount} người</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <CalendarClock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Đang nghỉ phép hôm nay</div>
            <div className="text-lg font-bold text-amber-700">{activeLeavesCount} nhân sự</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Sắp nghỉ phép tới</div>
            <div className="text-lg font-bold text-blue-600">{upcomingLeavesCount} đơn duyệt</div>
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder={
                activeTab === 'leaves'
                  ? 'Tìm đơn nghỉ phép theo tên, lý do...'
                  : 'Tìm nhân viên theo tên, SĐT, ca trực...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher: Danh sách vs Bảng phân ca vs Quản lý nghỉ phép */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveTab('roster')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'roster'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hồ Sơ Nhân Sự
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'schedule'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lịch Phân Ca & Khung Giờ
              </button>
              <button
                onClick={() => setActiveTab('leaves')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'leaves'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Nghỉ Phép (Đã, Đang, Sắp)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-900 text-amber-300">
                  {leaveRequests.length}
                </span>
              </button>
            </div>

            {activeTab === 'leaves' ? (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 ml-auto md:ml-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Đơn Nghỉ Phép</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedStaffForEdit(null);
                  setIsStaffModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 ml-auto md:ml-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Nhân Viên</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-filters for activeTab */}
        {activeTab === 'leaves' ? (
          /* 3 Status Filter Pills for Leave Requests: Đã, Đang, Sắp */
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Trạng thái nghỉ phép:
            </span>
            <button
              onClick={() => setLeaveFilterStatus('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                leaveFilterStatus === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({leaveRequests.length})
            </button>
            <button
              onClick={() => setLeaveFilterStatus('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leaveFilterStatus === 'active'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              <span>🏖️ Đang nghỉ ({activeLeavesCount})</span>
            </button>
            <button
              onClick={() => setLeaveFilterStatus('upcoming')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leaveFilterStatus === 'upcoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>⏳ Sắp nghỉ ({upcomingLeavesCount})</span>
            </button>
            <button
              onClick={() => setLeaveFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                leaveFilterStatus === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>✅ Đã nghỉ ({completedLeavesCount})</span>
            </button>
          </div>
        ) : (
          /* Role Filter Pills */
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
            {ROLES.map((role) => {
              const isSelected = selectedRole === role;
              const count =
                role === 'all'
                  ? staffList.length
                  : staffList.filter((s) => s.role === role).length;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <span>{role === 'all' ? 'Tất cả vị trí' : role}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content: Roster vs Schedule vs Leaves */}
      {activeTab === 'roster' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            let roleBadge = 'bg-slate-100 text-slate-800 border-slate-200';
            if (staff.role === 'Quản lý') roleBadge = 'bg-purple-100 text-purple-800 border-purple-200 font-bold';
            if (staff.role === 'Bếp trưởng') roleBadge = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
            if (staff.role === 'Thu ngân') roleBadge = 'bg-blue-100 text-blue-800 border-blue-200';
            if (staff.role === 'Phục vụ') roleBadge = 'bg-amber-100 text-amber-800 border-amber-200';
            if (staff.role === 'Pha chế') roleBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';

            return (
              <div
                key={staff.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header: Avatar, Name, Role, Status Toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                        />
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            staff.status === 'active'
                              ? 'bg-emerald-500'
                              : staff.status === 'on_break'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{staff.name}</h3>
                        <span
                          className={`inline-block text-[11px] px-2 py-0.5 rounded-md border mt-0.5 ${roleBadge}`}
                        >
                          {staff.role}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedStaffForEdit(staff);
                          setIsStaffModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setStaffToDelete(staff)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Xóa nhân viên"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Explicit Shift Info Card (Yêu cầu: Người đó thực hiện ca nào giờ nào) */}
                  <div className="mt-3.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block">
                        Ca trực phụ trách
                      </span>
                      <span className="text-xs font-black text-slate-900">
                        {staff.shiftName || staff.shift.split('(')[0]?.trim() || 'Ca Sáng'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-medium block">Khung giờ</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-mono font-bold text-xs shadow-xs">
                        {staff.shiftHours || staff.shift.match(/\((.*?)\)/)?.[1] || '06:00 - 14:00'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">{staff.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                  </div>

                  {/* Salary & Orders Handled */}
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Lương thỏa thuận</span>
                      <span className="text-xs font-bold text-slate-800">
                        {staff.salaryRate.toLocaleString('vi-VN')} ₫
                        <span className="text-[10px] text-slate-500 font-normal">
                          {staff.salaryType === 'monthly' ? '/th' : '/h'}
                        </span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Đơn phục vụ</span>
                      <span className="text-xs font-bold text-amber-600">
                        {(staff.ordersHandled || 0).toLocaleString('vi-VN')} đơn
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Switcher Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Trạng thái:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateStaff(staff.id, { status: 'active' })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        staff.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Đang trực
                    </button>
                    <button
                      onClick={() => updateStaff(staff.id, { status: 'on_break' })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        staff.status === 'on_break'
                          ? 'bg-amber-100 text-amber-800 font-bold'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Nghỉ giữa ca
                    </button>
                    <button
                      onClick={() => updateStaff(staff.id, { status: 'off' })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        staff.status === 'off'
                          ? 'bg-slate-200 text-slate-800 font-bold'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      Nghỉ ca
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'schedule' ? (
        /* Weekly Schedule Table View with Explicit Hours */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                Lịch Phân Ca & Khung Giờ Chi Tiết Trong Tuần
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy định giờ: Ca Sáng (06:00 - 14:00) • Ca Chiều (14:00 - 22:00) • Ca Tối (17:00 - 23:00) • Hành Chính (08:00 - 17:30)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
                Tuần 45 / 2026
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3">Nhân Viên</th>
                  <th className="px-4 py-3">Vị Trí & Khung Giờ</th>
                  <th className="px-3 py-3 text-center">Thứ 2</th>
                  <th className="px-3 py-3 text-center">Thứ 3</th>
                  <th className="px-3 py-3 text-center">Thứ 4</th>
                  <th className="px-3 py-3 text-center">Thứ 5</th>
                  <th className="px-3 py-3 text-center">Thứ 6</th>
                  <th className="px-3 py-3 text-center bg-amber-50/50">Thứ 7</th>
                  <th className="px-3 py-3 text-center bg-amber-50/50">Chủ Nhật</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {staffList.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <img src={st.avatar} alt="av" className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <div>{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{st.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                          {st.role}
                        </span>
                        <div className="text-[10px] font-mono text-amber-700 font-bold mt-1">
                          ⏰ {st.shiftHours || '06:00 - 14:00'} ({st.shiftName || 'Ca Sáng'})
                        </div>
                      </div>
                    </td>
                    {['Sáng', 'Sáng', 'Chiều', 'Sáng', 'Chiều', 'Toàn ca', 'Nghỉ'].map((shiftName, dayIdx) => (
                      <td key={dayIdx} className="px-3 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                            shiftName === 'Sáng'
                              ? 'bg-amber-100 text-amber-800'
                              : shiftName === 'Chiều'
                              ? 'bg-blue-100 text-blue-800'
                              : shiftName === 'Toàn ca'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {shiftName}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Leave Management View (Yêu cầu: Nghỉ phép chia ra 3 trạng thái :đã, đang, sắp) */
        <div className="space-y-4">
          {/* Status summary pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  🏖️ Đang Nghỉ Phép (Active)
                </span>
                <span className="text-2xl font-black text-amber-950 mt-1 block">
                  {activeLeavesCount} <span className="text-sm font-semibold text-amber-700">nhân sự</span>
                </span>
                <span className="text-xs text-amber-700 mt-0.5 block">Hôm nay đang tạm vắng ca</span>
              </div>
              <span className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-xs">
                {activeLeavesCount}
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  ⏳ Sắp Nghỉ Phép (Upcoming)
                </span>
                <span className="text-2xl font-black text-blue-950 mt-1 block">
                  {upcomingLeavesCount} <span className="text-sm font-semibold text-blue-700">kế hoạch</span>
                </span>
                <span className="text-xs text-blue-700 mt-0.5 block">Đã được duyệt, chuẩn bị nghỉ</span>
              </div>
              <span className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                {upcomingLeavesCount}
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  ✅ Đã Nghỉ Phép (Completed)
                </span>
                <span className="text-2xl font-black text-emerald-950 mt-1 block">
                  {completedLeavesCount} <span className="text-sm font-semibold text-emerald-700">lượt nghỉ</span>
                </span>
                <span className="text-xs text-emerald-700 mt-0.5 block">Đã hết phép & quay lại đi làm</span>
              </div>
              <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                {completedLeavesCount}
              </span>
            </div>
          </div>

          {/* Leave list table / cards */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-500" />
                  Danh Sách Đơn Nghỉ Phép Phân Loại 3 Trạng Thái (Đã • Đang • Sắp)
                </h3>
                <span className="text-xs text-slate-500">
                  Hiển thị {filteredLeaveRequests.length} đơn nghỉ phép
                </span>
              </div>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Tạo Đơn Nghỉ Phép</span>
              </button>
            </div>

            {filteredLeaveRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileCheck2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium text-sm">Không tìm thấy đơn nghỉ phép nào phù hợp.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Nhân Viên</th>
                      <th className="px-4 py-3">Loại Nghỉ</th>
                      <th className="px-4 py-3">Thời Gian Nghỉ</th>
                      <th className="px-4 py-3">Lý Do Nghỉ</th>
                      <th className="px-4 py-3">Trạng Thái (3 Mức)</th>
                      <th className="px-4 py-3">Người Duyệt</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLeaveRequests.map((leave) => {
                      const staff = staffList.find((s) => s.id === leave.staffId);
                      return (
                        <tr key={leave.id} className="hover:bg-slate-50/80">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {staff ? (
                                <img
                                  src={staff.avatar}
                                  alt="av"
                                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                                  {leave.staffName[0]}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900">{leave.staffName}</div>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {leave.role}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                              {leave.leaveType}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {new Date(leave.startDate).toLocaleDateString('vi-VN')} →{' '}
                              {new Date(leave.endDate).toLocaleDateString('vi-VN')}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Từ {leave.startDate} đến {leave.endDate}
                            </span>
                          </td>

                          <td className="px-4 py-3 max-w-xs">
                            <p className="text-slate-800 text-xs italic line-clamp-2">
                              "{leave.reason}"
                            </p>
                          </td>

                          <td className="px-4 py-3">
                            {leave.status === 'active' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px]">
                                <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
                                🏖️ Đang nghỉ (Hiện tại)
                              </span>
                            )}
                            {leave.status === 'upcoming' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 font-bold border border-blue-300 text-[11px]">
                                ⏳ Sắp nghỉ (Chưa đến)
                              </span>
                            )}
                            {leave.status === 'completed' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300 text-[11px]">
                                ✅ Đã nghỉ (Đã xong)
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600 font-medium">
                              {leave.approvedBy || 'Quản lý duyệt'}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Quick status switch buttons */}
                              {leave.status !== 'active' && (
                                <button
                                  onClick={() => updateLeaveRequestStatus(leave.id, 'active')}
                                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
                                  title="Chuyển sang Đang Nghỉ"
                                >
                                  Chuyển: Đang
                                </button>
                              )}
                              {leave.status !== 'completed' && (
                                <button
                                  onClick={() => updateLeaveRequestStatus(leave.id, 'completed')}
                                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-colors"
                                  title="Chuyển sang Đã Nghỉ"
                                >
                                  Chuyển: Đã
                                </button>
                              )}
                              {leave.status !== 'upcoming' && (
                                <button
                                  onClick={() => updateLeaveRequestStatus(leave.id, 'upcoming')}
                                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 hover:bg-blue-200 text-blue-900 transition-colors"
                                  title="Chuyển sang Sắp Nghỉ"
                                >
                                  Chuyển: Sắp
                                </button>
                              )}
                              <button
                                onClick={() => setLeaveToDelete(leave)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                                title="Xóa đơn"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff Modal */}
      <StaffModal
        isOpen={isStaffModalOpen}
        onClose={() => {
          setIsStaffModalOpen(false);
          setSelectedStaffForEdit(null);
        }}
        staffToEdit={selectedStaffForEdit}
      />

      {/* Leave Request Modal */}
      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
      />

      {/* Delete Staff Confirm Modal */}
      <ConfirmModal
        isOpen={!!staffToDelete}
        title={`Xác nhận xóa nhân viên "${staffToDelete?.name}"`}
        message={`Bạn có chắc chắn muốn xóa nhân viên "${staffToDelete?.name}" (${staffToDelete?.role}) không?`}
        confirmText="Xóa Nhân Viên"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          if (staffToDelete) {
            deleteStaff(staffToDelete.id);
            setStaffToDelete(null);
          }
        }}
        onClose={() => setStaffToDelete(null)}
      />

      {/* Delete Leave Confirm Modal */}
      <ConfirmModal
        isOpen={!!leaveToDelete}
        title="Xác nhận xóa đơn nghỉ phép"
        message={`Bạn có chắc muốn xóa đơn nghỉ phép của nhân viên "${leaveToDelete?.staffName}" không?`}
        confirmText="Xóa Đơn"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          if (leaveToDelete) {
            deleteLeaveRequest(leaveToDelete.id);
            setLeaveToDelete(null);
          }
        }}
        onClose={() => setLeaveToDelete(null)}
      />
    </div>
  );
};
