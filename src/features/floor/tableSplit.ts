import type {
  ChiTietDonGoi,
  DatabaseSnapshot,
  DonGoiMon,
} from '@/types/database';
import {
  attachTableOriginTag,
  parseTableOriginNote,
  stripTableOriginTag,
} from './tableOriginTag';

export type DetachTableOutcome =
  | {
      ok: true;
      kind: 'returned_empty' | 'restored_with_items';
      snapshot: DatabaseSnapshot;
      masterTableId: string;
      detachedTableId: string;
      newOrderId: string | null;
      restoredItemCount: number;
      restoredUnitsCount: number;
      message: string;
    }
  | {
      ok: false;
      reason: string;
    };

export type TransferOrMergeOutcome =
  | {
      ok: true;
      snapshot: DatabaseSnapshot;
      selectedTableId: string;
      message: string;
    }
  | {
      ok: false;
      reason: string;
    };

function toSqlTimestamp(date = new Date()): string {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function generateCompactId(prefix: string, existingIds: Set<string>, maxLen: number): string {
  for (let attempt = 0; attempt < 16; attempt++) {
    const tail = Date.now().toString(36).slice(-5).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const candidate = `${prefix}${tail}${rand}`.slice(0, maxLen);
    if (!existingIds.has(candidate)) {
      existingIds.add(candidate);
      return candidate;
    }
  }
  const fallback = `${prefix}${Date.now().toString(36).toUpperCase()}`.slice(0, maxLen);
  existingIds.add(fallback);
  return fallback;
}

/**
 * Lấy danh sách các món chưa hủy trong đơn bàn chính có nguồn gọi từ bàn phụ `childTableId`.
 */
export function getItemsBelongingToChildTable(
  snapshot: DatabaseSnapshot,
  childTableId: string,
): ChiTietDonGoi[] {
  const child = snapshot.tbl_ban.find((b) => b.ma_ban === childTableId);
  if (!child?.ma_ban_chinh) return [];

  const masterOrder = snapshot.tbl_don_goi_mon.find(
    (o) => o.ma_ban === child.ma_ban_chinh && o.trang_thai_order === 'DangPhucVu',
  );
  if (!masterOrder) return [];

  return snapshot.tbl_chi_tiet_don_goi.filter(
    (item) =>
      item.ma_order === masterOrder.ma_order &&
      item.trang_thai_mon !== 'DaHuy' &&
      parseTableOriginNote(item.ghi_chu_mon).originTableId === childTableId,
  );
}

/**
 * Ghép bàn vào bàn chính (hỗ trợ cả bàn Trống lẫn bàn Đang phục vụ khác chưa chốt bill —
 * khi gộp bàn đang phục vụ sẽ tự động gắn dấu nguồn bàn vào các món để lúc tách bàn trả lại đúng món)
 * hoặc Chuyển toàn bộ phiên phục vụ (kèm các bàn phụ đi kèm) sang một bàn Trống.
 */
export function applyTransferOrMergeTable(
  snapshot: DatabaseSnapshot,
  maBanNguon: string,
  maBanDich: string,
  mode: 'transfer' | 'merge',
): TransferOrMergeOutcome {
  const next = structuredClone(snapshot);
  const rawNguon = next.tbl_ban.find((b) => b.ma_ban === maBanNguon);
  const dich = next.tbl_ban.find((b) => b.ma_ban === maBanDich);

  if (!rawNguon || !dich) {
    return { ok: false, reason: 'Không tìm thấy bàn nguồn hoặc bàn đích!' };
  }

  const masterId = rawNguon.ma_ban_chinh || rawNguon.ma_ban;
  const nguon = next.tbl_ban.find((b) => b.ma_ban === masterId);
  if (!nguon) {
    return { ok: false, reason: 'Không tìm thấy bàn chính của phiên phục vụ!' };
  }
  if (nguon.ma_ban === dich.ma_ban) {
    return { ok: false, reason: 'Bàn nguồn và bàn đích phải khác nhau!' };
  }
  if (nguon.trang_thai_ban !== 'DangPhucVu') {
    return {
      ok: false,
      reason: 'Chỉ có thể ghép hoặc chuyển khi bàn nguồn đang ở trạng thái Đang phục vụ!',
    };
  }

  if (mode === 'transfer') {
    if (dich.trang_thai_ban !== 'Trong' || dich.ma_ban_chinh) {
      return { ok: false, reason: 'Bàn đích chuyển sang phải đang ở trạng thái Bàn trống!' };
    }

    const order = next.tbl_don_goi_mon.find(
      (o) => o.ma_ban === nguon.ma_ban && o.trang_thai_order === 'DangPhucVu',
    );
    if (order) {
      order.ma_ban = dich.ma_ban;
    }
    // Chuyển luôn liên kết các bàn phụ đang ghép theo bàn chính cũ sang bàn đích mới
    next.tbl_ban.forEach((b) => {
      if (b.ma_ban_chinh === nguon.ma_ban) {
        b.ma_ban_chinh = dich.ma_ban;
      }
    });
    next.tbl_yeu_cau_khach_hang.forEach((req) => {
      if (req.ma_ban === nguon.ma_ban && req.trang_thai_xu_ly !== 'DaHoanTat') {
        req.ma_ban = dich.ma_ban;
      }
    });
    dich.trang_thai_ban = nguon.trang_thai_ban;
    nguon.trang_thai_ban = 'Trong';

    return {
      ok: true,
      snapshot: next,
      selectedTableId: dich.ma_ban,
      message: `Đã chuyển toàn bộ phiên phục vụ từ ${nguon.ten_ban} sang ${dich.ten_ban}!`,
    };
  }

  // ── Chế độ GHÉP BÀN ──
  const masterOrder = next.tbl_don_goi_mon.find(
    (o) => o.ma_ban === nguon.ma_ban && o.trang_thai_order === 'DangPhucVu',
  );
  if (!masterOrder) {
    return { ok: false, reason: 'Không tìm thấy đơn đang mở của bàn chính!' };
  }

  if (dich.ma_ban_chinh) {
    return {
      ok: false,
      reason: `${dich.ten_ban} đang là bàn phụ của một nhóm khác, vui lòng tách trước khi ghép mới!`,
    };
  }

  if (dich.trang_thai_ban === 'Trong') {
    dich.ma_ban_chinh = nguon.ma_ban;
    dich.trang_thai_ban = 'DangPhucVu';

    return {
      ok: true,
      snapshot: next,
      selectedTableId: nguon.ma_ban,
      message: `Đã ghép ${dich.ten_ban} vào bàn chính ${nguon.ten_ban} (Gom chung 1 hóa đơn tổng)!`,
    };
  }

  if (dich.trang_thai_ban !== 'DangPhucVu') {
    return {
      ok: false,
      reason: 'Chỉ có thể ghép thêm Bàn trống hoặc bàn đang phục vụ (chưa chốt bill)!',
    };
  }

  // Ghép một bàn ĐANG PHỤC VỤ khác vào bàn chính -> gom món và gắn dấu nguồn bàn để tách ra trả đúng món
  const dichOrder = next.tbl_don_goi_mon.find(
    (o) => o.ma_ban === dich.ma_ban && o.trang_thai_order === 'DangPhucVu',
  );
  if (dichOrder) {
    const dichHasInvoice = next.tbl_hoa_don.some(
      (h) => h.ma_order === dichOrder.ma_order && h.trang_thai_tt !== 'DaHuy',
    );
    if (dichHasInvoice) {
      return {
        ok: false,
        reason: `${dich.ten_ban} đã lập hóa đơn thu ngân, không thể ghép bàn!`,
      };
    }
    if (dichOrder.ma_phieu_dat && masterOrder.ma_phieu_dat) {
      return {
        ok: false,
        reason: 'Cả hai bàn đều có phiếu đặt bàn riêng, không thể gộp chung vào 1 đơn!',
      };
    }
    if (dichOrder.ma_phieu_dat && !masterOrder.ma_phieu_dat) {
      return {
        ok: false,
        reason: `${dich.ten_ban} đang gắn tiền đặt cọc (${dichOrder.ma_phieu_dat}). Vui lòng chọn ${dich.ten_ban} làm bàn chính khi ghép!`,
      };
    }

    const masterItems = next.tbl_chi_tiet_don_goi.filter(
      (i) => i.ma_order === masterOrder.ma_order,
    );
    const maxLanGoi =
      masterItems.length === 0 ? 0 : Math.max(...masterItems.map((i) => i.lan_goi));

    let movedCount = 0;
    next.tbl_chi_tiet_don_goi.forEach((item) => {
      if (item.ma_order === dichOrder.ma_order) {
        item.ma_order = masterOrder.ma_order;
        if (item.trang_thai_mon !== 'DaHuy') {
          item.ghi_chu_mon = attachTableOriginTag(item.ghi_chu_mon, dich.ma_ban, true);
          item.lan_goi = maxLanGoi + item.lan_goi;
          movedCount += 1;
        }
      }
    });

    // Đóng phiên cũ của bàn phụ vì toàn bộ món đã gộp sang đơn bàn chính
    dichOrder.trang_thai_order = 'DaGiaiPhong';

    // Nếu bàn bị ghép vốn có các bàn con khác, chuyển luôn chúng về bàn chính mới
    next.tbl_ban.forEach((b) => {
      if (b.ma_ban_chinh === dich.ma_ban) {
        b.ma_ban_chinh = nguon.ma_ban;
      }
    });

    dich.ma_ban_chinh = nguon.ma_ban;
    dich.trang_thai_ban = 'DangPhucVu';

    return {
      ok: true,
      snapshot: next,
      selectedTableId: nguon.ma_ban,
      message: `Đã ghép ${dich.ten_ban} vào ${nguon.ten_ban} và gộp ${movedCount} dòng món (đã lưu nguồn bàn để tự trả đúng món khi tách)!`,
    };
  }

  dich.ma_ban_chinh = nguon.ma_ban;
  dich.trang_thai_ban = 'DangPhucVu';

  return {
    ok: true,
    snapshot: next,
    selectedTableId: nguon.ma_ban,
    message: `Đã ghép ${dich.ten_ban} vào bàn chính ${nguon.ten_ban}!`,
  };
}

/**
 * Tách một bàn phụ đang ghép khỏi bàn chính:
 * - Nếu bàn phụ có các món đã gọi (gọi qua QR bàn phụ, Phục vụ gọi cho bàn phụ, hoặc món có sẵn trước khi bị gộp):
 *   tự động tạo phiên đơn riêng cho bàn phụ và TRẢ VỀ ĐÚNG CÁC MÓN ĐÓ (gỡ dấu `[BAN:...]`, giữ nguyên log bếp KDS).
 * - Nếu bàn phụ chưa gọi món nào: trả bàn phụ về trạng thái `Trong` (Xanh lá).
 */
export function applyDetachMergedTable(
  snapshot: DatabaseSnapshot,
  childTableId: string,
  nowSql = toSqlTimestamp(),
): DetachTableOutcome {
  const next = structuredClone(snapshot);
  const child = next.tbl_ban.find((b) => b.ma_ban === childTableId);
  if (!child) {
    return { ok: false, reason: 'Không tìm thấy bàn phụ cần tách!' };
  }
  if (!child.ma_ban_chinh) {
    return { ok: false, reason: `${child.ten_ban} không phải là bàn phụ đang ghép!` };
  }

  const master = next.tbl_ban.find((b) => b.ma_ban === child.ma_ban_chinh);
  if (!master) {
    return { ok: false, reason: 'Không tìm thấy bàn chính của nhóm ghép!' };
  }
  if (master.trang_thai_ban !== 'DangPhucVu') {
    return {
      ok: false,
      reason: 'Không thể tách bàn khi bàn chính đã chốt bill chờ thanh toán!',
    };
  }

  const masterOrder = next.tbl_don_goi_mon.find(
    (o) => o.ma_ban === master.ma_ban && o.trang_thai_order === 'DangPhucVu',
  );
  if (masterOrder) {
    const hasIssuedInvoice = next.tbl_hoa_don.some(
      (h) => h.ma_order === masterOrder.ma_order && h.trang_thai_tt !== 'DaHuy',
    );
    if (hasIssuedInvoice) {
      return {
        ok: false,
        reason: 'Đơn hàng đã lập hóa đơn thu ngân, không thể tách bàn!',
      };
    }
  }

  const childItems = masterOrder
    ? next.tbl_chi_tiet_don_goi.filter(
        (item) =>
          item.ma_order === masterOrder.ma_order &&
          item.trang_thai_mon !== 'DaHuy' &&
          parseTableOriginNote(item.ghi_chu_mon).originTableId === child.ma_ban,
      )
    : [];

  // Trường hợp 1: Bàn phụ không có món nào của riêng nó -> trả về Bàn trống
  if (childItems.length === 0) {
    child.ma_ban_chinh = null;
    child.trang_thai_ban = 'Trong';

    next.tbl_yeu_cau_khach_hang.forEach((req) => {
      if (req.ma_ban === child.ma_ban && req.trang_thai_xu_ly !== 'DaHoanTat') {
        req.ma_ban = master.ma_ban;
      }
    });

    return {
      ok: true,
      kind: 'returned_empty',
      snapshot: next,
      masterTableId: master.ma_ban,
      detachedTableId: child.ma_ban,
      newOrderId: null,
      restoredItemCount: 0,
      restoredUnitsCount: 0,
      message: `Đã tách ${child.ten_ban} khỏi ${master.ten_ban} và trả về trạng thái Bàn trống!`,
    };
  }

  // Trường hợp 2: Bàn phụ có món đã gọi -> tự động mở phiên độc lập & trả đúng những món đó về bàn phụ
  const existingOrderIds = new Set(next.tbl_don_goi_mon.map((o) => o.ma_order));
  const newOrderId = generateCompactId('ORD-TB', existingOrderIds, 30);

  const newOrder: DonGoiMon = {
    ma_order: newOrderId,
    ma_ban: child.ma_ban,
    ma_phieu_dat: null, // Tiền cọc giữ tại bàn chính
    ma_khach_hang: null,
    ma_nhan_vien_phuc_vu: masterOrder?.ma_nhan_vien_phuc_vu ?? 'NV-PV01',
    loai_khach_phien: 'VangLai',
    vip_flag: child.loai_ban === 'VIP',
    thoi_gian_mo_ban: nowSql,
    trang_thai_order: 'DangPhucVu',
  };

  next.tbl_don_goi_mon.push(newOrder);
  child.ma_ban_chinh = null;
  child.trang_thai_ban = 'DangPhucVu';

  let restoredUnitsCount = 0;
  for (const item of childItems) {
    item.ma_order = newOrderId;
    item.ghi_chu_mon = stripTableOriginTag(item.ghi_chu_mon);
    restoredUnitsCount += item.so_luong;
  }

  return {
    ok: true,
    kind: 'restored_with_items',
    snapshot: next,
    masterTableId: master.ma_ban,
    detachedTableId: child.ma_ban,
    newOrderId,
    restoredItemCount: childItems.length,
    restoredUnitsCount,
    message: `Đã tách ${child.ten_ban} khỏi ${master.ten_ban} và tự động trả về ${restoredUnitsCount} phần (${childItems.length} dòng món) bàn này đã gọi (${newOrderId})!`,
  };
}
