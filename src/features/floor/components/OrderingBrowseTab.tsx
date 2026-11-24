import { useMemo, useState } from 'react';
import { Clock, Flame, Plus, Search, Send, Trash2, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatVnd } from '@/lib/format';
import { CUISINE_META, SPICE_LEVELS } from '@/lib/labels';
import type { CuisineSchool, DanhMucMon, MonAn } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { ChoiceChip, Input, QuantityStepper } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Misc';
import { DishAvailabilityBadge, DishImage, SpiceMeter } from '@/components/domain/badges';
import { filterDishesByCategory, type DishFilterKey } from '../floorHelpers';

export interface DraftOrderLine {
  key: string;
  dish: MonAn;
  so_luong: number;
  muc_do_cay_yc: 0 | 1 | 2 | 3;
  ghi_chu_mon: string;
}

const CUISINE_FILTERS: { id: DishFilterKey; label: string }[] = [
  { id: 'ALL', label: 'Tất cả' },
  ...(Object.keys(CUISINE_META) as CuisineSchool[]).map((k) => ({
    id: k as DishFilterKey,
    label: CUISINE_META[k].label,
  })),
  { id: 'COMBO', label: 'Combo' },
];

const QUICK_NOTES = ['Ít hành lá', 'Không hành', 'Ít dầu mỡ', 'Nước dùng nóng', 'Lên trước'];

