import React, { useState } from 'react';
import { ShieldCheck, Database, KeyRound, Server, RotateCcw } from 'lucide-react';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { DatabaseSnapshot } from '../../types/database';

export const RbacManagerView: React.FC = () => {
  const {
    snapshot,
    backendEngineLabel,
    setRole,
    resetAllDataToSeed,
  } = useRestaurantStore();

  const tableKeys = Object.keys(snapshot) as (keyof DatabaseSnapshot)[];
  const [inspectTable, setInspectTable] = useState<keyof DatabaseSnapshot>('tbl_ban');

  const rows = snapshot[inspectTable] as unknown as Record<string, unknown>[];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
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
          <span className="t-caption">MOD-10 • QUẢN TRỊ ĐỊNH DANH, MA TRẬN PHÂN QUYỀN RBAC & TRÌNH DUYỆT 27 BẢNG 3NF</span>
          <h1 className="t-h1">Tài Khoản Nội Bộ, Phân Quyền RBAC 6 Vai Trò & CSDL MySQL 27 Bảng</h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
          <span className="ac-badge ac-badge-green">
            <Server size={13} /> Engine: {backendEngineLabel} (27/27 Bảng 3NF)
          </span>
          <button className="ac-btn ac-btn-outline" onClick={resetAllDataToSeed}>
            <RotateCcw size={14} /> Khôi Phục Dữ Liệu Mẫu 27 Bảng
          </button>
        </div>
      </div>

      {/* Bảng Ma trận 6 Vai trò RBAC & Tài khoản đăng nhập */}
      <div className="ac-split-60-40">
        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            <ShieldCheck size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Ma Trận Phân Quyền Bảo Mật RBAC 6 Vai Trò (`tbl_vai_tro`)
          </h2>
          <div className="ac-table-wrap">
            <table className="ac-data-table">
              <thead>
                <tr>
                  <th>Mã Vai Trò</th>
                  <th>Tên Role</th>
                  <th>Phạm vi Phân hệ & Chốt chặn Bảo mật</th>
                  <th>Chuyển nhanh</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.tbl_vai_tro.map((vt) => (
                  <tr key={vt.ma_vai_tro}>
                    <td className="t-num"><strong>{vt.ma_vai_tro}</strong></td>
                    <td>
                      <span className="ac-badge ac-badge-vip">{vt.ten_vai_tro}</span>
                    </td>
                    <td>
                      <div className="t-small"><strong>{vt.pham_vi_truy_cap}</strong></div>
                      <div className="t-caption" style={{ textTransform: 'none' }}>{vt.mo_ta_quyen_han}</div>
                    </td>
                    <td>
                      <button
                        className="ac-btn ac-btn-outline"
                        style={{ padding: '4px 10px' }}
                        onClick={() => setRole(vt.ten_vai_tro)}
                      >
                        Trải nghiệm Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            <KeyRound size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Tài Khoản Nhân Viên Nội Bộ (`tbl_tai_khoan`)
          </h2>
          <div className="ac-table-wrap">
            <table className="ac-data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Nhân viên sở hữu</th>
                  <th>Role RBAC</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.tbl_tai_khoan.map((tk) => {
                  const nv = snapshot.tbl_nhan_vien.find((n) => n.ma_nhan_vien === tk.ma_nhan_vien);
                  return (
                    <tr key={tk.ma_tai_khoan}>
                      <td className="t-num"><strong>{tk.ten_dang_nhap}</strong></td>
                      <td>{nv?.ho_ten}</td>
                      <td><span className="ac-badge ac-badge-neutral">{tk.ma_vai_tro}</span></td>
                      <td>
                        <span className="ac-badge ac-badge-green">
                          {tk.trang_thai_khoa ? 'Đã khóa' : 'Đang hoạt động'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trình duyệt trực tiếp 27 Bảng CSDL Chuẩn 3NF */}
      <div className="ac-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--sp-3)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          <div>
            <span className="t-caption">CHƯƠNG 4 • ĐỐI CHIẾU TRỰC TIẾP 27 BẢNG CƠ SỞ DỮ LIỆU CHUẨN 3NF</span>
            <h2 className="t-h2">
              <Database size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Trình Duyệt Dữ Liệu Thời Gian Thực (27/27 Bảng MySQL 3NF)
            </h2>
          </div>

          <select
            className="ac-select"
            style={{ maxWidth: 340 }}
            value={inspectTable}
            onChange={(e) => setInspectTable(e.target.value as keyof DatabaseSnapshot)}
          >
            {tableKeys.map((key, index) => (
              <option key={key} value={key}>
                Bảng {index + 1}/27: {key} ({(snapshot[key] as unknown[]).length} bản ghi)
              </option>
            ))}
          </select>
        </div>

        <div className="ac-table-wrap">
          {rows.length === 0 ? (
            <p className="t-small">Bảng `{inspectTable}` hiện chưa có bản ghi nào.</p>
          ) : (
            <table className="ac-data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={col} className="t-num">
                        {row[col] === null || row[col] === undefined
                          ? 'NULL'
                          : typeof row[col] === 'boolean'
                            ? row[col]
                              ? 'TRUE'
                              : 'FALSE'
                            : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
