import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { Order, CashFlowRecord, GoodsReceipt, CustomerType } from '../../types';
import { ReceiptModal } from '../POS/ReceiptModal';
import { AddCashFlowModal } from './AddCashFlowModal';
import { AddGoodsReceiptModal } from './AddGoodsReceiptModal';
import { CUSTOMER_TYPE_CONFIG } from '../../constants/customerTypes';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Users,
  Award,
  Search,
  Printer,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Wallet,
  PackageCheck,
  FileSpreadsheet
} from 'lucide-react';

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'];

export const AnalyticsView: React.FC = () => {
  const {
    completedOrders,
    activeOrders,
    menuItems,
    currentUser,
    goodsReceipts,
    updateGoodsReceiptStatus,
    deleteGoodsReceipt,
    cashFlowRecords,
    deleteCashFlowRecord
  } = useRestaurant();

  // Tab state: 'revenue' (Doanh thu) | 'cash_flow' (Dòng tiền) | 'goods' (Hàng nhập)
  const [activeTab, setActiveTab] = useState<'revenue' | 'cash_flow' | 'goods'>('revenue');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
  const [isGoodsModalOpen, setIsGoodsModalOpen] = useState(false);

  // Filters
  const [searchHistory, setSearchHistory] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [cashFlowFilter, setCashFlowFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [goodsFilter, setGoodsFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Guard for HR Manager: prompt requested "Quản lí: hạn chế thấy vài thông tin như doanh thu, ..., chỉ tập trung vào điêù hành nhân viên"
  if (currentUser?.role === 'hr_manager') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-12 shadow-xs space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Quyền Hạn Chế Dữ Liệu Tài Chính & Doanh Thu
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Tài khoản <strong>Quản lý ({currentUser.fullName})</strong> được cấu hình tập trung vào{' '}
          <span className="text-amber-700 font-bold">điều hành nhân viên & vận hành ca trực</span> để hoạt động thông suốt.
          Thông tin doanh thu, sổ quỹ dòng tiền và hóa đơn nhập hàng chỉ hiển thị cho <strong>Chủ nhà hàng (Admin)</strong>.
        </p>
        <div className="pt-2">
          <span className="inline-block text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600">
            Vui lòng sử dụng tab "Sơ Đồ Bàn" hoặc "Nhân Sự & Phân Ca" để điều hành
          </span>
        </div>
      </div>
    );
  }

  // --- REVENUE & KPI CALCULATIONS ---
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.finalTotal, 0);
  const totalOrders = completedOrders.length;
  const totalGuests = completedOrders.reduce((sum, o) => sum + (o.customerCount || 2), 0);
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Customer Type Revenue Breakdown
  const customerTypeStats: Record<CustomerType, { count: number; total: number }> = {
    walk_in: { count: 0, total: 0 },
    regular: { count: 0, total: 0 },
    vip: { count: 0, total: 0 },
    group: { count: 0, total: 0 }
  };

  completedOrders.forEach((o) => {
    const cType = o.customerType || 'walk_in';
    customerTypeStats[cType].count += 1;
    customerTypeStats[cType].total += o.finalTotal;
  });

  // Hourly / Simulated Chart Data
  const revenueChartData = [
    { hour: '07:00 - 09:00', revenue: 450000, orders: 4 },
    { hour: '09:00 - 11:00', revenue: 780000, orders: 6 },
    { hour: '11:00 - 13:00', revenue: 2150000, orders: 15 },
    { hour: '13:00 - 15:00', revenue: 890000, orders: 7 },
    { hour: '15:00 - 17:00', revenue: 620000, orders: 5 },
    { hour: '17:00 - 19:00', revenue: 2890000, orders: 18 },
    { hour: '19:00 - 21:00', revenue: 3450000, orders: 22 },
    { hour: '21:00 - 23:00', revenue: 1200000, orders: 8 }
  ];

  // Category revenue distribution
  const categoryMap: Record<string, number> = {};
  completedOrders.forEach((ord) => {
    ord.items.forEach((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId);
      const cat = menuItem?.category || 'Món khác';
      categoryMap[cat] = (categoryMap[cat] || 0) + item.price * item.quantity;
    });
  });

  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value
  }));

  const displayCategoryData =
    categoryChartData.length > 0
      ? categoryChartData
      : [
          { name: 'Món chính', value: 4500000 },
          { name: 'Món lẩu', value: 3200000 },
          { name: 'Hải sản', value: 2800000 },
          { name: 'Khai vị', value: 1500000 },
          { name: 'Đồ uống', value: 1850000 },
          { name: 'Tráng miệng', value: 650000 }
        ];

  // Top Selling Dishes calculation
  const dishSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  [...completedOrders, ...activeOrders].forEach((ord) => {
    ord.items.forEach((item) => {
      if (!dishSalesMap[item.menuItemId]) {
        dishSalesMap[item.menuItemId] = { name: item.name, quantity: 0, revenue: 0 };
      }
      dishSalesMap[item.menuItemId].quantity += item.quantity;
      dishSalesMap[item.menuItemId].revenue += item.price * item.quantity;
    });
  });

  const topSellingDishes = Object.values(dishSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Filtered Completed Orders History
  const filteredHistory = completedOrders.filter((ord) => {
    if (filterPayment !== 'all' && ord.paymentMethod !== filterPayment) return false;
    if (searchHistory.trim()) {
      const q = searchHistory.toLowerCase();
      return (
        ord.code.toLowerCase().includes(q) ||
        ord.tableName.toLowerCase().includes(q) ||
        (ord.customerName && ord.customerName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // --- CASH FLOW CALCULATIONS (CHỦ: QUẢN LÝ DÒNG TIỀN) ---
  const totalInflow = cashFlowRecords
    .filter((r) => r.type === 'inflow')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalOutflow = cashFlowRecords
    .filter((r) => r.type === 'outflow')
    .reduce((sum, r) => sum + r.amount, 0);

  const netCashFlow = totalInflow - totalOutflow;

  const filteredCashFlowRecords = cashFlowRecords.filter((r) => {
    if (cashFlowFilter !== 'all' && r.type !== cashFlowFilter) return false;
    if (searchHistory.trim()) {
      const q = searchHistory.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        (r.referenceCode && r.referenceCode.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // --- GOODS RECEIPTS CALCULATIONS (CHỦ: QUẢN LÝ HÀNG NHẬP) ---
  const totalGoodsAmount = goodsReceipts.reduce((sum, gr) => sum + gr.totalAmount, 0);
  const paidGoodsAmount = goodsReceipts
    .filter((gr) => gr.paymentStatus === 'paid')
    .reduce((sum, gr) => sum + gr.totalAmount, 0);
  const debtGoodsAmount = goodsReceipts
    .filter((gr) => gr.paymentStatus === 'pending')
    .reduce((sum, gr) => sum + gr.totalAmount, 0);

  const filteredGoodsReceipts = goodsReceipts.filter((gr) => {
    if (goodsFilter !== 'all' && gr.paymentStatus !== goodsFilter) return false;
    if (searchHistory.trim()) {
      const q = searchHistory.toLowerCase();
      return (
        gr.receiptCode.toLowerCase().includes(q) ||
        gr.supplierName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Tab Switcher for Owner: Doanh Thu • Dòng Tiền • Hàng Nhập */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => {
              setActiveTab('revenue');
              setSearchHistory('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'revenue'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <span>Doanh Thu & Đơn Hàng</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('cash_flow');
              setSearchHistory('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'cash_flow'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Quản Lý Dòng Tiền (Thu/Chi)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('goods');
              setSearchHistory('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'goods'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Quản Lý Hàng Nhập (Kho NCC)</span>
          </button>
        </div>

        {/* Action Button for specific tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'cash_flow' && (
            <button
              onClick={() => setIsCashFlowModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Giao Dịch Thu / Chi</span>
            </button>
          )}

          {activeTab === 'goods' && (
            <button
              onClick={() => setIsGoodsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Phiếu Nhập Hàng</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: DOANH THU ================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  Tổng Doanh Thu Đã Thu
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalRevenue.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Doanh số trực tiếp từ bill
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  Hóa Đơn Hoàn Thành
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalOrders} đơn
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  {activeOrders.length} đơn đang phục vụ
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  Giá Trị TB / Đơn (AOV)
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {averageOrderValue.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">Mức tiêu dùng trung bình</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">
                  Lượt Khách Đã Đón
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalGuests} khách
                </div>
                <span className="text-[11px] text-slate-400 block mt-1">
                  ~{totalOrders > 0 ? (totalGuests / totalOrders).toFixed(1) : 2} khách/bàn
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Customer Type Breakdown (Khách vãng lai, Khách thường, Khách VIP, Khách đoàn) */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                Cơ Cấu Doanh Thu Theo 4 Loại Khách Hàng (Vãng Lai, Thường, VIP, Đoàn)
              </h3>
              <span className="text-xs text-slate-400">Chính sách ưu đãi tự động áp dụng</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['walk_in', 'regular', 'vip', 'group'] as CustomerType[]).map((type) => {
                const conf = CUSTOMER_TYPE_CONFIG[type];
                const stat = customerTypeStats[type];
                const percent =
                  totalRevenue > 0 ? ((stat.total / totalRevenue) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={type}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${conf.tagClass}`}
                      >
                        <span>{conf.icon}</span>
                        <span>{conf.label}</span>
                      </span>
                      {conf.defaultDiscount > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                          -{conf.defaultDiscount}% bill
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="text-lg font-black text-slate-900">
                        {stat.total.toLocaleString('vi-VN')} ₫
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-0.5">
                        <span>{stat.count} đơn hàng</span>
                        <span className="font-semibold text-slate-700">{percent}% doanh thu</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Charts: Hourly Revenue & Category Share */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Biểu Đồ Doanh Thu Theo Khung Giờ
                  </h3>
                  <p className="text-xs text-slate-400">Cao điểm buổi trưa và tối (11:00 - 13:00 & 19:00 - 21:00)</p>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  Hôm Nay
                </span>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} ₫`, 'Doanh thu']}
                      labelStyle={{ fontWeight: 'bold' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">Tỷ Trọng Doanh Thu</h3>
                <p className="text-xs text-slate-400">Cơ cấu doanh thu theo nhóm thực đơn</p>
              </div>

              <div className="h-56 w-full my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={displayCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {displayCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${Number(val).toLocaleString('vi-VN')} ₫`, 'Doanh số']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs pt-2 border-t border-slate-100">
                {displayCategoryData.slice(0, 4).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-slate-600 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Selling Dishes & Transaction History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Món Bán Chạy Nhất (Top Sellers)
              </h3>

              <div className="space-y-3 divide-y divide-slate-100">
                {topSellingDishes.map((dish, idx) => (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-700 font-extrabold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{dish.name}</h4>
                        <span className="text-[11px] text-slate-400">Đã bán: {dish.quantity} phần</span>
                      </div>
                    </div>
                    <div className="text-right font-extrabold text-xs text-amber-600">
                      {dish.revenue.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Lịch Sử Hóa Đơn Hoàn Thành</h3>
                  <p className="text-xs text-slate-400">Xem lại chi tiết và in lại hóa đơn</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700"
                  >
                    <option value="all">Tất cả thanh toán</option>
                    <option value="cash">Tiền mặt</option>
                    <option value="transfer">Chuyển khoản</option>
                    <option value="qr">VietQR</option>
                    <option value="card">Thẻ POS</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Mã đơn / Bàn..."
                      value={searchHistory}
                      onChange={(e) => setSearchHistory(e.target.value)}
                      className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-36 focus:w-48 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Mã Đơn</th>
                      <th className="px-3 py-2.5">Bàn & Loại Khách</th>
                      <th className="px-3 py-2.5">Thời Gian</th>
                      <th className="px-3 py-2.5">PT Thanh Toán</th>
                      <th className="px-3 py-2.5 text-right">Tổng Tiền</th>
                      <th className="px-3 py-2.5 text-right">Xem Phiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredHistory.map((ord) => {
                      const cType = ord.customerType || 'walk_in';
                      const cConf = CUSTOMER_TYPE_CONFIG[cType];
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50/80">
                          <td className="px-3 py-2.5 font-bold text-slate-900">{ord.code}</td>
                          <td className="px-3 py-2.5">
                            <span className="font-semibold text-slate-800">{ord.tableName}</span>
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-medium">
                              {cConf.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-500">
                            {ord.completedAt
                              ? new Date(ord.completedAt).toLocaleTimeString('vi-VN')
                              : 'Vừa xong'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {ord.paymentMethod === 'cash' ? (
                                <>
                                  <Banknote className="w-3 h-3 text-emerald-600" />
                                  Tiền mặt
                                </>
                              ) : ord.paymentMethod === 'qr' ? (
                                <>
                                  <QrCode className="w-3 h-3 text-amber-600" />
                                  VietQR
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-3 h-3 text-blue-600" />
                                  {ord.paymentMethod === 'transfer' ? 'Chuyển khoản' : 'Thẻ POS'}
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-extrabold text-amber-600">
                            {ord.finalTotal.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedReceipt(ord);
                                setIsReceiptModalOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                              title="Xem hóa đơn"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: QUẢN LÝ DÒNG TIỀN (CHỦ QUÁN) ================= */}
      {activeTab === 'cash_flow' && (
        <div className="space-y-4">
          {/* 3 Cash Flow KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Tổng Tiền Thu Vào (Inflow)
                </span>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  +{totalInflow.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-xs text-emerald-700 mt-1 block">
                  Bán hàng, thu khác trong kỳ
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                <ArrowDownRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
                  Tổng Tiền Chi Ra (Outflow)
                </span>
                <div className="text-2xl font-black text-rose-950 mt-1">
                  -{totalOutflow.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-xs text-rose-700 mt-1 block">
                  Nhập hàng, lương nhân viên, chi phí
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-md shadow-rose-600/20">
                <ArrowUpRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center justify-between text-white">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Dòng Tiền Thuần (Net Balance)
                </span>
                <div className={`text-2xl font-black mt-1 ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {netCashFlow >= 0 ? '+' : ''}
                  {netCashFlow.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  Chênh lệch Thu - Chi thực tế
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Sổ Quỹ Thu Chi Chi Tiết */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Sổ Nhật Ký Quỹ Thu Chi Chi Tiết (Cash Flow Ledger)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo dõi chính xác từng đồng thu vào - chi ra của quán
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Type Filter */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setCashFlowFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      cashFlowFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Tất cả ({cashFlowRecords.length})
                  </button>
                  <button
                    onClick={() => setCashFlowFilter('inflow')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      cashFlowFilter === 'inflow' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Thu vào (+)
                  </button>
                  <button
                    onClick={() => setCashFlowFilter('outflow')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      cashFlowFilter === 'outflow' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Chi ra (-)
                  </button>
                </div>

                <button
                  onClick={() => setIsCashFlowModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Phiếu Mới</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Nội Dung / Diễn Giải</th>
                    <th className="px-4 py-3">Danh Mục</th>
                    <th className="px-4 py-3">Hình Thức</th>
                    <th className="px-4 py-3">Mã Chứng Từ</th>
                    <th className="px-4 py-3">Ngày & Người Lập</th>
                    <th className="px-4 py-3 text-right">Số Tiền (VNĐ)</th>
                    <th className="px-4 py-3 text-right">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCashFlowRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        {record.type === 'inflow' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            Thu (+)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Chi (-)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-xs">
                        {record.title}
                        {record.notes && (
                          <div className="text-[10px] text-slate-400 font-normal italic">
                            {record.notes}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {record.category === 'revenue_order'
                            ? 'Bán hàng'
                            : record.category === 'goods_purchase'
                            ? 'Mua hàng kho'
                            : record.category === 'staff_salary'
                            ? 'Lương nhân sự'
                            : record.category === 'utilities'
                            ? 'Điện nước mặt bằng'
                            : record.category === 'marketing'
                            ? 'Marketing'
                            : 'Khác'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-slate-600 font-medium">
                          {record.method === 'cash'
                            ? '💵 Tiền mặt'
                            : record.method === 'qr'
                            ? '📱 VietQR'
                            : '💳 Chuyển khoản'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        {record.referenceCode || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {new Date(record.date).toLocaleDateString('vi-VN')}
                        </div>
                        <span className="text-[10px] text-slate-400">{record.createdBy}</span>
                      </td>

                      <td
                        className={`px-4 py-3 text-right font-black text-sm ${
                          record.type === 'inflow' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {record.type === 'inflow' ? '+' : '-'}
                        {record.amount.toLocaleString('vi-VN')} ₫
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteCashFlowRecord(record.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa bản ghi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUẢN LÝ HÀNG NHẬP (CHỦ QUÁN) ================= */}
      {activeTab === 'goods' && (
        <div className="space-y-4">
          {/* 3 Goods Receipts KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">
                  Tổng Giá Trị Hàng Nhập
                </span>
                <div className="text-2xl font-black text-blue-950 mt-1">
                  {totalGoodsAmount.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-xs text-blue-700 mt-1 block">
                  {goodsReceipts.length} phiếu nhập kho từ nhà cung cấp
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/20">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Đã Thanh Toán Đầy Đủ
                </span>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {paidGoodsAmount.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-xs text-emerald-700 mt-1 block">
                  Tiền hàng đã chi trả xong
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  Công Nợ Nhà Cung Cấp
                </span>
                <div className="text-2xl font-black text-amber-950 mt-1">
                  {debtGoodsAmount.toLocaleString('vi-VN')} ₫
                </div>
                <span className="text-xs text-amber-700 mt-1 block">
                  Cần lên lịch thanh toán cho đối tác
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Goods Receipts Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-600" />
                  Danh Sách Phiếu Nhập Hàng Kho & Nguyên Vật Liệu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quản lý chi tiết từng lô nhập từ nhà cung cấp kèm giá vốn
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setGoodsFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      goodsFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Tất cả ({goodsReceipts.length})
                  </button>
                  <button
                    onClick={() => setGoodsFilter('paid')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      goodsFilter === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Đã thanh toán
                  </button>
                  <button
                    onClick={() => setGoodsFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      goodsFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Còn công nợ
                  </button>
                </div>

                <button
                  onClick={() => setIsGoodsModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tạo Phiếu Nhập</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredGoodsReceipts.map((gr) => (
                <div
                  key={gr.id}
                  className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg">
                        {gr.receiptCode}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{gr.supplierName}</h4>
                        <span className="text-[11px] text-slate-500">
                          {gr.supplierPhone ? `SĐT: ${gr.supplierPhone} • ` : ''}Ngày nhập:{' '}
                          {new Date(gr.receivedDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {gr.paymentStatus === 'paid' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đã thanh toán
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Ghi nợ NCC
                        </span>
                      )}

                      {gr.paymentStatus === 'pending' ? (
                        <button
                          onClick={() => updateGoodsReceiptStatus(gr.id, 'paid')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                        >
                          Xác nhận trả tiền
                        </button>
                      ) : (
                        <button
                          onClick={() => updateGoodsReceiptStatus(gr.id, 'pending')}
                          className="px-2 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all"
                        >
                          Ghi nợ lại
                        </button>
                      )}

                      <button
                        onClick={() => deleteGoodsReceipt(gr.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                        title="Xóa phiếu nhập"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items list inside receipt */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {gr.items.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{item.ingredientName}</div>
                          <span className="text-[10px] text-slate-400">
                            {item.quantity} {item.unit} × {item.unitPrice.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <span className="font-extrabold text-amber-700">
                          {item.totalPrice.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer note & total */}
                  <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
                    <div>
                      {gr.notes && <span>Ghi chú: {gr.notes}</span>}
                    </div>
                    <div className="text-right">
                      Tổng tiền phiếu nhập:{' '}
                      <span className="font-black text-base text-slate-900 ml-1">
                        {gr.totalAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceipt(null);
        }}
        order={selectedReceipt}
      />

      <AddCashFlowModal
        isOpen={isCashFlowModalOpen}
        onClose={() => setIsCashFlowModalOpen(false)}
      />

      <AddGoodsReceiptModal
        isOpen={isGoodsModalOpen}
        onClose={() => setIsGoodsModalOpen(false)}
      />
    </div>
  );
};
