import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { OrderItemStatus } from '../../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertTriangle,
  Bell,
  Layers,
  Utensils,
  Check
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { activeOrders, updateOrderItemStatus, showToast } = useRestaurant();
  const [filterType, setFilterType] = useState<'all' | 'cooking' | 'ready'>('all');

  // Collect all active tickets
  const ordersWithItems = activeOrders.filter((o) => o.items.length > 0);

  // Filter based on item status inside orders
  const filteredOrders = ordersWithItems.filter((order) => {
    if (filterType === 'cooking') {
      return order.items.some((i) => i.status === 'pending' || i.status === 'cooking');
    }
    if (filterType === 'ready') {
      return order.items.some((i) => i.status === 'ready');
    }
    return true;
  });

  const getElapsedMinutes = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    return Math.floor(diff / 60000);
  };

  const handleNextStatus = (orderId: string, orderItemId: string, currentStatus: OrderItemStatus) => {
    let nextStatus: OrderItemStatus = 'cooking';
    if (currentStatus === 'pending') nextStatus = 'cooking';
    else if (currentStatus === 'cooking') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'served';

    updateOrderItemStatus(orderId, orderItemId, nextStatus);

    if (nextStatus === 'ready') {
      showToast('🔔 Món đã nấu xong, sẵn sàng mang ra bàn!', 'success');
    }
  };

  const handleCompleteAllForTable = (orderId: string) => {
    const order = activeOrders.find((o) => o.id === orderId);
    if (!order) return;

    order.items.forEach((item) => {
      if (item.status !== 'served') {
        updateOrderItemStatus(orderId, item.id, 'ready');
      }
    });

    showToast(`Đã hoàn tất tất cả món của ${order.tableName}!`, 'success');
  };

  // Kitchen Metrics
  const totalPending = activeOrders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'pending').length,
    0
  );
  const totalCooking = activeOrders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'cooking').length,
    0
  );
  const totalReady = activeOrders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'ready').length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Top Kitchen Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-amber-400">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Phiếu Bếp Đang Chờ</div>
            <div className="text-lg font-bold text-slate-800">{ordersWithItems.length} phiếu</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Flame className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Món Chờ / Đang Nấu</div>
            <div className="text-lg font-bold text-amber-700">
              {totalPending + totalCooking} món
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Món Đã Nấu Xong</div>
            <div className="text-lg font-bold text-emerald-600">{totalReady} món</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
            <Clock className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Thời Gian Chế Biến TB</div>
            <div className="text-lg font-bold text-slate-800">12 phút</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất Cả Phiếu ({ordersWithItems.length})
          </button>
          <button
            onClick={() => setFilterType('cooking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'cooking'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cần Nấu ({totalPending + totalCooking})
          </button>
          <button
            onClick={() => setFilterType('ready')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'ready'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Đã Xong - Chờ Phục Vụ ({totalReady})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-medium hidden sm:block">
          Mẹo: Nhấp vào trạng thái món để chuyển ca chế biến
        </div>
      </div>

      {/* Tickets Grid (KDS Kanban) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const elapsed = getElapsedMinutes(order.createdAt);
          const isUrgent = elapsed >= 20;
          const isWarning = elapsed >= 10 && elapsed < 20;

          return (
            <div
              key={order.id}
              className={`bg-white rounded-3xl border-2 shadow-xs transition-all overflow-hidden flex flex-col justify-between ${
                isUrgent
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                  : isWarning
                  ? 'border-amber-400'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Ticket Header */}
                <div
                  className={`p-4 border-b flex items-center justify-between ${
                    isUrgent
                      ? 'bg-rose-500 text-white'
                      : isWarning
                      ? 'bg-amber-50 text-amber-950 border-amber-200'
                      : 'bg-slate-900 text-white border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base">{order.tableName}</h3>
                      <span className="text-xs opacity-80 font-mono">({order.code})</span>
                    </div>
                    <p className="text-[11px] opacity-80">
                      {order.areaName} • {order.customerName} ({order.customerCount} khách)
                    </p>
                  </div>

                  {/* Timer Badge */}
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-xs ${
                      isUrgent
                        ? 'bg-white text-rose-600 animate-pulse'
                        : isWarning
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-amber-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsed} phút</span>
                  </div>
                </div>

                {/* Ticket Items List */}
                <div className="p-4 space-y-2.5 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                  {order.items.map((item) => {
                    let statusBadge = 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                    let statusIcon = <Clock className="w-3 h-3 text-slate-500" />;
                    let statusText = 'Chờ nấu';

                    if (item.status === 'cooking') {
                      statusBadge = 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200';
                      statusIcon = <Flame className="w-3 h-3 text-amber-600 animate-bounce" />;
                      statusText = 'Đang nấu';
                    } else if (item.status === 'ready') {
                      statusBadge = 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200';
                      statusIcon = <CheckCircle2 className="w-3 h-3 text-emerald-600" />;
                      statusText = 'Đã xong';
                    } else if (item.status === 'served') {
                      statusBadge = 'bg-blue-50 text-blue-700 line-through opacity-60';
                      statusIcon = <Check className="w-3 h-3 text-blue-600" />;
                      statusText = 'Đã phục vụ';
                    }

                    return (
                      <div key={item.id} className="pt-2.5 first:pt-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-xs text-slate-900 leading-snug">
                              {item.name}
                            </span>
                          </div>

                          <button
                            onClick={() => handleNextStatus(order.id, item.id, item.status)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 ${statusBadge}`}
                          >
                            {statusIcon}
                            <span>{statusText}</span>
                          </button>
                        </div>

                        {/* Special request note */}
                        {item.note && (
                          <div className="ml-8 text-[11px] bg-rose-50 text-rose-800 px-2 py-0.5 rounded-lg border border-rose-200/80 font-medium inline-block">
                            ⚠️ Ghi chú: {item.note}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ticket Footer Action */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {order.items.length} món ăn
                </span>
                <button
                  onClick={() => handleCompleteAllForTable(order.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Xong Tất Cả Món
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center text-slate-400 space-y-3">
          <ChefHat className="w-16 h-16 mx-auto text-slate-300 stroke-1" />
          <p className="font-bold text-slate-700 text-base">Hiện không có món nào đang chờ chế biến</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Khi khách gọi món từ sơ đồ bàn hoặc màn hình POS, phiếu gọi món sẽ tự động hiển thị tại đây theo thời gian thực.
          </p>
        </div>
      )}
    </div>
  );
};
