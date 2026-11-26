import { Building2, CalendarCheck, Crown, FileText, Mail, MapPin, Phone, Receipt } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatDateVi, formatNumber, formatVnd } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Misc';
import { Sheet } from '@/components/ui/Overlay';
import { CustomerGroupBadge } from '@/components/domain/badges';
import {
  CARD_TIER_RULES,
  DISCOUNT_TIER_LIST,
  ORDER_STATUS_META,
  RESERVATION_STATUS_META,
} from '../customerHelpers';
import type { EnrichedCustomerRow } from '../useCustomersData';

interface CustomerDetailSheetProps {
  record: EnrichedCustomerRow | null;
  onClose: () => void;
}

/** Ngăn kéo bên phải hiển thị hồ sơ chi tiết khách hàng, quy tắc chiết khấu, VAT đoàn và lịch sử dùng bữa/đặt bàn. */
export function CustomerDetailSheet({ record, onClose }: CustomerDetailSheetProps) {
  if (!record) return null;

  const { customer, corporate, reservations, orders, totalDeposit } = record;
  const tierRule = CARD_TIER_RULES[customer.hang_the];

  return (
    <Sheet
      open={Boolean(record)}
      onClose={onClose}
      side="right"
      width="lg"
      eyebrow={customer.ma_khach_hang}
      title={customer.ho_ten}
      description={`Tham gia từ ${formatDateVi(customer.ngay_tao)}`}
      icon={<Avatar name={customer.ho_ten} size="md" />}
    >
      <div className="space-y-6">
        {/* Thông tin liên hệ nhanh */}
        <div className="rounded-lg border border-line bg-paper-warm p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <CustomerGroupBadge group={customer.loai_khach} />
              <Badge tone={tierRule.tone} size="sm">
                {tierRule.label}
              </Badge>
              {customer.loai_khach === 'VIP' && (
                <Badge tone="gold" size="sm" icon={<Crown size={11} aria-hidden />}>
                  VIP Flag KDS
                </Badge>
              )}
            </div>
            <span className="num text-sm font-medium text-ink">
              {formatNumber(customer.diem_tich_luy)} điểm
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-1 gap-2 border-t border-line pt-3 text-xs sm:grid-cols-2">
            <div className="flex items-center gap-2 text-ink-soft">
              <Phone size={13} aria-hidden className="shrink-0 text-ink-muted" />
              <dt className="sr-only">Số điện thoại</dt>
              <dd className="num">{customer.so_dien_thoai || 'Chưa đăng ký SĐT'}</dd>
            </div>
            <div className="flex items-center gap-2 text-ink-soft">
              <Mail size={13} aria-hidden className="shrink-0 text-ink-muted" />
              <dt className="sr-only">Email</dt>
              <dd className="truncate">{customer.email || 'Chưa cập nhật email'}</dd>
            </div>
          </dl>
        </div>

        {/* Quy tắc chiết khấu hạng thẻ */}
        <section aria-label="Chính sách ưu đãi và hạng thẻ" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="t-card-title text-ink">Chính sách ưu đãi theo hạng thẻ</h3>
            <span className="num text-xs font-medium text-primary">
              Mức áp dụng: giảm {tierRule.discountPercent}%
            </span>
          </div>
          <p className="text-xs text-ink-muted">{tierRule.privilege}</p>

          <div className="grid grid-cols-3 gap-2.5">
            {DISCOUNT_TIER_LIST.map((rule) => {
              const isCurrent = customer.hang_the === rule.tier;
              return (
                <div
                  key={rule.tier}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-left',
                    isCurrent
                      ? 'border-primary bg-primary-soft/60'
                      : 'border-line bg-paper-warm',
                  )}
                >
                  <p className="text-xs font-medium text-ink">{rule.tier}</p>
                  <p
                    className={cn(
                      'num mt-1 text-lg font-medium',
                      isCurrent ? 'text-primary' : 'text-ink-soft',
                    )}
                  >
                    {rule.discountPercent}%
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {isCurrent ? 'Hạng hiện tại' : 'Chiết khấu món'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Thông tin pháp nhân VAT nếu là khách Đoàn */}
        {customer.loai_khach === 'Doan' && (
          <section aria-label="Thông tin pháp nhân hóa đơn VAT" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="t-card-title flex items-center gap-2 text-ink">
                <Building2 size={16} aria-hidden className="text-primary" />
                Thông tin pháp nhân & xuất VAT
              </h3>
              {totalDeposit > 0 && (
                <Badge tone="success" size="sm">
                  Đã cọc <span className="num">{formatVnd(totalDeposit)}</span>
                </Badge>
              )}
            </div>

            {corporate ? (
              <div className="space-y-2.5 rounded-lg border border-line bg-paper p-4 text-xs">
                <div>
                  <p className="t-label">Tên công ty / đơn vị</p>
                  <p className="mt-1 text-sm font-medium text-ink">
                    {corporate.ten_cong_ty || customer.ho_ten}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 border-t border-line pt-2.5 sm:grid-cols-2">
                  <div>
                    <p className="t-label">Người đại diện</p>
                    <p className="mt-0.5 text-sm text-ink">{corporate.nguoi_dai_dien}</p>
                  </div>
                  <div>
                    <p className="t-label">Mã số thuế (MST)</p>
                    <p className="num mt-0.5 text-sm font-medium text-ink">
                      {corporate.ma_so_thue || '—'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-line pt-2.5 text-ink-soft">
                  <p className="flex items-center gap-2">
                    <Mail size={13} aria-hidden className="shrink-0 text-ink-muted" />
                    <span>Email VAT: {corporate.email_nhan_hoa_don || '—'}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin size={13} aria-hidden className="mt-0.5 shrink-0 text-ink-muted" />
                    <span>{corporate.dia_chi_cong_ty || '—'}</span>
                  </p>
                  {corporate.ghi_chu_hop_dong && (
                    <p className="flex items-start gap-2 rounded-md bg-paper-warm p-2.5 text-ink-muted">
                      <FileText size={13} aria-hidden className="mt-0.5 shrink-0" />
                      <span>{corporate.ghi_chu_hop_dong}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="rounded-lg border border-line bg-paper-warm p-3 text-xs text-ink-muted">
                Chưa cập nhật thông tin pháp nhân VAT cho khách đoàn này.
              </p>
            )}
          </section>
        )}

        {/* Lịch sử phiếu đặt bàn & đặt cọc */}
        <section aria-label="Lịch sử đặt bàn" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="t-card-title flex items-center gap-2 text-ink">
              <CalendarCheck size={16} aria-hidden className="text-ink-muted" />
              Phiếu đặt bàn & đặt cọc
            </h3>
            <span className="num text-xs text-ink-muted">{reservations.length} phiếu</span>
          </div>

          {reservations.length === 0 ? (
            <p className="rounded-lg border border-line bg-paper-warm p-3.5 text-xs text-ink-muted">
              Khách hàng chưa có phiếu đặt bàn trước nào.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {reservations.map(({ reservation, table }) => {
                const st = RESERVATION_STATUS_META[reservation.trang_thai_dat];
                return (
                  <li
                    key={reservation.ma_phieu_dat}
                    className="rounded-lg border border-line bg-paper p-3.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="num font-medium text-ink">
                        {reservation.ma_phieu_dat} · {table?.ten_ban ?? reservation.ma_ban}
                      </span>
                      <Badge tone={st.tone} dot size="sm">
                        {st.label}
                      </Badge>
                    </div>
                    <div className="num mt-1.5 flex flex-wrap items-center justify-between gap-2 text-ink-muted">
                      <span>
                        Hẹn đến: {formatDateVi(reservation.thoi_gian_den)} ·{' '}
                        {formatClock(reservation.thoi_gian_den)} ({reservation.so_nguoi} khách)
                      </span>
                      <span className="font-medium text-ink">
                        Cọc: {formatVnd(reservation.tien_dat_coc)}
                      </span>
                    </div>
                    {reservation.ghi_chu_tiec && (
                      <p className="mt-1.5 text-ink-muted">{reservation.ghi_chu_tiec}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Lịch sử dùng bữa & hóa đơn */}
        <section aria-label="Lịch sử dùng bữa và hóa đơn" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="t-card-title flex items-center gap-2 text-ink">
              <Receipt size={16} aria-hidden className="text-ink-muted" />
              Lịch sử đơn gọi món & hóa đơn
            </h3>
            <span className="num text-xs text-ink-muted">{orders.length} phiên</span>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-lg border border-line bg-paper-warm p-3.5 text-xs text-ink-muted">
              Chưa ghi nhận đơn gọi món nào gắn với hồ sơ khách hàng này.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {orders.map(({ order, table, invoice, itemCount, completedAmount }) => {
                const st = ORDER_STATUS_META[order.trang_thai_order];
                return (
                  <li
                    key={order.ma_order}
                    className="rounded-lg border border-line bg-paper p-3.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="num font-medium text-ink">
                        {order.ma_order} · {table?.ten_ban ?? order.ma_ban}
                      </span>
                      <Badge tone={st.tone} dot size="sm">
                        {st.label}
                      </Badge>
                    </div>
                    <div className="num mt-1.5 flex flex-wrap items-center justify-between gap-2 text-ink-muted">
                      <span>
                        Mở bàn: {formatDateVi(order.thoi_gian_mo_ban)} ·{' '}
                        {formatClock(order.thoi_gian_mo_ban)} · {itemCount} phần
                      </span>
                      <span className="font-medium text-ink">
                        {invoice
                          ? formatVnd(invoice.tong_tien_phai_tra)
                          : formatVnd(completedAmount)}
                      </span>
                    </div>
                    {invoice && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-2">
                        <Badge tone={invoice.trang_thai_tt === 'DaThanhToan' ? 'success' : 'billing'} size="sm">
                          {invoice.ma_hoa_don} ·{' '}
                          {invoice.trang_thai_tt === 'DaThanhToan' ? 'Đã thu' : 'Chờ thu'}
                        </Badge>
                        {invoice.xuat_vat && (
                          <Badge tone="info" size="sm">
                            HĐ VAT {invoice.ma_so_thue_vat ? `· ${invoice.ma_so_thue_vat}` : ''}
                          </Badge>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Sheet>
  );
}
