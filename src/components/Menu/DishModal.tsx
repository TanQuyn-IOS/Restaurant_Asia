import React, { useState, useEffect } from 'react';
import { MenuItem, MenuCategory } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { X, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishToEdit?: MenuItem | null;
}

const CATEGORIES: MenuCategory[] = [
  'Khai vị',
  'Món chính',
  'Món lẩu',
  'Hải sản',
  'Món chay',
  'Tráng miệng',
  'Đồ uống',
  'Combo'
];

const PRESET_IMAGES = [
  { label: 'Phở / Món Nước', url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80' },
  { label: 'Gỏi cuốn / Khai vị', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
  { label: 'Chả giò chiên', url: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80' },
  { label: 'Bún chả / Thịt nướng', url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cơm tấm / Cơm chiên', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Bò bít tết / Bò lúc lắc', url: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80' },
  { label: 'Lẩu hải sản', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hải sản nướng', url: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80' },
  { label: 'Đồ uống trà hoa quả', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cà phê', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80' },
  { label: 'Món chay thanh tịnh', url: 'https://images.unsplash.com/photo-1546069901-d72d242948c3?auto=format&fit=crop&w=600&q=80' },
  { label: 'Chè / Tráng miệng', url: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&q=80' }
];

export const DishModal: React.FC<DishModalProps> = ({
  isOpen,
  onClose,
  dishToEdit
}) => {
  const { addMenuItem, updateMenuItem } = useRestaurant();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>('Món chính');
  const [price, setPrice] = useState<number>(75000);
  const [cost, setCost] = useState<number>(30000);
  const [unit, setUnit] = useState<string>('dĩa');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [preparationTimeMinutes, setPreparationTimeMinutes] = useState<number>(10);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isPopular, setIsPopular] = useState<boolean>(false);
  const [spicyLevel, setSpicyLevel] = useState<0 | 1 | 2 | 3>(0);
  const [tagsInput, setTagsInput] = useState<string>('');

  useEffect(() => {
    if (dishToEdit) {
      setName(dishToEdit.name);
      setCategory(dishToEdit.category);
      setPrice(dishToEdit.price);
      setCost(dishToEdit.cost || 0);
      setUnit(dishToEdit.unit || 'phần');
      setDescription(dishToEdit.description);
      setImage(dishToEdit.image);
      setPreparationTimeMinutes(dishToEdit.preparationTimeMinutes);
      setIsAvailable(dishToEdit.isAvailable);
      setIsPopular(dishToEdit.isPopular || false);
      setSpicyLevel(dishToEdit.spicyLevel || 0);
      setTagsInput(dishToEdit.tags ? dishToEdit.tags.join(', ') : '');
    } else {
      setName('');
      setCategory('Món chính');
      setPrice(85000);
      setCost(35000);
      setUnit('dĩa');
      setDescription('');
      setImage(PRESET_IMAGES[0].url);
      setPreparationTimeMinutes(12);
      setIsAvailable(true);
      setIsPopular(false);
      setSpicyLevel(0);
      setTagsInput('Tươi ngon, Nóng hổi');
    }
  }, [dishToEdit, isOpen]);

  if (!isOpen) return null;

  const profit = price - cost;
  const profitMargin = price > 0 ? Math.round((profit / price) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const dishData = {
      name: name.trim(),
      category,
      price: Number(price),
      cost: Number(cost),
      unit: unit.trim() || 'phần',
      description: description.trim(),
      image: image || PRESET_IMAGES[0].url,
      preparationTimeMinutes: Number(preparationTimeMinutes),
      isAvailable,
      isPopular,
      spicyLevel,
      tags
    };

    if (dishToEdit) {
      updateMenuItem(dishToEdit.id, dishData);
    } else {
      addMenuItem(dishData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {dishToEdit ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Mới Vào Thực Đơn'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Dish Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Tên món ăn / đồ uống *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Cơm Chiên Hải Sản Hoàng Kim"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Danh mục *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MenuCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing & Cost Calculation */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Giá bán (VND) *
              </label>
              <input
                type="number"
                required
                step={1000}
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Giá vốn nguyên liệu
              </label>
              <input
                type="number"
                step={1000}
                min={0}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Lợi nhuận gộp
              </label>
              <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <span className="font-bold text-emerald-700">+{profit.toLocaleString('vi-VN')} ₫</span>
                <span className="text-emerald-600 block text-[10px]">Tỷ suất: {profitMargin}%</span>
              </div>
            </div>
          </div>

          {/* Unit, Prep Time, Spice Level */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Đơn vị tính
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {['dĩa', 'phần', 'tô', 'nồi', 'ly', 'lon', 'chai', 'con', 'tộ'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Thời gian nấu (phút)
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={preparationTimeMinutes}
                onChange={(e) => setPreparationTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Độ cay (0 - 3)
              </label>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSpicyLevel(lvl as 0 | 1 | 2 | 3)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border ${
                      spicyLevel === lvl
                        ? 'bg-rose-500 text-white border-rose-500'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {lvl === 0 ? '0' : '🌶️'.repeat(lvl)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Mô tả hương vị & nguyên liệu
            </label>
            <textarea
              rows={2}
              placeholder="Mô tả ngắn về nguyên liệu tươi ngon, cách chế biến..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
            />
          </div>

          {/* Image Presets or Custom URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Hình ảnh đại diện món ăn</span>
              <span className="text-[11px] text-slate-400 font-normal">Chọn ảnh mẫu hoặc nhập URL</span>
            </label>

            {/* Quick preset selector */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-2">
              {PRESET_IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImage(img.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                    image === img.url ? 'border-amber-500 ring-2 ring-amber-400/50' : 'border-transparent hover:opacity-90'
                  }`}
                  title={img.label}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 text-[9px] text-white truncate px-1 py-0.5 text-center">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Tags & Popular Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Thẻ tag (ngăn cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                placeholder="VD: Đặc sản, Best seller, Ít đường..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                />
                <span>Món Bán Chạy (Best Seller)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400"
                />
                <span>Còn phục vụ</span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {dishToEdit ? 'Lưu Thay Đổi' : 'Thêm Vào Thực Đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
