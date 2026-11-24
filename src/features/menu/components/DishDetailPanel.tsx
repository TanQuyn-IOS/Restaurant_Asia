import { AlertTriangle, Layers, Package, PauseCircle, PlayCircle } from 'lucide-react';
import { formatVnd } from '@/lib/format';
import type { DishAvailability } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DishImage } from '@/components/domain/badges';
import type { EnrichedDishRow } from '../useMenuData';

interface DishDetailPanelProps {
  row: EnrichedDishRow;
  canToggle: boolean;
  onChangeStatus: (maMonAn: string, nextState: DishAvailability) => void;
}

/** Khối chi tiết mở rộng cho từng món ăn: định mức BOM (trừ kho khi KDS xong) hoặc thành phần gói Combo. */
export function DishDetailPanel({ row, canToggle, onChangeStatus }: DishDetailPanelProps) {
  const { dish, bomItems, comboComponents, comboStandaloneTotal } = row;
  const comboSavings = Math.max(0, comboStandaloneTotal - dish.don_gia);

  return (
    <div className="space-y-4 bg-paper-warm px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Mô tả & chuẩn phục vụ</p>
          <p className="mt-1 text-sm text-ink-soft">
            {dish.mo_ta || 'Món ăn đặc trưng chế biến nóng tại bếp Á Châu.'}
          </p>
        </div>

        {canToggle && (
          <div className="flex shrink-0 items-center gap-2">
            {dish.trang_thai_mon === 'TamNgung' ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<PlayCircle size={14} aria-hidden />}
                onClick={() => onChangeStatus(dish.ma_mon_an, 'ConMon')}
              >
                Mở bán lại
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                icon={<PauseCircle size={14} aria-hidden />}
                onClick={() => onChangeStatus(dish.ma_mon_an, 'TamNgung')}
              >
                Tạm ngưng phục vụ
              </Button>
            )}
          </div>
        )}
      </div>

      {dish.is_combo ? (
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package size={15} aria-hidden className="text-gold-ink" />
              <p className="text-sm font-medium text-ink">
                Thành phần gói Combo đoàn ({comboComponents.length} món)
              </p>
            </div>
            {comboStandaloneTotal > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                <span>
                  Giá lẻ gộp:{' '}
                  <span className="num font-medium text-ink">{formatVnd(comboStandaloneTotal)}</span>
                </span>
                {comboSavings > 0 && (
                  <Badge tone="gold" size="sm">
                    Tiết kiệm <span className="num">{formatVnd(comboSavings)}</span>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {comboComponents.length === 0 ? (
            <p className="mt-3 text-xs text-ink-muted">
              Chưa cấu hình danh sách món thành phần trong bảng `tbl_chi_tiet_combo`.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {comboComponents.map(({ item, dish: subDish, lineValue }) => (
                <li
                  key={item.ma_chi_tiet_combo}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <DishImage
                      src={subDish?.hinh_anh_url}
                      alt={subDish?.ten_mon_an ?? item.ma_mon_thanh_phan}
                      className="size-9 shrink-0 rounded-md"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {subDish?.ten_mon_an ?? item.ma_mon_thanh_phan}
                      </p>
                      {item.ghi_chu_combo && (
                        <p className="text-xs text-ink-muted">{item.ghi_chu_combo}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone="neutral" size="sm">
                      <span className="num">×{item.so_luong_mon}</span>
                    </Badge>
                    <span className="num text-xs font-medium text-ink-soft">
                      {formatVnd(lineValue)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers size={15} aria-hidden className="text-primary" />
              <p className="text-sm font-medium text-ink">
                Định mức tiêu hao nguyên liệu (BOM · tự trừ kho khi KDS Hoàn thành)
              </p>
            </div>
            <Badge tone={bomItems.length > 0 ? 'info' : 'neutral'} size="sm">
              <span className="num">{bomItems.length}</span> định mức
            </Badge>
          </div>

          {bomItems.length === 0 ? (
            <p className="mt-3 text-xs text-ink-muted">
              Món này chưa khai báo định mức nguyên liệu trong bảng `tbl_dinh_muc_mon`.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-ink-muted">
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      Nguyên liệu
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      Định lượng chuẩn
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      Hao hụt sơ chế
                    </th>
                    <th scope="col" className="pb-2 pr-4 font-medium">
                      Thực trừ / phần
                    </th>
                    <th scope="col" className="pb-2 font-medium">
                      Tồn kho hiện tại
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {bomItems.map(({ bom, ingredient, effectiveQty, isLowStock }) => (
                    <tr key={bom.ma_dinh_muc}>
                      <td className="py-2.5 pr-4 font-medium text-ink">
                        {ingredient?.ten_nguyen_lieu ?? bom.ma_nguyen_lieu}
                        <span className="num ml-1.5 font-normal text-ink-muted">
                          ({bom.ma_nguyen_lieu})
                        </span>
                      </td>
                      <td className="num py-2.5 pr-4 text-ink-soft">
                        {bom.dinh_luong_tieu_hao} {bom.don_vi_dinh_muc}
                      </td>
                      <td className="num py-2.5 pr-4 text-ink-muted">{bom.ty_le_hao_hut}%</td>
                      <td className="num py-2.5 pr-4 font-medium text-ink">
                        {effectiveQty} {bom.don_vi_dinh_muc}
                      </td>
                      <td className="py-2.5">
                        {ingredient ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="num text-ink-soft">
                              {ingredient.so_luong_ton_kho} {ingredient.don_vi_tinh}
                            </span>
                            {isLowStock && (
                              <Badge
                                tone="danger"
                                size="sm"
                                icon={<AlertTriangle size={11} aria-hidden />}
                              >
                                Tồn thấp
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
