import { Building2, CalendarCheck, ChevronRight, Mail, Users } from 'lucide-react';
import { formatClock, formatDateVi, formatVnd } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { EmptyState, Table, Td, Th, Tr } from '@/components/ui/Misc';
import { CustomerGroupBadge } from '@/components/domain/badges';
import { RESERVATION_STATUS_META } from '../customerHelpers';
import type { CorporateProfileRecord, CustomerReservationRecord } from '../useCustomersData';

interface CorporateAndReservationsProps {
  corporates: CorporateProfileRecord[];
  reservations: CustomerReservationRecord[];
  onSelectCustomerId: (maKhachHang: string) => void;
}

/** Khối 7/5 bên dưới danh bạ: Pháp nhân Khách đoàn (VAT) & Phiếu đặt bàn kèm tiền đặt cọc. */
export function CorporateAndReservations({
  corporates,
  reservations,
  onSelectCustomerId,
}: CorporateAndReservationsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Trái (7/12): Hồ sơ pháp nhân Khách đoàn & xuất hóa đơn VAT */}
      <Card className="lg:col-span-7">
        <CardHeader
          title="Pháp nhân khách đoàn & hóa đơn VAT"
          subtitle="Thông tin đối chiếu mã số thuế từ bảng tbl_khach_doan khi Thu ngân xuất hóa đơn điện tử"
          action={
            <Badge tone="primary" icon={<Building2 size={12} aria-hidden />}>
              <span className="num">{corporates.length}</span> doanh nghiệp
            </Badge>
          }
        />

        {corporates.length === 0 ? (
          <EmptyState
            icon={<Building2 size={22} />}
            title="Chưa có hồ sơ khách đoàn"
            description="Khi tạo phiếu đặt bàn cho nhóm Khách đoàn, hồ sơ pháp nhân VAT sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Công ty & người đại diện</Th>
                  <Th>Mã số thuế</Th>
                  <Th>Email nhận VAT</Th>
                  <Th className="text-right">Tổng cọc</Th>
                  <Th>
                    <span className="sr-only">Xem chi tiết</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {corporates.map(({ corporate, customer, totalDeposit }) => (
                  <Tr key={corporate.ma_khach_hang}>
                    <Td>
                      <button
                        type="button"
                        onClick={() => onSelectCustomerId(corporate.ma_khach_hang)}
                        className="text-left"
                      >
                        <p className="font-medium text-ink hover:text-primary">
                          {corporate.ten_cong_ty || customer?.ho_ten || corporate.ma_khach_hang}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          Đại diện: {corporate.nguoi_dai_dien}
                          {corporate.dia_chi_cong_ty ? ` · ${corporate.dia_chi_cong_ty}` : ''}
                        </p>
                      </button>
                    </Td>
                    <Td>
                      <span className="num rounded-md bg-sunken px-2 py-0.5 text-xs font-medium text-ink">
                        {corporate.ma_so_thue || 'Chưa cập nhật'}
                      </span>
                    </Td>
                    <Td>
                      {corporate.email_nhan_hoa_don ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                          <Mail size={13} aria-hidden className="shrink-0 text-ink-muted" />
                          {corporate.email_nhan_hoa_don}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-muted">—</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <span className="num text-sm font-medium text-ink">
                        {formatVnd(totalDeposit)}
                      </span>
                    </Td>
                    <Td className="w-10 text-right">
                      <button
                        type="button"
                        aria-label={`Xem hồ sơ ${corporate.ten_cong_ty || corporate.ma_khach_hang}`}
                        onClick={() => onSelectCustomerId(corporate.ma_khach_hang)}
                        className="grid size-8 place-items-center rounded-md text-ink-muted transition-colors hover:bg-sunken hover:text-ink"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* Phải (5/12): Phiếu đặt bàn & tiền đặt cọc đang hoạt động */}
      <Card className="lg:col-span-5">
        <CardHeader
          title="Phiếu đặt bàn & tiền đặt cọc"
          subtitle="Tự động đối trừ tiền cọc khi chốt hóa đơn tại quầy Thu ngân"
          action={
            <Badge tone="warning" dot>
              <span className="num">{reservations.length}</span> phiếu
            </Badge>
          }
        />
        <CardBody className="p-0">
          {reservations.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={22} />}
              title="Chưa có phiếu đặt bàn nào"
              description="Các phiếu đặt trước từ bảng tbl_phieu_dat_ban sẽ hiển thị tại đây."
            />
          ) : (
            <ul className="divide-y divide-line">
              {reservations.map(({ reservation, table, customer }) => {
                const st = RESERVATION_STATUS_META[reservation.trang_thai_dat];
                return (
                  <li key={reservation.ma_phieu_dat} className="px-5 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectCustomerId(reservation.ma_khach_hang)}
                            className="text-left text-sm font-medium text-ink hover:text-primary hover:underline"
                          >
                            {customer?.ho_ten ?? reservation.ma_khach_hang}
                          </button>
                          {customer && <CustomerGroupBadge group={customer.loai_khach} />}
                        </div>
                        <p className="num mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                          <span>{reservation.ma_phieu_dat}</span>
                          <span aria-hidden>·</span>
                          <span>{table?.ten_ban ?? reservation.ma_ban}</span>
                          <span aria-hidden>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} aria-hidden />
                            {reservation.so_nguoi} khách
                          </span>
                        </p>
                      </div>
                      <Badge tone={st.tone} dot size="sm">
                        {st.label}
                      </Badge>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md bg-paper-warm px-3 py-2 text-xs">
                      <span className="num text-ink-soft">
                        Giờ hẹn: {formatDateVi(reservation.thoi_gian_den)} ·{' '}
                        {formatClock(reservation.thoi_gian_den)}
                      </span>
                      <span className="num font-medium text-ink">
                        Cọc:{' '}
                        <span
                          className={
                            reservation.tien_dat_coc > 0 ? 'text-st-empty-ink' : 'text-ink-muted'
                          }
                        >
                          {formatVnd(reservation.tien_dat_coc)}
                        </span>
                      </span>
                    </div>

                    {reservation.ghi_chu_tiec && (
                      <p className="mt-2 text-xs text-ink-muted">{reservation.ghi_chu_tiec}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
