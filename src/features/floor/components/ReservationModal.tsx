import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Check, Wallet } from 'lucide-react';
import { DEMO_TODAY } from '@/lib/clock';
import { formatVnd } from '@/lib/format';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { CustomerGroupType } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Misc';
import { Modal } from '@/components/ui/Overlay';
import { formatLocalDateTimeSql } from '../floorHelpers';

interface ReservationErrors {
  hoTen?: string;
  soDienThoai?: string;
  maBan?: string;
  soNguoi?: string;
  tenCongTy?: string;
}

export function ReservationModal({
  open,
  canOperate,
  readOnlyReason,
  onClose,
}: {
  open: boolean;
  canOperate: boolean;
  readOnlyReason: string | null;
  onClose: () => void;
}) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const createReservation = useRestaurantStore((s) => s.createReservation);

  const emptyTables = useMemo(
    () => snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'Trong'),
    [snapshot.tbl_ban],
  );

  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [loaiKhach, setLoaiKhach] = useState<CustomerGroupType>('Doan');
  const [maBan, setMaBan] = useState('');
  const [ngayDen, setNgayDen] = useState(DEMO_TODAY);
  const [gioDen, setGioDen] = useState('19:30');
  const [soNguoi, setSoNguoi] = useState(8);
  const [tienDatCoc, setTienDatCoc] = useState(1000000);
  const [tenCongTy, setTenCongTy] = useState('');
  const [maSoThue, setMaSoThue] = useState('');
  const [diaChiCongTy, setDiaChiCongTy] = useState('');
  const [ghiChuTiec, setGhiChuTiec] = useState('');
  const [errors, setErrors] = useState<ReservationErrors>({});

  useEffect(() => {
    if (!open) return;
    setHoTen('');
    setSoDienThoai('');
    setLoaiKhach('Doan');
    setMaBan(emptyTables[0]?.ma_ban ?? '');
    setNgayDen(DEMO_TODAY);
    setGioDen('19:30');
    setSoNguoi(8);
    setTienDatCoc(1000000);
    setTenCongTy('');
    setMaSoThue('');
    setDiaChiCongTy('');
    setGhiChuTiec('');
    setErrors({});
  }, [open, emptyTables]);

  const handleGroupChange = (next: CustomerGroupType) => {
    setLoaiKhach(next);
    if (next !== 'Doan' && tienDatCoc === 1000000) {
      setTienDatCoc(next === 'VIP' ? 500000 : 0);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOperate) return;

    const nextErr: ReservationErrors = {};
    if (!hoTen.trim()) nextErr.hoTen = 'Vui lòng nhập họ tên người đặt hoặc trưởng đoàn.';
    if (!/^[0-9\s+.-]{8,15}$/.test(soDienThoai.trim())) {
      nextErr.soDienThoai = 'Số điện thoại cần từ 8–15 chữ số.';
    }
    if (!maBan) nextErr.maBan = 'Vui lòng chọn bàn trống để giữ chỗ.';
    if (!Number.isFinite(soNguoi) || soNguoi < 1) nextErr.soNguoi = 'Số khách phải từ 1 trở lên.';
    if (loaiKhach === 'Doan' && !tenCongTy.trim()) {
      nextErr.tenCongTy = 'Nhập tên công ty hoặc tổ chức cho khách đoàn.';
    }

    if (Object.keys(nextErr).length > 0) {
      setErrors(nextErr);
      return;
    }

    createReservation({
      ho_ten: hoTen.trim(),
      so_dien_thoai: soDienThoai.trim(),
      loai_khach: loaiKhach,
      ma_ban: maBan,
      thoi_gian_den: formatLocalDateTimeSql(ngayDen, gioDen),
      so_nguoi: Math.max(1, Math.round(soNguoi)),
      tien_dat_coc: Math.max(0, Math.round(tienDatCoc || 0)),
      ghi_chu_tiec: ghiChuTiec.trim() || 'Đặt bàn trước giữ chỗ',
      ten_cong_ty: loaiKhach === 'Doan' ? tenCongTy.trim() : undefined,
      ma_so_thue: loaiKhach === 'Doan' ? maSoThue.trim() || undefined : undefined,
      dia_chi_cong_ty: loaiKhach === 'Doan' ? diaChiCongTy.trim() || undefined : undefined,
    });

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<CalendarPlus size={20} />}
      eyebrow="Đặt bàn trước & thu cọc · UC-01"
      title="Tạo phiếu đặt bàn trước"
      description="Giữ bàn chuyển trạng thái Đã đặt (vàng hổ phách). Nếu có tiền đặt cọc, hệ thống tự đồng bộ vào Sổ quỹ Chủ và khấu trừ vào hóa đơn cuối."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="reservation-form"
            disabled={!canOperate || emptyTables.length === 0}
            title={readOnlyReason ?? undefined}
            icon={<Check size={16} />}
          >
            Xác nhận đặt bàn
          </Button>
        </>
      }
    >
      {emptyTables.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus size={24} />}
          title="Không còn bàn trống để đặt trước"
          description="Vui lòng giải phóng bàn sau khi khách rời đi hoặc thêm bàn mới."
        />
      ) : (
        <form id="reservation-form" onSubmit={handleSubmit} className="space-y-4">
          {readOnlyReason && (
            <div className="rounded-lg border border-st-booked/40 bg-st-booked-soft px-4 py-3 text-xs text-st-booked-ink">
              {readOnlyReason}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Họ tên người đặt / Trưởng đoàn" error={errors.hoTen}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  placeholder="VD: Ông Trần Quốc Khánh"
                  value={hoTen}
                  onChange={(e) => {
                    setHoTen(e.target.value);
                    setErrors((prev) => ({ ...prev, hoTen: undefined }));
                  }}
                />
              )}
            </Field>

            <Field label="Số điện thoại liên hệ" error={errors.soDienThoai}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  placeholder="0905111222"
                  value={soDienThoai}
                  onChange={(e) => {
                    setSoDienThoai(e.target.value);
                    setErrors((prev) => ({ ...prev, soDienThoai: undefined }));
                  }}
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Nhóm khách">
              {({ id }) => (
                <Select
                  id={id}
                  value={loaiKhach}
                  onChange={(e) => handleGroupChange(e.target.value as CustomerGroupType)}
                >
                  <option value="Doan">Đoàn / Sự kiện (VAT)</option>
                  <option value="VIP">Khách VIP</option>
                  <option value="Thuong">Khách thường</option>
                </Select>
              )}
            </Field>

            <Field label="Bàn trống giữ chỗ" error={errors.maBan}>
              {({ id, describedBy, invalid }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={maBan}
                  onChange={(e) => setMaBan(e.target.value)}
                >
                  {emptyTables.map((b) => (
                    <option key={b.ma_ban} value={b.ma_ban}>
                      {b.ten_ban} ({b.so_ghe} ghế)
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Số lượng khách" error={errors.soNguoi}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  type="number"
                  min={1}
                  max={100}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={soNguoi}
                  onChange={(e) => setSoNguoi(Number(e.target.value))}
                  className="num"
                />
              )}
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Ngày đến">
              {({ id }) => (
                <Input
                  id={id}
                  type="date"
                  value={ngayDen}
                  onChange={(e) => setNgayDen(e.target.value)}
                  className="num"
                />
              )}
            </Field>

            <Field label="Giờ hẹn đến">
              {({ id }) => (
                <Input
                  id={id}
                  type="time"
                  value={gioDen}
                  onChange={(e) => setGioDen(e.target.value)}
                  className="num"
                />
              )}
            </Field>

            <Field label="Tiền đặt cọc (VNĐ)">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  step={100000}
                  value={tienDatCoc}
                  onChange={(e) => setTienDatCoc(Number(e.target.value))}
                  className="num"
                />
              )}
            </Field>
          </div>

          {loaiKhach === 'Doan' && (
            <div className="space-y-3 rounded-lg border border-line bg-paper-warm p-4">
              <p className="eyebrow">Hồ sơ công ty & xuất hóa đơn VAT</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Tên công ty / Đơn vị" error={errors.tenCongTy}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      placeholder="CÔNG TY CP KIẾN TRÚC & ĐẦU TƯ ĐÀ NẴNG"
                      value={tenCongTy}
                      onChange={(e) => {
                        setTenCongTy(e.target.value);
                        setErrors((prev) => ({ ...prev, tenCongTy: undefined }));
                      }}
                    />
                  )}
                </Field>

                <Field label="Mã số thuế (MST)">
                  {({ id }) => (
                    <Input
                      id={id}
                      placeholder="0401987654"
                      value={maSoThue}
                      onChange={(e) => setMaSoThue(e.target.value)}
                      className="num"
                    />
                  )}
                </Field>
              </div>

              <Field label="Địa chỉ công ty">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="Số 88 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng"
                    value={diaChiCongTy}
                    onChange={(e) => setDiaChiCongTy(e.target.value)}
                  />
                )}
              </Field>
            </div>
          )}

          <Field label="Ghi chú tiệc / Yêu cầu đặc biệt">
            {({ id }) => (
              <Textarea
                id={id}
                placeholder="VD: Đặt trước Combo Ngũ Quốc, cần ghế trẻ em, xuất hóa đơn đỏ VAT…"
                value={ghiChuTiec}
                onChange={(e) => setGhiChuTiec(e.target.value)}
              />
            )}
          </Field>

          {tienDatCoc > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-st-empty/35 bg-st-empty-soft px-4 py-3 text-xs text-st-empty-ink">
              <Wallet size={16} className="mt-0.5 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">
                  Đồng bộ tiền cọc <span className="num">{formatVnd(tienDatCoc)}</span> vào Sổ quỹ Chủ
                </p>
                <p className="mt-0.5">
                  Bút toán Thu tiền cọc (Chuyển khoản) sẽ được ghi tự động và trừ thẳng vào tổng hóa đơn khi khách thanh
                  toán.
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
