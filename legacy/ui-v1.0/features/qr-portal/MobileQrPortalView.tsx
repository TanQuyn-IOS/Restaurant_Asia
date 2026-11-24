import React, { useState } from 'react';
import {
  QrCode,
  Lock,
  ShieldAlert,
  Flame,
  Send,
  Bell,
  GlassWater,
  Sparkles,
  Receipt,
  UserRoundCheck,
} from 'lucide-react';
import {
  useRestaurantStore,
  calculateCompletedOrderBill,
} from '../../store/useRestaurantStore';
import { CuisineSchool } from '../../types/database';
import { formatVnd, getSpicyLabel } from '../../utils/soundNotifier';

export const MobileQrPortalView: React.FC = () => {
  const {
    snapshot,
    selectedTableId,
    setSelectedTableId,
    submitOrderItems,
    sendGuestQrSupportRequest,
  } = useRestaurantStore();

  const [selectedCuisine, setSelectedCuisine] = useState<CuisineSchool | 'ALL'>('ALL');
  const [selectedSpice, setSelectedSpice] = useState<Record<string, 0 | 1 | 2 | 3>>({});
  const [selectedNote, setSelectedNote] = useState<Record<string, string>>({});

  const lockedBan =
    snapshot.tbl_ban.find((b) => b.ma_ban === selectedTableId) || snapshot.tbl_ban[0];
  const effectiveTableId = lockedBan.ma_ban_chinh || lockedBan.ma_ban;

  const activeOrder = snapshot.tbl_don_goi_mon.find(
    (o) => o.ma_ban === effectiveTableId && o.trang_thai_order !== 'DaGiaiPhong',
  );

  const tableItems = activeOrder
    ? snapshot.tbl_chi_tiet_don_goi.filter(
        (i) => i.ma_order === activeOrder.ma_order && i.trang_thai_mon !== 'DaHuy',
      )
    : [];

  const billSummary = activeOrder
    ? calculateCompletedOrderBill(snapshot, activeOrder.ma_order)
    : null;

  const filteredDishes = snapshot.tbl_mon_an.filter((mon) => {
    if (selectedCuisine === 'ALL') return true;
    const dm = snapshot.tbl_danh_muc_mon.find((d) => d.ma_danh_muc === mon.ma_danh_muc);
    return dm?.truong_phai_am_thuc === selectedCuisine;
  });

  const handleGuestOrderDish = (maMonAn: string, defaultSpice: 0 | 1 | 2 | 3) => {
    submitOrderItems({
      ma_ban: lockedBan.ma_ban,
      nguon_goi: 'MobileQR',
      items: [
        {
          ma_mon_an: maMonAn,
          so_luong: 1,
          muc_do_cay_yc: selectedSpice[maMonAn] ?? defaultSpice,
          ghi_chu_mon: selectedNote[maMonAn] || 'Khách tự gọi qua mã QR tại bàn',
        },
      ],
    });
  };

  return (
    <div style={{ padding: 'var(--sp-3) 0' }}>
      <div className="ac-mobile-qr-frame">
        {/* Header Mobile O2O: Khóa cứng số bàn & Ẩn hoàn toàn nút Login nhân viên */}
        <div
          style={{
            background: 'var(--primary)',
            color: 'var(--text-inverse)',
            padding: 'var(--sp-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--sp-2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ac-badge ac-badge-vip">
              <QrCode size={12} /> MENU QR TẠI BÀN
            </span>
            <span className="ac-badge ac-badge-green">
              <Lock size={11} /> Khóa cố định: {lockedBan.ma_ban}
            </span>
          </div>

          <h2 className="t-h2" style={{ color: 'var(--text-inverse)' }}>
            {lockedBan.ten_ban}
          </h2>

          <div
            style={{
              background: 'var(--surface-dark)',
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="t-caption" style={{ color: 'var(--text-inverse)' }}>
              Token: {lockedBan.ma_qr_code} • Đã ẩn 100% Login NV
            </span>
            <button
              className="ac-btn ac-btn-outline ac-btn-sm"
              onClick={() => setSelectedTableId('VIP-02')}
            >
              <ShieldAlert size={11} /> Thử đổi bàn
            </button>
          </div>
        </div>

        {/* 4 Nút Gọi Hỗ Trợ Nhanh Tại Bàn */}
        <div
          style={{
            padding: 'var(--sp-3)',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 6,
          }}
        >
          <button
            className="ac-btn ac-btn-outline ac-btn-sm"
            onClick={() => sendGuestQrSupportRequest(lockedBan.ma_ban, 'GoiNuocLoc', 'Khách gọi thêm nước lọc')}
          >
            <GlassWater size={13} /> Nước lọc
          </button>
          <button
            className="ac-btn ac-btn-outline ac-btn-sm"
            onClick={() => sendGuestQrSupportRequest(lockedBan.ma_ban, 'GoiKhanLanh', 'Khách xin thêm khăn lạnh')}
          >
            <Sparkles size={13} /> Khăn lạnh
          </button>
          <button
            className="ac-btn ac-btn-outline ac-btn-sm"
            onClick={() => sendGuestQrSupportRequest(lockedBan.ma_ban, 'YeuCauKiemBill', 'Khách yêu cầu kiểm Bill')}
          >
            <Receipt size={13} /> Kiểm Bill
          </button>
          <button
            className="ac-btn ac-btn-outline ac-btn-sm"
            onClick={() => sendGuestQrSupportRequest(lockedBan.ma_ban, 'GapPhucVu', 'Khách cần gặp phục vụ')}
          >
            <UserRoundCheck size={13} /> Gọi NV
          </button>
        </div>

        {/* Thanh Theo dõi Tiến độ Bếp KDS Realtime & Tạm tính */}
        <div
          style={{
            padding: 'var(--sp-3) var(--sp-4)',
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong className="t-small" style={{ color: 'var(--text)' }}>
              <Bell size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Tiến Độ Bếp KDS ({tableItems.length} món)
            </strong>
            {billSummary && (
              <strong className="t-small t-num" style={{ color: 'var(--primary)' }}>
                Tạm tính: {formatVnd(billSummary.tongTienPhaiTra)}
              </strong>
            )}
          </div>

          {tableItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
              {tableItems.map((item) => {
                const mon = snapshot.tbl_mon_an.find((m) => m.ma_mon_an === item.ma_mon_an);
                return (
                  <div
                    key={item.ma_chi_tiet_order}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 8px',
                      background: 'var(--surface-muted)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span className="t-caption" style={{ color: 'var(--text)' }}>
                      {item.so_luong}x {mon?.ten_mon_an}
                    </span>
                    <span
                      className={`ac-badge ${
                        item.trang_thai_mon === 'HoanThanh' || item.trang_thai_mon === 'DaPhucVu'
                          ? 'ac-badge-green'
                          : item.trang_thai_mon === 'DangCheBien'
                            ? 'ac-badge-yellow'
                            : 'ac-badge-orange'
                      }`}
                    >
                      {item.trang_thai_mon === 'ChoCheBien'
                        ? '⏳ Chờ bếp'
                        : item.trang_thai_mon === 'DangCheBien'
                          ? '🔥 Đang nấu'
                          : '✓ Đã xong'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Thanh chọn Trường phái ẩm thực */}
        <div style={{ padding: 'var(--sp-2) var(--sp-3)', background: 'var(--surface-muted)', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {(
            [
              { id: 'ALL', label: 'Tất cả' },
              { id: 'VietNam', label: '🇻🇳 Việt' },
              { id: 'TrungHoa', label: '🇨🇳 Hoa' },
              { id: 'NhatBan', label: '🇯🇵 Nhật' },
              { id: 'HanQuoc', label: '🇰🇷 Hàn' },
              { id: 'ThaiLan', label: '🇹🇭 Thái' },
            ] as { id: CuisineSchool | 'ALL'; label: string }[]
          ).map((c) => (
            <button
              key={c.id}
              className={`ac-btn ac-btn-sm ${selectedCuisine === c.id ? 'ac-btn-primary' : 'ac-btn-outline'}`}
              onClick={() => setSelectedCuisine(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Danh sách món ăn có ảnh trực quan */}
        <div style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', flex: 1 }}>
          {filteredDishes.map((mon) => {
            const isAvailable = mon.trang_thai_mon === 'ConMon';
            const canOrder = isAvailable && activeOrder?.trang_thai_order === 'DangPhucVu';

            return (
              <div
                key={mon.ma_mon_an}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--sp-3)',
                  display: 'flex',
                  gap: 'var(--sp-3)',
                  opacity: isAvailable ? 1 : 0.55,
                }}
              >
                {mon.hinh_anh_url && (
                  <img
                    src={mon.hinh_anh_url}
                    alt={mon.ten_mon_an}
                    loading="lazy"
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                )}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <strong className="t-small" style={{ color: 'var(--text)' }}>
                      {mon.ten_mon_an}
                    </strong>
                    <strong className="t-small t-num" style={{ color: 'var(--primary)' }}>
                      {formatVnd(mon.don_gia)}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <select
                      className="ac-select"
                      style={{ padding: '4px 6px', fontSize: 'var(--text-xs)' }}
                      value={selectedSpice[mon.ma_mon_an] ?? mon.muc_do_cay}
                      onChange={(e) =>
                        setSelectedSpice((prev) => ({
                          ...prev,
                          [mon.ma_mon_an]: Number(e.target.value) as 0 | 1 | 2 | 3,
                        }))
                      }
                      disabled={!canOrder}
                    >
                      <option value={0}>Không cay</option>
                      <option value={1}>Cay nhẹ 🌶️</option>
                      <option value={2}>Cay vừa 🌶️🌶️</option>
                      <option value={3}>Cay nồng 🌶️🌶️🌶️</option>
                    </select>

                    <button
                      className="ac-btn ac-btn-primary ac-btn-sm"
                      disabled={!canOrder}
                      onClick={() => handleGuestOrderDish(mon.ma_mon_an, mon.muc_do_cay)}
                    >
                      <Send size={11} /> {isAvailable ? 'Gọi món' : 'Hết'}
                    </button>
                  </div>

                  <input
                    className="ac-input"
                    style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }}
                    placeholder="Ghi chú khẩu vị..."
                    value={selectedNote[mon.ma_mon_an] || ''}
                    onChange={(e) =>
                      setSelectedNote((prev) => ({ ...prev, [mon.ma_mon_an]: e.target.value }))
                    }
                    disabled={!canOrder}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
