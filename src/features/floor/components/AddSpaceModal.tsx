import { useEffect, useState } from 'react';
import { Check, LayoutGrid, QrCode } from 'lucide-react';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { TableType } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { Segmented } from '@/components/ui/Tabs';

interface SpaceErrors {
  code?: string;
  name?: string;
  seats?: string;
}

export function AddSpaceModal({
  open,
  defaultZoneId,
  onCreatedZone,
  onClose,
}: {
  open: boolean;
  defaultZoneId: string;
  onCreatedZone?: (maKhuVuc: string) => void;
  onClose: () => void;
}) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const addTable = useRestaurantStore((s) => s.addTable);
  const addArea = useRestaurantStore((s) => s.addArea);

  const [mode, setMode] = useState<'table' | 'area'>('table');

  // Form thêm bàn
  const [maBan, setMaBan] = useState('');
  const [tenBan, setTenBan] = useState('');
  const [maKhuVuc, setMaKhuVuc] = useState('');
  const [loaiBan, setLoaiBan] = useState<TableType>('Thuong');
  const [soGhe, setSoGhe] = useState(4);

  // Form thêm khu vực
  const [areaCode, setAreaCode] = useState('');
  const [areaName, setAreaName] = useState('');
  const [areaCap, setAreaCap] = useState(40);
  const [areaDesc, setAreaDesc] = useState('');

  const [errors, setErrors] = useState<SpaceErrors>({});

  useEffect(() => {
    if (!open) return;
    setMode('table');
    setMaBan('');
    setTenBan('');
    const validZone =
      snapshot.tbl_khu_vuc.find((z) => z.ma_khu_vuc === defaultZoneId)?.ma_khu_vuc ??
      snapshot.tbl_khu_vuc[0]?.ma_khu_vuc ??
      '';
    setMaKhuVuc(validZone);
    setLoaiBan('Thuong');
    setSoGhe(4);
    setAreaCode('');
    setAreaName('');
    setAreaCap(40);
    setAreaDesc('');
    setErrors({});
  }, [open, defaultZoneId, snapshot.tbl_khu_vuc]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErr: SpaceErrors = {};

    if (mode === 'table') {
      const cleanCode = maBan.trim().toUpperCase();
      if (!cleanCode) nextErr.code = 'Nhập mã bàn (VD: B-105).';
      else if (snapshot.tbl_ban.some((b) => b.ma_ban.toUpperCase() === cleanCode)) {
        nextErr.code = `Mã bàn ${cleanCode} đã tồn tại trên sơ đồ.`;
      }
      if (!tenBan.trim()) nextErr.name = 'Nhập tên hiển thị cho bàn.';
      if (!Number.isFinite(soGhe) || soGhe < 2 || soGhe > 24) {
        nextErr.seats = 'Số ghế cần từ 2 đến 24.';
      }
      if (Object.keys(nextErr).length > 0) {
        setErrors(nextErr);
        return;
      }

      addTable({
        ma_ban: cleanCode,
        ten_ban: tenBan.trim(),
        ma_khu_vuc: maKhuVuc,
        loai_ban: loaiBan,
        so_ghe: Math.round(soGhe),
      });
      onClose();
      return;
    }

    const cleanArea = areaCode.trim().toUpperCase();
    if (!cleanArea) nextErr.code = 'Nhập mã khu vực (VD: KV-ST).';
    else if (snapshot.tbl_khu_vuc.some((k) => k.ma_khu_vuc.toUpperCase() === cleanArea)) {
      nextErr.code = `Mã khu vực ${cleanArea} đã tồn tại.`;
    }
    if (!areaName.trim()) nextErr.name = 'Nhập tên khu vực mới.';
    if (!Number.isFinite(areaCap) || areaCap < 4) nextErr.seats = 'Sức chứa tối thiểu 4 khách.';

    if (Object.keys(nextErr).length > 0) {
      setErrors(nextErr);
      return;
    }

    addArea({
      ma_khu_vuc: cleanArea,
      ten_khu_vuc: areaName.trim(),
      suc_chua_toi_da: Math.round(areaCap),
      mo_ta: areaDesc.trim() || null,
    });
    onCreatedZone?.(cleanArea);
    onClose();
  };

  const previewQr = maBan.trim()
    ? `QR-ACRMS-${maBan.trim().toUpperCase().replace(/[^A-Z0-9]/gi, '')}`
    : 'QR-ACRMS-B105';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<LayoutGrid size={20} />}
      eyebrow="Cấu hình sảnh · Chủ / Quản lý"
      title="Thêm bàn / khu vực"
      description="Bổ sung bàn ăn mới (tự sinh mã QR cố định) hoặc mở rộng khu vực phục vụ trên sơ đồ."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" form="add-space-form" icon={<Check size={16} />}>
            {mode === 'table' ? 'Tạo bàn mới' : 'Tạo khu vực mới'}
          </Button>
        </>
      }
    >
      <form id="add-space-form" onSubmit={handleSubmit} className="space-y-4">
        <Segmented
          label="Chọn đối tượng cần thêm"
          value={mode}
          onChange={(next) => {
            setMode(next);
            setErrors({});
          }}
          items={[
            { id: 'table', label: 'Thêm bàn mới' },
            { id: 'area', label: 'Thêm khu vực mới' },
          ]}
        />

        {mode === 'table' ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mã bàn" error={errors.code}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    placeholder="VD: B-105"
                    value={maBan}
                    onChange={(e) => {
                      setMaBan(e.target.value);
                      setErrors((prev) => ({ ...prev, code: undefined }));
                    }}
                  />
                )}
              </Field>

              <Field label="Tên hiển thị" error={errors.name}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    placeholder="VD: Bàn 105"
                    value={tenBan}
                    onChange={(e) => {
                      setTenBan(e.target.value);
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                  />
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Khu vực">
                {({ id }) => (
                  <Select id={id} value={maKhuVuc} onChange={(e) => setMaKhuVuc(e.target.value)}>
                    {snapshot.tbl_khu_vuc.map((z) => (
                      <option key={z.ma_khu_vuc} value={z.ma_khu_vuc}>
                        {z.ten_khu_vuc}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field label="Loại bàn">
                {({ id }) => (
                  <Select
                    id={id}
                    value={loaiBan}
                    onChange={(e) => setLoaiBan(e.target.value as TableType)}
                  >
                    <option value="Thuong">Bàn thường</option>
                    <option value="VIP">Phòng VIP</option>
                    <option value="BanDai">Bàn dài đoàn</option>
                  </Select>
                )}
              </Field>

              <Field label="Số ghế" error={errors.seats}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="number"
                    min={2}
                    max={24}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    value={soGhe}
                    onChange={(e) => setSoGhe(Number(e.target.value))}
                    className="num"
                  />
                )}
              </Field>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-line bg-paper-warm px-4 py-3 text-xs text-ink-soft">
              <QrCode size={16} className="shrink-0 text-primary" aria-hidden />
              <span>
                Mã QR cố định tự sinh: <span className="num font-medium text-ink">{previewQr}</span> · Trạng thái khởi
                tạo: <span className="font-medium text-st-empty-ink">Trống</span>.
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Mã khu vực" error={errors.code}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    placeholder="VD: KV-ST"
                    value={areaCode}
                    onChange={(e) => {
                      setAreaCode(e.target.value);
                      setErrors((prev) => ({ ...prev, code: undefined }));
                    }}
                  />
                )}
              </Field>

              <Field label="Sức chứa tối đa (khách)" error={errors.seats}>
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    type="number"
                    min={4}
                    max={300}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    value={areaCap}
                    onChange={(e) => setAreaCap(Number(e.target.value))}
                    className="num"
                  />
                )}
              </Field>
            </div>

            <Field label="Tên khu vực" error={errors.name}>
              {({ id, describedBy, invalid }) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  placeholder="VD: Sân Thượng Tầng 3 (Vườn Trà)"
                  value={areaName}
                  onChange={(e) => {
                    setAreaName(e.target.value);
                    setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                />
              )}
            </Field>

            <Field label="Mô tả không gian">
              {({ id }) => (
                <Textarea
                  id={id}
                  placeholder="Mô tả ngắn về vị trí, nhóm khách phù hợp…"
                  value={areaDesc}
                  onChange={(e) => setAreaDesc(e.target.value)}
                />
              )}
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
