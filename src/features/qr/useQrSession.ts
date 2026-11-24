import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getTierDiscountPercent,
  lookupGuestMemberByPhone,
  type GuestMemberProfile,
} from '@/lib/auth';
import { GUEST_REQUEST_META } from '@/lib/labels';
import { useRestaurantStore } from '@/store/useRestaurantStore';
import type { GuestRequestType, MonAn } from '@/types/database';
import {
  CALL_WAITER_COOLDOWN_MS,
  calculateCartTotals,
  enrichOrderItems,
  formatShortAreaName,
  getBillPreviewSummary,
  getRemainingCooldownSeconds,
  removeCartItem,
  updateCartItemQty,
  upsertCartItem,
  type QrCartDraft,
  type QrCartItem,
} from './qrHelpers';

export interface QrToastMessage {
  id: number;
  tone: 'success' | 'warning' | 'error';
  text: string;
}

export type QrSessionBlockReason = 'NO_SESSION' | 'BILL_LOCKED' | null;

export function useQrSession(maBanParam: string | undefined) {
  const snapshot = useRestaurantStore((s) => s.snapshot);
  const initRealtimeSync = useRestaurantStore((s) => s.initRealtimeSync);
  const submitOrderItems = useRestaurantStore((s) => s.submitOrderItems);
  const sendGuestQrSupportRequest = useRestaurantStore((s) => s.sendGuestQrSupportRequest);
  const linkMemberToTableOrder = useRestaurantStore((s) => s.linkMemberToTableOrder);

  const [cart, setCart] = useState<QrCartItem[]>([]);
  const [checkedMember, setCheckedMember] = useState<GuestMemberProfile | null>(null);
  const [toast, setToast] = useState<QrToastMessage | null>(null);
  const [lastSentByType, setLastSentByType] = useState<Partial<Record<GuestRequestType, number>>>({});
  const [lastSentMessage, setLastSentMessage] = useState<{ type: GuestRequestType; text: string } | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const toastTimerRef = useRef<number | null>(null);

  // Kích hoạt đồng bộ realtime (BroadcastChannel + Socket.io) để nhận cập nhật từ Bếp KDS ngay lập tức
  useEffect(() => {
    void initRealtimeSync();
  }, [initRealtimeSync]);

  // Xóa giỏ cục bộ nếu URL đổi sang mã bàn khác
  useEffect(() => {
    setCart([]);
    setCheckedMember(null);
    setLastSentByType({});
    setLastSentMessage(null);
  }, [maBanParam]);

  // Bộ đếm 1 giây chỉ chạy khi có ít nhất 1 hành động hỗ trợ đang trong thời gian chờ 20s
  const hasActiveCooldown = useMemo(() => {
    return Object.values(lastSentByType).some(
      (ts) => ts !== undefined && ts + CALL_WAITER_COOLDOWN_MS > nowMs,
    );
  }, [lastSentByType, nowMs]);

  useEffect(() => {
    if (!hasActiveCooldown) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasActiveCooldown]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = useCallback((tone: QrToastMessage['tone'], text: string) => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), tone, text });
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3600);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast(null);
  }, []);

  const table = useMemo(() => {
    if (!maBanParam) return undefined;
    return snapshot.tbl_ban.find((b) => b.ma_ban === maBanParam);
  }, [snapshot.tbl_ban, maBanParam]);

  const area = useMemo(() => {
    if (!table) return undefined;
    return snapshot.tbl_khu_vuc.find((kv) => kv.ma_khu_vuc === table.ma_khu_vuc);
  }, [snapshot.tbl_khu_vuc, table]);

  const parentTable = useMemo(() => {
    if (!table?.ma_ban_chinh) return undefined;
    return snapshot.tbl_ban.find((b) => b.ma_ban === table.ma_ban_chinh);
  }, [snapshot.tbl_ban, table]);

  const effectiveTableId = table ? table.ma_ban_chinh || table.ma_ban : undefined;

  const activeOrder = useMemo(() => {
    if (!effectiveTableId) return undefined;
    return snapshot.tbl_don_goi_mon.find(
      (o) => o.ma_ban === effectiveTableId && o.trang_thai_order !== 'DaGiaiPhong',
    );
  }, [snapshot.tbl_don_goi_mon, effectiveTableId]);

  const canSubmitOrder = activeOrder?.trang_thai_order === 'DangPhucVu';

  const sessionBlockReason: QrSessionBlockReason = useMemo(() => {
    if (!table) return null;
    if (canSubmitOrder) return null;
    if (
      activeOrder?.trang_thai_order === 'ChoThanhToan' ||
      activeOrder?.trang_thai_order === 'DaThanhToan' ||
      table.trang_thai_ban === 'ChoThanhToan'
    ) {
      return 'BILL_LOCKED';
    }
    return 'NO_SESSION';
  }, [table, canSubmitOrder, activeOrder]);

  const enrichedOrderItems = useMemo(() => {
    if (!activeOrder) return [];
    const rawItems = snapshot.tbl_chi_tiet_don_goi.filter(
      (item) => item.ma_order === activeOrder.ma_order,
    );
    return enrichOrderItems(rawItems, snapshot.tbl_mon_an);
  }, [activeOrder, snapshot.tbl_chi_tiet_don_goi, snapshot.tbl_mon_an]);

  const activeKitchenCount = useMemo(() => {
    return enrichedOrderItems.filter(
      (entry) =>
        entry.item.trang_thai_mon === 'ChoCheBien' ||
        entry.item.trang_thai_mon === 'DangCheBien',
    ).length;
  }, [enrichedOrderItems]);

  const billSummary = useMemo(
    () => getBillPreviewSummary(snapshot, activeOrder, enrichedOrderItems),
    [snapshot, activeOrder, enrichedOrderItems],
  );

  const dishAvailabilityMap = useMemo(
    () => new Map(snapshot.tbl_mon_an.map((d) => [d.ma_mon_an, d.trang_thai_mon])),
    [snapshot.tbl_mon_an],
  );

  const soldOutCartKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const item of cart) {
      if (dishAvailabilityMap.get(item.ma_mon_an) !== 'ConMon') {
        keys.add(item.key);
      }
    }
    return keys;
  }, [cart, dishAvailabilityMap]);

  const cartTotals = useMemo(() => calculateCartTotals(cart), [cart]);

  const addToCart = useCallback(
    (draft: QrCartDraft) => {
      if (draft.dish.trang_thai_mon !== 'ConMon') {
        showToast('warning', `"${draft.dish.ten_mon_an}" hiện đã hết món.`);
        return;
      }
      setCart((prev) => upsertCartItem(prev, draft));
      showToast(
        'success',
        `Đã thêm ${draft.so_luong}× ${draft.dish.ten_mon_an} vào giỏ món.`,
      );
    },
    [showToast],
  );

  const quickAddDish = useCallback(
    (dish: MonAn) => {
      addToCart({
        dish,
        so_luong: 1,
        muc_do_cay_yc: dish.muc_do_cay,
        ghi_chu_mon: '',
      });
    },
    [addToCart],
  );

  const setCartItemQuantity = useCallback((key: string, nextQty: number) => {
    setCart((prev) => updateCartItemQty(prev, key, nextQty));
  }, []);

  const removeItemFromCart = useCallback((key: string) => {
    setCart((prev) => removeCartItem(prev, key));
  }, []);

  const removeSoldOutItems = useCallback(() => {
    setCart((prev) => prev.filter((item) => !soldOutCartKeys.has(item.key)));
    showToast('warning', 'Đã xóa các món vừa hết khỏi giỏ.');
  }, [soldOutCartKeys, showToast]);

  const submitCartToKitchen = useCallback((): boolean => {
    if (!table || cart.length === 0) return false;

    if (!canSubmitOrder) {
      showToast(
        'warning',
        sessionBlockReason === 'BILL_LOCKED'
          ? 'Bàn đã chốt hóa đơn, vui lòng gọi nhân viên nếu cần gọi thêm món.'
          : 'Bàn chưa mở phiên phục vụ. Vui lòng nhấn "Gọi nhân viên mở bàn".',
      );
      return false;
    }

    if (soldOutCartKeys.size > 0) {
      showToast('error', 'Có món trong giỏ vừa hết. Vui lòng xóa món hết trước khi gửi bếp.');
      return false;
    }

    const submittedCount = cartTotals.totalItems;
    submitOrderItems({
      ma_ban: table.ma_ban,
      nguon_goi: 'MobileQR',
      items: cart.map((item) => ({
        ma_mon_an: item.ma_mon_an,
        so_luong: item.so_luong,
        muc_do_cay_yc: item.muc_do_cay_yc,
        ghi_chu_mon: item.ghi_chu_mon,
      })),
    });

    setCart([]);
    showToast('success', `Đã gửi ${submittedCount} món xuống bếp. Bếp đang tiếp nhận!`);
    return true;
  }, [
    table,
    cart,
    canSubmitOrder,
    sessionBlockReason,
    soldOutCartKeys.size,
    cartTotals.totalItems,
    submitOrderItems,
    showToast,
  ]);

  const getCooldownSeconds = useCallback(
    (type: GuestRequestType) => getRemainingCooldownSeconds(lastSentByType[type], nowMs),
    [lastSentByType, nowMs],
  );

  const sendSupportRequest = useCallback(
    (type: GuestRequestType, customNote?: string): boolean => {
      if (!table) return false;
      const now = Date.now();
      const remaining = getRemainingCooldownSeconds(lastSentByType[type], now);
      if (remaining > 0) {
        return false;
      }

      const meta = GUEST_REQUEST_META[type];
      sendGuestQrSupportRequest(
        table.ma_ban,
        type,
        customNote ?? `${meta.label} (${table.ten_ban})`,
      );
      setNowMs(now);
      setLastSentByType((prev) => ({ ...prev, [type]: now }));
      const confirmText = `Đã gửi "${meta.label}" tới nhân viên phục vụ. Nhân viên sẽ đến hỗ trợ ngay.`;
      setLastSentMessage({ type, text: confirmText });
      showToast('success', `Đã gửi yêu cầu "${meta.label}" tới phục vụ.`);
      return true;
    },
    [table, lastSentByType, sendGuestQrSupportRequest, showToast],
  );

  const requestStaffOpenTable = useCallback(() => {
    if (!table) return false;
    return sendSupportRequest(
      'GapPhucVu',
      `Khách tại ${table.ten_ban} yêu cầu nhân viên mở phiên phục vụ để gọi món qua QR`,
    );
  }, [table, sendSupportRequest]);

  const linkedMember = useMemo<GuestMemberProfile | null>(() => {
    if (activeOrder?.ma_khach_hang) {
      const kh = snapshot.tbl_khach_hang.find((k) => k.ma_khach_hang === activeOrder.ma_khach_hang);
      if (kh && kh.loai_khach !== 'VangLai') {
        const doan = snapshot.tbl_khach_doan.find((d) => d.ma_khach_hang === kh.ma_khach_hang);
        return {
          ma_khach_hang: kh.ma_khach_hang,
          ho_ten: kh.ho_ten,
          so_dien_thoai: kh.so_dien_thoai ?? '',
          loai_khach: kh.loai_khach,
          hang_the: kh.hang_the,
          diem_tich_luy: kh.diem_tich_luy,
          discountPercent: getTierDiscountPercent(kh.hang_the),
          companyName: doan?.ten_cong_ty ?? null,
        };
      }
    }
    return checkedMember;
  }, [activeOrder, snapshot.tbl_khach_hang, snapshot.tbl_khach_doan, checkedMember]);

  const identifyMemberByPhone = useCallback(
    (rawPhone: string): { ok: boolean; error?: string } => {
      const res = lookupGuestMemberByPhone(snapshot, rawPhone);
      if (!res.ok) {
        return { ok: false, error: res.message };
      }
      setCheckedMember(res.member);
      if (table && canSubmitOrder) {
        linkMemberToTableOrder(table.ma_ban, res.member.ma_khach_hang);
        showToast(
          'success',
          `Chào ${res.member.ho_ten} (${res.member.hang_the}) — đã áp dụng ưu đãi cho bàn!`,
        );
      } else {
        showToast('success', `Đã nhận diện thành viên ${res.member.ho_ten} (${res.member.hang_the}).`);
      }
      return { ok: true };
    },
    [snapshot, table, canSubmitOrder, linkMemberToTableOrder, showToast],
  );

  const shortAreaName = area ? formatShortAreaName(area.ten_khu_vuc) : 'Khu vực ăn uống';

  return {
    snapshot,
    table,
    area,
    shortAreaName,
    parentTable,
    activeOrder,
    linkedMember,
    identifyMemberByPhone,
    canSubmitOrder,
    sessionBlockReason,
    enrichedOrderItems,
    activeKitchenCount,
    billSummary,
    cart,
    cartTotals,
    soldOutCartKeys,
    toast,
    dismissToast,
    addToCart,
    quickAddDish,
    setCartItemQuantity,
    removeItemFromCart,
    removeSoldOutItems,
    submitCartToKitchen,
    sendSupportRequest,
    requestStaffOpenTable,
    getCooldownSeconds,
    lastSentMessage,
  };
}
