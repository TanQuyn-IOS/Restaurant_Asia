import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { GoodsReceiptItem, PaymentMethod } from '../../types';
import { X, Plus, Trash2, PackageCheck, Truck, DollarSign } from 'lucide-react';

interface AddGoodsReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INGREDIENT_CATEGORIES = [
  'Thịt & Hải sản',
  'Rau củ quả',
  'Bia & Nước giải khát',
  'Gia vị & Khô',
  'Vật tư tiêu hao'
] as const;

export const AddGoodsReceiptModal: React.FC<AddGoodsReceiptModalProps> = ({ isOpen, onClose }) => {
  const { addGoodsReceipt, currentUser } = useRestaurant();

  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending'>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('transfer');
  const [notes, setNotes] = useState('');

  // Items list
  const [items, setItems] = useState<Omit<GoodsReceiptItem, 'id' | 'totalPrice'>[]>([
    {
      ingredientName: 'Thịt bò Úc phi lê',
      category: 'Thịt & Hải sản',
      quantity: 10,
      unit: 'kg',
      unitPrice: 280000
    }
  ]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        ingredientName: '',
        category: 'Rau củ quả',
        quantity: 5,
        unit: 'kg',
        unitPrice: 30000
      }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const calculatedItems: GoodsReceiptItem[] = items.map((it, idx) => ({
    ...it,
    id: `gri-${Date.now()}-${idx}`,
    totalPrice: it.quantity * it.unitPrice
  }));

  const totalAmount = calculatedItems.reduce((sum, it) => sum + it.totalPrice, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || calculatedItems.length === 0) return;

    addGoodsReceipt({
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim() || undefined,
      items: calculatedItems,
      totalAmount,
      paymentStatus,
      paymentMethod,
      notes: notes.trim() || undefined,
      createdBy: currentUser?.fullName || 'Chủ nhà hàng'
    });

    onClose();
    setSupplierName('');
    setSupplierPhone('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" />
            Tạo Phiếu Nhập Hàng / Nguyên Liệu Mới (Chủ Nhà Hàng)
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Nhà cung cấp & SĐT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Tên Nhà Cung Cấp / Đầu Mối *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Hải Sản Biển Đông, Nông Sản Đà Lạt..."
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Số Điện Thoại Liên Hệ
              </label>
              <input
                type="tel"
                placeholder="VD: 0988 123 456"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          {/* Danh sách mặt hàng nhập */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chi Tiết Nguyên Liệu & Hàng Hóa Nhập ({items.length} món)
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm dòng hàng</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-4">
                    <input
                      type="text"
                      required
                      placeholder="Tên nguyên liệu..."
                      value={it.ingredientName}
                      onChange={(e) => handleItemChange(idx, 'ingredientName', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>

                  <div className="col-span-3">
                    <select
                      value={it.category}
                      onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      {INGREDIENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      required
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="w-14 px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-center"
                    />
                    <input
                      type="text"
                      placeholder="ĐVT"
                      value={it.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-12 px-1 py-1.5 rounded-lg border border-slate-200 bg-white text-center"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step={1000}
                      min={0}
                      required
                      placeholder="Đơn giá"
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-right"
                    />
                  </div>

                  <div className="col-span-1 text-right">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 text-right text-xs text-slate-600">
              Tổng tiền nguyên liệu:{' '}
              <span className="font-bold text-amber-600 text-sm">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </span>
            </div>
          </div>

          {/* Trạng thái thanh toán & Phương thức */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Trạng thái thanh toán tiền hàng *
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'pending')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-bold"
              >
                <option value="paid" className="text-emerald-700">
                  ✅ Đã thanh toán đầy đủ (Không nợ)
                </option>
                <option value="pending" className="text-amber-700">
                  ⏳ Ghi nhận công nợ nhà cung cấp
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Phương thức chi trả
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white font-medium"
              >
                <option value="transfer">Chuyển khoản ngân hàng</option>
                <option value="cash">Tiền mặt thủ quỹ</option>
                <option value="qr">VietQR</option>
              </select>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Ghi chú thêm về lô hàng
            </label>
            <input
              type="text"
              placeholder="VD: Kiểm tra quy cách tươi sống, lưu kho bảo quản ngăn đông -18°C..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Tổng giá trị phiếu nhập:{' '}
              <strong className="text-base text-slate-900 ml-1">
                {totalAmount.toLocaleString('vi-VN')} ₫
              </strong>
            </div>

            <div className="flex items-center gap-2">
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
                <PackageCheck className="w-4 h-4" />
                Lưu Phiếu Nhập Hàng
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
