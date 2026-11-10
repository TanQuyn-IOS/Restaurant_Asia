import React, { useState } from 'react';
import { Table, ReservationInfo, CustomerType } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, CalendarClock, User, Phone, Users, FileText, Sparkles } from 'lucide-react';
import { CUSTOMER_TYPES, CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  table
}) => {
  const { reserveTable, cancelReservation } = useRestaurant();

  const [customerName, setCustomerName] = useState(table?.reservation?.customerName || '');
  const [phone, setPhone] = useState(table?.reservation?.phone || '');
  const [customerType, setCustomerType] = useState<CustomerType>(
    table?.reservation?.customerType || table?.customerType || 'regular'
  );
  const [guestCount, setGuestCount] = useState<number>(table?.reservation?.guestCount || table?.capacity || 2);
  const [reservationTime, setReservationTime] = useState(table?.reservation?.reservationTime || '19:00');
  const [notes, setNotes] = useState(table?.reservation?.notes || '');

  if (!isOpen || !table) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim()) return;

    const reservationData: ReservationInfo = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      customerType,
      guestCount,
      reservationTime,
      notes: notes.trim() || undefined
    };

    reserveTable(table.id, reservationData);
    onClose();
  };

  const handleCancelBooking = () => {
    cancelReservation(table.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2 text-amber-900">
            <CalendarClock className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold">
              {table.reservation ? 'Thông Tin Đặt Bàn' : `Đặt Bàn: ${table.name}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Type Selector (Khách vãng lai, Khách thường, Khách VIP, Khách đoàn) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Phân Loại Khách Hàng
              </span>
              <span className="text-[11px] text-amber-600 font-bold lowercase">
                {CUSTOMER_TYPE_CONFIG[customerType]?.label}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CUSTOMER_TYPES.map((typeKey) => {
                const meta = CUSTOMER_TYPE_CONFIG[typeKey];
                const isSelected = customerType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setCustomerType(typeKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/30'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        <span>{meta.label}</span>
                        {meta.defaultDiscount > 0 && (
                          <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-1 rounded">
                            -{meta.defaultDiscount}%
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {meta.shortLabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              Tên khách hàng *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Anh Minh, Chị Lan..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Số lượng khách
              </label>
              <input
                type="number"
                min={1}
                max={table.capacity * 2}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
              Giờ đến dự kiến *
            </label>
            <input
              type="time"
              required
              value={reservationTime}
              onChange={(e) => setReservationTime(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Ghi chú đặc biệt
            </label>
            <textarea
              rows={2}
              placeholder="VD: Sinh nhật cần chuẩn bị bánh/hoa, ăn không cay..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {table.reservation ? (
              <button
                type="button"
                onClick={handleCancelBooking}
                className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition-colors"
              >
                Hủy Đặt Bàn
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all"
              >
                {table.reservation ? 'Cập Nhật Đặt Bàn' : 'Xác Nhận Đặt Bàn'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
