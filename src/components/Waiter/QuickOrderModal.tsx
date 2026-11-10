import React, { useState } from 'react';
import { MenuItem, MenuCategory, Table, CustomerType } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { CUSTOMER_TYPES, CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';
import {
  X,
  Search,
  Plus,
  Minus,
  ChefHat,
  Sparkles,
  ShoppingBag,
  Send,
  User,
  Users
} from 'lucide-react';

interface QuickOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: Table | null;
}

const CATEGORIES: ('all' | MenuCategory)[] = [
  'all',
  'Khai vị',
  'Món chính',
  'Món lẩu',
  'Hải sản',
  'Món chay',
  'Tráng miệng',
  'Đồ uống',
  'Combo'
];

export const QuickOrderModal: React.FC<QuickOrderModalProps> = ({
  isOpen,
  onClose,
  table
}) => {
  const {
    menuItems,
    activeOrders,
    createOrGetOrderForTable,
    addItemToOrder,
    updateTableCustomerType,
    showToast
  } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<'all' | MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<{ menuItem: MenuItem; quantity: number; note: string }[]>([]);
  const [customerType, setCustomerType] = useState<CustomerType>(table?.customerType || 'walk_in');
  const [customerName, setCustomerName] = useState(table?.reservation?.customerName || '');
  const [guestCount, setGuestCount] = useState<number>(table?.reservation?.guestCount || table?.capacity || 2);

  if (!isOpen || !table) return null;

  const activeOrder = activeOrders.find((o) => o.tableId === table.id && o.status === 'active');
  const isAddingMore = !!activeOrder;

  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleAddDishToCart = (item: MenuItem) => {
    if (!item.isAvailable) {
      showToast(`Món "${item.name}" hiện đang tạm hết!`, 'warning');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1, note: '' }];
    });
  };

  const handleUpdateCartQuantity = (menuItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
    } else {
      setCartItems((prev) =>
        prev.map((i) => (i.menuItem.id === menuItemId ? { ...i, quantity: newQty } : i))
      );
    }
  };

  const handleUpdateItemNote = (menuItemId: string, note: string) => {
    setCartItems((prev) =>
      prev.map((i) => (i.menuItem.id === menuItemId ? { ...i, note } : i))
    );
  };

  const handleConfirmAndSendToKitchen = () => {
    if (cartItems.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 món ăn!', 'warning');
      return;
    }

    // 1. Ensure table customer type is saved
    updateTableCustomerType(table.id, customerType);

    // 2. Create or get existing order
    const order = isAddingMore
      ? activeOrder
      : createOrGetOrderForTable(table.id, guestCount, customerName || 'Khách Lẻ', customerType);

    // 3. Add each item into the order
    cartItems.forEach(({ menuItem, quantity, note }) => {
      addItemToOrder(order.id, menuItem, quantity, note.trim() || undefined);
    });

    showToast(
      isAddingMore
        ? `Đã gọi thêm ${cartItems.length} món cho bàn ${table.name} & gửi ngay vào Bếp!`
        : `Đã mở bàn ${table.name} thành công với ${cartItems.length} món gửi Bếp!`,
      'success'
    );

    setCartItems([]);
    onClose();
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">
                  {isAddingMore ? `Gọi Thêm Món: ${table.name}` : `Mở Bàn & Chọn Món: ${table.name}`}
                </h3>
                {isAddingMore && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                    BÀN ĐANG PHỤC VỤ
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Nhân viên phục vụ thao tác nhanh tại bàn cho khách
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Control Bar: Customer Type & Guest Count */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Loại Khách:
            </span>
            <div className="flex items-center gap-1 overflow-x-auto">
              {CUSTOMER_TYPES.map((typeKey) => {
                const meta = CUSTOMER_TYPE_CONFIG[typeKey];
                const isSelected = customerType === typeKey;
                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setCustomerType(typeKey)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.shortLabel}</span>
                    {meta.defaultDiscount > 0 && (
                      <span className="text-[10px] font-black bg-slate-950 text-amber-300 px-1 rounded ml-0.5">
                        -{meta.defaultDiscount}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tên khách"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-24 focus:outline-none text-xs text-slate-800 font-semibold"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="number"
                min={1}
                max={20}
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-10 focus:outline-none text-xs text-slate-800 font-bold"
              />
              <span className="text-slate-400 text-[10px]">khách</span>
            </div>
          </div>
        </div>

        {/* Modal Body: Left Dishes Menu + Right Order Staging */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left: Dishes Browser (7 cols) */}
          <div className="md:col-span-7 p-4 border-r border-slate-200 overflow-y-auto space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Search & Category Tabs */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm món nhanh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                  const stagedQty = cartItems.find((i) => i.menuItem.id === item.id)?.quantity || 0;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={!item.isAvailable}
                      onClick={() => handleAddDishToCart(item)}
                      className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                        !item.isAvailable
                          ? 'opacity-40 border-slate-200 cursor-not-allowed bg-slate-50'
                          : stagedQty > 0
                          ? 'border-teal-500 bg-teal-50/30 ring-1 ring-teal-400/40'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="aspect-video w-full rounded-xl overflow-hidden mb-1.5 bg-slate-100 relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        {stagedQty > 0 && (
                          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-teal-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                            {stagedQty}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-black text-amber-600">
                            {item.price.toLocaleString('vi-VN')} ₫
                          </span>
                          <span className="text-[10px] text-slate-400">/{item.unit}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Items To Send (5 cols) */}
          <div className="md:col-span-5 p-4 flex flex-col justify-between bg-slate-50 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-teal-600" />
                  Món Chuẩn Bị Gửi Bếp ({cartItems.reduce((s, i) => s + i.quantity, 0)})
                </span>
                {cartItems.length > 0 && (
                  <button
                    onClick={() => setCartItems([])}
                    className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Xóa trắng
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                  <p className="text-xs font-medium">Chưa có món nào được chọn</p>
                  <p className="text-[11px] text-slate-400">
                    Bấm chọn các món từ danh sách bên trái để thêm vào đơn bàn {table.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 divide-y divide-slate-200">
                  {cartItems.map(({ menuItem, quantity, note }) => (
                    <div key={menuItem.id} className="pt-2 first:pt-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{menuItem.name}</div>
                          <div className="text-[11px] font-extrabold text-amber-600">
                            {(menuItem.price * quantity).toLocaleString('vi-VN')} ₫
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(menuItem.id, quantity - 1)}
                            className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-xs">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCartQuantity(menuItem.id, quantity + 1)}
                            className="w-5 h-5 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        placeholder="Ghi chú bếp: không hành, ít đá..."
                        value={note}
                        onChange={(e) => handleUpdateItemNote(menuItem.id, e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Send Button */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Tạm tính các món mới:</span>
                <span className="text-sm font-black text-slate-900">
                  {cartTotal.toLocaleString('vi-VN')} ₫
                </span>
              </div>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleConfirmAndSendToKitchen}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isAddingMore ? 'Gửi Gọi Thêm Món Vào Bếp' : 'Mở Bàn & Gửi Thực Đơn Vào Bếp'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
