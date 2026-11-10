import React, { useState } from 'react';
import {
  UtensilsCrossed,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  User,
  StickyNote,
  AlertCircle,
  Check
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, Table, CustomerType } from '../../types';
import { CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';

interface TableRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { menuItem: MenuItem; quantity: number; note: string }[];
  onOrderSuccess: (registeredTableId: string) => void;
}

export const TableRegistrationModal: React.FC<TableRegistrationModalProps> = ({
  isOpen,
  onClose,
  cart,
  onOrderSuccess
}) => {
  const { tables, areas, customerTableId, customerSubmitOrder, updateTableCustomerType } = useRestaurant();

  // Selected Area Filter
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  
  // Selected Table
  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    return customerTableId || tables[0]?.id || '';
  });

  // Customer Information
  const [customerType, setCustomerType] = useState<CustomerType>('walk_in');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [tableNote, setTableNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const vat = Math.round(subtotal * 0.08);
  const grandTotal = subtotal + vat;

  // Filtered tables based on area
  const filteredTables = tables.filter((t) => {
    if (selectedAreaId === 'all') return true;
    return t.areaId === selectedAreaId;
  });

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const selectedArea = areas.find((a) => a.id === selectedTable?.areaId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedTableId) {
      setErrorMsg('Vui lòng chọn một bàn ăn để đăng ký!');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Giỏ món ăn của bạn đang trống. Vui lòng chọn món trước!');
      return;
    }

    setIsSubmitting(true);

    try {
      updateTableCustomerType(selectedTableId, customerType);

      customerSubmitOrder(
        selectedTableId,
        cart.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
          note: item.note
        })),
        customerName.trim() || undefined,
        customerPhone.trim() || undefined,
        guestCount,
        tableNote.trim() || undefined
      );

      setIsSubmitting(false);
      onOrderSuccess(selectedTableId);
    } catch (err) {
      console.error(err);
      setErrorMsg('Có lỗi xảy ra khi gửi đơn. Vui lòng thử lại!');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Bước Cuối: Chọn Bàn
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Đăng Ký Bàn & Gửi Đơn Vào Bếp
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quý khách đã chọn {totalItems} món ({subtotal.toLocaleString('vi-VN')} ₫). Vui lòng chọn bàn đang ngồi!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Area Filter Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>1. Chọn Khu Vực & Bàn Ăn Của Bạn</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedTable ? `Đã chọn: ${selectedTable.name}` : 'Chưa chọn bàn'}
              </span>
            </div>

            {/* Area pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedAreaId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedAreaId === 'all'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả khu vực ({tables.length})
              </button>
              {areas.map((area) => {
                const count = tables.filter((t) => t.areaId === area.id).length;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setSelectedAreaId(area.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedAreaId === area.id
                        ? 'bg-slate-900 text-amber-400 shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {area.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
              {filteredTables.map((tbl) => {
                const isSelected = selectedTableId === tbl.id;
                const isOccupied = tbl.status === 'occupied';
                const areaInfo = areas.find((a) => a.id === tbl.areaId);

                return (
                  <div
                    key={tbl.id}
                    onClick={() => {
                      setSelectedTableId(tbl.id);
                      setGuestCount(tbl.capacity || 2);
                    }}
                    className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500 shadow-md'
                        : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-extrabold text-sm text-slate-900">
                        {tbl.name}
                      </span>
                      {isSelected ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          {tbl.capacity}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] text-slate-500 block truncate">
                        {areaInfo?.name || 'Khu vực'}
                      </span>
                      <div>
                        {isOccupied ? (
                          <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                            Đang dùng (Gọi thêm)
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                            Bàn trống
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Diner Details (Optional) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span>2. Thông Tin Khách Hàng & Phân Hạng (4 Nhóm)</span>
            </label>

            {/* 4 Customer Types Selector */}
            <div>
              <span className="block text-[11px] font-bold text-slate-600 mb-1.5">
                Phân loại khách hàng:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['walk_in', 'regular', 'vip', 'group'] as CustomerType[]).map((type) => {
                  const conf = CUSTOMER_TYPE_CONFIG[type];
                  const isSel = customerType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCustomerType(type)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSel
                          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-400/50 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{conf.icon}</span>
                        {conf.defaultDiscount > 0 && (
                          <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                            -{conf.defaultDiscount}%
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <div className="font-bold text-xs text-slate-900">{conf.label}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Tên / Danh xưng:
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="VD: Anh Nam, Bàn tiệc..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Số điện thoại (tích điểm):
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="0901 xxx xxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Số lượng người ngồi:
                </label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => Math.max(1, g - 1))}
                    className="w-7 h-7 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center hover:bg-slate-100 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-extrabold text-xs text-slate-800">
                    {guestCount} người
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((g) => g + 1)}
                    className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center hover:bg-amber-400 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Ghi chú chung cho toàn bàn:
              </label>
              <div className="relative">
                <StickyNote className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Có em bé cần chuẩn bị ghế phụ, lên món lẩu trước, mang thêm đá..."
                  value={tableNote}
                  onChange={(e) => setTableNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Order Summary Preview */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span>Tóm tắt đơn gọi ({totalItems} món):</span>
              <span className="text-slate-900">{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    • {item.menuItem.name} <strong className="text-amber-700">x{item.quantity}</strong>
                    {item.note && <span className="italic text-slate-400 ml-1">({item.note})</span>}
                  </span>
                  <span>{(item.menuItem.price * item.quantity).toLocaleString('vi-VN')} ₫</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-amber-200 flex items-center justify-between font-extrabold text-sm">
              <span className="text-slate-900">
                Bàn đăng ký: <strong className="text-amber-700">{selectedTable?.name || '---'}</strong> ({selectedArea?.name || ''})
              </span>
              <span className="text-amber-600 text-base">
                Tổng: {subtotal.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer transition-colors"
            >
              Chọn Thêm Món
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedTableId}
              className="flex-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Đang gửi đơn...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Đăng Ký {selectedTable?.name} & Gửi Đơn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
