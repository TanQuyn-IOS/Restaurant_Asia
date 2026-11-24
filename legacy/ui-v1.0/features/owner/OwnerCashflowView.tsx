import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  PackagePlus,
  Crown,
  ShieldAlert,
} from 'lucide-react';
import {
  useRestaurantStore,
  verifyRbacPermission,
} from '../../store/useRestaurantStore';
import { formatVnd } from '../../utils/soundNotifier';

export const OwnerCashflowView: React.FC = () => {
  const { snapshot, currentRole, createWarehouseImportOrder } = useRestaurantStore();

  const [nccId, setNccId] = useState('NCC-01');
  const [nlId, setNlId] = useState('NL-04');
  const [importQty, setImportQty] = useState(10);
  const [importPrice, setImportPrice] = useState(620000);
  const [importExpiry, setImportExpiry] = useState('2026-12-30');
  const [importPaid, setImportPaid] = useState(5000000);
  const [importFund, setImportFund] = useState<'TienMat' | 'TaiKhoanNganHang'>('TaiKhoanNganHang');

  // Chốt chặn RBAC nghiêm ngặt FR-19: Chặn tuyệt đối nếu không phải Chủ nhà hàng (Owner)
  const accessCheck = verifyRbacPermission(currentRole, 'VIEW_CASHFLOW');
  if (!accessCheck.allowed) {
    return (
      <div className="ac-card" style={{ borderColor: 'var(--primary)', textAlign: 'center', padding: 'var(--sp-12)' }}>
        <ShieldAlert size={48} color="var(--primary)" style={{ margin: '0 auto var(--sp-4)' }} />
        <h1 className="t-h1" style={{ color: 'var(--primary)' }}>
          HTTP 403 FORBIDDEN — CHẶN TRUY CẬP BẢO MẬT TÀI CHÍNH (FR-19)
        </h1>
        <p className="t-body" style={{ maxWidth: 640, margin: 'var(--sp-3) auto' }}>
          {accessCheck.message}
        </p>
      </div>
    );
  }

  const tongThu = snapshot.tbl_so_quy_dong_tien
    .filter((g) => g.loai_thu_chi === 'ThuHoaDon' || g.loai_thu_chi === 'ThuTienCoc')
    .reduce((s, g) => s + Number(g.so_tien), 0);

  const tongChi = snapshot.tbl_so_quy_dong_tien
    .filter((g) => g.loai_thu_chi.startsWith('Chi'))
    .reduce((s, g) => s + Number(g.so_tien), 0);

  const loiNhuanRong = tongThu - tongChi;
  const soDuHienTai =
    snapshot.tbl_so_quy_dong_tien[snapshot.tbl_so_quy_dong_tien.length - 1]?.so_du_quy_sau_gd ?? 0;

  const lowStockItems = snapshot.tbl_nguyen_lieu.filter(
    (nl) => Number(nl.so_luong_ton_kho) <= Number(nl.nguong_ton_toi_thieu),
  );

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWarehouseImportOrder({
      ma_nha_cung_cap: nccId,
      ma_nguyen_lieu: nlId,
      so_luong_nhap: importQty,
      don_gia_nhap: importPrice,
      han_su_dung_lo: importExpiry,
      tien_da_thanh_toan: importPaid,
      hinh_thuc_quy: importFund,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      {/* Header Độc quyền Chủ nhà hàng */}
      <div
        className="ac-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--sp-4)',
        }}
      >
        <div>
          <span className="t-caption">MOD-08 • PHÂN VÙNG TÀI CHÍNH & KHO ĐỘC QUYỀN CHỦ NHÀ HÀNG (OWNER ONLY)</span>
          <h1 className="t-h1">Sổ Quỹ Dòng Tiền Thu–Chi, Báo Cáo Lãi/Lỗ & Nhập Kho Nguyên Liệu</h1>
        </div>
        <span className="ac-badge ac-badge-vip">
          <Crown size={14} /> ĐỘC QUYỀN CHỦ NHÀ HÀNG (Ẩn 100% với Quản lý sảnh)
        </span>
      </div>

      {/* Bento Grid Tài chính: Lợi nhuận ròng & Số dư quỹ, Tổng Thu, Tổng Chi */}
      <div className="ac-bento-grid">
        <div className="ac-card-featured">
          <span className="t-caption" style={{ color: 'var(--accent)' }}>
            <Wallet size={13} /> SỐ DƯ QUỸ TÀI CHÍNH LŨY KẾ & LỢI NHUẬN RÒNG
          </span>
          <div className="t-h1 t-num" style={{ color: 'var(--text-inverse)', marginTop: 8 }}>
            {formatVnd(soDuHienTai)}
          </div>
          <div className="t-small t-num" style={{ color: 'var(--accent)', marginTop: 6 }}>
            Lợi nhuận ròng (Lãi/Lỗ kỳ này): <strong>{loiNhuanRong >= 0 ? '+' : ''}{formatVnd(loiNhuanRong)}</strong>
          </div>
        </div>

        <div className="ac-card">
          <span className="ac-badge ac-badge-green">
            <TrendingUp size={13} /> TỔNG THU (HÓA ĐƠN + TIỀN CỌC ĐOÀN)
          </span>
          <div className="t-h1 t-num" style={{ color: 'var(--table-empty)', marginTop: 10 }}>
            +{formatVnd(tongThu)}
          </div>
          <p className="t-small" style={{ marginTop: 4 }}>
            Tự động đồng bộ từ `ThuHoaDon` (POS Thu ngân) và `ThuTienCoc` (Phiếu đặt bàn đoàn/VIP).
          </p>
        </div>

        <div className="ac-card">
          <span className="ac-badge ac-badge-red">
            <TrendingDown size={13} /> TỔNG CHI (NHẬP KHO + LƯƠNG CA KÍP)
          </span>
          <div className="t-h1 t-num" style={{ color: 'var(--primary)', marginTop: 10 }}>
            -{formatVnd(tongChi)}
          </div>
          <p className="t-small" style={{ marginTop: 4 }}>
            Tự động kết chuyển từ `ChiNhapHang` (Phiếu nhập kho) và `ChiLuong` (`tbl_bang_luong`).
          </p>
        </div>
      </div>

      {/* Cảnh báo nguyên liệu chạm ngưỡng tồn kho tối thiểu (FR-24) */}
      {lowStockItems.length > 0 && (
        <div
          className="ac-card"
          style={{
            background: 'var(--primary-soft)',
            borderColor: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <AlertTriangle size={22} color="var(--primary)" />
            <div>
              <strong className="t-small" style={{ color: 'var(--primary)' }}>
                CẢNH BÁO TỒN KHO TỐI THIỂU (FR-24): Có {lowStockItems.length} nguyên liệu chạm ngưỡng cần nhập hàng ngay!
              </strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {lowStockItems.map((nl) => (
                  <span key={nl.ma_nguyen_lieu} className="ac-badge ac-badge-red">
                    {nl.ten_nguyen_lieu}: Còn {nl.so_luong_ton_kho} {nl.don_vi_tinh} (Ngưỡng tối thiểu: {nl.nguong_ton_toi_thieu} {nl.don_vi_tinh})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bố cục 60/40: Sổ quỹ dòng tiền (tbl_so_quy_dong_tien) + Lập phiếu nhập kho nguyên vật liệu */}
      <div className="ac-split-60-40">
        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            Sổ Quỹ Dòng Tiền Thời Gian Thực (`tbl_so_quy_dong_tien`)
          </h2>
          <div className="ac-table-wrap">
            <table className="ac-data-table">
              <thead>
                <tr>
                  <th>Mã GD Quỹ</th>
                  <th>Thời gian</th>
                  <th>Loại Thu / Chi</th>
                  <th>Kênh quỹ</th>
                  <th>Số tiền</th>
                  <th>Số dư sau GD</th>
                  <th>Diễn giải & Chứng từ gốc</th>
                </tr>
              </thead>
              <tbody>
                {[...snapshot.tbl_so_quy_dong_tien].reverse().map((gd) => {
                  const isThu = gd.loai_thu_chi.startsWith('Thu');
                  return (
                    <tr key={gd.ma_giao_dich_quy}>
                      <td className="t-num"><strong>{gd.ma_giao_dich_quy}</strong></td>
                      <td className="t-num">{gd.ngay_ghi_so}</td>
                      <td>
                        <span className={`ac-badge ${isThu ? 'ac-badge-green' : 'ac-badge-red'}`}>
                          {gd.loai_thu_chi}
                        </span>
                      </td>
                      <td>{gd.hinh_thuc_quy}</td>
                      <td className="t-num">
                        <strong style={{ color: isThu ? 'var(--table-empty)' : 'var(--primary)' }}>
                          {isThu ? '+' : '-'}{formatVnd(gd.so_tien)}
                        </strong>
                      </td>
                      <td className="t-num"><strong>{formatVnd(gd.so_du_quy_sau_gd)}</strong></td>
                      <td>
                        <div className="t-small">{gd.dien_giai}</div>
                        <span className="t-caption">Chứng từ: {gd.ma_chung_tu_goc}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Lập phiếu nhập kho nguyên vật liệu (UC-12) */}
        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            <PackagePlus size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Lập Phiếu Nhập Kho Nguyên Liệu (UC-12)
          </h2>
          <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div>
              <label className="t-caption">Nhà cung cấp thực phẩm Châu Á (`tbl_nha_cung_cap`)</label>
              <select
                className="ac-select"
                value={nccId}
                onChange={(e) => setNccId(e.target.value)}
              >
                {snapshot.tbl_nha_cung_cap.map((c) => (
                  <option key={c.ma_nha_cung_cap} value={c.ma_nha_cung_cap}>
                    {c.ten_nha_cung_cap} (Nợ: {formatVnd(c.cong_no_hien_tai)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="t-caption">Nguyên vật liệu nhập kho (`tbl_nguyen_lieu`)</label>
              <select
                className="ac-select"
                value={nlId}
                onChange={(e) => setNlId(e.target.value)}
              >
                {snapshot.tbl_nguyen_lieu.map((n) => (
                  <option key={n.ma_nguyen_lieu} value={n.ma_nguyen_lieu}>
                    {n.ten_nguyen_lieu} (Tồn: {n.so_luong_ton_kho} {n.don_vi_tinh})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'var(--sp-2)' }}>
              <div>
                <label className="t-caption">Số lượng nhập</label>
                <input
                  type="number"
                  min={1}
                  step="0.5"
                  className="ac-input"
                  value={importQty}
                  onChange={(e) => setImportQty(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="t-caption">Đơn giá nhập (VND)</label>
                <input
                  type="number"
                  min={1000}
                  step={10000}
                  className="ac-input"
                  value={importPrice}
                  onChange={(e) => setImportPrice(Number(e.target.value))}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
              <div>
                <label className="t-caption">Hạn sử dụng lô hàng</label>
                <input
                  type="date"
                  className="ac-input"
                  value={importExpiry}
                  onChange={(e) => setImportExpiry(e.target.value)}
                />
              </div>
              <div>
                <label className="t-caption">Nguồn quỹ chi trả</label>
                <select
                  className="ac-select"
                  value={importFund}
                  onChange={(e) => setImportFund(e.target.value as 'TienMat' | 'TaiKhoanNganHang')}
                >
                  <option value="TaiKhoanNganHang">Tài khoản Ngân hàng</option>
                  <option value="TienMat">Quỹ Tiền mặt</option>
                </select>
              </div>
            </div>
            <div>
              <label className="t-caption">
                Số tiền thanh toán ngay (Tổng lô: {formatVnd(importQty * importPrice)})
              </label>
              <input
                type="number"
                min={0}
                className="ac-input"
                value={importPaid}
                onChange={(e) => setImportPaid(Number(e.target.value))}
              />
            </div>
            <button type="submit" className="ac-btn ac-btn-primary">
              Lưu Phiếu Nhập → Cộng Tồn Kho & Ghi Chi Sổ Quỹ
            </button>
          </form>
        </div>
      </div>

      {/* Bảng Tồn kho Nguyên vật liệu & Công nợ Nhà cung cấp */}
      <div className="ac-split-60-40">
        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            Tồn Kho Nguyên Vật Liệu & Ngưỡng Cảnh Báo (`tbl_nguyen_lieu`)
          </h2>
          <div className="ac-table-wrap">
            <table className="ac-data-table">
              <thead>
                <tr>
                  <th>Mã NL</th>
                  <th>Tên nguyên vật liệu</th>
                  <th>Tồn thực tế</th>
                  <th>Ngưỡng tối thiểu</th>
                  <th>Giá nhập BQ</th>
                  <th>Trạng thái tồn</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.tbl_nguyen_lieu.map((nl) => {
                  const isLow = Number(nl.so_luong_ton_kho) <= Number(nl.nguong_ton_toi_thieu);
                  return (
                    <tr key={nl.ma_nguyen_lieu}>
                      <td className="t-num"><strong>{nl.ma_nguyen_lieu}</strong></td>
                      <td><strong>{nl.ten_nguyen_lieu}</strong></td>
                      <td className="t-num">
                        <strong>{nl.so_luong_ton_kho} {nl.don_vi_tinh}</strong>
                      </td>
                      <td className="t-num">{nl.nguong_ton_toi_thieu} {nl.don_vi_tinh}</td>
                      <td className="t-num">{formatVnd(nl.don_gia_nhap_bq)}</td>
                      <td>
                        <span className={`ac-badge ${isLow ? 'ac-badge-red' : 'ac-badge-green'}`}>
                          {isLow ? '⚠ Chạm ngưỡng tối thiểu' : '✓ Đủ định mức'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            Nhà Cung Cấp & Công Nợ (`tbl_nha_cung_cap`)
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            {snapshot.tbl_nha_cung_cap.map((ncc) => (
              <div
                key={ncc.ma_nha_cung_cap}
                style={{
                  padding: 'var(--sp-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong>{ncc.ten_nha_cung_cap}</strong>
                  <span className="ac-badge ac-badge-orange">
                    Nợ: {formatVnd(ncc.cong_no_hien_tai)}
                  </span>
                </div>
                <div className="t-small" style={{ marginTop: 4 }}>
                  Liên hệ: {ncc.nguoi_lien_he} • SĐT: {ncc.so_dien_thoai}
                </div>
                <div className="t-caption" style={{ textTransform: 'none' }}>
                  TK: {ncc.so_tai_khoan}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
