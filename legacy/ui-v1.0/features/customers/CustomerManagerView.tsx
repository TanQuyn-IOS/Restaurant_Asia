import React, { useState } from 'react';
import { Crown, Users, UserCheck, Zap, Building2, FileText } from 'lucide-react';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { CustomerGroupType } from '../../types/database';
import { formatVnd } from '../../utils/soundNotifier';

export const CustomerManagerView: React.FC = () => {
  const { snapshot } = useRestaurantStore();
  const [activeGroup, setActiveGroup] = useState<CustomerGroupType | 'ALL'>('ALL');

  const filteredCustomers =
    activeGroup === 'ALL'
      ? snapshot.tbl_khach_hang
      : snapshot.tbl_khach_hang.filter((k) => k.loai_khach === activeGroup);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
      <div className="ac-card">
        <span className="t-caption">MOD-02 • CHUẨN HÓA PHÂN KHÚC 4 NHÓM KHÁCH HÀNG CHÂU Á</span>
        <h1 className="t-h1">Quản Lý 4 Nhóm Khách Hàng & Hợp Đồng Tiệc Đoàn (VAT)</h1>
        <p className="t-small" style={{ marginTop: 6 }}>
          Hệ thống chuẩn hóa chính sách phục vụ riêng biệt cho 4 nhóm thực khách: Vãng lai (mở bàn tốc độ), Thường (tích lũy điểm thưởng), VIP (chiết khấu 10%–15%, ưu tiên phòng VIP & gắn cờ VIP Flag đẩy món lên đầu KDS), và Khách đoàn (ghép bàn, Combo tiệc, đặt cọc trước 30% & xuất hóa đơn đỏ VAT).
        </p>
      </div>

      {/* Bento Grid 4 Nhóm Khách Hàng */}
      <div className="ac-bento-grid">
        <div className="ac-card-featured">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="ac-badge ac-badge-vip">
              <Crown size={14} /> NHÓM 3 & 4: VIP & KHÁCH ĐOÀN
            </span>
            <span className="t-caption" style={{ color: 'var(--accent)' }}>CHÍNH SÁCH ĐẶC QUYỀN</span>
          </div>
          <h2 className="t-h2" style={{ color: 'var(--text-inverse)', marginTop: 12 }}>
            Ưu Tiên Chế Biến KDS & Khép Kín Tiền Cọc – Hóa Đơn Đỏ VAT
          </h2>
          <p className="t-small" style={{ color: 'var(--bg-elevated)', marginTop: 8 }}>
            • <strong>Khách VIP (Gold / Diamond)</strong>: Tự động giảm giá 10% – 15%, gắn cờ <code>VIP Flag</code> đẩy món ăn lên đầu màn hình KDS Bếp.<br />
            • <strong>Khách Đoàn (tbl_khach_doan)</strong>: Lưu pháp nhân công ty, Mã số thuế, thu tiền đặt cọc tự động trừ vào hóa đơn cuối và phát hành hóa đơn điện tử GTGT (VAT).
          </p>
        </div>

        <div className="ac-card">
          <span className="ac-badge ac-badge-green">
            <Zap size={13} /> NHÓM 1: KHÁCH VÃNG LAI (WALK-IN)
          </span>
          <h3 className="t-h3" style={{ marginTop: 10 }}>Phục Vụ Nhanh Không Cần Tài Khoản</h3>
          <p className="t-small" style={{ marginTop: 6 }}>
            Vào thẳng bàn trống, mở phiên phục vụ tức thì với <code>ma_khach_hang = NULL</code> hoặc mã vãng lai mặc định, tối ưu tốc độ quay vòng bàn giờ cao điểm.
          </p>
        </div>

        <div className="ac-card">
          <span className="ac-badge ac-badge-yellow">
            <UserCheck size={13} /> NHÓM 2: KHÁCH THƯỜNG (THÀNH VIÊN)
          </span>
          <h3 className="t-h3" style={{ marginTop: 10 }}>Tích Lũy & Tiêu Điểm Thưởng</h3>
          <p className="t-small" style={{ marginTop: 6 }}>
            Lưu hồ sơ SĐT, tự động cộng điểm tích lũy sau mỗi hóa đơn thanh toán (1 điểm / 10.000đ) và cho phép khấu trừ điểm ở các lần dùng bữa kế tiếp.
          </p>
        </div>
      </div>

      {/* Bộ lọc 4 nhóm khách */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        {(
          [
            { id: 'ALL', label: `Tất cả khách hàng (${snapshot.tbl_khach_hang.length})` },
            { id: 'VangLai', label: '1. Khách Vãng Lai' },
            { id: 'Thuong', label: '2. Khách Thường (Thành viên)' },
            { id: 'VIP', label: '3. Khách VIP (Gold / Diamond)' },
            { id: 'Doan', label: '4. Khách Đoàn (Công ty / Tour / VAT)' },
          ] as { id: CustomerGroupType | 'ALL'; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            className={`ac-btn ${activeGroup === tab.id ? 'ac-btn-primary' : 'ac-btn-outline'}`}
            onClick={() => setActiveGroup(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bảng Hồ sơ khách hàng (tbl_khach_hang + tbl_khach_doan + tbl_phieu_dat_ban) */}
      <div className="ac-card">
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-4)' }}>
          Danh Sách Hồ Sơ Khách Hàng & Pháp Nhân Đoàn (`tbl_khach_hang` & `tbl_khach_doan`)
        </h2>
        <div className="ac-table-wrap">
          <table className="ac-data-table">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Họ tên / Tên Đoàn</th>
                <th>Phân loại 4 nhóm</th>
                <th>Hạng thẻ & Ưu đãi</th>
                <th>Điểm tích lũy</th>
                <th>Pháp nhân Đoàn & Mã Số Thuế (VAT)</th>
                <th>Tiền đặt cọc tiệc</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((kh) => {
                const doan = snapshot.tbl_khach_doan.find(
                  (d) => d.ma_khach_hang === kh.ma_khach_hang,
                );
                const datBans = snapshot.tbl_phieu_dat_ban.filter(
                  (p) => p.ma_khach_hang === kh.ma_khach_hang,
                );
                const tongCoc = datBans.reduce((s, p) => s + Number(p.tien_dat_coc || 0), 0);

                return (
                  <tr key={kh.ma_khach_hang}>
                    <td className="t-num">
                      <strong>{kh.ma_khach_hang}</strong>
                    </td>
                    <td>
                      <strong>{kh.ho_ten}</strong>
                      {kh.so_dien_thoai && <div className="t-caption">SĐT: {kh.so_dien_thoai}</div>}
                    </td>
                    <td>
                      <span
                        className={`ac-badge ${
                          kh.loai_khach === 'VIP'
                            ? 'ac-badge-vip'
                            : kh.loai_khach === 'Doan'
                              ? 'ac-badge-red'
                              : kh.loai_khach === 'Thuong'
                                ? 'ac-badge-green'
                                : 'ac-badge-neutral'
                        }`}
                      >
                        {kh.loai_khach}
                      </span>
                    </td>
                    <td>
                      <strong>{kh.hang_the}</strong>
                      <div className="t-caption">
                        {kh.hang_the === 'Diamond'
                          ? 'Giảm 15% + VIP Flag'
                          : kh.hang_the === 'Gold'
                            ? 'Giảm 10% + VIP Flag'
                            : kh.hang_the === 'Silver'
                              ? 'Giảm 5%'
                              : 'Tiêu chuẩn'}
                      </div>
                    </td>
                    <td className="t-num">
                      <strong>{kh.diem_tich_luy.toLocaleString()} điểm</strong>
                    </td>
                    <td>
                      {doan ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={14} color="var(--primary)" />
                            <strong>{doan.ten_cong_ty}</strong>
                          </div>
                          <div className="t-small">
                            MST: <strong>{doan.ma_so_thue}</strong> • Đại diện: {doan.nguoi_dai_dien}
                          </div>
                          <div className="t-caption" style={{ textTransform: 'none' }}>
                            <FileText size={11} /> {doan.dia_chi_cong_ty}
                          </div>
                        </div>
                      ) : (
                        <span className="t-small">— Cá nhân / Bán lẻ —</span>
                      )}
                    </td>
                    <td className="t-num">
                      {tongCoc > 0 ? (
                        <span className="ac-badge ac-badge-yellow">
                          Đã cọc: {formatVnd(tongCoc)}
                        </span>
                      ) : (
                        <span className="t-small">0 ₫</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
