import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { CashFlowType, CashFlowCategory, PaymentMethod } from '../../types';
import { X, ArrowDownRight, ArrowUpRight, DollarSign, FileText } from 'lucide-react';

interface AddCashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: CashFlowCategory; label: string; defaultType: CashFlowType }[] = [
  { value: 'revenue_order', label: 'Thu tiền bán hàng / Khách thanh toán', defaultType: 'inflow' },
  { value: 'goods_purchase', label: 'Chi mua hàng hóa & nguyên vật liệu', defaultType: 'outflow' },
  { value: 'staff_salary', label: 'Chi trả lương & thưởng nhân viên', defaultType: 'outflow' },
  { value: 'utilities', label: 'Chi tiền điện, nước, internet, mặt bằng', defaultType: 'outflow' },
  { value: 'marketing', label: 'Chi phí quảng cáo, khuyến mại', defaultType: 'outflow' },
  { value: 'other', label: 'Thu / Chi khác', defaultType: 'outflow' }
];

export const AddCashFlowModal: React.FC<AddCashFlowModalProps> = ({ isOpen, onClose }) => {
  const { addCashFlowRecord, currentUser } = useRestaurant();

  const [type, setType] = useState<CashFlowType>('outflow');
  const [category, setCategory] = useState<CashFlowCategory>('goods_purchase');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(500000);
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [referenceCode, setReferenceCode] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;

    addCashFlowRecord({
      type,
      category,
      title: title.trim(),
      amount: Number(amount),
      method,
      referenceCode: referenceCode.trim() || undefined,
      notes: notes.trim() || undefined,
      createdBy: currentUser?.fullName || 'Chủ nhà hàng'
    });

    onClose();
    setTitle('');
    setNotes('');
    setReferenceCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-500" />
            Thêm Giao Dịch Thu / Chi (Sổ Quỹ Tiền Mặt)
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Loại giao dịch: Thu vào hay Chi ra */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Loại dòng tiền *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('inflow')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'inflow'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-300" />
                <span>Tiền Thu Vào (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('outflow')}
                className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'outflow'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-300" />
                <span>Tiền Chi Ra (-)</span>
              </button>
            </div>
          </div>

          {/* Tiêu đề & Số tiền */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Nội dung giao dịch *
            </label>
            <input
              type="text"
              required
              placeholder="VD: Mua thêm rau gia vị chợ sớm, Tiền điện tháng 10..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Số tiền (VNĐ) *
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                required
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Hình thức tiền
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
              >
                <option value="cash">💵 Tiền mặt</option>
                <option value="transfer">💳 Chuyển khoản NH</option>
                <option value="qr">📱 VietQR</option>
              </select>
            </div>
          </div>

          {/* Phân loại danh mục */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Phân loại danh mục thu / chi
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CashFlowCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mã chứng từ tham chiếu & Ghi chú */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Mã chứng từ (nếu có)
              </label>
              <input
                type="text"
                placeholder="VD: PNK-001, HD-102"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Ghi chú thêm
              </label>
              <input
                type="text"
                placeholder="Ghi chú người nhận, hóa đơn..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Actions */}
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
              Lưu Giao Dịch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
