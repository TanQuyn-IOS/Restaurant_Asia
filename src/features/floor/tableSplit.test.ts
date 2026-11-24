import { describe, expect, it } from 'vitest';
import { INITIAL_DATABASE_SNAPSHOT } from '@/data/seedData';
import {
  attachTableOriginTag,
  parseTableOriginNote,
  stripTableOriginTag,
} from './tableOriginTag';
import {
  applyDetachMergedTable,
  applyTransferOrMergeTable,
  getItemsBelongingToChildTable,
} from './tableSplit';

describe('tableOriginTag — gắn và đọc nguồn bàn gọi món trong ghi_chu_mon', () => {
  it('gắn, tách và gỡ dấu nguồn bàn an toàn trong giới hạn 255 ký tự', () => {
    const tagged = attachTableOriginTag('Ít hành', 'D-302');
    expect(tagged).toBe('[BAN:D-302] Ít hành');
    expect(parseTableOriginNote(tagged)).toEqual({
      originTableId: 'D-302',
      cleanNote: 'Ít hành',
    });
    expect(stripTableOriginTag(tagged)).toBe('Ít hành');

    const emptyNote = attachTableOriginTag('', 'B-102');
    expect(emptyNote).toBe('[BAN:B-102]');
    expect(parseTableOriginNote(emptyNote)).toEqual({
      originTableId: 'B-102',
      cleanNote: null,
    });
    expect(stripTableOriginTag(emptyNote)).toBeNull();

    // Giữ nguyên nguồn bàn cũ nếu preserveExisting = true
    expect(attachTableOriginTag('[BAN:B-102] Không cay', 'B-101', true)).toBe(
      '[BAN:B-102] Không cay',
    );
  });
});

