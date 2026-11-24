import { Building2, Crown, GitMerge, Search, UtensilsCrossed } from 'lucide-react';
import { formatVnd } from '@/lib/format';
import { CUSTOMER_GROUP_META } from '@/lib/labels';
import type { Ban, CustomerGroupType, KhachDoan, KhachHang, MonAn } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { ChoiceChip, Field, Input, QuantityStepper, Select } from '@/components/ui/Form';

export function OpenTableGroupFields({
  group,
  isVipEffective,
  memberQuery,
  onMemberQueryChange,
  matchingCustomers,
  customerId,
  onCustomerChange,
  selectedCustomer,
  selectedGroupVat,
  availableCombos,
  selectedComboId,
  onComboChange,
  comboQty,
  onComboQtyChange,
  mergeCandidates,
  mergeIds,
  onToggleMergeTable,
}: {
  group: CustomerGroupType;
  isVipEffective: boolean;
  memberQuery: string;
  onMemberQueryChange: (q: string) => void;
  matchingCustomers: KhachHang[];
  customerId: string;
  onCustomerChange: (id: string) => void;
  selectedCustomer: KhachHang | undefined;
  selectedGroupVat: KhachDoan | undefined;
  availableCombos: MonAn[];
  selectedComboId: string;
  onComboChange: (id: string) => void;
  comboQty: number;
  onComboQtyChange: (qty: number) => void;
  mergeCandidates: Ban[];
  mergeIds: string[];
  onToggleMergeTable: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Khu vực tra cứu thành viên (Thường / VIP / Đoàn) */}
      {group !== 'VangLai' && (
        <div className="space-y-3 rounded-lg border border-line bg-paper-warm p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Tìm nhanh theo tên / SĐT">
              {({ id }) => (
                <div className="relative">
                  <Search
                    size={15}
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
                  />
                  <Input
                    id={id}
                    value={memberQuery}
                    onChange={(e) => onMemberQueryChange(e.target.value)}
                    placeholder="Nhập tên hoặc số điện thoại…"
                    className="pl-9"
                  />
                </div>
              )}
            </Field>

            <Field label={`Hồ sơ ${CUSTOMER_GROUP_META[group].label}`}>
              {({ id }) => (
                <Select
                  id={id}
                  value={customerId}
                  onChange={(e) => onCustomerChange(e.target.value)}
                >
                  {matchingCustomers.length === 0 ? (
                    <option value="">Không tìm thấy hồ sơ khớp</option>
                  ) : (
                    matchingCustomers.map((k) => (
                      <option key={k.ma_khach_hang} value={k.ma_khach_hang}>
                        {k.ho_ten} · {k.hang_the} ({k.so_dien_thoai ?? 'Chưa có SĐT'})
                      </option>
                    ))
                  )}
                </Select>
              )}
            </Field>
          </div>

          {selectedCustomer && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2 text-xs">
              <span className="font-medium text-ink">{selectedCustomer.ho_ten}</span>
              <div className="flex flex-wrap items-center gap-2 text-ink-muted">
                <Badge tone={group === 'VIP' ? 'gold' : 'info'} size="sm">
                  Hạng {selectedCustomer.hang_the}
                </Badge>
                <span className="num">{selectedCustomer.diem_tich_luy} điểm</span>
                {selectedCustomer.so_dien_thoai && (
                  <span className="num">{selectedCustomer.so_dien_thoai}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Callout VIP Priority Flag */}
      {isVipEffective && (
        <div className="flex items-start gap-3 rounded-lg border border-gold/50 bg-gold-soft px-4 py-3 text-xs text-gold-ink">
          <Crown size={17} className="mt-0.5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Bật cờ ưu tiên bếp (VIP Priority Flag)</p>
            <p className="mt-0.5">
              Toàn bộ món gọi từ bàn này được ghim đầu hàng đợi KDS bếp và tự động áp dụng chiết khấu hạng thẻ (Silver
              5% · Gold 10% · Diamond 15%).
            </p>
          </div>
        </div>
      )}

      {/* Thông tin Công ty VAT, Combo & Ghép bàn phụ cho Khách Đoàn */}
      {group === 'Doan' && (
        <div className="space-y-4 rounded-lg border border-line bg-paper-warm p-4">
          <div className="flex items-start gap-2.5">
            <Building2 size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1 text-xs">
              <p className="font-medium text-ink">Thông tin xuất hóa đơn đỏ VAT công ty</p>
              {selectedGroupVat ? (
                <div className="mt-1 space-y-0.5 text-ink-soft">
                  <p className="font-medium">{selectedGroupVat.ten_cong_ty}</p>
                  <p>
                    MST: <span className="num font-medium">{selectedGroupVat.ma_so_thue}</span> · Đại diện:{' '}
                    {selectedGroupVat.nguoi_dai_dien}
                  </p>
                  {selectedGroupVat.dia_chi_cong_ty && <p>{selectedGroupVat.dia_chi_cong_ty}</p>}
                </div>
              ) : (
                <p className="mt-1 text-ink-muted">
                  Chọn hồ sơ khách đoàn bên trên hoặc tạo phiếu đặt bàn đoàn để lưu MST công ty.
                </p>
              )}
            </div>
          </div>

          {availableCombos.length > 0 && (
            <div className="grid grid-cols-1 items-end gap-3 border-t border-line pt-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Field
                label={
                  <span className="inline-flex items-center gap-1">
                    <UtensilsCrossed size={12} aria-hidden /> Gọi sẵn gói Combo đoàn (tùy chọn)
                  </span>
                }
              >
                {({ id }) => (
                  <Select
                    id={id}
                    value={selectedComboId}
                    onChange={(e) => onComboChange(e.target.value)}
                  >
                    <option value="">Không chọn sẵn — gọi món sau trong ngăn gọi món</option>
                    {availableCombos.map((cb) => (
                      <option key={cb.ma_mon_an} value={cb.ma_mon_an}>
                        {cb.ten_mon_an} — {formatVnd(cb.don_gia)}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {selectedComboId && (
                <QuantityStepper
                  value={comboQty}
                  onChange={onComboQtyChange}
                  min={1}
                  max={10}
                  label="Số gói combo"
                />
              )}
            </div>
          )}

          <div className="space-y-2 border-t border-line pt-3">
            <p className="eyebrow inline-flex items-center gap-1.5">
              <GitMerge size={12} aria-hidden /> Ghép bàn phụ liền kề (gom chung 1 hóa đơn tổng)
            </p>
            {mergeCandidates.length === 0 ? (
              <p className="text-xs text-ink-muted">Hiện không còn bàn trống khác để ghép thêm.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {mergeCandidates.map((b) => {
                  const picked = mergeIds.includes(b.ma_ban);
                  return (
                    <ChoiceChip
                      key={b.ma_ban}
                      selected={picked}
                      onClick={() => onToggleMergeTable(b.ma_ban)}
                    >
                      {picked ? '✓ ' : '+ '}
                      {b.ten_ban} ({b.so_ghe} ghế)
                    </ChoiceChip>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
