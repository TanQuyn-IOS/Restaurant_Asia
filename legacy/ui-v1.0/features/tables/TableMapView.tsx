import React, { useState } from 'react';
import {
  Utensils,
  Trash2,
  QrCode,
  CalendarPlus,
  Crown,
  Users,
  CheckCircle2,
  BellRing,
  Plus,
  ArrowRightLeft,
  FileCheck2,
  XCircle,
  Flame,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import {
  useRestaurantStore,
  calculateCompletedOrderBill,
  canCancelOrderItem,
} from '../../store/useRestaurantStore';
import { CustomerGroupType, CuisineSchool } from '../../types/database';
import { formatVnd, getSpicyLabel } from '../../utils/soundNotifier';

const QUICK_NOTES = ['Ít hành lá', 'Không cay', 'Ít dầu mỡ', 'Nước dùng nóng già', 'Ưu tiên lên trước'];

export const TableMapView: React.FC = () => {
  const {
    snapshot,
    selectedTableId,
    setSelectedTableId,
    openTableSession,
    createReservation,
    deleteReleaseTableSession,
    transferOrMergeTable,
    submitOrderItems,
    cancelOrderItemBeforeCooking,
    markDishServedAtTable,
    lockBillAndSendToCashier,
    enterIsolatedQrMode,
    resolveGuestQrRequest,
  } = useRestaurantStore();

  // Chế độ hiển thị cột trái: Sơ đồ bàn (FLOOR) hoặc Lưới chạm chọn món nhanh (TOUCH_MENU)
  const [workspaceMode, setWorkspaceMode] = useState<'FLOOR' | 'TOUCH_MENU'>('FLOOR');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineSchool | 'ALL'>('ALL');

  // Mở bàn 4 nhóm khách
  const [openCustomerType, setOpenCustomerType] = useState<CustomerGroupType>('VangLai');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [mergeTableIds, setMergeTableIds] = useState<string[]>([]);
  const [targetTransferId, setTargetTransferId] = useState<string>('');

  // Tùy chọn nhanh khi chạm gọi món trên Touch POS
  const [activeSpice, setActiveSpice] = useState<0 | 1 | 2 | 3>(1);
  const [activeNote, setActiveNote] = useState<string>('');

  // Modal Đặt bàn trước & Thu cọc
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookType, setBookType] = useState<CustomerGroupType>('Doan');
  const [bookTableId, setBookTableId] = useState('B-102');
  const [bookTime, setBookTime] = useState('2026-11-24 19:00:00');
  const [bookGuests, setBookGuests] = useState(12);
  const [bookDeposit, setBookDeposit] = useState(1500000);
  const [bookCompany, setBookCompany] = useState('');
  const [bookTaxCode, setBookTaxCode] = useState('');
  const [bookNote, setBookNote] = useState('Đặt tiệc đoàn chọn gói Combo Á Châu, xuất hóa đơn đỏ VAT');

  const selectedBan =
    snapshot.tbl_ban.find((b) => b.ma_ban === selectedTableId) || snapshot.tbl_ban[0];
  const effectiveTableId = selectedBan?.ma_ban_chinh || selectedBan?.ma_ban;

  const activeOrder = snapshot.tbl_don_goi_mon.find(
    (o) => o.ma_ban === effectiveTableId && o.trang_thai_order !== 'DaGiaiPhong',
  );

  const orderItems = activeOrder
    ? snapshot.tbl_chi_tiet_don_goi.filter((i) => i.ma_order === activeOrder.ma_order)
    : [];

  const billSummary = activeOrder
    ? calculateCompletedOrderBill(snapshot, activeOrder.ma_order)
    : null;

  const filteredTables =
    selectedArea === 'ALL'
      ? snapshot.tbl_ban
      : snapshot.tbl_ban.filter((b) => b.ma_khu_vuc === selectedArea);

  const filteredDishes = snapshot.tbl_mon_an.filter((mon) => {
    if (selectedCuisine === 'ALL') return true;
    const dm = snapshot.tbl_danh_muc_mon.find((d) => d.ma_danh_muc === mon.ma_danh_muc);
    return dm?.truong_phai_am_thuc === selectedCuisine;
  });

  const pendingQrRequests = snapshot.tbl_yeu_cau_khach_hang.filter(
    (y) => y.trang_thai_xu_ly !== 'DaHoanTat',
  );

  const handleOpenTable = () => {
    if (!selectedBan) return;
    const reservation = snapshot.tbl_phieu_dat_ban.find(
      (p) => p.ma_ban === selectedBan.ma_ban && p.trang_thai_dat === 'DaNhan',
    );
    openTableSession({
      ma_ban: selectedBan.ma_ban,
      loai_khach: openCustomerType,
      ma_khach_hang:
        selectedCustomerId ||
        reservation?.ma_khach_hang ||
        (openCustomerType === 'VIP'
          ? 'KH-VIP01'
          : openCustomerType === 'Doan'
            ? 'KH-DOAN01'
            : openCustomerType === 'Thuong'
              ? 'KH-TH01'
              : 'KH-VL01'),
      ma_phieu_dat: reservation?.ma_phieu_dat || null,
      ghep_ban_phu_ids: mergeTableIds,
    });
    setMergeTableIds([]);
    setWorkspaceMode('TOUCH_MENU');
  };

  const handleQuickTapDish = (maMonAn: string) => {
    if (!selectedBan) return;
    submitOrderItems({
      ma_ban: selectedBan.ma_ban,
      nguon_goi: 'Waitstaff',
      items: [
        {
          ma_mon_an: maMonAn,
          so_luong: 1,
          muc_do_cay_yc: activeSpice,
          ghi_chu_mon: activeNote,
        },
      ],
    });
  };

  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation({
      ho_ten: bookName || 'Đoàn Khách Công Ty Á Đông',
      so_dien_thoai: bookPhone || '0905888999',
      loai_khach: bookType,
      ma_ban: bookTableId,
      thoi_gian_den: bookTime,
      so_nguoi: bookGuests,
      tien_dat_coc: bookDeposit,
      ghi_chu_tiec: bookNote,
      ten_cong_ty: bookCompany,
      ma_so_thue: bookTaxCode,
    });
    setShowBookingModal(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Trong':
        return { text: 'Trống', badge: 'ac-badge-green' };
      case 'DaDat':
        return { text: 'Đã đặt', badge: 'ac-badge-yellow' };
      case 'DangPhucVu':
        return { text: 'Đang phục vụ', badge: 'ac-badge-red' };
      case 'ChoThanhToan':
        return { text: 'Chờ thanh toán', badge: 'ac-badge-orange' };
      default:
        return { text: status, badge: 'ac-badge-neutral' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      {/* Thanh Điều Khiển Sảnh & Chuyển Đổi Nhanh Sơ Đồ Bàn <-> Menu Chạm Gọi Món */}
      <div className="ac-page-header">
        <div className="ac-page-title-block">
          <h1 className="t-h1">Điều Phối Sơ Đồ Sảnh & POS Phục Vụ Tại Bàn</h1>
          <p className="t-small">
            Chọn bàn trên sơ đồ để mở phiên theo 4 nhóm khách, chạm chọn món gửi Bếp KDS, kiểm chốt Bill hoặc bấm nút DELETE dọn bàn.
          </p>
        </div>

        <div className="ac-page-actions">
          <div className="ac-segmented">
            <button
              className={`ac-seg-btn ${workspaceMode === 'FLOOR' ? 'active' : ''}`}
              onClick={() => setWorkspaceMode('FLOOR')}
            >
              <LayoutGrid size={15} /> 1. Sơ Đồ Bàn ({snapshot.tbl_ban.length})
            </button>
            <button
              className={`ac-seg-btn ${workspaceMode === 'TOUCH_MENU' ? 'active' : ''}`}
              onClick={() => setWorkspaceMode('TOUCH_MENU')}
            >
              <Utensils size={15} /> 2. Chạm Chọn Món ({selectedBan?.ten_ban})
            </button>
          </div>

          <button
            className="ac-btn ac-btn-primary"
            onClick={() => setShowBookingModal(true)}
          >
            <CalendarPlus size={15} /> Đặt Bàn / Thu Cọc Đoàn
          </button>
        </div>
      </div>

      {/* Chuông báo Yêu cầu hỗ trợ trực tiếp từ khách quét Mobile QR */}
      {pendingQrRequests.length > 0 && (
        <div
          className="ac-card"
          style={{
            background: 'var(--accent-soft)',
            borderColor: 'var(--accent)',
            padding: 'var(--sp-3) var(--sp-4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <BellRing size={18} color="var(--primary)" />
            <strong className="t-small">Yêu cầu từ khách quét QR tại bàn:</strong>
            {pendingQrRequests.map((req) => (
              <span key={req.ma_yeu_cau} className="ac-badge ac-badge-yellow">
                [{req.ma_ban}] {req.loai_yeu_cau}: {req.ghi_chu_yeu_cau}
                <button
                  onClick={() => resolveGuestQrRequest(req.ma_yeu_cau)}
                  style={{
                    marginLeft: 8,
                    textDecoration: 'underline',
                    color: 'var(--text-inverse)',
                    fontWeight: 700,
                  }}
                >
                  ✓ Xong
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* BỐ CỤC POS CHUẨN TOAST / SQUARE: Cột trái Sơ đồ bàn hoặc Menu chạm + Cột phải Sticky Receipt Dock */}
      <div className="ac-pos-layout">
        {/* ── CỘT TRÁI: SƠ ĐỒ BÀN HOẶC LƯỚI CHẠM GỌI MÓN NHANH ── */}
        {workspaceMode === 'FLOOR' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            {/* Thanh lọc Khu vực sảnh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div className="ac-segmented">
                <button
                  className={`ac-seg-btn ${selectedArea === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedArea('ALL')}
                >
                  Tất cả sảnh ({snapshot.tbl_ban.length})
                </button>
                {snapshot.tbl_khu_vuc.map((kv) => (
                  <button
                    key={kv.ma_khu_vuc}
                    className={`ac-seg-btn ${selectedArea === kv.ma_khu_vuc ? 'active' : ''}`}
                    onClick={() => setSelectedArea(kv.ma_khu_vuc)}
                  >
                    {kv.ten_khu_vuc.split(' (')[0]}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="ac-badge ac-badge-green">● Trống</span>
                <span className="ac-badge ac-badge-yellow">● Đã đặt</span>
                <span className="ac-badge ac-badge-red">● Đang phục vụ</span>
                <span className="ac-badge ac-badge-orange">● Chờ TT</span>
              </div>
            </div>

            {/* Mặt bằng Sảnh Nhà hàng (Architectural Floor Canvas) */}
            <div className="ac-floor-canvas">
              <div className="ac-table-grid">
                {filteredTables.map((ban) => {
                  const st = getStatusLabel(ban.trang_thai_ban);
                  const isSelected = ban.ma_ban === selectedBan?.ma_ban;
                  const tableOrder = snapshot.tbl_don_goi_mon.find(
                    (o) =>
                      (o.ma_ban === ban.ma_ban || o.ma_ban === ban.ma_ban_chinh) &&
                      o.trang_thai_order !== 'DaGiaiPhong',
                  );
                  const tableInvoice = tableOrder
                    ? snapshot.tbl_hoa_don.find((h) => h.ma_order === tableOrder.ma_order)
                    : undefined;
                  const tableCalc = tableOrder
                    ? calculateCompletedOrderBill(snapshot, tableOrder.ma_order)
                    : null;
                  const reservation = snapshot.tbl_phieu_dat_ban.find(
                    (p) => p.ma_ban === ban.ma_ban && p.trang_thai_dat !== 'DaHuy',
                  );

                  return (
                    <div
                      key={ban.ma_ban}
                      className={`ac-table-card status-${ban.trang_thai_ban} ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedTableId(ban.ma_ban)}
                    >
                      <div>
                        <div className="ac-table-header">
                          <div>
                            <div className="t-caption">
                              {ban.ma_ban} • {ban.so_ghe} ghế
                            </div>
                            <h3 className="t-h3">{ban.ten_ban}</h3>
                            {/* Hiển thị trực quan số ghế quanh bàn */}
                            <div className="ac-table-seats-visual">
                              {Array.from({ length: Math.min(8, ban.so_ghe) }).map((_, i) => (
                                <span key={i} className="ac-seat-pill" />
                              ))}
                            </div>
                          </div>
                          <span className={`ac-badge ${st.badge}`}>{st.text}</span>
                        </div>

                        {/* Micro-data mật độ cao giống Toast POS */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                          {ban.loai_ban === 'VIP' && (
                            <span className="ac-badge ac-badge-vip">
                              <Crown size={11} /> VIP
                            </span>
                          )}
                          {tableOrder?.vip_flag && (
                            <span className="ac-badge ac-badge-vip">★ Ưu tiên KDS</span>
                          )}
                          {ban.ma_ban_chinh && (
                            <span className="ac-badge ac-badge-neutral">
                              Ghép → {ban.ma_ban_chinh}
                            </span>
                          )}
                          {tableOrder && (
                            <span className="ac-badge ac-badge-neutral">
                              {tableOrder.loai_khach_phien}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Thông tin số tiền tạm tính hoặc giờ hẹn đặt trước */}
                      <div>
                        {tableCalc && (
                          <div
                            className="t-num"
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingTop: 6,
                              borderTop: '1px dashed var(--border-strong)',
                            }}
                          >
                            <span className="t-caption">
                              {tableCalc.completedItemsCount} món xong
                            </span>
                            <strong className="t-small" style={{ color: 'var(--text)' }}>
                              {formatVnd(tableCalc.tongTienPhaiTra)}
                            </strong>
                          </div>
                        )}

                        {tableInvoice?.trang_thai_tt === 'DaThanhToan' && (
                          <div style={{ marginTop: 4 }}>
                            <span className="ac-badge ac-badge-green">
                              ✓ Đã thu tiền • Chờ DELETE
                            </span>
                          </div>
                        )}

                        {reservation && ban.trang_thai_ban === 'DaDat' && (
                          <div className="t-caption" style={{ marginTop: 4 }}>
                            Hẹn {reservation.thoi_gian_den.slice(11, 16)} • {reservation.so_nguoi} khách
                            {reservation.tien_dat_coc > 0 && ` • Cọc ${formatVnd(reservation.tien_dat_coc)}`}
                          </div>
                        )}

                        {/* Hàng nút thao tác nhanh dưới đáy thẻ bàn */}
                        <div
                          style={{
                            display: 'flex',
                            gap: 6,
                            marginTop: 8,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tableOrder?.trang_thai_order === 'DangPhucVu' && (
                            <button
                              className="ac-btn ac-btn-primary ac-btn-sm"
                              style={{ flex: 1 }}
                              onClick={() => {
                                setSelectedTableId(ban.ma_ban);
                                setWorkspaceMode('TOUCH_MENU');
                              }}
                            >
                              <Plus size={12} /> Gọi món
                            </button>
                          )}

                          <button
                            className="ac-btn ac-btn-outline ac-btn-sm"
                            onClick={() => enterIsolatedQrMode(ban.ma_ban)}
                            title="Mở Cổng Khách hàng quét QR tại bàn này"
                          >
                            <QrCode size={12} /> QR
                          </button>

                          {ban.trang_thai_ban !== 'Trong' && (
                            <button
                              className="ac-btn ac-btn-delete ac-btn-sm"
                              style={{ flex: 1 }}
                              onClick={() => deleteReleaseTableSession(ban.ma_ban)}
                              title="FR-02: Sau khi thanh toán và dọn bàn sạch, bấm DELETE để xóa phiên cũ"
                            >
                              <Trash2 size={12} /> DELETE
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── CHẾ ĐỘ 2: LƯỚI CHẠM CHỌN MÓN NHANH (VISUAL TOUCH POS MENU GRID) ── */
          <div className="ac-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h2 className="t-h2">
                  Chạm Chọn Món Nhanh — {selectedBan?.ten_ban}
                </h2>
                <p className="t-small">
                  Chọn độ cay và ghi chú khẩu vị bên dưới, sau đó chạm trực tiếp vào thẻ món ăn để đẩy xuống Bếp KDS.
                </p>
              </div>
              <button
                className="ac-btn ac-btn-outline ac-btn-sm"
                onClick={() => setWorkspaceMode('FLOOR')}
              >
                ← Quay lại Sơ đồ bàn
              </button>
            </div>

            {/* Thanh chọn Cấp độ cay (0-3) & Tag ghi chú khẩu vị 1 chạm (Zero-Layer Modifiers giống Toast POS) */}
            <div
              style={{
                background: 'var(--surface-muted)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--sp-3)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--sp-2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="ac-label">
                  <Flame size={13} color="var(--primary)" style={{ verticalAlign: 'middle' }} /> Độ cay khi chạm gọi món:
                </span>
                {([0, 1, 2, 3] as (0 | 1 | 2 | 3)[]).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    className={`ac-btn ac-btn-sm ${activeSpice === lv ? 'ac-btn-primary' : 'ac-btn-outline'}`}
                    onClick={() => setActiveSpice(lv)}
                  >
                    {getSpicyLabel(lv)}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className="ac-label">
                  <Sparkles size={13} style={{ verticalAlign: 'middle' }} /> Ghi chú bếp:
                </span>
                {QUICK_NOTES.map((note) => (
                  <button
                    key={note}
                    type="button"
                    className={`ac-btn ac-btn-sm ${activeNote === note ? 'ac-btn-gold' : 'ac-btn-outline'}`}
                    onClick={() => setActiveNote(activeNote === note ? '' : note)}
                  >
                    {note}
                  </button>
                ))}
                <input
                  className="ac-input"
                  style={{ maxWidth: 220, padding: '4px 10px' }}
                  placeholder="Hoặc nhập ghi chú khác..."
                  value={activeNote}
                  onChange={(e) => setActiveNote(e.target.value)}
                />
              </div>
            </div>

            {/* Bộ lọc 5 Trường phái ẩm thực Châu Á */}
            <div className="ac-segmented">
              {(
                [
                  { id: 'ALL', label: 'Tất cả món' },
                  { id: 'VietNam', label: '🇻🇳 Việt Nam' },
                  { id: 'TrungHoa', label: '🇨🇳 Trung Hoa' },
                  { id: 'NhatBan', label: '🇯🇵 Nhật Bản' },
                  { id: 'HanQuoc', label: '🇰🇷 Hàn Quốc' },
                  { id: 'ThaiLan', label: '🇹🇭 Thái Lan' },
                ] as { id: CuisineSchool | 'ALL'; label: string }[]
              ).map((c) => (
                <button
                  key={c.id}
                  className={`ac-seg-btn ${selectedCuisine === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCuisine(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Lưới Thẻ Món Ăn Chạm 1-Tap */}
            <div className="ac-pos-dish-grid">
              {filteredDishes.map((mon) => {
                const isSoldOut = mon.trang_thai_mon !== 'ConMon';
                const canOrder = !isSoldOut && activeOrder?.trang_thai_order === 'DangPhucVu';

                return (
                  <div
                    key={mon.ma_mon_an}
                    className={`ac-pos-dish-card ${isSoldOut ? 'sold-out' : ''}`}
                  >
                    <div style={{ position: 'relative' }}>
                      {mon.hinh_anh_url && (
                        <img
                          src={mon.hinh_anh_url}
                          alt={mon.ten_mon_an}
                          className="ac-pos-dish-img"
                          loading="lazy"
                        />
                      )}
                      <span
                        className={`ac-badge ${isSoldOut ? 'ac-badge-red' : 'ac-badge-green'}`}
                        style={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        {isSoldOut ? 'Hết món' : `${mon.thoi_gian_nau_tb}p`}
                      </span>
                    </div>

                    <div className="ac-pos-dish-body">
                      <strong className="t-small" style={{ color: 'var(--text)' }}>
                        {mon.ten_mon_an}
                      </strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <strong className="t-small t-num" style={{ color: 'var(--primary)' }}>
                          {formatVnd(mon.don_gia)}
                        </strong>
                        <button
                          className="ac-btn ac-btn-primary ac-btn-sm"
                          disabled={!canOrder}
                          onClick={() => handleQuickTapDish(mon.ma_mon_an)}
                        >
                          <Plus size={13} /> Gửi Bếp
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CỘT PHẢI: STICKY POS RECEIPT DOCK (Phiếu Phục Vụ & Kiểm Chốt Bill Tại Bàn) ── */}
        {selectedBan && (
          <aside className="ac-pos-dock">
            <div className="ac-pos-dock-header">
              <div>
                <div className="t-caption" style={{ color: 'var(--accent)' }}>
                  {selectedBan.ma_ban} • {selectedBan.so_ghe} GHẾ • {selectedBan.ma_qr_code}
                </div>
                <h2 className="t-h2" style={{ color: 'var(--text-inverse)' }}>
                  {selectedBan.ten_ban}
                </h2>
              </div>
              <button
                className="ac-btn ac-btn-gold ac-btn-sm"
                onClick={() => enterIsolatedQrMode(selectedBan.ma_ban)}
              >
                <QrCode size={13} /> Mở QR Khách
              </button>
            </div>

            {/* NỘI DUNG DOCK: Nếu chưa mở bàn -> Form Mở Bàn 4 Nhóm Khách; Nếu đã mở -> Phiếu Order & Kiểm Bill */}
            {!activeOrder ? (
              <div className="ac-pos-dock-body">
                <div
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--sp-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--sp-3)',
                  }}
                >
                  <h3 className="t-h3">Mở Bàn Đón Khách (Chọn 4 Nhóm)</h3>
                  <p className="t-small">
                    Bàn đang ở trạng thái <strong>{selectedBan.trang_thai_ban}</strong>. Chọn nhóm thực khách để khởi tạo phiên phục vụ:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                    {(
                      [
                        { code: 'VangLai', label: '1. Vãng Lai (Nhanh)' },
                        { code: 'Thuong', label: '2. Khách Thường' },
                        { code: 'VIP', label: '3. Khách VIP (Ưu tiên)' },
                        { code: 'Doan', label: '4. Khách Đoàn (VAT)' },
                      ] as { code: CustomerGroupType; label: string }[]
                    ).map((g) => (
                      <button
                        key={g.code}
                        type="button"
                        className={`ac-btn ${openCustomerType === g.code ? 'ac-btn-primary' : 'ac-btn-outline'}`}
                        onClick={() => setOpenCustomerType(g.code)}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  {openCustomerType !== 'VangLai' && (
                    <div className="ac-field">
                      <label className="ac-label">Hồ sơ khách hàng / đoàn</label>
                      <select
                        className="ac-select"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      >
                        <option value="">-- Tự động gán hồ sơ mẫu ({openCustomerType}) --</option>
                        {snapshot.tbl_khach_hang
                          .filter((k) => k.loai_khach === openCustomerType)
                          .map((k) => (
                            <option key={k.ma_khach_hang} value={k.ma_khach_hang}>
                              {k.ho_ten} ({k.hang_the})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {openCustomerType === 'Doan' && (
                    <div className="ac-field">
                      <label className="ac-label">Ghép bàn phụ liền kề (Gom chung 1 Hóa đơn)</label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {snapshot.tbl_ban
                          .filter((b) => b.trang_thai_ban === 'Trong' && b.ma_ban !== selectedBan.ma_ban)
                          .map((b) => {
                            const checked = mergeTableIds.includes(b.ma_ban);
                            return (
                              <button
                                key={b.ma_ban}
                                type="button"
                                className={`ac-btn ac-btn-sm ${checked ? 'ac-btn-warning' : 'ac-btn-outline'}`}
                                onClick={() =>
                                  setMergeTableIds((prev) =>
                                    checked ? prev.filter((id) => id !== b.ma_ban) : [...prev, b.ma_ban],
                                  )
                                }
                              >
                                {checked ? '✓ ' : '+ '} {b.ten_ban}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  <button
                    className="ac-btn ac-btn-success ac-btn-lg"
                    onClick={handleOpenTable}
                  >
                    <Users size={16} /> Mở Bàn & Bắt Đầu Gọi Món
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="ac-pos-dock-body">
                  {/* Thanh thông tin phiên & Chuyển bàn */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: 'var(--sp-2)',
                      borderBottom: '1px solid var(--border)',
                      gap: 8,
                    }}
                  >
                    <div>
                      <span className="t-caption">Mã Order: {activeOrder.ma_order}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span className="ac-badge ac-badge-neutral">
                          Khách: {activeOrder.loai_khach_phien}
                        </span>
                        {activeOrder.vip_flag && (
                          <span className="ac-badge ac-badge-vip">★ VIP Flag</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <select
                        className="ac-select"
                        style={{ width: 112, padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                        value={targetTransferId}
                        onChange={(e) => setTargetTransferId(e.target.value)}
                      >
                        <option value="">Đổi bàn...</option>
                        {snapshot.tbl_ban
                          .filter((b) => b.trang_thai_ban === 'Trong')
                          .map((b) => (
                            <option key={b.ma_ban} value={b.ma_ban}>
                              {b.ten_ban}
                            </option>
                          ))}
                      </select>
                      <button
                        className="ac-btn ac-btn-outline ac-btn-sm"
                        disabled={!targetTransferId}
                        onClick={() =>
                          transferOrMergeTable(effectiveTableId, targetTransferId, 'transfer')
                        }
                        title="Chuyển toàn bộ món sang bàn trống khác"
                      >
                        <ArrowRightLeft size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Nút mở nhanh lưới Chạm Chọn Món nếu đang ở Sơ đồ bàn */}
                  {activeOrder.trang_thai_order === 'DangPhucVu' && workspaceMode === 'FLOOR' && (
                    <button
                      className="ac-btn ac-btn-primary"
                      onClick={() => setWorkspaceMode('TOUCH_MENU')}
                    >
                      <Plus size={15} /> Mở Menu Chạm Gọi Thêm Món
                    </button>
                  )}

                  {/* Danh sách các dòng món trên Phiếu Order */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {orderItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
                        <p className="t-small">Chưa có món ăn trong phiên này.</p>
                      </div>
                    ) : (
                      orderItems.map((item) => {
                        const mon = snapshot.tbl_mon_an.find((m) => m.ma_mon_an === item.ma_mon_an);
                        const cancelCheck = canCancelOrderItem(item.trang_thai_mon);
                        const isBillable =
                          item.trang_thai_mon === 'HoanThanh' || item.trang_thai_mon === 'DaPhucVu';

                        return (
                          <div
                            key={item.ma_chi_tiet_order}
                            className="ac-receipt-line"
                            style={{
                              opacity: item.trang_thai_mon === 'DaHuy' ? 0.45 : 1,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <strong className="t-small" style={{ color: 'var(--text)' }}>
                                  {item.so_luong}x {mon?.ten_mon_an}
                                </strong>
                                <span className="ac-badge ac-badge-neutral">
                                  Cay {item.muc_do_cay_yc}
                                </span>
                              </div>
                              {item.ghi_chu_mon && (
                                <div className="t-caption">{item.ghi_chu_mon}</div>
                              )}
                              <div className="t-caption" style={{ marginTop: 2 }}>
                                Lượt #{item.lan_goi} ({item.nguon_goi}) •{' '}
                                {isBillable ? (
                                  <span style={{ color: 'var(--table-empty)', fontWeight: 700 }}>
                                    ✓ Đã nạp vào Bill
                                  </span>
                                ) : (
                                  <span>Chờ Bếp bấm Hoàn thành</span>
                                )}
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <strong className="t-small t-num">
                                {formatVnd(item.don_gia_thoi_diem * item.so_luong)}
                              </strong>

                              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <span
                                  className={`ac-badge ${
                                    isBillable
                                      ? 'ac-badge-green'
                                      : item.trang_thai_mon === 'DangCheBien'
                                        ? 'ac-badge-yellow'
                                        : item.trang_thai_mon === 'DaHuy'
                                          ? 'ac-badge-neutral'
                                          : 'ac-badge-orange'
                                  }`}
                                >
                                  {item.trang_thai_mon}
                                </span>

                                {item.trang_thai_mon === 'HoanThanh' && (
                                  <button
                                    className="ac-btn ac-btn-success ac-btn-sm"
                                    onClick={() => markDishServedAtTable(item.ma_chi_tiet_order)}
                                    title="Xác nhận đã bưng món ra bàn"
                                  >
                                    <CheckCircle2 size={12} /> Bưng
                                  </button>
                                )}

                                {item.trang_thai_mon !== 'DaHuy' &&
                                  activeOrder.trang_thai_order === 'DangPhucVu' && (
                                    <button
                                      className="ac-btn ac-btn-outline ac-btn-sm"
                                      onClick={() =>
                                        cancelOrderItemBeforeCooking(item.ma_chi_tiet_order)
                                      }
                                      title={
                                        cancelCheck.allowed
                                          ? 'Hủy món chưa chế biến'
                                          : cancelCheck.reason
                                      }
                                    >
                                      <XCircle size={12} />
                                      {cancelCheck.allowed ? 'Hủy' : 'Khóa'}
                                    </button>
                                  )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* CHÂN PHIẾU DOCK: Bảng tính tiền món đã Hoàn thành & Nút CHỐT BILL / DELETE BÀN */}
                {billSummary && (
                  <div className="ac-pos-dock-footer">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Món Bếp đã Hoàn thành ({billSummary.completedItemsCount}):</span>
                        <strong>{formatVnd(billSummary.tongTienMonHoanThanh)}</strong>
                      </div>
                      {billSummary.tienGiamGia > 0 && (
                        <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--table-empty)' }}>
                          <span>Chiết khấu VIP ({Math.round(billSummary.tyLeGiamVip * 100)}%):</span>
                          <span>-{formatVnd(billSummary.tienGiamGia)}</span>
                        </div>
                      )}
                      <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Thuế GTGT (VAT 8%):</span>
                        <span>+{formatVnd(billSummary.tienThueVat)}</span>
                      </div>
                      {billSummary.tienCocTru > 0 && (
                        <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                          <span>Trừ tiền đặt cọc đoàn:</span>
                          <span>-{formatVnd(billSummary.tienCocTru)}</span>
                        </div>
                      )}
                      <div
                        className="t-h2 t-num"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-strong)',
                          paddingTop: 6,
                          color: 'var(--primary)',
                        }}
                      >
                        <span>Tổng Phải Trả:</span>
                        <span>{formatVnd(billSummary.tongTienPhaiTra)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                      {activeOrder.trang_thai_order === 'DangPhucVu' && (
                        <button
                          className="ac-btn ac-btn-primary ac-btn-lg"
                          onClick={() => lockBillAndSendToCashier(selectedBan.ma_ban)}
                        >
                          <FileCheck2 size={15} /> Chốt Bill
                        </button>
                      )}
                      <button
                        className="ac-btn ac-btn-delete ac-btn-lg"
                        style={{
                          gridColumn:
                            activeOrder.trang_thai_order === 'DangPhucVu' ? 'auto' : '1 / -1',
                        }}
                        onClick={() => deleteReleaseTableSession(selectedBan.ma_ban)}
                      >
                        <Trash2 size={15} /> DELETE Dọn Bàn
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </aside>
        )}
      </div>

      {/* Modal Đặt bàn trước & Thu cọc tiệc đoàn (UC-01) */}
      {showBookingModal && (
        <div className="ac-modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="ac-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="t-h2">Đặt Bàn Trước & Thu Tiền Cọc Tiệc Đoàn</h2>
            <p className="t-small">
              Bàn được đặt sẽ chuyển sang màu Vàng (`DaDat`), tiền đặt cọc tự động khấu trừ vào hóa đơn cuối và ghi bút toán `ThuTienCoc` vào Sổ quỹ Chủ nhà hàng.
            </p>
            <form onSubmit={handleCreateReservation} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                <div className="ac-field">
                  <label className="ac-label">Họ tên người đặt / Trưởng đoàn</label>
                  <input
                    className="ac-input"
                    required
                    placeholder="VD: Ông Trần Quốc Khánh"
                    value={bookName}
                    onChange={(e) => setBookName(e.target.value)}
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Số điện thoại liên hệ</label>
                  <input
                    className="ac-input"
                    required
                    placeholder="0905111222"
                    value={bookPhone}
                    onChange={(e) => setBookPhone(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-3)' }}>
                <div className="ac-field">
                  <label className="ac-label">Phân nhóm khách</label>
                  <select
                    className="ac-select"
                    value={bookType}
                    onChange={(e) => setBookType(e.target.value as CustomerGroupType)}
                  >
                    <option value="Doan">Khách Đoàn (Tiệc / VAT)</option>
                    <option value="VIP">Khách VIP</option>
                    <option value="Thuong">Khách Thường</option>
                  </select>
                </div>
                <div className="ac-field">
                  <label className="ac-label">Chọn bàn trống giữ chỗ</label>
                  <select
                    className="ac-select"
                    value={bookTableId}
                    onChange={(e) => setBookTableId(e.target.value)}
                  >
                    {snapshot.tbl_ban
                      .filter((b) => b.trang_thai_ban === 'Trong')
                      .map((b) => (
                        <option key={b.ma_ban} value={b.ma_ban}>
                          {b.ten_ban} ({b.so_ghe} ghế)
                        </option>
                      ))}
                  </select>
                </div>
                <div className="ac-field">
                  <label className="ac-label">Số lượng khách</label>
                  <input
                    type="number"
                    min={1}
                    className="ac-input"
                    value={bookGuests}
                    onChange={(e) => setBookGuests(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                <div className="ac-field">
                  <label className="ac-label">Thời gian hẹn đến</label>
                  <input
                    type="text"
                    className="ac-input"
                    value={bookTime}
                    onChange={(e) => setBookTime(e.target.value)}
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-label">Tiền đặt cọc trước (VND)</label>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    className="ac-input"
                    value={bookDeposit}
                    onChange={(e) => setBookDeposit(Number(e.target.value))}
                  />
                </div>
              </div>

              {bookType === 'Doan' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--sp-3)' }}>
                  <div className="ac-field">
                    <label className="ac-label">Tên công ty xuất hóa đơn đỏ VAT</label>
                    <input
                      className="ac-input"
                      placeholder="CÔNG TY CP KIẾN TRÚC & ĐẦU TƯ ĐÀ NẴNG"
                      value={bookCompany}
                      onChange={(e) => setBookCompany(e.target.value)}
                    />
                  </div>
                  <div className="ac-field">
                    <label className="ac-label">Mã số thuế (MST)</label>
                    <input
                      className="ac-input"
                      placeholder="0401888999"
                      value={bookTaxCode}
                      onChange={(e) => setBookTaxCode(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="ac-field">
                <label className="ac-label">Ghi chú đặt tiệc / Thực đơn Combo</label>
                <input
                  className="ac-input"
                  value={bookNote}
                  onChange={(e) => setBookNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                <button
                  type="button"
                  className="ac-btn ac-btn-outline"
                  onClick={() => setShowBookingModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="ac-btn ac-btn-primary">
                  Xác Nhận Đặt Bàn & Ghi Sổ Quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
