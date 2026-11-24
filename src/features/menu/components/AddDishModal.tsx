import { useEffect, useState, type FormEvent } from 'react';
import { Check, UtensilsCrossed } from 'lucide-react';
import { CUISINE_META, SPICE_LEVELS } from '@/lib/labels';
import type { DanhMucMon, MonAn } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { ChoiceChip, Field, Input, Select, Switch, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import {
  validateDishForm,
  type DishFormErrors,
  type DishFormValues,
} from '../menuHelpers';

interface AddDishModalProps {
  open: boolean;
  onClose: () => void;
  categories: DanhMucMon[];
  onSubmit: (dish: Omit<MonAn, 'ma_mon_an'>) => void;
}

function createInitialValues(defaultCategoryId: string): DishFormValues {
  return {
    ten_mon_an: '',
    ma_danh_muc: defaultCategoryId,
    don_gia: '195000',
    muc_do_cay: 1,
    thoi_gian_nau_tb: '12',
    hinh_anh_url: '',
    mo_ta: '',
    is_combo: defaultCategoryId === 'DM-COMBO',
  };
}

export function AddDishModal({ open, onClose, categories, onSubmit }: AddDishModalProps) {
  const defaultCategoryId = categories[0]?.ma_danh_muc ?? 'DM-VN';
  const [values, setValues] = useState<DishFormValues>(() => createInitialValues(defaultCategoryId));
  const [errors, setErrors] = useState<DishFormErrors>({});

  useEffect(() => {
    if (open) {
      setValues(createInitialValues(defaultCategoryId));
      setErrors({});
    }
  }, [open, defaultCategoryId]);

  const updateField = <K extends keyof DishFormValues>(key: K, value: DishFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key in errors) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleCategoryChange = (maDanhMuc: string) => {
    setValues((prev) => ({
      ...prev,
      ma_danh_muc: maDanhMuc,
      is_combo: maDanhMuc === 'DM-COMBO',
    }));
    setErrors((prev) => ({ ...prev, ma_danh_muc: undefined }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validCatIds = new Set(categories.map((c) => c.ma_danh_muc));
    const result = validateDishForm(values, validCatIds);
    if (!result.valid || !result.parsed) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.parsed);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<UtensilsCrossed size={20} />}
      eyebrow="Thực đơn Á Châu · MOD-03"
      title="Thêm món mới vào thực đơn"
      description="Món mới sẽ có sẵn ngay ở trạng thái Còn món trên App phục vụ và Cổng gọi món Mobile QR."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button type="submit" form="add-dish-form" variant="primary" icon={<Check size={16} />}>
            Lưu món mới
          </Button>
        </>
      }
    >
      <form id="add-dish-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Tên món ăn *" error={errors.ten_mon_an}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              data-autofocus
              aria-describedby={describedBy}
              invalid={invalid}
              placeholder="VD: Cá tuyết hấp xì dầu Thượng Hải"
              value={values.ten_mon_an}
              onChange={(e) => updateField('ten_mon_an', e.target.value)}
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Danh mục ẩm thực *" error={errors.ma_danh_muc}>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={values.ma_danh_muc}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.ma_danh_muc} value={cat.ma_danh_muc}>
                    {cat.ten_danh_muc} ({CUISINE_META[cat.truong_phai_am_thuc].label})
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Đơn giá bán (VNĐ) *" error={errors.don_gia}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={1000}
                step={5000}
                aria-describedby={describedBy}
                invalid={invalid}
                className="num"
                value={values.don_gia}
                onChange={(e) => updateField('don_gia', e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Thời gian chế biến TB (phút) *" error={errors.thoi_gian_nau_tb}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={1}
                max={240}
                aria-describedby={describedBy}
                invalid={invalid}
                className="num"
                value={values.thoi_gian_nau_tb}
                onChange={(e) => updateField('thoi_gian_nau_tb', e.target.value)}
              />
            )}
          </Field>

          <Field
            label="URL hình ảnh (tùy chọn)"
            hint="Để trống nếu chưa có ảnh — hệ thống sẽ dùng khung mặc định."
            error={errors.hinh_anh_url}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="url"
                aria-describedby={describedBy}
                invalid={invalid}
                placeholder="https://images.unsplash.com/..."
                value={values.hinh_anh_url}
                onChange={(e) => updateField('hinh_anh_url', e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="space-y-1.5">
          <p className="eyebrow">Cấp độ cay tiêu chuẩn (0–3)</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Chọn cấp độ cay tiêu chuẩn">
            {SPICE_LEVELS.map((sp) => (
              <ChoiceChip
                key={sp.level}
                selected={values.muc_do_cay === sp.level}
                onClick={() => updateField('muc_do_cay', sp.level)}
              >
                {sp.short}
              </ChoiceChip>
            ))}
          </div>
          {errors.muc_do_cay && <p className="text-xs text-st-serving-ink">{errors.muc_do_cay}</p>}
        </div>

        <Field label="Mô tả món ăn (tùy chọn)">
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              placeholder="Mô tả ngắn gọn nguyên liệu chính, nước sốt hoặc cách thưởng thức..."
              value={values.mo_ta}
              onChange={(e) => updateField('mo_ta', e.target.value)}
            />
          )}
        </Field>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper-warm px-4 py-3">
          <div>
            <p className="text-sm font-medium text-ink">Đánh dấu là gói Combo tiệc đoàn</p>
            <p className="text-xs text-ink-muted">
              Gắn nhãn Combo và hiển thị riêng trong bộ lọc thực đơn khách đoàn.
            </p>
          </div>
          <Switch
            checked={values.is_combo}
            onChange={(next) => updateField('is_combo', next)}
            label="Đánh dấu là gói Combo tiệc đoàn"
          />
        </div>
      </form>
    </Modal>
  );
}
