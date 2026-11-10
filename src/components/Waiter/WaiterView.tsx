import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  LayoutGrid,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  UtensilsCrossed,
  X,
  AlertTriangle,
  Send,
  Coffee,
  Receipt,
  Users,
  Trash2,
  CalendarClock,
  RotateCcw,
  User
} from 'lucide-react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, OrderItem, ServiceRequest, Table } from '../../types';
import { QuickOrderModal } from './QuickOrderModal';
import { TableBillReviewModal } from './TableBillReviewModal';
import { ReservationModal } from '../FloorPlan/ReservationModal';
import { ConfirmModal } from '../Common/ConfirmModal';
import { CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';

interface WaiterViewProps {
  onOpenPOSForTable?: (tableId: string) => void;
}

export type WaiterTab = 'tables_overview' | 'ready_food' | 'service_calls';

export const WaiterView: React.FC<WaiterViewProps> = ({ onOpenPOSForTable }) => {
  const {
    tables,
    activeOrders,
    serviceRequests,
    updateServiceRequestStatus,
    updateOrderItemStatus,
    updateTableStatus,
    clearTableSession,
    currentUser
  } = useRestaurant();

  const [activeSubTab, setActiveSubTab] = useState<WaiterTab>('tables_overview');
  const [tableFilter, setTableFilter] = useState<string>('all');

  // Modals state
  const [tableForQuickOrder, setTableForQuickOrder] = useState<Table | null>(null);
  const [tableForBill, setTableForBill] = useState<{ table: Table; order: Order } | null>(null);
  const [tableForReserve, setTableForReserve] = useState<Table | null>(null);
  const [tableToClear, setTableToClear] = useState<Table | null>(null);

  // Extract all dishes with status 'ready' that need to be delivered to tables
  const readyDishes: {
    orderId: string;
    orderCode: string;
    tableId: string;
    tableName: string;
    item: OrderItem;
  }[] = [];

  activeOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.status === 'ready') {
        readyDishes.push({
          orderId: order.id,
          orderCode: order.code,
          tableId: order.tableId,
          tableName: order.tableName,
          item
        });
      }
    });
  });

  // Pending service calls
  const pendingRequests = serviceRequests.filter((r) => r.status !== 'resolved');

  // Filter tables
  const filteredTables = tables.filter((t) => {
    if (tableFilter === 'all') return true;
    return t.status === tableFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-3">
                <Users className="w-3.5 h-3.5" />
                <span>Trạm Phục Vụ & Điều Phối Bàn Ăn</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Cổng Phục Vụ (Waiter Service Station)
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-2xl">
                Nhận thông báo món đã nấu xong từ Bếp để bưng ra bàn, tiếp nhận chuông yêu cầu hỗ trợ từ khách và hỗ trợ tạo order tại bàn.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Món sẵn sàng bưng:</div>
                  <div className="text-lg font-extrabold text-teal-300">
                    {readyDishes.length} món
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 px-4 py-3 rounded-2xl flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                  pendingRequests.length > 0 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-700/40 text-slate-400'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Chuông gọi hỗ trợ:</div>
                  <div className="text-lg font-extrabold text-rose-400">
                    {pendingRequests.length} yêu cầu
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 pt-6 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveSubTab('ready_food')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'ready_food'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              <span>Món Bếp Đã Nấu Xong ({readyDishes.length})</span>
              {readyDishes.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-teal-300 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('service_calls')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'service_calls'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Chuông Gọi Hỗ Trợ Bàn ({pendingRequests.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('tables_overview')}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'tables_overview'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Trực Quan Sơ Đồ Bàn ({tables.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: READY DISHES TO SERVE */}
        {activeSubTab === 'ready_food' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-teal-400" />
                <span>Danh Sách Món Ăn Bếp Đã Chuẩn Bị Xong</span>
              </h2>
              <span className="text-xs text-slate-400">
                Nhân viên bấm &ldquo;Đã Bưng Ra Bàn&rdquo; sau khi mang món đến cho khách
              </span>
            </div>

            {readyDishes.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-teal-400" />
                </div>
                <h3 className="text-base font-bold text-white">Hiện không có món nào đang chờ bưng</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                  Khi đầu bếp bấm hoàn thành món tại màn hình Bếp KDS, món sẽ lập tức xuất hiện tại đây với hiệu ứng rung chuông để nhân viên phục vụ mang ra bàn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyDishes.map(({ orderId, orderCode, tableName, item }) => (
                  <div
                    key={`${orderId}-${item.id}`}
                    className="bg-slate-900 border border-teal-500/40 rounded-3xl p-5 shadow-lg shadow-teal-500/5 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 bg-teal-500 text-slate-950 font-extrabold text-[10px] px-3 py-1 rounded-bl-xl">
                      BẾP ĐÃ NẤU XONG
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-2.5 py-1 rounded-xl border border-teal-500/30">
                          {tableName}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{orderCode}</span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-white">{item.name}</h3>
                          <div className="text-xs text-teal-400 font-semibold mt-0.5">
                            Số lượng: <strong className="text-sm text-white font-extrabold">{item.quantity}</strong> {item.unit}
                          </div>
                        </div>
                      </div>

                      {item.note && (
                        <div className="mt-3 p-2 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5">
                          <span className="font-bold">Ghi chú:</span> {item.note}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Nấu xong lúc: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <button
                        onClick={() => updateOrderItemStatus(orderId, item.id, 'served')}
                        className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã Bưng Ra Bàn</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SERVICE CALLS */}
        {activeSubTab === 'service_calls' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" />
                <span>Yêu Cầu Hỗ Trợ & Chuông Báo Tại Bàn</span>
              </h2>
            </div>

            {serviceRequests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Chưa có yêu cầu hỗ trợ nào</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Khi thực khách bấm nút gọi phục vụ từ giao diện điện thoại tại bàn, thông báo sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceRequests.map((req) => {
                  const isResolved = req.status === 'resolved';
                  const isAttending = req.status === 'attending';

                  return (
                    <div
                      key={req.id}
                      className={`bg-slate-900 border rounded-3xl p-5 shadow-lg flex flex-col justify-between ${
                        isResolved
                          ? 'border-slate-800 opacity-60'
                          : isAttending
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/20 animate-in fade-in'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white">
                            {req.tableName}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              isResolved
                                ? 'bg-slate-800 text-slate-400 border-slate-700'
                                : isAttending
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse'
                            }`}
                          >
                            {isResolved ? 'ĐÃ XỬ LÝ' : isAttending ? 'ĐANG HỖ TRỢ' : 'CHỜ PHỤC VỤ'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white mt-2">{req.title}</h3>
                        {req.note && (
                          <p className="text-xs text-slate-300 mt-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                            &ldquo;{req.note}&rdquo;
                          </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-2">
                          Thời gian: {new Date(req.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>

                      {!isResolved && (
                        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                          {!isAttending && (
                            <button
                              onClick={() =>
                                updateServiceRequestStatus(req.id, 'attending', currentUser?.fullName || 'Phục vụ')
                              }
                              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                            >
                              Đang Đến Bàn
                            </button>
                          )}
                          <button
                            onClick={() =>
                              updateServiceRequestStatus(req.id, 'resolved', currentUser?.fullName || 'Phục vụ')
                            }
                            className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
                          >
                            Hoàn Tất
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TABLES OVERVIEW */}
        {activeSubTab === 'tables_overview' && (
          <div className="space-y-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setTableFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tableFilter === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({tables.length})
              </button>
              <button
                onClick={() => setTableFilter('available')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tableFilter === 'available'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Bàn Trống ({tables.filter((t) => t.status === 'available').length})
              </button>
              <button
                onClick={() => setTableFilter('occupied')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tableFilter === 'occupied'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Đang Phục Vụ ({tables.filter((t) => t.status === 'occupied').length})
              </button>
              <button
                onClick={() => setTableFilter('reserved')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tableFilter === 'reserved'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Đã Đặt Trước ({tables.filter((t) => t.status === 'reserved').length})
              </button>
              <button
                onClick={() => setTableFilter('cleaning')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tableFilter === 'cleaning'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Cần Dọn Dẹp ({tables.filter((t) => t.status === 'cleaning').length})
              </button>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTables.map((tbl) => {
                const order = activeOrders.find((o) => o.tableId === tbl.id && o.status === 'active');
                const customerTypeKey = order?.customerType || tbl.customerType || tbl.reservation?.customerType || 'walk_in';
                const customerMeta = CUSTOMER_TYPE_CONFIG[customerTypeKey];
                const totalItemsCount = order?.items.reduce((s, i) => s + i.quantity, 0) || 0;

                return (
                  <div
                    key={tbl.id}
                    className={`bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between transition-all shadow-lg ${
                      tbl.status === 'occupied'
                        ? 'border-rose-500/40 bg-gradient-to-b from-slate-900 to-rose-950/20'
                        : tbl.status === 'reserved'
                        ? 'border-amber-500/40 bg-gradient-to-b from-slate-900 to-amber-950/20'
                        : tbl.status === 'cleaning'
                        ? 'border-teal-500/40 bg-teal-500/5'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Header of Card */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-white">{tbl.name}</span>
                          <span className="text-[11px] text-slate-400">({tbl.capacity} ghế)</span>
                        </div>

                        {/* Customer Type Badge */}
                        {(tbl.status === 'occupied' || tbl.status === 'reserved') && (
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${customerMeta.badgeBg} ${customerMeta.badgeText} ${customerMeta.badgeBorder}`}
                          >
                            <span>{customerMeta.icon}</span>
                            <span>{customerMeta.shortLabel}</span>
                          </span>
                        )}
                      </div>

                      {/* Status indicator bar */}
                      <div className="flex items-center gap-2 text-xs mb-3">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            tbl.status === 'occupied'
                              ? 'bg-rose-400 animate-pulse'
                              : tbl.status === 'reserved'
                              ? 'bg-amber-400'
                              : tbl.status === 'cleaning'
                              ? 'bg-teal-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span className="text-slate-300 font-semibold text-xs">
                          {tbl.status === 'occupied'
                            ? 'Đang có khách'
                            : tbl.status === 'reserved'
                            ? 'Đã đặt trước'
                            : tbl.status === 'cleaning'
                            ? 'Cần dọn dẹp'
                            : 'Bàn trống sẵn sàng'}
                        </span>
                      </div>

                      {/* Occupied Details */}
                      {tbl.status === 'occupied' && order && (
                        <div className="bg-slate-950/80 rounded-2xl p-3 border border-slate-800 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-mono">{order.code}</span>
                            <span className="text-slate-300 flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-500" />
                              {order.customerName || 'Khách Lẻ'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                            <span className="text-slate-400">Đã gọi: <strong>{totalItemsCount}</strong> món</span>
                            <span className="text-sm font-extrabold text-amber-400">
                              {order.finalTotal.toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Reserved Details */}
                      {tbl.status === 'reserved' && tbl.reservation && (
                        <div className="bg-amber-500/10 rounded-2xl p-3 border border-amber-500/20 space-y-1 text-xs text-amber-200">
                          <div className="font-bold flex items-center gap-1">
                            <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                            Khách: {tbl.reservation.customerName} ({tbl.reservation.guestCount} người)
                          </div>
                          <div className="text-[11px] text-amber-300/80">
                            Giờ đến: <strong>{tbl.reservation.reservationTime}</strong> • SĐT: {tbl.reservation.phone}
                          </div>
                          {tbl.reservation.notes && (
                            <div className="text-[10px] text-amber-400 italic">
                              &ldquo;{tbl.reservation.notes}&rdquo;
                            </div>
                          )}
                        </div>
                      )}

                      {/* Available table hint */}
                      {tbl.status === 'available' && (
                        <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 text-[11px] text-slate-400">
                          Bàn đang trống. Bấm nút dưới để Đặt bàn trước hoặc Mở bàn & Gọi món ngay.
                        </div>
                      )}
                    </div>

                    {/* Waiter Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      {/* CASE 1: OCCUPIED TABLE */}
                      {tbl.status === 'occupied' && order && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Gọi thêm món */}
                            <button
                              type="button"
                              onClick={() => setTableForQuickOrder(tbl)}
                              className="py-2 px-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Gọi Thêm Món</span>
                            </button>

                            {/* Kiểm tra bill trước khi thanh toán */}
                            <button
                              type="button"
                              onClick={() => setTableForBill({ table: tbl, order })}
                              className="py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Kiểm Tra Bill</span>
                            </button>
                          </div>

                          {/* Khách ăn xong bấm delete để giải phóng bàn có chỗ đặt mới */}
                          <button
                            type="button"
                            onClick={() => setTableToClear(tbl)}
                            className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-400" />
                            <span>Khách Ăn Xong • Dọn Bàn (Xóa Để Có Chỗ)</span>
                          </button>
                        </>
                      )}

                      {/* CASE 2: RESERVED TABLE */}
                      {tbl.status === 'reserved' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTableForQuickOrder(tbl)}
                            className="py-2 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            <span>Khách Đến • Gọi Món</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setTableForReserve(tbl)}
                            className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
                          >
                            Sửa Đặt Bàn
                          </button>
                        </div>
                      )}

                      {/* CASE 3: AVAILABLE TABLE */}
                      {tbl.status === 'available' && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setTableForQuickOrder(tbl)}
                            className="py-2 px-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Mở Bàn & Gọi Món</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTableForReserve(tbl)}
                            className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer flex items-center justify-center gap-1"
                          >
                            <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Đặt Bàn</span>
                          </button>
                        </div>
                      )}

                      {/* CASE 4: CLEANING TABLE */}
                      {tbl.status === 'cleaning' && (
                        <button
                          type="button"
                          onClick={() => updateTableStatus(tbl.id, 'available')}
                          className="w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Xác Nhận Đã Dọn Xong • Chuyển Sang Bàn Trống</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL 1: QUICK ORDER & CALL MORE DISHES */}
        {tableForQuickOrder && (
          <QuickOrderModal
            isOpen={!!tableForQuickOrder}
            onClose={() => setTableForQuickOrder(null)}
            table={tableForQuickOrder}
          />
        )}

        {/* MODAL 2: TABLE BILL REVIEW & CHECKOUT BEFORE PAYMENT */}
        {tableForBill && (
          <TableBillReviewModal
            isOpen={!!tableForBill}
            onClose={() => setTableForBill(null)}
            table={tableForBill.table}
            order={tableForBill.order}
          />
        )}

        {/* MODAL 3: RESERVATION MODAL */}
        {tableForReserve && (
          <ReservationModal
            isOpen={!!tableForReserve}
            onClose={() => setTableForReserve(null)}
            table={tableForReserve}
          />
        )}

        {/* MODAL 4: CONFIRM CLEAR TABLE (Khách ăn xong bấm delete để giải phóng chỗ) */}
        <ConfirmModal
          isOpen={!!tableToClear}
          title={`Khách ăn xong • Dọn bàn "${tableToClear?.name}"?`}
          message={`Bàn "${tableToClear?.name}" sẽ được xóa trạng thái ngồi và dọn sạch ngay lập tức để có chỗ cho khách mới đặt bàn. Đơn hàng sẽ được lưu vào lịch sử hoàn tất.`}
          confirmText="Dọn Bàn Xong (Giải Phóng Chỗ)"
          cancelText="Hủy Bỏ"
          variant="danger"
          onConfirm={() => {
            if (tableToClear) {
              clearTableSession(tableToClear.id);
              setTableToClear(null);
            }
          }}
          onClose={() => setTableToClear(null)}
        />
      </div>
    </div>
  );
};