describe('tableSplit — Ghép bàn (Trống & Đang phục vụ) và Tách bàn tự trả đúng món đã gọi', () => {
  it('Tách bàn phụ D-302 chưa gọi món riêng: trả về Trống và chuyển yêu cầu QR về bàn chính D-301', () => {
    const snap = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    snap.tbl_yeu_cau_khach_hang.push({
      ma_yeu_cau: 'YC-TEST-D302',
      ma_ban: 'D-302',
      loai_yeu_cau: 'GoiNuocLoc',
      ghi_chu_yeu_cau: null,
      thoi_gian_gui: '2026-11-24 19:00:00',
      trang_thai_xu_ly: 'ChoXuLy',
    });

    const initialOrdersCount = snap.tbl_don_goi_mon.length;
    const res = applyDetachMergedTable(snap, 'D-302');

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.kind).toBe('returned_empty');
    expect(res.newOrderId).toBeNull();
    expect(res.restoredItemCount).toBe(0);
    expect(res.snapshot.tbl_don_goi_mon).toHaveLength(initialOrdersCount);

    const d302 = res.snapshot.tbl_ban.find((b) => b.ma_ban === 'D-302');
    expect(d302?.ma_ban_chinh).toBeNull();
    expect(d302?.trang_thai_ban).toBe('Trong');

    const movedReq = res.snapshot.tbl_yeu_cau_khach_hang.find((r) => r.ma_yeu_cau === 'YC-TEST-D302');
    expect(movedReq?.ma_ban).toBe('D-301');
  });

  it('Tách bàn phụ D-302 khi bàn phụ đã gọi món trong lúc ghép: tự mở đơn mới và trả đúng những món D-302 đã gọi', () => {
    const snap = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    snap.tbl_chi_tiet_don_goi.push({
      ma_chi_tiet_order: 'CT-D302-1',
      ma_order: 'ORD-DOAN301',
      ma_mon_an: 'MON-VN01',
      so_luong: 2,
      don_gia_thoi_diem: 145000,
      muc_do_cay_yc: 1,
      ghi_chu_mon: attachTableOriginTag('Ít hành', 'D-302'),
      lan_goi: 2,
      nguon_goi: 'MobileQR',
      thoi_gian_goi: '2026-11-24 19:20:00',
      trang_thai_mon: 'DangCheBien',
    });
    snap.tbl_nhat_ky_bep.push({
      ma_log_bep: 'LOG-CT-D302-1',
      ma_chi_tiet_order: 'CT-D302-1',
      ma_dau_bep: 'NV-BEP01',
      thoi_gian_tiep_nhan: '2026-11-24 19:20:00',
      thoi_gian_bat_dau: '2026-11-24 19:22:00',
      thoi_gian_hoan_thanh: null,
      trang_thai_che_bien: 'DangCheBien',
    });

    expect(getItemsBelongingToChildTable(snap, 'D-302').map((i) => i.ma_chi_tiet_order)).toEqual([
      'CT-D302-1',
    ]);

    const res = applyDetachMergedTable(snap, 'D-302', '2026-11-24 19:30:00');
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.kind).toBe('restored_with_items');
    expect(res.newOrderId).toBeTruthy();
    expect(res.newOrderId!.length).toBeLessThanOrEqual(30);
    expect(res.restoredItemCount).toBe(1);
    expect(res.restoredUnitsCount).toBe(2);

    const d302 = res.snapshot.tbl_ban.find((b) => b.ma_ban === 'D-302');
    expect(d302?.ma_ban_chinh).toBeNull();
    expect(d302?.trang_thai_ban).toBe('DangPhucVu');

    const returnedItem = res.snapshot.tbl_chi_tiet_don_goi.find(
      (i) => i.ma_chi_tiet_order === 'CT-D302-1',
    );
    expect(returnedItem?.ma_order).toBe(res.newOrderId);
    expect(returnedItem?.ghi_chu_mon).toBe('Ít hành'); // Đã gỡ dấu [BAN:D-302]

    // Món gốc của bàn chính D-301 vẫn nguyên vẹn ở ORD-DOAN301
    const masterItem = res.snapshot.tbl_chi_tiet_don_goi.find(
      (i) => i.ma_chi_tiet_order === 'CT-DOAN-1',
    );
    expect(masterItem?.ma_order).toBe('ORD-DOAN301');
  });

  it('Ghép 2 bàn đang phục vụ (lỡ gộp B-101 vào D-301) rồi tách B-101 ra sẽ tự trả lại toàn bộ 3 món của B-101', () => {
    // D-301 đang có 1 dòng món (CT-DOAN-1); B-101 đang có 3 dòng món (CT-101-1, CT-101-2, CT-101-3)
    const mergeRes = applyTransferOrMergeTable(INITIAL_DATABASE_SNAPSHOT, 'D-301', 'B-101', 'merge');
    expect(mergeRes.ok).toBe(true);
    if (!mergeRes.ok) return;

    const mergedSnap = mergeRes.snapshot;
    const b101AfterMerge = mergedSnap.tbl_ban.find((b) => b.ma_ban === 'B-101');
    expect(b101AfterMerge?.ma_ban_chinh).toBe('D-301');

    const b101ItemsInMerged = getItemsBelongingToChildTable(mergedSnap, 'B-101');
    expect(b101ItemsInMerged.map((i) => i.ma_chi_tiet_order).sort()).toEqual([
      'CT-101-1',
      'CT-101-2',
      'CT-101-3',
    ]);

    // Bây giờ tách B-101 ra -> tự trả về đúng 3 món của B-101
    const detachRes = applyDetachMergedTable(mergedSnap, 'B-101', '2026-11-24 20:00:00');
    expect(detachRes.ok).toBe(true);
    if (!detachRes.ok) return;

    expect(detachRes.kind).toBe('restored_with_items');
    expect(detachRes.restoredItemCount).toBe(3);
    expect(detachRes.restoredUnitsCount).toBe(4); // 2 + 1 + 1

    const b101OrderItems = detachRes.snapshot.tbl_chi_tiet_don_goi.filter(
      (i) => i.ma_order === detachRes.newOrderId,
    );
    expect(b101OrderItems.map((i) => i.ma_chi_tiet_order).sort()).toEqual([
      'CT-101-1',
      'CT-101-2',
      'CT-101-3',
    ]);
    // Dấu [BAN:B-101] đã được gỡ sạch sau khi trả về bàn riêng
    expect(b101OrderItems.every((i) => parseTableOriginNote(i.ghi_chu_mon).originTableId === null)).toBe(
      true,
    );

    // D-301 vẫn giữ đúng món ban đầu của D-301
    const d301Remaining = detachRes.snapshot.tbl_chi_tiet_don_goi.filter(
      (i) => i.ma_order === 'ORD-DOAN301',
    );
    expect(d301Remaining.map((i) => i.ma_chi_tiet_order)).toEqual(['CT-DOAN-1']);
  });

  it('Chặn tách bàn không phải bàn phụ, chặn tách khi bàn chính đã chốt bill, và chặn ghép bàn có cọc làm bàn phụ', () => {
    expect(applyDetachMergedTable(INITIAL_DATABASE_SNAPSHOT, 'D-301').ok).toBe(false);
    expect(applyDetachMergedTable(INITIAL_DATABASE_SNAPSHOT, 'B-102').ok).toBe(false);

    const billingSnap = structuredClone(INITIAL_DATABASE_SNAPSHOT);
    const d301 = billingSnap.tbl_ban.find((b) => b.ma_ban === 'D-301');
    if (d301) d301.trang_thai_ban = 'ChoThanhToan';
    expect(applyDetachMergedTable(billingSnap, 'D-302').ok).toBe(false);

    // D-301 có phiếu đặt cọc PDB-01 nên không được chọn làm bàn phụ gộp vào B-101 (tránh mất cọc)
    const badMerge = applyTransferOrMergeTable(INITIAL_DATABASE_SNAPSHOT, 'B-101', 'D-301', 'merge');
    expect(badMerge.ok).toBe(false);
  });

  it('Chuyển bàn chính có bàn phụ ghép đi kèm sẽ cập nhật ma_ban_chinh sang bàn đích mới', () => {
    const res = applyTransferOrMergeTable(INITIAL_DATABASE_SNAPSHOT, 'D-301', 'D-303', 'transfer');
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const d301 = res.snapshot.tbl_ban.find((b) => b.ma_ban === 'D-301');
    const d302 = res.snapshot.tbl_ban.find((b) => b.ma_ban === 'D-302');
    const d303 = res.snapshot.tbl_ban.find((b) => b.ma_ban === 'D-303');
    const ord = res.snapshot.tbl_don_goi_mon.find((o) => o.ma_order === 'ORD-DOAN301');

    expect(d301?.trang_thai_ban).toBe('Trong');
    expect(d303?.trang_thai_ban).toBe('DangPhucVu');
    expect(d302?.ma_ban_chinh).toBe('D-303');
    expect(ord?.ma_ban).toBe('D-303');
  });
});
