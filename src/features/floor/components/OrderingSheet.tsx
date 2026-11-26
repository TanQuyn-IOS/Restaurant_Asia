import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Crown,
  ExternalLink,
  FileCheck2,
  GitMerge,
  Info,
  Lock,
  QrCode,
  ReceiptText,
  Trash2,
  Unlink2,
  UtensilsCrossed,
} from 'lucide-react';
import {
  canReleaseTableWithDeleteButton,
  useRestaurantStore,
} from '@/store/useRestaurantStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Misc';
import { Sheet } from '@/components/ui/Overlay';
import { Segmented, UnderlineTabs } from '@/components/ui/Tabs';
import { CustomerGroupBadge, TableStatusBadge } from '@/components/domain/badges';
import type { FloorTableVM } from '../floorHelpers';
import { OrderingBillTab } from './OrderingBillTab';
import { OrderingBrowseTab } from './OrderingBrowseTab';

type SheetTab = 'order' | 'browse';

export function OrderingSheet({
  open,
  vm,
  canOperate,
  readOnlyReason,
  onOpenDetachTable,
  onClose,
}: {
  open: boolean;
  vm: FloorTableVM | undefined;
  canOperate: boolean;
  readOnlyReason: string | null;
  onOpenDetachTable?: (sourceTableId: string, preferredTargetId?: string | null) => void;
  onClose: () => void;
}) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const submitOrderItems = useRestaurantStore((s) => s.submitOrderItems);
  const cancelOrderItemBeforeCooking = useRestaurantStore((s) => s.cancelOrderItemBeforeCooking);
  const markDishServedAtTable = useRestaurantStore((s) => s.markDishServedAtTable);
  const lockBillAndSendToCashier = useRestaurantStore((s) => s.lockBillAndSendToCashier);
  const deleteReleaseTableSession = useRestaurantStore((s) => s.deleteReleaseTableSession);

  const [tab, setTab] = useState<SheetTab>('order');
  const [orderForTableId, setOrderForTableId] = useState<string>('');

  const activeOrder = vm?.activeOrder;
  const orderItems = useMemo(() => {
    if (!activeOrder) return [];
    return snapshot.tbl_chi_tiet_don_goi.filter((i) => i.ma_order === activeOrder.ma_order);
  }, [snapshot.tbl_chi_tiet_don_goi, activeOrder]);

  const activeNonCancelledCount = useMemo(
    () => orderItems.filter((i) => i.trang_thai_mon !== 'DaHuy').length,
    [orderItems],
  );

  const initialOrderKey = activeOrder?.ma_order ?? '';
  const openedTableId = vm?.ban.ma_ban ?? '';
  const initialIsEmptyServing =
    activeOrder?.trang_thai_order === 'DangPhucVu' && orderItems.length === 0;

  useEffect(() => {
    if (!open || !initialOrderKey) return;
    setTab(initialIsEmptyServing ? 'browse' : 'order');
  }, [open, initialOrderKey, initialIsEmptyServing]);

  useEffect(() => {
    if (!open || !openedTableId) return;
    setOrderForTableId(openedTableId);
  }, [open, openedTableId]);

  if (!vm || !activeOrder) {
    return (
      <Sheet open={open} onClose={onClose} side="right" width="xl" title="Chi tiết bàn">
        <EmptyState
          icon={<UtensilsCrossed size={24} />}
          title="Bàn chưa mở phiên"
          description="Mở bàn trước khi gọi món hoặc kiểm bill."
        />
      </Sheet>
    );
  }

  const { ban, zone, effectiveTableId, masterTable, mergedChildren, invoice, bill, customer, groupInfo } = vm;
  const isServing = activeOrder.trang_thai_order === 'DangPhucVu';
  const isInvoicePaid = invoice?.trang_thai_tt === 'DaThanhToan';

  const releaseCheck = canReleaseTableWithDeleteButton(snapshot, effectiveTableId);
  const canRelease = canOperate && releaseCheck.allowed;
  const releaseBlockReason = !canOperate ? readOnlyReason : releaseCheck.reason;

  const canLockBill = canOperate && isServing && Boolean(bill && bill.completedItemsCount > 0);
  const lockBillDisabledReason = !canOperate
    ? readOnlyReason
    : !isServing
      ? 'Đơn đã chốt bill và chuyển sang quầy Thu ngân.'
      : !bill || bill.completedItemsCount === 0
        ? 'Cần ít nhất 1 món được bếp bấm Hoàn thành để chốt bill.'
        : null;

  const browseDisabledReason = !canOperate
    ? readOnlyReason
    : !isServing
      ? 'Bàn đã chốt bill, không thể gọi thêm món.'
      : null;

  const availableDishesCount = snapshot.tbl_mon_an.filter((m) => m.trang_thai_mon === 'ConMon').length;

  const masterForGroup = masterTable ?? ban;
  const groupTables = [
    masterForGroup,
    ...snapshot.tbl_ban.filter((b) => b.ma_ban_chinh === masterForGroup.ma_ban),
  ];

  const resolvedOrderForTableId = groupTables.some((b) => b.ma_ban === orderForTableId)
    ? orderForTableId
    : ban.ma_ban;

  const handleSubmitDishes = (
    items: {
      ma_mon_an: string;
      so_luong: number;
      muc_do_cay_yc: 0 | 1 | 2 | 3;
      ghi_chu_mon: string;
    }[],
  ) => {
    submitOrderItems({ ma_ban: resolvedOrderForTableId, nguon_goi: 'Waitstaff', items });
    setTab('order');
  };

  const handleDeleteRelease = () => {
    if (!canRelease) return;
    deleteReleaseTableSession(effectiveTableId);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      side="right"
      width="xl"
      icon={<ReceiptText size={20} />}
      eyebrow={`${ban.ma_ban} · ${zone?.ten_khu_vuc.split(' (')[0] ?? 'Sảnh'} · ${ban.so_ghe} ghế`}
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span>{ban.ten_ban}</span>
          <TableStatusBadge status={ban.trang_thai_ban} />
        </span>
      }
      description={
        <span className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
          <span className="num">Đơn {activeOrder.ma_order}</span>
          <span>·</span>
          <CustomerGroupBadge group={activeOrder.loai_khach_phien} />
          {customer && <span className="text-ink-soft">{customer.ho_ten}</span>}
          {activeOrder.vip_flag && (
            <Badge tone="gold" size="sm" icon={<Crown size={11} aria-hidden />}>
              VIP ưu tiên KDS
            </Badge>
          )}
          <a
            href={`/qr/${ban.ma_ban}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
          >
            <QrCode size={12} aria-hidden /> Cổng QR <ExternalLink size={11} aria-hidden />
          </a>
        </span>
      }
      footer={
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            {isServing && (
              <Button
                variant="primary"
                size="lg"
                block
                className="sm:flex-1"
                disabled={!canLockBill}
                title={lockBillDisabledReason ?? undefined}
                onClick={() => lockBillAndSendToCashier(effectiveTableId)}
                icon={<FileCheck2 size={16} />}
              >
                Chốt bill & chuyển Thu ngân
              </Button>
            )}

            <Button
              variant="danger"
              size="lg"
              block
              className={isServing ? 'sm:flex-1' : undefined}
              disabled={!canRelease}
              title={releaseBlockReason ?? undefined}
              onClick={handleDeleteRelease}
              icon={<Trash2 size={16} />}
            >
              Dọn & trả bàn (DELETE)
            </Button>
          </div>

          <div className="space-y-1 text-xs text-ink-muted">
            {isServing && lockBillDisabledReason && (
              <p className="flex items-center gap-1.5">
                <Info size={13} className="shrink-0" aria-hidden />
                <span>Chốt bill: {lockBillDisabledReason}</span>
              </p>
            )}
            {!canRelease && releaseBlockReason && (
              <p className="flex items-center gap-1.5 text-st-billing-ink">
                <Lock size={13} className="shrink-0" aria-hidden />
                <span>DELETE bị khóa: {releaseBlockReason}</span>
              </p>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {readOnlyReason && (
          <div className="rounded-lg border border-st-booked/40 bg-st-booked-soft px-3.5 py-2.5 text-xs text-st-booked-ink">
            {readOnlyReason}
          </div>
        )}

        {(masterTable || mergedChildren.length > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-info/30 bg-info-soft px-3.5 py-2.5 text-xs text-info-ink">
            <div className="flex items-center gap-2">
              <GitMerge size={15} className="shrink-0" aria-hidden />
              {masterTable ? (
                <span>
                  Bàn phụ ghép vào <span className="font-medium">{masterTable.ten_ban}</span>, dùng chung đơn{' '}
                  <span className="num font-medium">{activeOrder.ma_order}</span>.
                </span>
              ) : (
                <span>
                  Đang ghép với:{' '}
                  <span className="font-medium">{mergedChildren.map((c) => c.ten_ban).join(', ')}</span>.
                </span>
              )}
            </div>
            {canOperate && isServing && onOpenDetachTable && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Unlink2 size={13} />}
                onClick={() => {
                  onClose();
                  onOpenDetachTable(
                    effectiveTableId,
                    masterTable ? ban.ma_ban : mergedChildren[0]?.ma_ban ?? null,
                  );
                }}
              >
                {masterTable ? 'Tách bàn này' : 'Tách bàn'}
              </Button>
            )}
          </div>
        )}

        {isInvoicePaid && invoice && (
          <div className="flex items-start gap-2.5 rounded-lg border border-st-empty/40 bg-st-empty-soft px-3.5 py-3 text-xs text-st-empty-ink">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">
                Hóa đơn <span className="num">{invoice.ma_hoa_don}</span> đã thanh toán
              </p>
              <p className="mt-0.5">
                Dọn bàn xong, bấm <span className="font-bold">Dọn & trả bàn (DELETE)</span> bên dưới để trả bàn về Trống.
              </p>
            </div>
          </div>
        )}

        {!isServing && !isInvoicePaid && invoice && (
          <div className="flex items-start gap-2.5 rounded-lg border border-st-billing/40 bg-st-billing-soft px-3.5 py-3 text-xs text-st-billing-ink">
            <Lock size={15} className="mt-0.5 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">
                Đã chốt bill ({invoice.ma_hoa_don}), chờ Thu ngân thu tiền
              </p>
              <p className="mt-0.5">
                Đơn đã khóa gọi thêm và hủy món. Nút trả bàn mở lại sau khi thu tiền xong.
              </p>
            </div>
          </div>
        )}

        <div className="border-b border-line">
          <UnderlineTabs
            label="Nội dung ngăn gọi món"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'order', index: '01', label: 'Đơn hiện tại & Kiểm bill', count: activeNonCancelledCount },
              { id: 'browse', index: '02', label: 'Gọi thêm món', count: availableDishesCount },
            ]}
          />
        </div>

        {tab === 'browse' ? (
          <div className="space-y-3">
            {groupTables.length > 1 && isServing && canOperate && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-paper-warm px-3.5 py-2.5">
                <span className="t-label">Gọi món cho bàn</span>
                <Segmented
                  label="Chọn bàn trong nhóm ghép để ghi nhận món gọi"
                  value={resolvedOrderForTableId}
                  onChange={setOrderForTableId}
                  items={groupTables.map((t) => ({
                    id: t.ma_ban,
                    label: t.ten_ban,
                  }))}
                />
              </div>
            )}
            <OrderingBrowseTab
              dishes={snapshot.tbl_mon_an}
              categories={snapshot.tbl_danh_muc_mon}
              canSubmit={canOperate && isServing}
              disabledReason={browseDisabledReason}
              onSubmitToKitchen={handleSubmitDishes}
            />
          </div>
        ) : (
          <OrderingBillTab
            orderItems={orderItems}
            dishes={snapshot.tbl_mon_an}
            tables={snapshot.tbl_ban}
            bill={bill}
            groupInfo={groupInfo}
            isServing={isServing}
            canOperate={canOperate}
            readOnlyReason={readOnlyReason}
            onOpenBrowse={() => setTab('browse')}
            onMarkServed={markDishServedAtTable}
            onCancelItem={cancelOrderItemBeforeCooking}
          />
        )}
      </div>
    </Sheet>
  );
}
