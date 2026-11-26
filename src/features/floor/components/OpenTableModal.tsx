import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, Check, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatClock, formatVnd } from '@/lib/format';
import { CUSTOMER_GROUP_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { CustomerGroupType } from '@/types/database';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Select } from '@/components/ui/Form';
import { EmptyState } from '@/components/ui/Misc';
import { Modal } from '@/components/ui/Overlay';
import { filterCustomersByGroup, getActiveReservationForTable } from '../floorHelpers';
import { OpenTableGroupFields } from './OpenTableGroupFields';

const GROUPS: CustomerGroupType[] = ['VangLai', 'Thuong', 'VIP', 'Doan'];

export function OpenTableModal({
  open,
  initialTableId,
  canOperate,
  readOnlyReason,
  onClose,
  onOpened,
}: {
  open: boolean;
  initialTableId: string | null;
  canOperate: boolean;
  readOnlyReason: string | null;
  onClose: () => void;
  onOpened: (maBan: string) => void;
}) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const openTableSession = useRestaurantStore((s) => s.openTableSession);
  const submitOrderItems = useRestaurantStore((s) => s.submitOrderItems);

  const openableTables = useMemo(
    () => snapshot.tbl_ban.filter((b) => b.trang_thai_ban === 'Trong' || b.trang_thai_ban === 'DaDat'),
    [snapshot.tbl_ban],
  );
  const pendingReservations = useMemo(
    () => snapshot.tbl_phieu_dat_ban.filter((p) => p.trang_thai_dat === 'DaNhan'),
    [snapshot.tbl_phieu_dat_ban],
  );
  const availableCombos = useMemo(
    () => snapshot.tbl_mon_an.filter((m) => m.is_combo && m.trang_thai_mon === 'ConMon'),
    [snapshot.tbl_mon_an],
  );

  const [tableId, setTableId] = useState('');
  const [group, setGroup] = useState<CustomerGroupType>('VangLai');
  const [memberQuery, setMemberQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [reservationId, setReservationId] = useState('');
  const [mergeIds, setMergeIds] = useState<string[]>([]);
  const [selectedComboId, setSelectedComboId] = useState('');
  const [comboQty, setComboQty] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const preferred = openableTables.find((b) => b.ma_ban === initialTableId) ?? openableTables[0];
    const nextTableId = preferred?.ma_ban ?? '';
    setTableId(nextTableId);
    setMemberQuery('');
    setMergeIds([]);
    setSelectedComboId('');
    setComboQty(1);
    setError(null);

    if (nextTableId) {
      const res = getActiveReservationForTable(snapshot, nextTableId);
      if (res) {
        const cust = snapshot.tbl_khach_hang.find((k) => k.ma_khach_hang === res.ma_khach_hang);
        setReservationId(res.ma_phieu_dat);
        setGroup(cust?.loai_khach ?? 'Thuong');
        setCustomerId(res.ma_khach_hang);
        return;
      }
      if (preferred?.loai_ban === 'VIP') {
        setReservationId('');
        setGroup('VIP');
        setCustomerId(snapshot.tbl_khach_hang.find((k) => k.loai_khach === 'VIP')?.ma_khach_hang ?? '');
        return;
      }
      if (preferred?.loai_ban === 'BanDai') {
        setReservationId('');
        setGroup('Doan');
        setCustomerId(snapshot.tbl_khach_hang.find((k) => k.loai_khach === 'Doan')?.ma_khach_hang ?? '');
        return;
      }
    }
    setReservationId('');
    setGroup('VangLai');
    setCustomerId('');
  }, [open, initialTableId, openableTables, snapshot]);

  const selectedTable = snapshot.tbl_ban.find((b) => b.ma_ban === tableId);
  const linkedReservation = pendingReservations.find((p) => p.ma_phieu_dat === reservationId);

  const matchingCustomers = useMemo(() => {
    if (group === 'VangLai') return [];
    return filterCustomersByGroup(snapshot.tbl_khach_hang, group, memberQuery);
  }, [snapshot.tbl_khach_hang, group, memberQuery]);

  // Tự chọn hồ sơ khớp đầu tiên khi tìm theo tên / SĐT
  const handleMemberQueryChange = (q: string) => {
    setMemberQuery(q);
    if (group === 'VangLai') return;
    const nextMatches = filterCustomersByGroup(snapshot.tbl_khach_hang, group, q);
    if (nextMatches.length > 0 && !nextMatches.some((c) => c.ma_khach_hang === customerId)) {
      setCustomerId(nextMatches[0].ma_khach_hang);
    }
  };

  const selectedCustomer = snapshot.tbl_khach_hang.find((k) => k.ma_khach_hang === customerId);
  const selectedGroupVat = selectedCustomer
    ? snapshot.tbl_khach_doan.find((d) => d.ma_khach_hang === selectedCustomer.ma_khach_hang)
    : undefined;

  const mergeCandidates = useMemo(() => {
    return snapshot.tbl_ban
      .filter((b) => b.trang_thai_ban === 'Trong' && b.ma_ban !== tableId)
      .sort((a, b) => {
        const aSame = a.ma_khu_vuc === selectedTable?.ma_khu_vuc ? 0 : 1;
        const bSame = b.ma_khu_vuc === selectedTable?.ma_khu_vuc ? 0 : 1;
        return aSame - bSame || a.ma_ban.localeCompare(b.ma_ban);
      });
  }, [snapshot.tbl_ban, tableId, selectedTable?.ma_khu_vuc]);

  const handleTableChange = (nextId: string) => {
    setTableId(nextId);
    setMergeIds((prev) => prev.filter((id) => id !== nextId));
    setError(null);
    const res = getActiveReservationForTable(snapshot, nextId);
    if (res) {
      const cust = snapshot.tbl_khach_hang.find((k) => k.ma_khach_hang === res.ma_khach_hang);
      setReservationId(res.ma_phieu_dat);
      if (cust) {
        setGroup(cust.loai_khach);
        setCustomerId(cust.ma_khach_hang);
      }
    } else {
      setReservationId('');
    }
  };

  const handleGroupChange = (nextGroup: CustomerGroupType) => {
    setGroup(nextGroup);
    setMemberQuery('');
    setError(null);
    setCustomerId(
      nextGroup === 'VangLai'
        ? ''
        : (snapshot.tbl_khach_hang.find((k) => k.loai_khach === nextGroup)?.ma_khach_hang ?? ''),
    );
    if (nextGroup !== 'Doan') setSelectedComboId('');
  };

  const handleReservationChange = (nextResId: string) => {
    setReservationId(nextResId);
    const res = pendingReservations.find((p) => p.ma_phieu_dat === nextResId);
    const cust = res
      ? snapshot.tbl_khach_hang.find((k) => k.ma_khach_hang === res.ma_khach_hang)
      : undefined;
    if (cust) {
      setGroup(cust.loai_khach);
      setCustomerId(cust.ma_khach_hang);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canOperate) return;
    if (!tableId) {
      setError('Vui lòng chọn một bàn trống hoặc đã đặt trước.');
      return;
    }

    const fallbackCustomer =
      group === 'VangLai'
        ? 'KH-VL01'
        : customerId ||
          linkedReservation?.ma_khach_hang ||
          snapshot.tbl_khach_hang.find((k) => k.loai_khach === group)?.ma_khach_hang ||
          null;

    openTableSession({
      ma_ban: tableId,
      loai_khach: group,
      ma_khach_hang: fallbackCustomer,
      ma_phieu_dat: reservationId || null,
      ghep_ban_phu_ids: mergeIds,
    });

    if (group === 'Doan' && selectedComboId && comboQty > 0) {
      submitOrderItems({
        ma_ban: tableId,
        nguon_goi: 'Waitstaff',
        items: [
          {
            ma_mon_an: selectedComboId,
            so_luong: comboQty,
            muc_do_cay_yc: 1,
            ghi_chu_mon: 'Đặt sẵn gói Combo khi mở bàn đoàn',
          },
        ],
      });
    }

    onOpened(tableId);
    onClose();
  };

  const isVipEffective = group === 'VIP' || selectedTable?.loai_ban === 'VIP';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon={<Users size={20} />}
      title="Mở bàn đón khách"
      description="Chọn bàn và nhóm thực khách để bắt đầu phiên gọi món."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="open-table-form"
            disabled={!canOperate || openableTables.length === 0}
            title={readOnlyReason ?? undefined}
            icon={<Check size={16} />}
          >
            Mở bàn & gọi món
          </Button>
        </>
      }
    >
      {openableTables.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="Không còn bàn trống hoặc đã đặt"
          description="Tất cả bàn trong nhà hàng hiện đang phục vụ hoặc chờ thanh toán."
        />
      ) : (
        <form id="open-table-form" onSubmit={handleSubmit} className="space-y-5">
          {readOnlyReason && (
            <div className="rounded-lg border border-st-booked/40 bg-st-booked-soft px-4 py-3 text-xs text-st-booked-ink">
              {readOnlyReason}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Bàn cần mở" error={error}>
              {({ id, describedBy, invalid }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  invalid={invalid}
                  value={tableId}
                  onChange={(e) => handleTableChange(e.target.value)}
                >
                  {openableTables.map((b) => (
                    <option key={b.ma_ban} value={b.ma_ban}>
                      {b.ten_ban} ({b.so_ghe} ghế · {b.trang_thai_ban === 'DaDat' ? 'Đã đặt' : 'Trống'})
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Liên kết phiếu đặt trước (nếu có)">
              {({ id }) => (
                <Select id={id} value={reservationId} onChange={(e) => handleReservationChange(e.target.value)}>
                  <option value="">Không liên kết phiếu đặt</option>
                  {pendingReservations.map((p) => {
                    const kh = snapshot.tbl_khach_hang.find((k) => k.ma_khach_hang === p.ma_khach_hang);
                    return (
                      <option key={p.ma_phieu_dat} value={p.ma_phieu_dat}>
                        {p.ma_phieu_dat} · {kh?.ho_ten ?? p.ma_khach_hang} ({p.ma_ban} ·{' '}
                        {formatClock(p.thoi_gian_den)})
                      </option>
                    );
                  })}
                </Select>
              )}
            </Field>
          </div>

          {linkedReservation && (
            <div className="flex flex-wrap items-start gap-3 rounded-lg border border-st-booked/40 bg-st-booked-soft px-4 py-3 text-xs text-st-booked-ink">
              <CalendarCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">
                  Phiếu đặt {linkedReservation.ma_phieu_dat} · Hẹn {formatClock(linkedReservation.thoi_gian_den)} ·{' '}
                  <span className="num">{linkedReservation.so_nguoi} khách</span>
                </p>
                {linkedReservation.tien_dat_coc > 0 && (
                  <p>
                    Tiền đặt cọc đã thu:{' '}
                    <span className="num font-bold">{formatVnd(linkedReservation.tien_dat_coc)}</span> (tự động trừ vào
                    hóa đơn cuối).
                  </p>
                )}
                {linkedReservation.ghi_chu_tiec && <p>{linkedReservation.ghi_chu_tiec}</p>}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-ink-soft">Nhóm thực khách</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Nhóm thực khách">
              {GROUPS.map((code) => {
                const meta = CUSTOMER_GROUP_META[code];
                const active = group === code;
                return (
                  <button
                    key={code}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleGroupChange(code)}
                    className={cn(
                      'flex flex-col items-start rounded-lg border p-3.5 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary-soft'
                        : 'border-line-strong bg-paper hover:bg-paper-warm',
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className={cn('text-sm font-medium', active ? 'text-primary' : 'text-ink')}>
                        {code === 'VIP' && '✦ '}
                        {meta.label}
                      </span>
                      {active && (
                        <Badge tone="primary" size="sm">
                          Đang chọn
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">{meta.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <OpenTableGroupFields
            group={group}
            isVipEffective={isVipEffective}
            memberQuery={memberQuery}
            onMemberQueryChange={handleMemberQueryChange}
            matchingCustomers={matchingCustomers}
            customerId={customerId}
            onCustomerChange={setCustomerId}
            selectedCustomer={selectedCustomer}
            selectedGroupVat={selectedGroupVat}
            availableCombos={availableCombos}
            selectedComboId={selectedComboId}
            onComboChange={setSelectedComboId}
            comboQty={comboQty}
            onComboQtyChange={setComboQty}
            mergeCandidates={mergeCandidates}
            mergeIds={mergeIds}
            onToggleMergeTable={(id) =>
              setMergeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
            }
          />
        </form>
      )}
    </Modal>
  );
}
