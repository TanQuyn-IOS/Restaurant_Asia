import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuItem, MenuCategory, OrderItem, CustomerType } from '../../types';
import { ReceiptModal } from './ReceiptModal';
import { ConfirmModal } from '../Common/ConfirmModal';
import { CUSTOMER_TYPES, CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  ChefHat,
  ShoppingBag,
  Clock,
  User,
  Users,
  Percent,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Flame,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Lock
} from 'lucide-react';

interface POSViewProps {
  initialTableId?: string;
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

export const POSView: React.FC<POSViewProps> = ({ initialTableId }) => {
  const {
    tables,
    areas,
    menuItems,
    activeOrders,
    createOrGetOrderForTable,
    addItemToOrder,
    updateOrderItemQuantity,
    removeOrderItem,
    updateOrderDetails,
    updateTableCustomerType,
    cancelOrder,
    showToast,
    serviceRequests,
    updateServiceRequestStatus,
    currentRole
  } = useRestaurant();

  const isCashier = currentRole === 'cashier';

  const [selectedTableId, setSelectedTableId] = useState<string>(
    initialTableId || tables[0]?.id || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<'all' | MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [showConfirmCancelOrder, setShowConfirmCancelOrder] = useState(false);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Sync initialTableId if passed
  useEffect(() => {
    if (initialTableId) {
      setSelectedTableId(initialTableId);
    }
  }, [initialTableId]);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const activeOrder = activeOrders.find(
    (o) => o.tableId === selectedTableId && o.status === 'active'
  );

  // Filter menu items
  const filteredMenuItems = menuItems.filter((item) => {
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

  const handleAddItem = (item: MenuItem) => {
    // CASHIER RESTRICTION: Giao diện thu ngân không thêm món trong khi thanh toán
    if (isCashier) {
      showToast('Chế độ Thu Ngân: Không được thêm món mới trong khi thanh toán bill!', 'warning');
      return;
    }

    if (!item.isAvailable) {
      showToast(`Món "${item.name}" hiện đang tạm hết!`, 'warning');
      return;
    }

    let order = activeOrder;
    if (!order) {
      order = createOrGetOrderForTable(selectedTableId, selectedTable?.capacity || 2, 'Khách Lẻ', selectedTable?.customerType || 'walk_in');
    }

    addItemToOrder(order.id, item, 1);
  };

  const handleSelectCustomerType = (type: CustomerType) => {
    updateTableCustomerType(selectedTableId, type);
    if (activeOrder) {
      const defaultDiscount = CUSTOMER_TYPE_CONFIG[type]?.defaultDiscount || 0;
      updateOrderDetails(activeOrder.id, {
        customerType: type,
        discountPercent: defaultDiscount
      });
    }
  };

  const handleSendToKitchen = () => {
    if (!activeOrder || activeOrder.items.length === 0) {
      showToast('Chưa có món nào trong đơn để gửi bếp!', 'warning');
      return;
    }
    showToast(`Đã gửi thực đơn bàn ${activeOrder.tableName} sang Màn hình Bếp & Bar!`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top Table Selector & POS Quick Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Table Selector */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Chọn Bàn:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {tables.map((t) => {
              const isSelected = selectedTableId === t.id;
              const hasActive = activeOrders.some((o) => o.tableId === t.id);

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTableId(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                      : hasActive
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : t.status === 'reserved'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasActive
                        ? 'bg-rose-500 animate-pulse'
                        : t.status === 'reserved'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Status Preview */}
        {activeOrder && (
          <div className="flex items-center gap-2 self-end md:self-auto text-xs">
            <span className="text-slate-500">Mã đơn: <strong className="text-slate-900">{activeOrder.code}</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Thời gian: <strong>{new Date(activeOrder.createdAt).toLocaleTimeString('vi-VN')}</strong></span>
          </div>
        )}
      </div>

      {/* Customer Service Requests Banner for this Table */}
      {(() => {
        const tablePendingRequests = serviceRequests.filter(
          (r) => r.tableId === selectedTableId && r.status !== 'resolved'
        );
        if (tablePendingRequests.length === 0) return null;

        return (
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                🔔
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-900">
                  {tablePendingRequests.length} Yêu Cầu Hỗ Trợ Từ {selectedTable?.name}:
                </h4>
                <p className="text-xs text-rose-700">
                  {tablePendingRequests.map((r) => r.title + (r.note ? ` ("${r.note}")` : '')).join(' | ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {tablePendingRequests.map((r) => (
                <button
                  key={r.id}
                  onClick={() => updateServiceRequestStatus(r.id, 'resolved', 'Thu ngân')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
                >
                  Xác nhận xử lý ({r.title})
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Main POS Interface: Menu Browser (Left 7 Cols) + Ticket Cart (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Food Menu Browser */}
        <div className="lg:col-span-7 space-y-3">
          {/* Search and Category Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Tìm nhanh món theo tên, hương vị..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            {/* Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat === 'all' ? 'Tất cả món' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredMenuItems.map((item) => {
              const inCartCount = activeOrder?.items
                .filter((i) => i.menuItemId === item.id)
                .reduce((sum, i) => sum + i.quantity, 0) || 0;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!item.isAvailable}
                  onClick={() => handleAddItem(item)}
                  className={`bg-white rounded-2xl border text-left overflow-hidden transition-all flex flex-col justify-between p-3 relative group shadow-xs ${
                    isCashier
                      ? 'border-slate-200 cursor-not-allowed opacity-80'
                      : !item.isAvailable
                      ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                      : inCartCount > 0
                      ? 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/20 hover:shadow-md active:scale-98 cursor-pointer'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md active:scale-98 cursor-pointer'
                  }`}
                >
                  {/* Photo & in-cart badge */}
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2 bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />

                    {inCartCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                        {inCartCount}
                      </span>
                    )}

                    {isCashier && (
                      <span className="absolute bottom-1.5 right-1.5 bg-slate-900/85 text-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Lock className="w-2.5 h-2.5 text-amber-400" />
                        <span>Khóa</span>
                      </span>
                    )}

                    {item.isPopular && !isCashier && (
                      <span className="absolute top-1.5 left-1.5 bg-amber-500/90 text-slate-950 px-1.5 py-0.5 rounded text-[9px] font-bold">
                        Bán Chạy
                      </span>
                    )}
                  </div>

                  {/* Title & Price */}
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-extrabold text-sm text-amber-600">
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

        {/* Right: Active Table Cart & Checkout Panel */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between min-h-[640px] space-y-4">
            <div>
              {/* Cashier Protection Banner */}
              {isCashier && (
                <div className="bg-emerald-50 border border-emerald-300/80 rounded-2xl p-3 text-emerald-950 text-xs mb-3 flex items-start gap-2 shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-emerald-900">
                      Giao diện Thu Ngân Bảo Mật
                    </strong>
                    <span>
                      Đã khóa thêm và xóa món trong khi thanh toán để bảo đảm tính minh bạch và tránh thất thoát.
                    </span>
                  </div>
                </div>
              )}

              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold text-base text-slate-900">
                      {selectedTable?.name || 'Chọn Bàn'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    {areas.find((a) => a.id === selectedTable?.areaId)?.name}
                  </p>
                </div>

                {activeOrder && (
                  <button
                    disabled={isCashier}
                    onClick={() => {
                      if (!isCashier) setShowConfirmCancelOrder(true);
                    }}
                    title={isCashier ? 'Thu ngân không được hủy đơn. Vui lòng liên hệ Phục vụ hoặc Quản lý' : 'Hủy đơn hàng này'}
                    className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 font-semibold ${
                      isCashier
                        ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-100'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                    }`}
                  >
                    {isCashier ? <Lock className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Hủy đơn</span>
                  </button>
                )}
              </div>

              {/* Customer Type Selector (Khách vãng lai, Khách thường, Khách VIP, Khách đoàn) */}
              <div className="py-2.5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Phân Loại Khách:
                  </span>
                  {activeOrder?.customerType && (
                    <span className="text-[11px] font-bold text-amber-600">
                      {CUSTOMER_TYPE_CONFIG[activeOrder.customerType]?.label}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CUSTOMER_TYPES.map((typeKey) => {
                    const meta = CUSTOMER_TYPE_CONFIG[typeKey];
                    const currentType = activeOrder?.customerType || selectedTable?.customerType || 'walk_in';
                    const isSelected = currentType === typeKey;

                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => handleSelectCustomerType(typeKey)}
                        className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/15 text-slate-900 font-extrabold shadow-xs ring-1 ring-amber-400'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-sm">{meta.icon}</span>
                        <span className="text-[10px] font-bold block truncate">{meta.shortLabel}</span>
                        {meta.defaultDiscount > 0 ? (
                          <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 rounded block mt-0.5">
                            -{meta.defaultDiscount}%
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400 block mt-0.5">0%</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Info Quick Inputs */}
              {activeOrder && (
                <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 text-xs">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tên khách hàng"
                      value={activeOrder.customerName || ''}
                      onChange={(e) =>
                        updateOrderDetails(activeOrder.id, { customerName: e.target.value })
                      }
                      className="bg-transparent border-none focus:outline-none w-full font-medium text-slate-800"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/80 text-xs">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      placeholder="Số khách"
                      value={activeOrder.customerCount || 2}
                      onChange={(e) =>
                        updateOrderDetails(activeOrder.id, { customerCount: Number(e.target.value) })
                      }
                      className="bg-transparent border-none focus:outline-none w-full font-medium text-slate-800"
                    />
                    <span className="text-slate-400 text-[10px]">khách</span>
                  </div>
                </div>
              )}

              {/* Items List in Cart */}
              <div className="py-2 space-y-2 max-h-[300px] overflow-y-auto pr-1 divide-y divide-slate-100">
                {activeOrder && activeOrder.items.length > 0 ? (
                  activeOrder.items.map((item) => {
                    let statusColor = 'bg-slate-100 text-slate-600';
                    let statusLabel = 'Chờ nấu';
                    if (item.status === 'cooking') {
                      statusColor = 'bg-amber-100 text-amber-800 animate-pulse';
                      statusLabel = 'Đang nấu';
                    } else if (item.status === 'ready') {
                      statusColor = 'bg-emerald-100 text-emerald-800';
                      statusLabel = 'Đã xong';
                    } else if (item.status === 'served') {
                      statusColor = 'bg-blue-100 text-blue-800';
                      statusLabel = 'Đã phục vụ';
                    }

                    return (
                      <div key={item.id} className="pt-2 first:pt-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-bold text-xs text-slate-900">{item.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-extrabold text-xs text-amber-600">
                                {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </div>
                          </div>

                          {/* Quantity Controls: Cashier CANNOT add or remove */}
                          {isCashier ? (
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl">
                              <span className="text-xs font-bold text-slate-800">
                                SL: <strong>{item.quantity}</strong> {item.unit}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                              <button
                                onClick={() =>
                                  updateOrderItemQuantity(activeOrder.id, item.id, item.quantity - 1)
                                }
                                className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold text-xs text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateOrderItemQuantity(activeOrder.id, item.id, item.quantity + 1)
                                }
                                className="w-6 h-6 rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Note line & Edit / Delete */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          {editingNoteItemId === item.id && !isCashier ? (
                            <div className="flex items-center gap-1.5 w-full pt-1">
                              <input
                                type="text"
                                autoFocus
                                placeholder="Ghi chú món: ít ngọt, không ớt..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="w-full px-2 py-1 rounded-lg border border-amber-400 text-xs bg-amber-50 text-slate-800"
                              />
                              <button
                                onClick={() => {
                                  updateOrderDetails(activeOrder.id, {
                                    items: activeOrder.items.map((i) =>
                                      i.id === item.id ? { ...i, note: noteText } : i
                                    )
                                  });
                                  setEditingNoteItemId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                              >
                                Lưu
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-slate-500 italic">
                                {item.note ? `"${item.note}"` : ''}
                              </span>

                              {/* Cashier CANNOT delete items during payment */}
                              {isCashier ? (
                                <span
                                  title="Chế độ Thu Ngân: Không được xóa món trong khi thanh toán để bảo đảm tính minh bạch"
                                  className="text-[11px] text-slate-400 font-medium flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg"
                                >
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>Khóa sửa</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => removeOrderItem(activeOrder.id, item.id)}
                                  className="text-slate-400 hover:text-rose-500 cursor-pointer p-1"
                                  title="Xóa món khỏi đơn"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
                    <p className="text-xs font-semibold text-slate-600">Đơn hàng đang trống</p>
                    <p className="text-[11px] text-slate-400">
                      Chọn món từ danh sách bên trái để thêm vào bàn này
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Calculations & Order Actions */}
            {activeOrder && activeOrder.items.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                {/* Discount & Tax Selector */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Chiết khấu:</span>
                    <select
                      value={activeOrder.discountPercent}
                      onChange={(e) =>
                        updateOrderDetails(activeOrder.id, {
                          discountPercent: Number(e.target.value)
                        })
                      }
                      className="bg-transparent font-bold text-slate-800 focus:outline-none"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5%</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={20}>20%</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-medium">Thuế VAT:</span>
                    <select
                      value={activeOrder.taxPercent}
                      onChange={(e) =>
                        updateOrderDetails(activeOrder.id, {
                          taxPercent: Number(e.target.value)
                        })
                      }
                      className="bg-transparent font-bold text-slate-800 focus:outline-none"
                    >
                      <option value={8}>8%</option>
                      <option value={10}>10%</option>
                      <option value={0}>0%</option>
                    </select>
                  </div>
                </div>

                {/* Final Total Line */}
                <div className="p-3.5 bg-slate-900 rounded-2xl text-white flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Tổng tiền thanh toán
                    </span>
                    <span className="text-xs text-slate-400">
                      Đã bao gồm VAT & Giảm giá
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-amber-400">
                      {activeOrder.finalTotal.toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSendToKitchen}
                    className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <ChefHat className="w-4 h-4 text-amber-600" />
                    Gửi Vào Bếp
                  </button>

                  <button
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all"
                  >
                    <Receipt className="w-4 h-4" />
                    Thanh Toán
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Checkout Modal */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={activeOrder || null}
      />

      {/* Cancel Order Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmCancelOrder}
        title="Xác nhận hủy đơn hàng"
        message={`Bạn có chắc chắn muốn hủy bỏ toàn bộ đơn hàng của bàn "${selectedTable?.name || ''}" không?`}
        confirmText="Hủy Đơn Hàng"
        cancelText="Đóng"
        variant="danger"
        onConfirm={() => {
          if (activeOrder) {
            cancelOrder(activeOrder.id);
          }
        }}
        onClose={() => setShowConfirmCancelOrder(false)}
      />
    </div>
  );
};
