import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, PackagePlus } from 'lucide-react';
import { DEMO_TODAY } from '@/lib/clock';
import { formatVnd } from '@/lib/format';
import { useRestaurantStore, verifyRbacPermission } from '@/store/useRestaurantStore';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { Modal } from '@/components/ui/Overlay';
import { shortSupplierName, validateImportOrderInput } from '../financeHelpers';

interface CreateImportOrderModalProps {
  open: boolean;
  initialIngredientId?: string | null;
  onClose: () => void;
}

export function CreateImportOrderModal({
  open,
  initialIngredientId,
  onClose,
}: CreateImportOrderModalProps) {
  const currentRole = useRestaurantStore((s) => s.currentRole);
  const suppliers = useRestaurantStore((s) => s.snapshot.tbl_nha_cung_cap);
  const ingredients = useRestaurantStore((s) => s.snapshot.tbl_nguyen_lieu);
  const createWarehouseImportOrder = useRestaurantStore((s) => s.createWarehouseImportOrder);

  const [supplierId, setSupplierId] = useState(suppliers[0]?.ma_nha_cung_cap ?? '');
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.ma_nguyen_lieu ?? '');
  const [quantity, setQuantity] = useState('10');
  const [unitPrice, setUnitPrice] = useState('620000');
  const [expiryDate, setExpiryDate] = useState('2026-12-30');
  const [paidAmount, setPaidAmount] = useState('5000000');
  const [fundType, setFundType] = useState<'TienMat' | 'TaiKhoanNganHang'>('TaiKhoanNganHang');
  const [submitted, setSubmitted] = useState(false);

  const permission = verifyRbacPermission(currentRole, 'IMPORT_INVENTORY');

  useEffect(() => {
    if (!open) return;
    setSubmitted(false);
    const targetId =
      initialIngredientId && ingredients.some((n) => n.ma_nguyen_lieu === initialIngredientId)
        ? initialIngredientId
        : (ingredients.find((n) => n.so_luong_ton_kho < n.nguong_ton_toi_thieu)?.ma_nguyen_lieu ??
          ingredients[0]?.ma_nguyen_lieu ??
          '');
    setIngredientId(targetId);
    const item = ingredients.find((n) => n.ma_nguyen_lieu === targetId);
    const defaultPrice = item?.don_gia_nhap_bq ?? 500000;
    const defaultQty = 10;
    setQuantity(String(defaultQty));
    setUnitPrice(String(defaultPrice));
    setPaidAmount(String(Math.round(defaultQty * defaultPrice)));
    setExpiryDate('2026-12-30');
    if (!supplierId && suppliers[0]) setSupplierId(suppliers[0].ma_nha_cung_cap);
  }, [open, initialIngredientId, ingredients, suppliers, supplierId]);

  const selectedIngredient = ingredients.find((n) => n.ma_nguyen_lieu === ingredientId);

  const validation = useMemo(
    () =>
      validateImportOrderInput(
        {
          ma_nha_cung_cap: supplierId,
          ma_nguyen_lieu: ingredientId,
          so_luong_nhap: Number(quantity),
          don_gia_nhap: Number(unitPrice),
          han_su_dung_lo: expiryDate,
          tien_da_thanh_toan: Number(paidAmount),
        },
        DEMO_TODAY,
      ),
    [supplierId, ingredientId, quantity, unitPrice, expiryDate, paidAmount],
  );

  const handleIngredientChange = (nextId: string) => {
    setIngredientId(nextId);
    const nextItem = ingredients.find((n) => n.ma_nguyen_lieu === nextId);
    if (nextItem) {
      setUnitPrice(String(nextItem.don_gia_nhap_bq));
      const qtyNum = Number(quantity);
      if (Number.isFinite(qtyNum) && qtyNum > 0) {
        setPaidAmount(String(Math.round(qtyNum * nextItem.don_gia_nhap_bq)));
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!permission.allowed || !validation.valid) return;

    createWarehouseImportOrder({
      ma_nha_cung_cap: supplierId,
      ma_nguyen_lieu: ingredientId,
      so_luong_nhap: Number(quantity),
      don_gia_nhap: Number(unitPrice),
      han_su_dung_lo: expiryDate,
      tien_da_thanh_toan: Number(paidAmount),
      hinh_thuc_quy: fundType,
    });
    onClose();
  };

  const shownErrors = submitted ? validation.errors : {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      icon={<PackagePlus size={20} />}
      eyebrow="KHO & NHẬP HÀNG · MOD-08"
      title="Lập phiếu nhập kho nguyên liệu"
      description="Tự động cộng tồn kho, tính lại đơn giá bình quân, ghi công nợ NCC và bút toán Chi nhập hàng vào Sổ quỹ Chủ."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="import-order-form"
            disabled={!permission.allowed}
            icon={<Check size={15} />}
          >
            Duyệt phiếu nhập kho
          </Button>
        </>
      }
    >
      <form id="import-order-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nhà cung cấp" error={shownErrors.ma_nha_cung_cap}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              {suppliers.map((ncc) => (
                <option key={ncc.ma_nha_cung_cap} value={ncc.ma_nha_cung_cap}>
                  {shortSupplierName(ncc.ten_nha_cung_cap)} (Nợ: {formatVnd(ncc.cong_no_hien_tai)})
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="Nguyên liệu nhập kho"
          error={shownErrors.ma_nguyen_lieu}
          hint={
            selectedIngredient
              ? `Tồn hiện tại: ${selectedIngredient.so_luong_ton_kho} ${selectedIngredient.don_vi_tinh} · Tối thiểu: ${selectedIngredient.nguong_ton_toi_thieu} ${selectedIngredient.don_vi_tinh}`
              : undefined
          }
        >
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={ingredientId}
              onChange={(e) => handleIngredientChange(e.target.value)}
            >
              {ingredients.map((nl) => (
                <option key={nl.ma_nguyen_lieu} value={nl.ma_nguyen_lieu}>
                  {nl.ten_nguyen_lieu} (Còn {nl.so_luong_ton_kho} {nl.don_vi_tinh})
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={`Số lượng nhập (${selectedIngredient?.don_vi_tinh ?? 'ĐV'})`}
            error={shownErrors.so_luong_nhap}
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                step="0.5"
                min="0.5"
                aria-describedby={describedBy}
                invalid={invalid}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            )}
          </Field>

          <Field label="Đơn giá nhập (VND)" error={shownErrors.don_gia_nhap}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                step="10000"
                min="1000"
                aria-describedby={describedBy}
                invalid={invalid}
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Hạn sử dụng lô hàng" error={shownErrors.han_su_dung_lo}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="date"
                min="2026-11-25"
                aria-describedby={describedBy}
                invalid={invalid}
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            )}
          </Field>

          <Field label="Nguồn quỹ chi trả">
            {({ id }) => (
              <Select
                id={id}
                value={fundType}
                onChange={(e) => setFundType(e.target.value as 'TienMat' | 'TaiKhoanNganHang')}
              >
                <option value="TaiKhoanNganHang">Tài khoản ngân hàng</option>
                <option value="TienMat">Quỹ tiền mặt</option>
              </Select>
            )}
          </Field>
        </div>

        <Field
          label="Số tiền thanh toán ngay (VND)"
          error={shownErrors.tien_da_thanh_toan}
          hint={
            <span className="inline-flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => setPaidAmount(String(validation.totalAmount))}
              >
                Trả đủ 100%
              </button>
              <button
                type="button"
                className="font-medium text-ink-soft hover:underline"
                onClick={() => setPaidAmount(String(Math.round(validation.totalAmount * 0.5)))}
              >
                Trả 50%
              </button>
              <button
                type="button"
                className="font-medium text-ink-soft hover:underline"
                onClick={() => setPaidAmount('0')}
              >
                Ghi công nợ 100%
              </button>
            </span>
          }
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="number"
              min="0"
              step="50000"
              aria-describedby={describedBy}
              invalid={invalid}
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
          )}
        </Field>

        {/* Tóm tắt tự động tính tổng tiền hàng / đã trả / ghi nợ */}
        <div className="space-y-2 rounded-lg border border-line bg-paper-warm p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Tổng giá trị lô hàng</span>
            <span className="num font-medium text-ink">{formatVnd(validation.totalAmount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Chi ngay từ sổ quỹ</span>
            <span className="num font-medium text-st-empty-ink">
              {formatVnd(Math.max(0, Math.min(Number(paidAmount) || 0, validation.totalAmount)))}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-2">
            <span className="font-medium text-ink">Cộng thêm vào công nợ NCC</span>
            <span
              className={
                validation.debtAmount > 0
                  ? 'num font-medium text-st-billing-ink'
                  : 'num text-ink-muted'
              }
            >
              {formatVnd(validation.debtAmount)}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
