import React, { useState } from 'react';
import {
  Clock,
  CalendarCheck,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { LeaveThreeState } from '../../types/database';
import { formatVnd } from '../../utils/soundNotifier';

export const HrManagementView: React.FC = () => {
  const {
    snapshot,
    currentRole,
    assignStaffShift,
    submitLeaveRequest,
    approveOrRejectLeave,
    toggleShiftCheckInOut,
  } = useRestaurantStore();

  const [leaveFilter, setLeaveFilter] = useState<LeaveThreeState | 'ALL'>('ALL');

  const [shiftStaffId, setShiftStaffId] = useState('NV-PV01');
  const [shiftCaId, setShiftCaId] = useState('CA-SANG');
  const [shiftDate, setShiftDate] = useState('2026-11-25');
  const [shiftAreaId, setShiftAreaId] = useState('KV-T1');

  const [leaveStaffId, setLeaveStaffId] = useState('NV-PV02');
  const [leaveDate, setLeaveDate] = useState('2026-11-28');
  const [leaveCaId, setLeaveCaId] = useState('CA-TOI');
  const [leaveReason, setLeaveReason] = useState('Xin nghỉ việc gia đình (đã có người trực thay)');
  const [leaveReplaceId, setLeaveReplaceId] = useState('NV-PV01');

  const filteredLeaves =
    leaveFilter === 'ALL'
      ? snapshot.tbl_don_nghi_phep
      : snapshot.tbl_don_nghi_phep.filter((d) => d.trang_thai_nghi === leaveFilter);

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    assignStaffShift({
      ma_nhan_vien: shiftStaffId,
      ma_ca: shiftCaId,
      ngay_lam_viec: shiftDate,
      ma_khu_vuc_truc: shiftAreaId,
    });
  };

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    submitLeaveRequest({
      ma_nhan_vien: leaveStaffId,
      ngay_nghi: leaveDate,
      ma_ca_nghi: leaveCaId,
      ly_do: leaveReason,
      ma_nv_thay_ca: leaveReplaceId,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      <div className="ac-page-header">
        <div className="ac-page-title-block">
          <h1 className="t-h1">Lịch Phân Ca (Ca Nào – Giờ Nào), Nghỉ Phép 3 Trạng Thái & Lương Ca</h1>
          <p className="t-small">
            Quản lý rõ nhân viên làm Ca nào – Khung giờ nào – Khu vực nào, duyệt nghỉ phép theo 3 mốc Đã – Đang – Sắp nghỉ kèm người trực thay ca.
          </p>
        </div>
        <span className="ac-badge ac-badge-vip">
          <ShieldCheck size={13} /> Đã Ẩn 100% Doanh Thu & Sổ Quỹ với Quản Lý Sảnh ({currentRole})
        </span>
      </div>

      {/* 3 Khung giờ ca làm việc chuẩn */}
      <div className="ac-bento-grid">
        {snapshot.tbl_ca_lam_viec.map((ca, idx) => (
          <div key={ca.ma_ca} className={idx === 0 ? 'ac-card-featured' : 'ac-card'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="ac-badge ac-badge-vip">
                <Clock size={12} /> {ca.ma_ca}
              </span>
              <span className="t-caption" style={{ color: idx === 0 ? 'var(--accent)' : 'var(--muted)' }}>
                Hệ số lương: x{ca.he_so_luong_ca}
              </span>
            </div>
            <h3
              className="t-h3"
              style={{
                marginTop: 8,
                color: idx === 0 ? 'var(--text-inverse)' : 'var(--text)',
              }}
            >
              {ca.ten_ca}
            </h3>
            <p
              className="t-small"
              style={{
                marginTop: 4,
                color: idx === 0 ? 'var(--bg-elevated)' : 'var(--text-alt)',
              }}
            >
              Khung giờ: <strong>{ca.gio_bat_dau.slice(0, 5)} – {ca.gio_ket_thuc.slice(0, 5)}</strong> • {ca.mo_ta}
            </p>
          </div>
        ))}
      </div>

      {/* Lịch phân ca chi tiết + Form lập lịch */}
      <div className="ac-split-60-40">
        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            Bảng Phân Công Ca Trực: Nhân Viên – Ca Nào – Giờ Nào (`tbl_phan_cong_ca`)
          </h2>
          <div className="ac-table-wrap">
            <table className="ac-data-table">
              <thead>
                <tr>
                  <th>Ngày trực</th>
                  <th>Nhân viên</th>
                  <th>Ca nào – Khung giờ nào</th>
                  <th>Khu vực trực</th>
                  <th>Giờ Check-in / Out</th>
                  <th>Chấm công</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.tbl_phan_cong_ca.map((pc) => {
                  const nv = snapshot.tbl_nhan_vien.find((n) => n.ma_nhan_vien === pc.ma_nhan_vien);
                  const ca = snapshot.tbl_ca_lam_viec.find((c) => c.ma_ca === pc.ma_ca);
                  const kv = snapshot.tbl_khu_vuc.find((k) => k.ma_khu_vuc === pc.ma_khu_vuc_truc);

                  return (
                    <tr key={pc.ma_phan_cong}>
                      <td className="t-num"><strong>{pc.ngay_lam_viec}</strong></td>
                      <td>
                        <strong>{nv?.ho_ten}</strong>
                        <div className="t-caption">{nv?.chuc_vu}</div>
                      </td>
                      <td>
                        <span className="ac-badge ac-badge-yellow">{ca?.ten_ca}</span>
                        <div className="t-caption t-num">
                          {ca?.gio_bat_dau.slice(0, 5)} → {ca?.gio_ket_thuc.slice(0, 5)}
                        </div>
                      </td>
                      <td>{kv?.ten_khu_vuc.split(' (')[0] || 'Toàn sảnh'}</td>
                      <td className="t-num t-small">
                        {pc.gio_check_in ? pc.gio_check_in.slice(11, 16) : '—'} /{' '}
                        {pc.gio_check_out ? pc.gio_check_out.slice(11, 16) : '—'}
                      </td>
                      <td>
                        <button
                          className="ac-btn ac-btn-outline ac-btn-sm"
                          onClick={() => toggleShiftCheckInOut(pc.ma_phan_cong)}
                        >
                          <CalendarCheck size={12} />{' '}
                          {!pc.gio_check_in
                            ? 'Check-in'
                            : !pc.gio_check_out
                              ? 'Check-out'
                              : 'Đã xong'}
                        </button>
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
            Phân Công Ca Mới
          </h2>
          <form onSubmit={handleAssignShift} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div className="ac-field">
              <label className="ac-label">Chọn nhân viên</label>
              <select
                className="ac-select"
                value={shiftStaffId}
                onChange={(e) => setShiftStaffId(e.target.value)}
              >
                {snapshot.tbl_nhan_vien.map((nv) => (
                  <option key={nv.ma_nhan_vien} value={nv.ma_nhan_vien}>
                    {nv.ho_ten} ({nv.chuc_vu})
                  </option>
                ))}
              </select>
            </div>
            <div className="ac-field">
              <label className="ac-label">Chọn Ca làm việc & Khung giờ</label>
              <select
                className="ac-select"
                value={shiftCaId}
                onChange={(e) => setShiftCaId(e.target.value)}
              >
                {snapshot.tbl_ca_lam_viec.map((ca) => (
                  <option key={ca.ma_ca} value={ca.ma_ca}>
                    {ca.ten_ca} (x{ca.he_so_luong_ca})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
              <div className="ac-field">
                <label className="ac-label">Ngày trực</label>
                <input
                  type="date"
                  className="ac-input"
                  value={shiftDate}
                  onChange={(e) => setShiftDate(e.target.value)}
                />
              </div>
              <div className="ac-field">
                <label className="ac-label">Khu vực trực</label>
                <select
                  className="ac-select"
                  value={shiftAreaId}
                  onChange={(e) => setShiftAreaId(e.target.value)}
                >
                  {snapshot.tbl_khu_vuc.map((kv) => (
                    <option key={kv.ma_khu_vuc} value={kv.ma_khu_vuc}>
                      {kv.ten_khu_vuc.split(' (')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="ac-btn ac-btn-primary">
              <Plus size={14} /> Lưu Lịch Phân Ca
            </button>
          </form>
        </div>
      </div>

      {/* Nghỉ phép 3 trạng thái: ĐÃ NGHỈ - ĐANG NGHỈ - SẮP NGHỈ */}
      <div className="ac-split-60-40">
        <div className="ac-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <h2 className="t-h2">Nghỉ Phép 3 Trạng Thái (`tbl_don_nghi_phep`)</h2>

            <div className="ac-segmented">
              <button
                className={`ac-seg-btn ${leaveFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setLeaveFilter('ALL')}
              >
                Tất cả ({snapshot.tbl_don_nghi_phep.length})
              </button>
              <button
                className={`ac-seg-btn ${leaveFilter === 'DaNghi' ? 'active' : ''}`}
                onClick={() => setLeaveFilter('DaNghi')}
              >
                1. ĐÃ NGHỈ
              </button>
              <button
                className={`ac-seg-btn ${leaveFilter === 'DangNghi' ? 'active' : ''}`}
                onClick={() => setLeaveFilter('DangNghi')}
              >
                2. ĐANG NGHỈ
              </button>
              <button
                className={`ac-seg-btn ${leaveFilter === 'SapNghi' ? 'active' : ''}`}
                onClick={() => setLeaveFilter('SapNghi')}
              >
                3. SẮP NGHỈ
              </button>
            </div>
          </div>

          <div className="ac-table-wrap">
            <table className="ac-data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Nhân viên xin nghỉ</th>
                  <th>Ngày & Ca nghỉ</th>
                  <th>Người trực thay ca</th>
                  <th>Phân nhóm 3 trạng thái</th>
                  <th>Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((don) => {
                  const nv = snapshot.tbl_nhan_vien.find((n) => n.ma_nhan_vien === don.ma_nhan_vien);
                  const thay = snapshot.tbl_nhan_vien.find((n) => n.ma_nhan_vien === don.ma_nv_thay_ca);
                  const ca = snapshot.tbl_ca_lam_viec.find((c) => c.ma_ca === don.ma_ca_nghi);

                  return (
                    <tr key={don.ma_don_nghi}>
                      <td className="t-num"><strong>{don.ma_don_nghi}</strong></td>
                      <td>
                        <strong>{nv?.ho_ten}</strong>
                        <div className="t-caption">{don.ly_do}</div>
                      </td>
                      <td>
                        <strong>{don.ngay_nghi}</strong>
                        <div className="t-caption">{ca?.ten_ca}</div>
                      </td>
                      <td>
                        <span className="ac-badge ac-badge-green">
                          <UserCheck size={11} /> {thay?.ho_ten || 'Chưa gán'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ac-badge ${
                            don.trang_thai_nghi === 'DangNghi'
                              ? 'ac-badge-red'
                              : don.trang_thai_nghi === 'SapNghi'
                                ? 'ac-badge-yellow'
                                : 'ac-badge-neutral'
                          }`}
                        >
                          {don.trang_thai_nghi === 'DaNghi'
                            ? '1. ĐÃ NGHỈ'
                            : don.trang_thai_nghi === 'DangNghi'
                              ? '2. ĐANG NGHỈ'
                              : '3. SẮP NGHỈ'}
                        </span>
                      </td>
                      <td>
                        {don.trang_thai_duyet === 'ChoDuyet' ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              className="ac-btn ac-btn-success ac-btn-sm"
                              onClick={() => approveOrRejectLeave(don.ma_don_nghi, 'DaDuyet')}
                            >
                              <CheckCircle2 size={12} /> Duyệt
                            </button>
                            <button
                              className="ac-btn ac-btn-outline ac-btn-sm"
                              onClick={() => approveOrRejectLeave(don.ma_don_nghi, 'TuChoi')}
                            >
                              <XCircle size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="ac-badge ac-badge-green">{don.trang_thai_duyet}</span>
                        )}
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
            Tạo Đơn Nghỉ Phép & Chỉ Định Người Thay Ca
          </h2>
          <form onSubmit={handleCreateLeave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div className="ac-field">
              <label className="ac-label">Nhân viên xin nghỉ</label>
              <select
                className="ac-select"
                value={leaveStaffId}
                onChange={(e) => setLeaveStaffId(e.target.value)}
              >
                {snapshot.tbl_nhan_vien.map((nv) => (
                  <option key={nv.ma_nhan_vien} value={nv.ma_nhan_vien}>
                    {nv.ho_ten} ({nv.chuc_vu})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
              <div className="ac-field">
                <label className="ac-label">Ngày xin nghỉ</label>
                <input
                  type="date"
                  className="ac-input"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                />
              </div>
              <div className="ac-field">
                <label className="ac-label">Ca xin nghỉ</label>
                <select
                  className="ac-select"
                  value={leaveCaId}
                  onChange={(e) => setLeaveCaId(e.target.value)}
                >
                  {snapshot.tbl_ca_lam_viec.map((ca) => (
                    <option key={ca.ma_ca} value={ca.ma_ca}>
                      {ca.ten_ca}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ac-field">
              <label className="ac-label">Nhân viên đồng ý trực thay ca</label>
              <select
                className="ac-select"
                value={leaveReplaceId}
                onChange={(e) => setLeaveReplaceId(e.target.value)}
              >
                {snapshot.tbl_nhan_vien
                  .filter((nv) => nv.ma_nhan_vien !== leaveStaffId)
                  .map((nv) => (
                    <option key={nv.ma_nhan_vien} value={nv.ma_nhan_vien}>
                      {nv.ho_ten} ({nv.chuc_vu})
                    </option>
                  ))}
              </select>
            </div>
            <div className="ac-field">
              <label className="ac-label">Lý do xin nghỉ</label>
              <input
                className="ac-input"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
              />
            </div>
            <button type="submit" className="ac-btn ac-btn-primary">
              Gửi Đơn Nghỉ Phép
            </button>
          </form>
        </div>
      </div>

      {/* Bảng tổng hợp lương nhân viên theo ca */}
      <div className="ac-card">
        <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
          Bảng Tổng Hợp Lương Theo Ca & Đối Trừ Ngày ĐÃ NGHỈ (`tbl_bang_luong`)
        </h2>
        <div className="ac-table-wrap">
          <table className="ac-data-table">
            <thead>
              <tr>
                <th>Mã Phiếu Lương</th>
                <th>Nhân viên</th>
                <th>Kỳ lương</th>
                <th>Tổng số ca (Sáng / Chiều / Tối)</th>
                <th>Số ca ĐÃ NGHỈ</th>
                <th>Phụ cấp</th>
                <th>Tổng lương thực lĩnh</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.tbl_bang_luong.map((bl) => {
                const nv = snapshot.tbl_nhan_vien.find((n) => n.ma_nhan_vien === bl.ma_nhan_vien);
                return (
                  <tr key={bl.ma_bang_luong}>
                    <td className="t-num"><strong>{bl.ma_bang_luong}</strong></td>
                    <td><strong>{nv?.ho_ten}</strong> ({nv?.chuc_vu})</td>
                    <td className="t-num">{bl.thang_nam}</td>
                    <td className="t-num">
                      <strong>{bl.tong_so_ca} ca</strong> ({bl.so_ca_sang} S • {bl.so_ca_chieu} C • {bl.so_ca_toi} T)
                    </td>
                    <td className="t-num">
                      <span className="ac-badge ac-badge-orange">-{bl.so_ngay_da_nghi} ca</span>
                    </td>
                    <td className="t-num">{formatVnd(bl.tien_phu_cap)}</td>
                    <td className="t-num">
                      <strong style={{ color: 'var(--table-empty)' }}>
                        {formatVnd(bl.tong_luong_thuc_linh)}
                      </strong>
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
