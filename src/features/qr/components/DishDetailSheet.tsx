import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { CUISINE_META, SPICE_LEVELS } from '@/lib/labels';
import { Button } from '@/components/ui/Button';
import { ChoiceChip, Input, QuantityStepper } from '@/components/ui/Form';
import { Sheet } from '@/components/ui/Overlay';
import { DishImage } from '@/components/domain/badges';
import type { DanhMucMon, MonAn } from '@/types/database';
import { composeDishNote, DIETARY_TAGS, type QrCartDraft } from '../qrHelpers';

interface DishDetailSheetProps {
  dish: MonAn | null;
  category: DanhMucMon | undefined;
  onClose: () => void;
  onAddToCart: (draft: QrCartDraft) => void;
}

/** Bottom-sheet tùy chỉnh độ cay (0–3), ghi chú ăn uống và số lượng món (khớp mockup 14). */
export function DishDetailSheet({
  dish,
  category,
  onClose,
  onAddToCart,
}: DishDetailSheetProps) {
  const [spiceLevel, setSpiceLevel] = useState<0 | 1 | 2 | 3>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!dish) return;
    setSpiceLevel(dish.muc_do_cay);
    setSelectedTags([]);
    setCustomNote('');
    setQty(1);
  }, [dish]);

  if (!dish) return null;

  const soldOut = dish.trang_thai_mon !== 'ConMon';
  const cuisineLabel = dish.is_combo
    ? 'Combo đoàn'
    : category
      ? CUISINE_META[category.truong_phai_am_thuc].label
      : 'Ẩm thực Á Châu';
  const defaultSpiceMeta = SPICE_LEVELS[dish.muc_do_cay];
  const lineTotal = dish.don_gia * qty;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  };

  const handleConfirm = () => {
    if (soldOut) return;
    onAddToCart({
      dish,
      so_luong: qty,
      muc_do_cay_yc: spiceLevel,
      ghi_chu_mon: composeDishNote(selectedTags, customNote),
    });
    onClose();
  };

  return (
    <Sheet
      open={Boolean(dish)}
      onClose={onClose}
      side="bottom"
      frame="mobile"
      eyebrow={cuisineLabel}
      title={dish.ten_mon_an}
      footer={
        <div className="flex items-center gap-3 pb-[env(safe-area-inset-bottom)]">
          <QuantityStepper
            value={qty}
            onChange={setQty}
            min={1}
            max={20}
            size="lg"
            label="Số lượng phần"
          />
          <Button
            variant="primary"
            size="lg"
            disabled={soldOut}
            onClick={handleConfirm}
            className="flex-1 justify-between rounded-xl px-4"
          >
            <span>{soldOut ? 'Đã hết món' : 'Thêm vào đơn'}</span>
            {!soldOut && <span className="num font-bold">{formatVnd(lineTotal)}</span>}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-sunken">
          <DishImage
            src={dish.hinh_anh_url}
            alt={dish.ten_mon_an}
            grayscale={soldOut}
            className="size-full"
          />
          {soldOut && (
            <div className="absolute inset-0 grid place-items-center bg-ink/50">
              <span className="rounded-md bg-ink/80 px-3.5 py-1.5 text-xs font-bold tracking-[0.06em] text-white uppercase">
                Hết món
              </span>
            </div>
          )}
        </div>

        <div>
          {dish.mo_ta && (
            <p className="text-sm leading-relaxed text-ink-soft">{dish.mo_ta}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <span className="num text-xl font-bold text-primary">
              {formatVnd(dish.don_gia)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <Flame
                size={14}
                aria-hidden
                className={dish.muc_do_cay > 0 ? 'text-primary' : 'text-ink-faint'}
              />
              Mặc định: {defaultSpiceMeta.label}
            </span>
          </div>
        </div>

        {/* Chọn độ cay 0–3 */}
        <section aria-labelledby="qr-spice-heading" className="space-y-2.5">
          <h3 id="qr-spice-heading" className="text-sm font-medium text-ink">
            Độ cay
          </h3>

          <div
            role="radiogroup"
            aria-label="Mức độ cay từ 0 đến 3"
            className="grid grid-cols-4 gap-2"
          >
            {SPICE_LEVELS.map((option) => {
              const selected = spiceLevel === option.level;
              return (
                <button
                  key={option.level}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={soldOut}
                  onClick={() => setSpiceLevel(option.level)}
                  className={cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-1.5 py-2 text-center transition-colors disabled:opacity-45',
                    selected
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-line bg-paper text-ink-soft hover:bg-paper-warm',
                  )}
                >
                  <span aria-hidden className="flex h-4 items-center justify-center gap-0.5">
                    {option.level === 0 ? (
                      <span className="text-sm text-ink-faint">—</span>
                    ) : (
                      Array.from({ length: option.level }).map((_, idx) => (
                        <Flame
                          key={idx}
                          size={13}
                          className={selected ? 'text-primary' : 'text-st-billing'}
                        />
                      ))
                    )}
                  </span>
                  <span className="num text-xs font-medium leading-tight">
                    {option.level === 0 ? '0 · Không' : option.short}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Ghi chú ăn uống */}
        <section aria-labelledby="qr-dietary-heading" className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="qr-dietary-heading" className="text-sm font-medium text-ink">
              Ghi chú cho bếp
            </h3>
            <span className="text-xs text-ink-muted">Tùy chọn</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {DIETARY_TAGS.map((tag) => (
              <ChoiceChip
                key={tag}
                selected={selectedTags.includes(tag)}
                disabled={soldOut}
                onClick={() => toggleTag(tag)}
                className="min-h-11 px-3.5 text-xs"
              >
                {tag}
              </ChoiceChip>
            ))}
          </div>

          <Input
            value={customNote}
            disabled={soldOut}
            maxLength={120}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Ghi chú thêm cho bếp (vd: ít muối, để riêng nước sốt...)"
            aria-label="Ghi chú thêm cho bếp"
            className="h-11 rounded-xl border-cream-line bg-paper-warm"
          />
        </section>
      </div>
    </Sheet>
  );
}
