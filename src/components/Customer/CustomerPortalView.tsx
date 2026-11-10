import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Clock,
  Receipt,
  Bell,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Flame,
  Search,
  Sparkles,
  ChevronRight,
  Info,
  HelpCircle,
  Coffee,
  Check,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { MenuCategory, MenuItem, ServiceRequestType, CustomerType } from '../../types';
import { CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';
import { TableRegistrationModal } from './TableRegistrationModal';

export const CustomerPortalView: React.FC = () => {
  const {
    tables,
    areas,
    menuItems,
    activeOrders,
    customerTableId,
    setCustomerTableId,
    customerSubmitOrder,
    addServiceRequest,
    serviceRequests,
    updateTableCustomerType
  } = useRestaurant();

  // Active sub-view within Customer Portal
  const [customerTab, setCustomerTab] = useState<'menu' | 'status' | 'bill'>('menu');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state
  const [cart, setCart] = useState<{ menuItem: MenuItem; quantity: number; note: string }[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  const [showTableRegisterModal, setShowTableRegisterModal] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Item customization modal
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalNote, setModalNote] = useState<string>('');

  // Service Call Modal
  const [showCallStaffModal, setShowCallStaffModal] = useState<boolean>(false);
  const [callType, setCallType] = useState<ServiceRequestType>('call_waiter');
  const [callNote, setCallNote] = useState<string>('');

  // Current active table
  const currentTable = tables.find((t) => t.id === customerTableId) || tables[0];
  const currentArea = areas.find((a) => a.id === currentTable?.areaId);
  const currentOrder = activeOrders.find((o) => o.tableId === currentTable?.id && o.status === 'active');

  // Service requests for this table
  const tableRequests = serviceRequests.filter((r) => r.tableId === currentTable?.id);
  const pendingRequests = tableRequests.filter((r) => r.status !== 'resolved');

  // Menu categories
  const categories: MenuCategory[] = [
    'Khai vị',
    'Món chính',
    'Món lẩu',
    'Hải sản',
    'Món chay',
    'Tráng miệng',
    'Đồ uống',
    'Combo'
  ];

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  // Cart helper functions
  const handleOpenItemModal = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setSelectedItemForModal(item);
    setModalQuantity(1);
    setModalNote('');
  };

  const handleAddToCart = () => {
    if (!selectedItemForModal) return;
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.menuItem.id === selectedItemForModal.id && i.note === modalNote.trim()
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += modalQuantity;
        return updated;
      }
      return [...prev, { menuItem: selectedItemForModal, quantity: modalQuantity, note: modalNote.trim() }];
    });
    setSelectedItemForModal(null);
  };

  const updateCartItemQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCart((prev) =>
        prev.map((item, i) => (i === index ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const cartTotalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);

  const handleConfirmOrder = () => {
    if (cart.length === 0 || !currentTable) return;
    customerSubmitOrder(
      currentTable.id,
      cart.map((item) => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        note: item.note
      })),
      customerName.trim() || undefined,
      customerPhone.trim() || undefined
    );
    setCart([]);
    setShowCartDrawer(false);
    setCustomerTab('status');
  };

  // Service Request Submission
  const handleSendServiceRequest = () => {
    if (!currentTable) return;
    const requestTitles: Record<ServiceRequestType, string> = {
      call_waiter: 'Cần nhân viên hỗ trợ tại bàn',
      request_bill: 'Yêu cầu thanh toán & in hóa đơn',
      refill_water: 'Xin thêm nước đá / Trà đá',
      extra_cutlery: 'Xin thêm chén, dĩa, muỗng, đũa',
      clean_table: 'Yêu cầu dọn bàn / lau bàn',
      other: 'Yêu cầu khác từ khách'
    };

    addServiceRequest({
      tableId: currentTable.id,
      type: callType,
      title: requestTitles[callType],
      note: callNote.trim() || undefined
    });

    setShowCallStaffModal(false);
    setCallNote('');
  };

  // Status counts
  const totalOrderedItems = currentOrder ? currentOrder.items.reduce((s, i) => s + i.quantity, 0) : 0;
  const servedCount = currentOrder
    ? currentOrder.items.filter((i) => i.status === 'served').reduce((s, i) => s + i.quantity, 0)
    : 0;
  const cookingCount = currentOrder
    ? currentOrder.items.filter((i) => i.status === 'cooking' || i.status === 'pending').reduce((s, i) => s + i.quantity, 0)
    : 0;
  const readyCount = currentOrder
    ? currentOrder.items.filter((i) => i.status === 'ready').reduce((s, i) => s + i.quantity, 0)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-24">
      {/* Top Banner: Table Selector, Customer Type & Quick Customer Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xl shadow-slate-900/20 space-y-3.5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Current Table Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-lg shadow-inner">
              {currentTable?.name.replace(/[^0-9]/g, '') || '01'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Thực Khách Gọi Món
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {currentTable?.name} ({currentArea?.name || 'Sảnh chính'})
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentOrder ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Mã đơn #{currentOrder.code} • Đang phục vụ ({totalOrderedItems} món)
                  </span>
                ) : (
                  'Bàn chưa có món nào được gọi. Hãy chọn món bên dưới để bắt đầu!'
                )}
              </p>
            </div>
          </div>

          {/* Table Switcher & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Direct Register / Change Table Button */}
            <button
              onClick={() => setShowTableRegisterModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/60 text-amber-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Đổi / Đăng Ký Bàn</span>
            </button>

            {/* Change table dropdown */}
            <div className="relative flex-1 md:flex-initial">
              <select
                value={customerTableId}
                onChange={(e) => setCustomerTableId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({areas.find((a) => a.id === t.areaId)?.name || 'Khu vực'}) {t.status === 'occupied' ? '• Đang có khách' : '• Bàn trống'}
                  </option>
                ))}
              </select>
            </div>

            {/* Call Staff Button */}
            <button
              onClick={() => setShowCallStaffModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 relative cursor-pointer"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span>Gọi Nhân Viên</span>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-extrabold border-2 border-slate-900 animate-pulse">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 4 Customer Types Selector Bar (Vãng lai, Thường, VIP, Đoàn) */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400/90 uppercase tracking-wider">
              Phân loại khách bàn:
            </span>
            <div className="inline-flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
              {(['walk_in', 'regular', 'vip', 'group'] as CustomerType[]).map((cType) => {
                const activeCust = currentTable?.customerType || currentOrder?.customerType || 'walk_in';
                const isSel = activeCust === cType;
                const conf = CUSTOMER_TYPE_CONFIG[cType];
                return (
                  <button
                    key={cType}
                    onClick={() => {
                      if (currentTable) {
                        updateTableCustomerType(currentTable.id, cType);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSel
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <span>{conf.icon}</span>
                    <span>{conf.label}</span>
                    {conf.defaultDiscount > 0 && (
                      <span
                        className={`text-[10px] px-1 rounded font-extrabold ${
                          isSel ? 'bg-slate-950 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        -{conf.defaultDiscount}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            {currentTable?.customerType === 'vip' && '⭐ Thẻ VIP: Giảm 10% tự động trên hóa đơn'}
            {currentTable?.customerType === 'group' && '👥 Khách đoàn: Giảm 5% tự động trên hóa đơn'}
            {(!currentTable?.customerType || currentTable?.customerType === 'walk_in') && 'Khách vãng lai: Giá thực đơn tiêu chuẩn'}
            {currentTable?.customerType === 'regular' && 'Khách thân thiết: Tích lũy điểm tiêu dùng'}
          </div>
        </div>

        {/* Live Service Request Notification Banner */}
        {pendingRequests.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-amber-500/10 -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 rounded-b-2xl border-amber-500/20">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              <span className="font-semibold">Yêu cầu đang được xử lý:</span>
              <span>"{pendingRequests[0].title}"</span>
              {pendingRequests[0].status === 'attending' && (
                <span className="text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  Nhân viên đang đến
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400">Gửi lúc {new Date(pendingRequests[0].createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs for Customer */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setCustomerTab('menu')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              customerTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Gọi Món Trực Tuyến</span>
          </button>

          <button
            onClick={() => setCustomerTab('status')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all relative ${
              customerTab === 'status'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Trạng Thái Món Ăn</span>
            {cookingCount + readyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-xs font-extrabold bg-rose-500 text-white">
                {cookingCount + readyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCustomerTab('bill')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              customerTab === 'bill'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Hóa Đơn & Tạm Tính</span>
          </button>
        </div>

        {/* Floating Cart Trigger */}
        <button
          onClick={() => setShowCartDrawer(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm"
        >
          <span className="relative">
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            {cartTotalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold">
                {cartTotalItems}
              </span>
            )}
          </span>
          <span className="hidden sm:inline">Giỏ món:</span>
          <span className="text-amber-400 font-extrabold">{cartSubtotal.toLocaleString('vi-VN')} ₫</span>
        </button>
      </div>

      {/* ================= VIEW 1: GỌI MÓN TRỰC TUYẾN (MENU) ================= */}
      {customerTab === 'menu' && (
        <div className="space-y-6">
          {/* Category Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Categories horizontal scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tất cả ({menuItems.length})
              </button>
              {categories.map((cat) => {
                const count = menuItems.filter((m) => m.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-amber-400 shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm món ăn, đồ uống..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
              />
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => item.isAvailable && handleOpenItemModal(item)}
                className={`group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between ${
                  item.isAvailable ? 'cursor-pointer hover:border-amber-400/80' : 'opacity-60 cursor-not-allowed bg-slate-50'
                }`}
              >
                <div>
                  {/* Dish Image */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                      <span className="bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-400/20">
                        {item.category}
                      </span>
                      {item.isPopular && (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <Flame className="w-3 h-3" /> Best Seller
                        </span>
                      )}
                    </div>

                    {!item.isAvailable && (
                      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
                        <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                          Tạm hết nguyên liệu
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-amber-600 transition-colors">
                        {item.name}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                        /{item.unit}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Bar: Price & Add button */}
                <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2">
                  <div>
                    <span className="text-base font-extrabold text-amber-600">
                      {item.price.toLocaleString('vi-VN')} ₫
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>~{item.preparationTimeMinutes} phút</span>
                    </div>
                  </div>

                  <button
                    disabled={!item.isAvailable}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenItemModal(item);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      item.isAvailable
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/20 active:scale-95'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Chọn món</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: TRẠNG THÁI MÓN ĂN (LIVE STATUS TRACKER) ================= */}
      {customerTab === 'status' && (
        <div className="space-y-6">
          {/* Summary Progress Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Tiến Độ Món Ăn Bàn {currentTable?.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Hệ thống kết nối trực tiếp với Màn hình Bếp & Bar KDS theo thời gian thực
            </p>

            {/* 4 Status Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <span className="text-xs font-semibold text-amber-700 block mb-1">⏳ Chờ Bếp Nhận</span>
                <span className="text-xl font-black text-amber-800">
                  {currentOrder?.items.filter((i) => i.status === 'pending').reduce((s, i) => s + i.quantity, 0) || 0}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5">món</span>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
                <span className="text-xs font-semibold text-orange-700 block mb-1">🔥 Đang Chế Biến</span>
                <span className="text-xl font-black text-orange-800">
                  {currentOrder?.items.filter((i) => i.status === 'cooking').reduce((s, i) => s + i.quantity, 0) || 0}
                </span>
                <span className="text-[10px] text-orange-600 block mt-0.5">món</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                <span className="text-xs font-semibold text-blue-700 block mb-1">🍽️ Đã Nấu Xong</span>
                <span className="text-xl font-black text-blue-800">
                  {readyCount}
                </span>
                <span className="text-[10px] text-blue-600 block mt-0.5">sẵn sàng lên bàn</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-xs font-semibold text-emerald-700 block mb-1">✅ Đã Lên Món</span>
                <span className="text-xl font-black text-emerald-800">
                  {servedCount}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">đã phục vụ</span>
              </div>
            </div>
          </div>

          {/* Detailed Item Tracking List */}
          {currentOrder && currentOrder.items.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Danh sách món đã gọi ({currentOrder.items.length} món)
                </span>
                <span className="text-xs font-semibold text-amber-600">
                  Đơn #{currentOrder.code}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {currentOrder.items.map((item, idx) => {
                  const statusMap: Record<
                    string,
                    { label: string; color: string; badge: string; icon: React.ReactNode }
                  > = {
                    pending: {
                      label: 'Chờ Bếp Tiếp Nhận',
                      color: 'text-amber-600',
                      badge: 'bg-amber-100 text-amber-800 border-amber-300',
                      icon: <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                    },
                    cooking: {
                      label: 'Đang Nấu / Chế Biến',
                      color: 'text-orange-600',
                      badge: 'bg-orange-100 text-orange-800 border-orange-300',
                      icon: <Flame className="w-4 h-4 text-orange-600 animate-bounce" />
                    },
                    ready: {
                      label: 'Bếp Đã Xong - Đang Mang Lên',
                      color: 'text-blue-600',
                      badge: 'bg-blue-100 text-blue-800 border-blue-300',
                      icon: <Sparkles className="w-4 h-4 text-blue-600" />
                    },
                    served: {
                      label: 'Đã Lên Bàn Thành Công',
                      color: 'text-emerald-600',
                      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    },
                    cancelled: {
                      label: 'Đã Hủy Món',
                      color: 'text-rose-600',
                      badge: 'bg-rose-100 text-rose-800 border-rose-300',
                      icon: <AlertCircle className="w-4 h-4 text-rose-600" />
                    }
                  };

                  const currentStatus = statusMap[item.status] || statusMap.pending;

                  return (
                    <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex items-center justify-center border border-slate-200 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              x{item.quantity} {item.unit}
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-xs text-slate-500 italic mt-0.5">
                              Ghi chú: "{item.note}"
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Đặt lúc: {new Date(item.orderedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${currentStatus.badge}`}>
                          {currentStatus.icon}
                          <span>{currentStatus.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base mb-1">Chưa có món ăn nào</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Bàn này chưa đặt món. Hãy bấm vào tab "Gọi Món Trực Tuyến" để chọn các món ngon!
              </p>
              <button
                onClick={() => setCustomerTab('menu')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-colors"
              >
                Mở Thực Đơn Gọi Món
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 3: HÓA ĐƠN & TẠM TÍNH (BILL OVERVIEW) ================= */}
      {customerTab === 'bill' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detailed Bill items (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Hóa Đơn Tạm Tính • {currentTable?.name}</h3>
                  <p className="text-xs text-slate-400">{currentArea?.name} • Mã #{currentOrder?.code || '---'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold">
                    {currentOrder ? 'Đang phục vụ' : 'Chưa có đơn'}
                  </span>
                </div>
              </div>

              {currentOrder && currentOrder.items.length > 0 ? (
                <div>
                  <div className="p-4 divide-y divide-slate-100">
                    {currentOrder.items.map((item, i) => (
                      <div key={i} className="py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 text-sm">
                            {item.name}
                          </div>
                          <div className="text-slate-500">
                            {item.price.toLocaleString('vi-VN')} ₫ × {item.quantity} {item.unit}
                            {item.note && <span className="italic text-slate-400 ml-1">({item.note})</span>}
                          </div>
                        </div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                      <span className="text-slate-600 font-medium">Hạng khách bàn:</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{CUSTOMER_TYPE_CONFIG[currentOrder.customerType || currentTable?.customerType || 'walk_in'].icon}</span>
                        <span>{CUSTOMER_TYPE_CONFIG[currentOrder.customerType || currentTable?.customerType || 'walk_in'].label}</span>
                        {(currentOrder.discountPercent > 0 || CUSTOMER_TYPE_CONFIG[currentOrder.customerType || currentTable?.customerType || 'walk_in'].defaultDiscount > 0) && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-extrabold border border-rose-200">
                            -{(currentOrder.discountPercent || CUSTOMER_TYPE_CONFIG[currentOrder.customerType || currentTable?.customerType || 'walk_in'].defaultDiscount)}%
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Tạm tính tiền món:</span>
                      <span className="font-semibold text-slate-900">{currentOrder.subtotal.toLocaleString('vi-VN')} ₫</span>
                    </div>

                    {currentOrder.discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Chiết khấu ưu đãi ({currentOrder.discountPercent}%):</span>
                        <span>
                          -{((currentOrder.subtotal * currentOrder.discountPercent) / 100).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Thuế VAT ({currentOrder.taxPercent}%):</span>
                      <span className="font-semibold text-slate-900">
                        {Math.round((currentOrder.subtotal * currentOrder.taxPercent) / 100).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-base font-extrabold text-slate-900">
                      <span>Tổng Tiền Thanh Toán:</span>
                      <span className="text-amber-600 text-lg">
                        {currentOrder.finalTotal.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Chưa có món nào trong hóa đơn bàn này.
                </div>
              )}
            </div>
          </div>

          {/* Quick Payment & Assistance (Right col) */}
          <div className="space-y-4">
            {/* VietQR Quick Payment */}
            {currentOrder && currentOrder.finalTotal > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-slate-800 font-bold text-sm">
                  <QrCode className="w-4 h-4 text-amber-500" />
                  <span>Quét QR Chuyển Khoản Nhanh</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mx-auto">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `VietQR|NH Hang Pro|${currentTable?.name}|${currentOrder.code}|${currentOrder.finalTotal}VND`
                    )}`}
                    alt="VietQR Payment Code"
                    className="w-40 h-40 mx-auto rounded-lg"
                  />
                  <p className="text-[10px] text-slate-500 mt-2 font-medium">
                    Nội dung: <span className="font-mono font-bold text-slate-800">{currentOrder.code} {currentTable?.name}</span>
                  </p>
                </div>

                <p className="text-xs text-slate-500">
                  Số tiền cần thanh toán:{' '}
                  <span className="font-extrabold text-amber-600 text-sm">
                    {currentOrder.finalTotal.toLocaleString('vi-VN')} ₫
                  </span>
                </p>
              </div>
            )}

            {/* Request Bill Button */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-slate-950 shadow-md shadow-amber-500/20 space-y-3">
              <h4 className="font-black text-base">Gọi Tính Tiền Tại Bàn</h4>
              <p className="text-xs text-slate-900/80 leading-relaxed font-medium">
                Bấm nút bên dưới để thông báo cho thu ngân và nhân viên mang phiếu thanh toán đến bàn của bạn.
              </p>
              <button
                onClick={() => {
                  setCallType('request_bill');
                  setCallNote('Khách yêu cầu tính tiền tại bàn');
                  setShowCallStaffModal(true);
                }}
                className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4" />
                <span>Yêu Cầu Thanh Toán Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 1: CHỌN MÓN & GHI CHÚ ================= */}
      {selectedItemForModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Header Image */}
            <div className="relative h-48 w-full bg-slate-100">
              <img
                src={selectedItemForModal.image}
                alt={selectedItemForModal.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedItemForModal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-950/70 text-white flex items-center justify-center hover:bg-slate-950 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {selectedItemForModal.category}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedItemForModal.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedItemForModal.description}
                </p>
                <div className="text-lg font-extrabold text-amber-600 mt-2">
                  {selectedItemForModal.price.toLocaleString('vi-VN')} ₫
                  <span className="text-xs text-slate-400 font-normal ml-1">/{selectedItemForModal.unit}</span>
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Số lượng:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-base text-slate-900 w-6 text-center">
                    {modalQuantity}
                  </span>
                  <button
                    onClick={() => setModalQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center hover:bg-amber-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú cho bếp & pha chế:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ít cay, không hành tây, ít ngọt..."
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setSelectedItemForModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddToCart}
                  className="flex-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Vào Giỏ ({(selectedItemForModal.price * modalQuantity).toLocaleString('vi-VN')} ₫)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: GỌI NHÂN VIÊN HỖ TRỢ ================= */}
      {showCallStaffModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Gọi Nhân Viên Hỗ Trợ</h3>
                  <p className="text-[11px] text-slate-500">{currentTable?.name} ({currentArea?.name})</p>
                </div>
              </div>
              <button
                onClick={() => setShowCallStaffModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick 1-Tap Request Types */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Chọn nhu cầu cần hỗ trợ:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'call_waiter', label: 'Cần Phục Vụ Hỗ Trợ', icon: '🙋' },
                  { type: 'request_bill', label: 'Yêu Cầu Thanh Toán', icon: '🧾' },
                  { type: 'refill_water', label: 'Thêm Nước / Trà Đá', icon: '🧊' },
                  { type: 'extra_cutlery', label: 'Thêm Chén / Đũa / Ly', icon: '🥢' },
                  { type: 'clean_table', label: 'Lau & Dọn Bàn', icon: '🧹' },
                  { type: 'other', label: 'Yêu Cầu Khác', icon: '💬' }
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setCallType(item.type as ServiceRequestType)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                      callType === item.type
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chi tiết yêu cầu (không bắt buộc):
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Xin thêm 3 ly trà đá và 1 đĩa ớt băm..."
                value={callNote}
                onChange={(e) => setCallNote(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowCallStaffModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                onClick={handleSendServiceRequest}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <Bell className="w-4 h-4" />
                <span>Gửi Yêu Cầu Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DRAWER: GIỎ MÓN ĐANG CHỌN ================= */}
      {showCartDrawer && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm">Giỏ Món Đang Chọn</h3>
                  <p className="text-xs text-slate-400">{currentTable?.name} • {cartTotalItems} món</p>
                </div>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length > 0 ? (
                cart.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-slate-800 text-xs">{item.menuItem.name}</h4>
                      <p className="text-[11px] text-amber-600 font-extrabold">
                        {item.menuItem.price.toLocaleString('vi-VN')} ₫
                      </p>
                      {item.note && (
                        <p className="text-[10px] text-slate-500 italic">
                          "{item.note}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartItemQuantity(idx, item.quantity - 1)}
                        className="w-6 h-6 rounded bg-white border border-slate-300 text-slate-700 text-xs font-bold flex items-center justify-center hover:bg-slate-100"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(idx, item.quantity + 1)}
                        className="w-6 h-6 rounded bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center hover:bg-amber-400"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <UtensilsCrossed className="w-12 h-12 text-slate-300" />
                  <p className="text-xs font-medium">Giỏ món của bạn đang trống</p>
                  <button
                    onClick={() => setShowCartDrawer(false)}
                    className="text-xs font-bold text-amber-600 hover:underline"
                  >
                    Khám phá thực đơn ngay
                  </button>
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">Tổng tiền món ({cartTotalItems} món):</span>
                  <span className="font-extrabold text-amber-600 text-base">
                    {cartSubtotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Primary Action: Select / Register table & send order */}
                  <button
                    onClick={() => setShowTableRegisterModal(true)}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                    <span>Đăng Ký Bàn & Gửi Đơn Vào Bếp</span>
                  </button>

                  {/* Secondary Quick Action: Confirm immediately for current table */}
                  {currentTable && (
                    <button
                      onClick={handleConfirmOrder}
                      className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Gửi nhanh cho {currentTable.name} ({currentArea?.name || 'Sảnh'})</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ĐĂNG KÝ BÀN & GỬI ĐƠN ================= */}
      <TableRegistrationModal
        isOpen={showTableRegisterModal}
        onClose={() => setShowTableRegisterModal(false)}
        cart={cart}
        onOrderSuccess={(registeredTableId) => {
          setCart([]);
          setShowCartDrawer(false);
          setShowTableRegisterModal(false);
          setCustomerTableId(registeredTableId);
          setCustomerTab('status');
        }}
      />
    </div>
  );
};
