import React, { useState } from 'react';
import { Order, PaymentMethod } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import {
  X,
  Printer,
  CheckCircle2,
  QrCode,
  CreditCard,
  Banknote,
  Percent,
  Receipt,
  Download,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onPaymentSuccess?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentSuccess
}) => {
  const { checkoutOrder, showToast } = useRestaurant();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountPercent, setDiscountPercent] = useState<number>(order?.discountPercent || 0);
  const [taxPercent, setTaxPercent] = useState<number>(order?.taxPercent || 8);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completedReceipt, setCompletedReceipt] = useState<Order | null>(null);

  if (!isOpen || !order) return null;

  // Calculate totals
  const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxAmount = Math.round(((subtotal - discountAmount) * taxPercent) / 100);
  const finalTotal = subtotal - discountAmount + taxAmount;
  const changeDue = Math.max(0, cashGiven - finalTotal);

  const handleCompletePayment = () => {
    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Ignore if canvas is not ready
    }

    const completed = checkoutOrder(order.id, paymentMethod, discountPercent, taxPercent);
    if (completed) {
      setCompletedReceipt(completed);
      setIsCompleted(true);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    }
  };

  const handlePrint = () => {
    window.print();
    showToast('Đang gửi lệnh in hóa đơn ra máy in nhiệt...', 'info');
  };

  const activeOrderData = completedReceipt || order;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">
              {isCompleted ? 'Hóa Đơn Thanh Toán' : `Thanh Toán: ${order.tableName} (${order.code})`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left: Thermal Receipt Preview */}
          <div className="p-6 bg-slate-50/50 flex flex-col justify-between">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs font-mono text-xs text-slate-800 space-y-3 receipt-printable">
              {/* Receipt Header */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-extrabold text-sm text-slate-950 tracking-wider">
                  QUÁN ĂN & NHÀ HÀNG PRO
                </h3>
                <p className="text-[10px] text-slate-500 font-sans">
                  128 Nguyễn Đình Chiểu, P. Đa Kao, Quận 1, TP. HCM
                </p>
                <p className="text-[10px] text-slate-500 font-sans">Hotline: 1900 6868</p>
                <div className="font-bold text-slate-900 pt-1 text-xs">
                  PHIẾU THANH TOÁN TẠM TÍNH
                </div>
              </div>

              {/* Order Info */}
              <div className="space-y-0.5 text-[11px] text-slate-600 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Mã đơn:</span>
                  <span className="font-bold text-slate-900">{activeOrderData.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vị trí:</span>
                  <span className="font-bold text-slate-900">{activeOrderData.tableName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thu ngân:</span>
                  <span>{activeOrderData.staffName || 'Thu ngân'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian:</span>
                  <span>{new Date(activeOrderData.createdAt).toLocaleTimeString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span>{activeOrderData.customerName || 'Khách Lẻ'} ({activeOrderData.customerCount} người)</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 py-1 divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                {activeOrderData.items.map((it) => (
                  <div key={it.id} className="pt-1 text-[11px]">
                    <div className="flex justify-between font-semibold text-slate-900">
                      <span>
                        {it.name} x{it.quantity}
                      </span>
                      <span>{(it.price * it.quantity).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    {it.note && (
                      <div className="text-[10px] text-slate-400 italic">Ghi chú: {it.note}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Tiền món ({activeOrderData.items.length}):</span>
                  <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Chiết khấu ({discountPercent}%):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Thuế VAT ({taxPercent}%):</span>
                  <span>+{taxAmount.toLocaleString('vi-VN')} ₫</span>
                </div>

                <div className="flex justify-between text-sm font-extrabold text-slate-950 pt-2 border-t border-slate-800">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-amber-600">{finalTotal.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 font-sans space-y-0.5">
                <p className="font-semibold text-slate-700">Cảm ơn Quý Khách - Hẹn Gặp Lại!</p>
                <p>Pass Wifi: nhahangpro2026</p>
              </div>
            </div>

            {/* Print & Share buttons */}
            <div className="flex items-center gap-2 pt-3">
              <button
                onClick={handlePrint}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                In Hóa Đơn
              </button>
            </div>
          </div>

          {/* Right: Payment Method Selector & Cash Tender */}
          <div className="p-6 space-y-5 flex flex-col justify-between">
            {!isCompleted ? (
              <div className="space-y-4">
                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Hình thức thanh toán:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'cash', label: 'Tiền mặt', icon: <Banknote className="w-4 h-4" /> },
                      { id: 'qr', label: 'Quét QR VietQR', icon: <QrCode className="w-4 h-4" /> },
                      { id: 'transfer', label: 'Chuyển khoản', icon: <CreditCard className="w-4 h-4" /> },
                      { id: 'card', label: 'Thẻ POS / Visa', icon: <CreditCard className="w-4 h-4" /> }
                    ].map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                        className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                          paymentMethod === pm.id
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {pm.icon}
                        <span>{pm.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* QR Code generator preview if QR / Transfer chosen */}
                {(paymentMethod === 'qr' || paymentMethod === 'transfer') && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-center space-y-2">
                    <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex flex-col items-center justify-center">
                      <QrCode className="w-24 h-24 text-slate-800 stroke-1" />
                    </div>
                    <div className="text-xs text-emerald-950 font-bold">
                      VietQR • Ngân Hàng TMCP Ngoại Thương (Vietcombank)
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      STK: <span className="font-bold">1029384756</span> • Chủ TK: NHÀ HÀNG PRO
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 bg-white/80 py-1 px-2 rounded-lg inline-block">
                      Số tiền: <span className="text-emerald-700 font-bold">{finalTotal.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                )}

                {/* Cash Calculator if Cash chosen */}
                {paymentMethod === 'cash' && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600">Khách thanh toán:</span>
                      <div className="flex items-center gap-1">
                        {[100000, 200000, 500000, 1000000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCashGiven(preset)}
                            className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            {(preset / 1000).toFixed(0)}k
                          </button>
                        ))}
                      </div>
                    </div>

                    <input
                      type="number"
                      step={10000}
                      placeholder="Nhập số tiền khách đưa..."
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 bg-white"
                    />

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-medium">Tiền thừa trả khách:</span>
                      <span className="font-extrabold text-sm text-emerald-600">
                        {changeDue.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                )}

                {/* Discount & VAT Options */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Giảm giá voucher (%)
                    </label>
                    <select
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value={0}>Không giảm (0%)</option>
                      <option value={5}>VIP Thân Thiết (5%)</option>
                      <option value={10}>Ưu đãi Thành viên (10%)</option>
                      <option value={15}>Sinh nhật (15%)</option>
                      <option value={20}>Khai trương (20%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Thuế VAT (%)
                    </label>
                    <select
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value={0}>Không tính VAT (0%)</option>
                      <option value={8}>VAT Chuẩn F&B (8%)</option>
                      <option value={10}>VAT (10%)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* Success State */
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    Thanh Toán Thành Công!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Đơn hàng {completedReceipt?.code} đã được lưu vào hệ thống báo cáo doanh thu.
                  </p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 inline-block text-xs font-bold text-amber-900">
                  Số tiền thu: {completedReceipt?.finalTotal.toLocaleString('vi-VN')} ₫
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                {isCompleted ? 'Đóng cửa sổ' : 'Hủy bỏ'}
              </button>

              {!isCompleted && (
                <button
                  type="button"
                  onClick={handleCompletePayment}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác Nhận Thu Tiền
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