export function OrderingBrowseTab({
  dishes,
  categories,
  canSubmit,
  disabledReason,
  onSubmitToKitchen,
}: {
  dishes: MonAn[];
  categories: DanhMucMon[];
  canSubmit: boolean;
  disabledReason: string | null;
  onSubmitToKitchen: (
    items: {
      ma_mon_an: string;
      so_luong: number;
      muc_do_cay_yc: 0 | 1 | 2 | 3;
      ghi_chu_mon: string;
    }[],
  ) => void;
}) {
  const [filter, setFilter] = useState<DishFilterKey>('ALL');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<DraftOrderLine[]>([]);

  const filtered = useMemo(
    () => filterDishesByCategory(dishes, categories, filter, query),
    [dishes, categories, filter, query],
  );

  const draftSubtotal = useMemo(
    () => draft.reduce((sum, line) => sum + line.dish.don_gia * line.so_luong, 0),
    [draft],
  );

  const draftTotalCount = useMemo(
    () => draft.reduce((sum, line) => sum + line.so_luong, 0),
    [draft],
  );

  const addDishToDraft = (dish: MonAn) => {
    if (!canSubmit || dish.trang_thai_mon !== 'ConMon') return;
    setDraft((prev) => {
      const idx = prev.findIndex((l) => l.dish.ma_mon_an === dish.ma_mon_an && l.ghi_chu_mon === '');
      if (idx >= 0) {
        return prev.map((l, i) => (i === idx ? { ...l, so_luong: l.so_luong + 1 } : l));
      }
      return [
        {
          key: `${dish.ma_mon_an}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          dish,
          so_luong: 1,
          muc_do_cay_yc: dish.muc_do_cay,
          ghi_chu_mon: '',
        },
        ...prev,
      ];
    });
  };

  const updateLine = (key: string, patch: Partial<Omit<DraftOrderLine, 'key' | 'dish'>>) => {
    setDraft((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    setDraft((prev) => prev.filter((l) => l.key !== key));
  };

  const handleSendKitchen = () => {
    if (!canSubmit || draft.length === 0) return;
    onSubmitToKitchen(
      draft.map((l) => ({
        ma_mon_an: l.dish.ma_mon_an,
        so_luong: l.so_luong,
        muc_do_cay_yc: l.muc_do_cay_yc,
        ghi_chu_mon: l.ghi_chu_mon.trim(),
      })),
    );
    setDraft([]);
  };

  return (
    <div className="space-y-4">
      {disabledReason && (
        <div className="rounded-lg border border-st-booked/40 bg-st-booked-soft px-3.5 py-2.5 text-xs text-st-booked-ink">
          {disabledReason}
        </div>
      )}

      {/* Khay món chuẩn bị gửi bếp */}
      {draft.length > 0 && (
        <div className="space-y-3 rounded-lg border border-primary/35 bg-primary-soft/50 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-ink">Khay gọi món mới</p>
              <Badge tone="primary" size="sm">
                <span className="num">{draftTotalCount}</span> phần
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="num text-sm font-bold text-primary">{formatVnd(draftSubtotal)}</span>
              <Button
                variant="primary"
                size="sm"
                disabled={!canSubmit}
                onClick={handleSendKitchen}
                icon={<Send size={14} />}
              >
                Gửi bếp
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {draft.map((line) => (
              <div key={line.key} className="space-y-2.5 rounded-md border border-line bg-paper p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{line.dish.ten_mon_an}</p>
                    <p className="num text-xs text-ink-muted">
                      {formatVnd(line.dish.don_gia)} × {line.so_luong} ={' '}
                      <span className="font-medium text-ink">
                        {formatVnd(line.dish.don_gia * line.so_luong)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <QuantityStepper
                      value={line.so_luong}
                      onChange={(next) => updateLine(line.key, { so_luong: next })}
                      min={1}
                      max={20}
                      label={`Số lượng ${line.dish.ten_mon_an}`}
                    />
                    <IconButton
                      label={`Xóa ${line.dish.ten_mon_an} khỏi khay`}
                      onClick={() => removeLine(line.key)}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </div>
                </div>

                {/* Chọn độ cay 0-3 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                    <Flame size={12} aria-hidden className="text-st-serving-ink" /> Độ cay:
                  </span>
                  {SPICE_LEVELS.map((sp) => (
                    <button
                      key={sp.level}
                      type="button"
                      aria-pressed={line.muc_do_cay_yc === sp.level}
                      onClick={() => updateLine(line.key, { muc_do_cay_yc: sp.level })}
                      className={cn(
                        'rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                        line.muc_do_cay_yc === sp.level
                          ? 'border-primary bg-primary-soft text-primary'
                          : 'border-line bg-paper-warm text-ink-soft hover:bg-sunken',
                      )}
                    >
                      {sp.short}
                    </button>
                  ))}
                </div>

                {/* Ghi chú bếp + tag chọn nhanh */}
                <div className="space-y-1.5">
                  <Input
                    aria-label={`Ghi chú món ${line.dish.ten_mon_an}`}
                    placeholder="Ghi chú cho bếp (VD: ít hành, không đậu phộng)…"
                    value={line.ghi_chu_mon}
                    onChange={(e) => updateLine(line.key, { ghi_chu_mon: e.target.value })}
                    className="h-9 text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NOTES.map((note) => {
                      const active = line.ghi_chu_mon === note;
                      return (
                        <button
                          key={note}
                          type="button"
                          onClick={() =>
                            updateLine(line.key, { ghi_chu_mon: active ? '' : note })
                          }
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                            active
                              ? 'border-gold bg-gold-soft text-gold-ink'
                              : 'border-line bg-paper text-ink-muted hover:bg-sunken',
                          )}
                        >
                          {note}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tìm kiếm + Lọc 5 trường phái ẩm thực + Combo */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search
            size={15}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
          />
          <Input
            aria-label="Tìm món ăn theo tên"
            placeholder="Tìm món ăn, combo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="scroll-quiet flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Lọc theo ẩm thực">
          {CUISINE_FILTERS.map((c) => (
            <ChoiceChip key={c.id} selected={filter === c.id} onClick={() => setFilter(c.id)}>
              {c.label}
            </ChoiceChip>
          ))}
        </div>
      </div>

      {/* Danh sách món ăn */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<UtensilsCrossed size={22} />}
          title="Không tìm thấy món phù hợp"
          description="Thử chọn bộ lọc ẩm thực khác hoặc xóa từ khóa tìm kiếm."
        />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {filtered.map((dish) => {
            const isSoldOut = dish.trang_thai_mon !== 'ConMon';
            const inDraftQty = draft
              .filter((l) => l.dish.ma_mon_an === dish.ma_mon_an)
              .reduce((sum, l) => sum + l.so_luong, 0);

            return (
              <div
                key={dish.ma_mon_an}
                className={cn(
                  'flex gap-3 rounded-lg border border-line bg-paper p-3 transition-colors',
                  isSoldOut ? 'bg-paper-warm opacity-70' : 'hover:border-line-strong',
                )}
              >
                <DishImage
                  src={dish.hinh_anh_url}
                  alt={dish.ten_mon_an}
                  grayscale={isSoldOut}
                  className="size-16 shrink-0 rounded-md"
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium text-ink">{dish.ten_mon_an}</p>
                    {isSoldOut && <DishAvailabilityBadge status={dish.trang_thai_mon} />}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <SpiceMeter level={dish.muc_do_cay} />
                    <span className="num inline-flex items-center gap-1">
                      <Clock size={11} aria-hidden />
                      {dish.thoi_gian_nau_tb}p
                    </span>
                    {dish.is_combo && (
                      <Badge tone="gold" size="sm">
                        Combo
                      </Badge>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="num text-sm font-bold text-primary">
                      {formatVnd(dish.don_gia)}
                    </span>
                    <Button
                      size="sm"
                      variant={inDraftQty > 0 ? 'primary' : 'secondary'}
                      disabled={isSoldOut || !canSubmit}
                      onClick={() => addDishToDraft(dish)}
                      title={
                        isSoldOut
                          ? 'Món hiện không thể gọi (Hết món / Tạm ngưng)'
                          : disabledReason ?? 'Thêm vào khay gọi món'
                      }
                      icon={<Plus size={13} />}
                    >
                      {isSoldOut ? 'Hết món' : inDraftQty > 0 ? `Thêm (${inDraftQty})` : 'Chọn'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
