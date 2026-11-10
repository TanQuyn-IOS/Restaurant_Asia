import React, { useState } from 'react';
import { MenuItem, MenuCategory } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { DishModal } from './DishModal';
import { ConfirmModal } from '../Common/ConfirmModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Flame,
  LayoutGrid,
  List,
  Sparkles,
  TrendingUp,
  Tag,
  CheckCircle2,
  XCircle
} from 'lucide-react';

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

export const MenuView: React.FC = () => {
  const { menuItems, deleteMenuItem, toggleItemAvailability } = useRestaurant();

  const [selectedCategory, setSelectedCategory] = useState<'all' | MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'soldout' | 'popular'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'profit'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [isDishModalOpen, setIsDishModalOpen] = useState(false);
  const [selectedDishForEdit, setSelectedDishForEdit] = useState<MenuItem | null>(null);
  const [dishToDelete, setDishToDelete] = useState<MenuItem | null>(null);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    // Category
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    // Availability
    if (filterAvailability === 'available' && !item.isAvailable) return false;
    if (filterAvailability === 'soldout' && item.isAvailable) return false;
    if (filterAvailability === 'popular' && !item.isPopular) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q));
      return matchName || matchCategory || matchTags;
    }

    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'profit') {
      const profitA = a.price - (a.cost || 0);
      const profitB = b.price - (b.cost || 0);
      return profitB - profitA;
    }
    return a.name.localeCompare(b.name, 'vi');
  });

  // Menu statistics
  const totalDishes = menuItems.length;
  const availableCount = menuItems.filter((m) => m.isAvailable).length;
  const avgPrice = Math.round(
    menuItems.reduce((sum, m) => sum + m.price, 0) / (totalDishes || 1)
  );
  const avgMargin = Math.round(
    (menuItems.reduce((sum, m) => sum + (m.price - (m.cost || 0)), 0) /
      menuItems.reduce((sum, m) => sum + m.price, 0)) *
      100
  );

  return (
    <div className="space-y-4">
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
            🍲
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tổng món trong Menu</div>
            <div className="text-lg font-bold text-slate-800">{totalDishes} món</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Đang sẵn sàng phục vụ</div>
            <div className="text-lg font-bold text-emerald-600">
              {availableCount} / {totalDishes}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Giá bán trung bình</div>
            <div className="text-lg font-bold text-slate-800">{avgPrice.toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tỷ suất lợi nhuận TB</div>
            <div className="text-lg font-bold text-purple-700">{avgMargin}%</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên món, nguyên liệu, hương vị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
            />
          </div>

          {/* Quick Filters & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none"
            >
              <option value="name">Sắp xếp: Tên A-Z</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
              <option value="profit">Lợi nhuận gộp cao nhất</option>
            </select>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Dạng danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedDishForEdit(null);
                setIsDishModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Món Mới</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'all'
                ? menuItems.length
                : menuItems.filter((i) => i.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat === 'all' ? 'Tất cả danh mục' : cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Container: Grid View or Table View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedItems.map((dish) => {
            const profit = dish.price - (dish.cost || 0);
            const margin = dish.price > 0 ? Math.round((profit / dish.price) * 100) : 0;

            return (
              <div
                key={dish.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md ${
                  !dish.isAvailable ? 'opacity-70 border-slate-200 bg-slate-50/50' : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Category badge */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                      {dish.category}
                    </span>

                    {/* Popular badge */}
                    {dish.isPopular && (
                      <span className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 shadow-md">
                        <Flame className="w-3 h-3 fill-slate-950" />
                        Bán Chạy
                      </span>
                    )}

                    {/* Sold out overlay */}
                    {!dish.isAvailable && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-2xs flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs tracking-wider uppercase shadow-lg">
                          Tạm Hết Món
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {dish.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {dish.description || 'Chưa có mô tả cho món ăn này.'}
                    </p>

                    {/* Tags & Prep time */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {dish.preparationTimeMinutes} phút
                      </span>

                      {dish.spicyLevel !== undefined && dish.spicyLevel > 0 && (
                        <span>{'🌶️'.repeat(dish.spicyLevel)}</span>
                      )}

                      {dish.tags?.map((tag, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Quick Action Buttons */}
                <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-extrabold text-amber-600">
                      {dish.price.toLocaleString('vi-VN')} ₫
                    </div>
                    <div className="text-[10px] text-slate-400">
                      /{dish.unit} • LN: +{profit.toLocaleString('vi-VN')}₫ ({margin}%)
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Availability */}
                    <button
                      onClick={() => toggleItemAvailability(dish.id)}
                      className={`p-2 rounded-xl transition-colors ${
                        dish.isAvailable
                          ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      }`}
                      title={dish.isAvailable ? 'Chuyển sang Tạm hết món' : 'Chuyển sang Còn phục vụ'}
                    >
                      {dish.isAvailable ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => {
                        setSelectedDishForEdit(dish);
                        setIsDishModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                      title="Sửa món"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => setDishToDelete(dish)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Xóa món"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Món Ăn</th>
                  <th className="px-4 py-3">Danh Mục</th>
                  <th className="px-4 py-3">Đơn Vị</th>
                  <th className="px-4 py-3">Giá Bán</th>
                  <th className="px-4 py-3">Giá Vốn</th>
                  <th className="px-4 py-3">Lợi Nhuận</th>
                  <th className="px-4 py-3">Trạng Thái</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {sortedItems.map((dish) => {
                  const profit = dish.price - (dish.cost || 0);
                  const margin = dish.price > 0 ? Math.round((profit / dish.price) * 100) : 0;
                  return (
                    <tr key={dish.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={dish.image}
                            alt={dish.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{dish.name}</div>
                            <div className="text-xs text-slate-400 line-clamp-1">{dish.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          {dish.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{dish.unit}</td>
                      <td className="px-4 py-3 font-bold text-amber-600">
                        {dish.price.toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {(dish.cost || 0).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-emerald-600">
                          +{profit.toLocaleString('vi-VN')} ₫ ({margin}%)
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleItemAvailability(dish.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            dish.isAvailable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {dish.isAvailable ? 'Đang phục vụ' : 'Hết món'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedDishForEdit(dish);
                              setIsDishModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDishToDelete(dish)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Xóa món"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedItems.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          <Tag className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-2" />
          <p className="font-semibold text-slate-700">Không tìm thấy món ăn phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc chọn danh mục khác</p>
        </div>
      )}

      {/* Dish Modal */}
      <DishModal
        isOpen={isDishModalOpen}
        onClose={() => {
          setIsDishModalOpen(false);
          setSelectedDishForEdit(null);
        }}
        dishToEdit={selectedDishForEdit}
      />

      {/* Delete Dish Confirm Modal */}
      <ConfirmModal
        isOpen={!!dishToDelete}
        title={`Xác nhận xóa món "${dishToDelete?.name}"`}
        message={`Bạn có chắc chắn muốn xóa món "${dishToDelete?.name}" khỏi thực đơn không?`}
        confirmText="Xóa Món"
        cancelText="Hủy"
        variant="danger"
        onConfirm={() => {
          if (dishToDelete) {
            deleteMenuItem(dishToDelete.id);
            setDishToDelete(null);
          }
        }}
        onClose={() => setDishToDelete(null)}
      />
    </div>
  );
};
