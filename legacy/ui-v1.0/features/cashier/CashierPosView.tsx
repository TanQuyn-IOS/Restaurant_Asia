import React, { useState } from 'react';
import {
  Lock,
  ShieldAlert,
  CreditCard,
  QrCode,
  Banknote,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { PaymentMethodType } from '../../types/database';
import { formatVnd } from '../../utils/soundNotifier';

export const CashierPosView: React.FC = () => {
  const {
    snapshot,
    attemptIllegalCashierModification,
    processReadOnlyInvoicePayment,
  } = useRestaurantStore();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    snapshot.tbl_hoa_don[0]?.ma_hoa_don || '',
  );
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('ChuyenKhoanQR');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [issueVat, setIssueVat] = useState<boolean>(true);
  const [vatTaxCode, setVatTaxCode] = useState<string>('0401987654');
  const [vatCompany, setVatCompany] = useState<string>(
    'CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ DU LỊCH Á CHÂU',
  );

  const selectedInvoice =
    snapshot.tbl_hoa_don.find((h) => h.ma_hoa_don === selectedInvoiceId) ||
    snapshot.tbl_hoa_don[0];

  const relatedOrder = selectedInvoice
    ? snapshot.tbl_don_goi_mon.find((o) => o.ma_order === selectedInvoice.ma_order)
    : undefined;

  const relatedBan = relatedOrder
    ? snapshot.tbl_ban.find((b) => b.ma_ban === relatedOrder.ma_ban)
    : undefined;

  const completedInvoiceItems = relatedOrder
    ? snapshot.tbl_chi_tiet_don_goi.filter(
        (i) =>
          i.ma_order === relatedOrder.ma_order &&
          (i.trang_thai_mon === 'HoanThanh' || i.trang_thai_mon === 'DaPhucVu'),
      )
    : [];

  const effectiveCash = cashReceived || selectedInvoice?.tong_tien_phai_tra || 0;
  const changeAmount = Math.max(
    0,
    effectiveCash - (selectedInvoice?.tong_tien_phai_tra || 0),
  );

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    processReadOnlyInvoicePayment({
      ma_hoa_don: selectedInvoice.ma_hoa_don,
      phuong_thuc: payMethod,
      so_tien_nhan: effectiveCash,
      xuat_vat: issueVat,
      ma_so_thue_vat: issueVat ? vatTaxCode : undefined,
      ten_cong_ty_vat: issueVat ? vatCompany : undefined,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      {/* Header POS Thu ngân Read-Only */}
      <div className="ac-page-header">
        <div className="ac-page-title-block">
          <h1 className="t-h1">Quầy Thu Ngân POS (Chế Độ Chỉ Đọc) & Phát Hành Hóa Đơn Đỏ VAT</h1>
          <p className="t-small">
            Chống thất thoát tuyệt đối: Hóa đơn mở ở chế độ Read-Only, khóa mọi thao tác thêm/sửa/xóa món. Tự động khấu trừ tiền cọc và đồng bộ Sổ quỹ Chủ.
          </p>
        </div>

        <div className="ac-page-actions">
          <span className="ac-badge ac-badge-red">
            <Lock size={12} /> Chế độ Read-Only: Khóa thêm/xóa món
          </span>
          <button
            className="ac-btn ac-btn-outline ac-btn-sm"
            onClick={attemptIllegalCashierModification}
          >
            <ShieldAlert size={14} color="var(--primary)" /> Thử Sửa/Xóa Món (Test Chặn 403)
          </button>
        </div>
      </div>

      <div className="ac-pos-layout">
        {/* CỘT TRÁI: Danh sách hóa đơn đã chốt & Bảng chi tiết món Read-Only */}
        <div className="ac-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h2 className="t-h2">Hóa Đơn Đã Chốt Từ Phục Vụ Bàn</h2>
            <div className="ac-segmented">
              {snapshot.tbl_hoa_don.map((hd) => (
                <button
                  key={hd.ma_hoa_don}
                  className={`ac-seg-btn ${selectedInvoice?.ma_hoa_don === hd.ma_hoa_don ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedInvoiceId(hd.ma_hoa_don);
                    setCashReceived(hd.tong_tien_phai_tra);
                  }}
                >
                  {hd.ma_hoa_don} ({hd.trang_thai_tt === 'DaThanhToan' ? 'Đã TT' : 'Chờ TT'})
                </button>
              ))}
            </div>
          </div>

          {!selectedInvoice ? (
            <p className="t-small">Chưa có hóa đơn nào được Phục vụ bàn chốt chuyển sang.</p>
          ) : (
            <>
              <div
                style={{
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  padding: 'var(--sp-3) var(--sp-4)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <strong className="t-h3">
                    {relatedBan?.ten_ban || 'Bàn ăn'} — Mã HĐ: {selectedInvoice.ma_hoa_don}
                  </strong>
                  <div className="t-caption">
                    Phiên Order: {selectedInvoice.ma_order} • Nhóm khách: {relatedOrder?.loai_khach_phien}
                  </div>
                </div>
                <span
                  className={`ac-badge ${
                    selectedInvoice.trang_thai_tt === 'DaThanhToan'
                      ? 'ac-badge-green'
                      : 'ac-badge-orange'
                  }`}
                >
                  {selectedInvoice.trang_thai_tt === 'DaThanhToan'
                    ? '✓ Đã thanh toán (Chờ Phục vụ bấm DELETE bàn)'
                    : '⏳ Chờ thanh toán tại quầy'}
                </span>
              </div>

              <div className="ac-table-wrap">
                <table className="ac-data-table">
                  <thead>
                    <tr>
                      <th>Món ăn (Đã Hoàn thành trên KDS)</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      <th>Trạng thái khóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedInvoiceItems.map((item) => {
                      const mon = snapshot.tbl_mon_an.find((m) => m.ma_mon_an === item.ma_mon_an);
                      return (
                        <tr key={item.ma_chi_tiet_order}>
                          <td>
                            <strong>{mon?.ten_mon_an}</strong>
                            <div className="t-caption">KDS: {item.trang_thai_mon}</div>
                          </td>
                          <td className="t-num"><strong>x{item.so_luong}</strong></td>
                          <td className="t-num">{formatVnd(item.don_gia_thoi_diem)}</td>
                          <td className="t-num">
                            <strong>{formatVnd(item.don_gia_thoi_diem * item.so_luong)}</strong>
                          </td>
                          <td>
                            <span className="ac-badge ac-badge-neutral">
                              <Lock size={11} /> Chỉ đọc (Read-Only)
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  background: 'var(--bg)',
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Trash2 size={18} color="var(--primary)" />
                <span className="t-small">
                  <strong>Quy tắc giải phóng bàn (FR-02):</strong> Sau khi Thu ngân xác nhận thu tiền, bàn <strong>không</strong> tự động trống mà chờ Nhân viên phục vụ dọn sạch bàn và bấm nút <strong>DELETE</strong> trên sơ đồ bàn.
                </span>
              </div>
            </>
          )}
        </div>

        {/* CỘT PHẢI: Sticky POS Payment Terminal */}
        {selectedInvoice && (
          <aside className="ac-pos-dock">
            <div className="ac-pos-dock-header">
              <div>
                <div className="t-caption" style={{ color: 'var(--accent)' }}>
                  PHIẾU TÍNH TIỀN CHỐT CHẶN READ-ONLY
                </div>
                <h2 className="t-h2" style={{ color: 'var(--text-inverse)' }}>
                  {formatVnd(selectedInvoice.tong_tien_phai_tra)}
                </h2>
              </div>
              <span className="ac-badge ac-badge-vip">VAT 8%</span>
            </div>

            <form onSubmit={handleConfirmPayment} className="ac-pos-dock-body">
              {/* Chi tiết cộng trừ hóa đơn */}
              <div
                style={{
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--sp-3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tổng tiền món Bếp Hoàn thành:</span>
                  <strong>{formatVnd(selectedInvoice.tong_tien_mon)}</strong>
                </div>
                <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--table-empty)' }}>
                  <span>Chiết khấu VIP / Điểm thưởng:</span>
                  <span>-{formatVnd(selectedInvoice.tien_giam_gia)}</span>
                </div>
                <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Thuế GTGT (VAT 8%):</span>
                  <span>+{formatVnd(selectedInvoice.tien_thue_vat)}</span>
                </div>
                <div className="t-small t-num" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                  <span>Trừ tiền đặt cọc trước:</span>
                  <span>-{formatVnd(selectedInvoice.tien_coc_tru)}</span>
                </div>
              </div>

              {/* Chọn Kênh Thanh Toán */}
              <div className="ac-field">
                <label className="ac-label">Phương thức thanh toán</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                  <button
                    type="button"
                    className={`ac-btn ${payMethod === 'TienMat' ? 'ac-btn-primary' : 'ac-btn-outline'}`}
                    onClick={() => setPayMethod('TienMat')}
                  >
                    <Banknote size={14} /> Tiền mặt
                  </button>
                  <button
                    type="button"
                    className={`ac-btn ${payMethod === 'TheNganHang' ? 'ac-btn-primary' : 'ac-btn-outline'}`}
                    onClick={() => setPayMethod('TheNganHang')}
                  >
                    <CreditCard size={14} /> Thẻ POS
                  </button>
                  <button
                    type="button"
                    className={`ac-btn ${payMethod === 'ChuyenKhoanQR' ? 'ac-btn-primary' : 'ac-btn-outline'}`}
                    onClick={() => setPayMethod('ChuyenKhoanQR')}
                  >
                    <QrCode size={14} /> VietQR
                  </button>
                </div>
              </div>

              {payMethod === 'ChuyenKhoanQR' && (
                <div
                  style={{
                    background: 'var(--surface-muted)',
                    padding: 'var(--sp-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--primary)',
                    textAlign: 'center',
                  }}
                >
                  <div className="t-caption">VIETQR ĐỘNG KHỚP SỐ TIỀN HÓA ĐƠN</div>
                  <strong className="t-h3 t-num" style={{ color: 'var(--primary)' }}>
                    Vietcombank • 0041000999888
                  </strong>
                  <div className="t-caption">
                    Số tiền: {formatVnd(selectedInvoice.tong_tien_phai_tra)} • ND: {selectedInvoice.ma_hoa_don}
                  </div>
                </div>
              )}

              {/* Phím bấm mệnh giá tiền nhanh giống máy POS thực tế */}
              <div className="ac-field">
                <label className="ac-label">Số tiền khách đưa (VND) & Gợi ý mệnh giá nhanh</label>
                <input
                  type="number"
                  className="ac-input t-num"
                  value={effectiveCash}
                  onChange={(e) => setCashReceived(Number(e.target.value))}
                />
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  <button
                    type="button"
                    className="ac-btn ac-btn-outline ac-btn-sm"
                    onClick={() => setCashReceived(selectedInvoice.tong_tien_phai_tra)}
                  >
                    Đúng số tiền
                  </button>
                  <button
                    type="button"
                    className="ac-btn ac-btn-outline ac-btn-sm"
                    onClick={() => setCashReceived(selectedInvoice.tong_tien_phai_tra + 50000)}
                  >
                    +50.000đ
                  </button>
                  <button
                    type="button"
                    className="ac-btn ac-btn-outline ac-btn-sm"
                    onClick={() => setCashReceived(2000000)}
                  >
                    2.000.000đ
                  </button>
                </div>
                {changeAmount > 0 && (
                  <div className="t-small t-num" style={{ color: 'var(--table-empty)', marginTop: 4 }}>
                    Tiền thừa trả lại khách: <strong>{formatVnd(changeAmount)}</strong>
                  </div>
                )}
              </div>

              {/* Hóa đơn đỏ điện tử VAT cho Khách đoàn */}
              <div
                style={{
                  background: 'var(--accent-soft)',
                  padding: 'var(--sp-3)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={issueVat}
                    onChange={(e) => setIssueVat(e.target.checked)}
                  />
                  <strong className="t-small">
                    <FileSpreadsheet size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Xuất Hóa Đơn Đỏ Điện Tử GTGT (VAT)
                  </strong>
                </label>

                {issueVat && (
                  <>
                    <input
                      className="ac-input"
                      placeholder="Tên công ty nhận hóa đơn VAT"
                      value={vatCompany}
                      onChange={(e) => setVatCompany(e.target.value)}
                    />
                    <input
                      className="ac-input"
                      placeholder="Mã số thuế (10-13 số)"
                      value={vatTaxCode}
                      onChange={(e) => setVatTaxCode(e.target.value)}
                    />
                  </>
                )}
              </div>

              <button
                type="submit"
                className="ac-btn ac-btn-success ac-btn-lg"
                disabled={selectedInvoice.trang_thai_tt === 'DaThanhToan'}
              >
                <CheckCircle2 size={16} />
                {selectedInvoice.trang_thai_tt === 'DaThanhToan'
                  ? 'Đã Thanh Toán Hoàn Tất'
                  : 'Xác Nhận Thu Tiền & Ghi Sổ Quỹ'}
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
};
