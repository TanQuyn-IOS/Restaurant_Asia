import React, { useState } from 'react';
import { Order, PaymentMethod, Table } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';
import {
  X,
  Printer,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Sparkles,
  Receipt,
  User,
  Users,
  Clock,
  Trash2
} from 'lucide-react';

interface TableBillReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
  order: Order | null;
  onPaymentSuccess?: () => void;
}

export const TableBillReviewModal: React.FC<TableBillReviewModalProps> = ({
  isOpen,
  onClose,
  table,
  order,
  onPaymentSuccess
}) => {
  const { checkoutOrder, clearTableSession, showToast } = useRestaurant();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('qr');
  const [showQRPreview, setShowQRPreview] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  if (!isOpen || !table || !order) return null;

  const customerTypeKey = order.customerType || table.customerType || 'walk_in';
  const customerMeta = CUSTOMER_TYPE_CONFIG[customerTypeKey];

  const handlePrint = () => {
    window.print();
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      checkoutOrder(order.id, selectedPaymentMethod, order.discountPercent, order.taxPercent);
      setIsProcessing(false);
      showToast(`Đã thanh toán thành công cho bàn ${table.name}!`, 'success');
      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    }, 400);
  };

  const handleClearTable = () => {
    clearTableSession(table.id);
    setShowClearConfirm(false);
    onClose();
  };

  const discountAmount = Math.round((order.subtotal * order.discountPercent) / 100);
  const taxAmount = Math.round(((order.subtotal - discountAmount) * order.taxPercent) / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">Kiểm Tra Bill: {table.name}</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${customerMeta.badgeBg} ${customerMeta.badgeText} ${customerMeta.badgeBorder}`}>
                  {customerMeta.icon} {customerMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Mã đơn: {order.code}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bill Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800">
          {/* Diner Overview */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Khách hàng</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {order.customerName || 'Khách Lẻ'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Số người</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {order.customerCount || 2} khách
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Giờ vào bàn</span>
              <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Dishes Table */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Danh Sách Món Đã Gọi ({order.items.reduce((s, i) => s + i.quantity, 0)})</span>
              <span className="text-slate-400 text-[11px] font-normal">Bếp & Phục Vụ</span>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {item.price.toLocaleString('vi-VN')} ₫ × {item.quantity} {item.unit}
                      {item.note && <span className="ml-2 text-amber-600 italic">(&ldquo;{item.note}&rdquo;)</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-xs text-slate-900">
                      {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Calculation breakdown */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Cộng tiền món (Tạm tính):</span>
              <span className="font-bold text-slate-800">{order.subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>

            {order.discountPercent > 0 && (
              <div className="flex items-center justify-between text-amber-700 font-medium">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Ưu đãi {customerMeta.label} (-{order.discountPercent}%):
                </span>
                <span className="font-bold">-{discountAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span>Thuế GTGT (VAT {order.taxPercent}%):</span>
              <span className="font-bold text-slate-800">+{taxAmount.toLocaleString('vi-VN')} ₫</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900">Tổng Tiền Cần Thanh Toán:</span>
              <span className="text-lg font-black text-rose-600">
                {order.finalTotal.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Hình Thức Thanh Toán Cho Khách:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('qr')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  selectedPaymentMethod === 'qr'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/30 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 text-emerald-600" />
                <span className="text-xs">Chuyển VietQR</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('cash')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  selectedPaymentMethod === 'cash'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-400/30 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-600" />
                <span className="text-xs">Tiền Mặt</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  selectedPaymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-400/30 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Thẻ POS</span>
              </button>
            </div>
          </div>

          {/* VietQR Quick Scan */}
          {selectedPaymentMethod === 'qr' && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4">
              <div className="w-24 h-24 bg-white p-1 rounded-xl shadow-xs border border-emerald-300 shrink-0 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=247PAY_${order.code}_${order.finalTotal}`}
                  alt="VietQR"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-xs text-emerald-950 space-y-1">
                <div className="font-extrabold text-sm text-emerald-800">VietQR Quét Trực Tiếp Tại Bàn</div>
                <div>Ngân hàng: <strong>MBBank (Quân Đội)</strong></div>
                <div>Số tài khoản: <strong className="font-mono text-emerald-700">0901234567</strong></div>
                <div>Nội dung: <strong className="font-mono">{order.code}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Khách ăn xong bấm delete để giải phóng chỗ */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-2.5 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Khách ăn xong bấm delete để có chỗ đặt bàn"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Khách Ăn Xong • Dọn Bàn</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-2xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Tạm Tính</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProcessPayment}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Đang Xử Lý...' : 'Thanh Toán Cho Khách'}</span>
            </button>
          </div>
        </div>

        {/* Confirmation to clear table */}
        {showClearConfirm && (
          <div className="absolute inset-0 bg-slate-950/80 z-20 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-base text-slate-900">
                Xác nhận khách ăn xong & Dọn bàn?
              </h4>
              <p className="text-xs text-slate-500">
                Bàn <strong>{table.name}</strong> sẽ được làm trống lập tức để có chỗ cho khách mới đặt bàn. Đơn hàng sẽ được lưu vào lịch sử.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Quay Lại
                </button>
                <button
                  type="button"
                  onClick={handleClearTable}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Xác Nhận Dọn Bàn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
