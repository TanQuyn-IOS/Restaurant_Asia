import React from 'react';
import { Flame, Crown, BellRing, ChefHat, CheckCircle2, Play, Ban } from 'lucide-react';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { getSpicyLabel } from '../../utils/soundNotifier';

export const KitchenKdsView: React.FC = () => {
  const { snapshot, advanceKdsDishStatus, toggleDishAvailability } = useRestaurantStore();

  const kdsQueue = snapshot.tbl_chi_tiet_don_goi
    .filter((item) => item.trang_thai_mon !== 'DaHuy')
    .map((item) => {
      const order = snapshot.tbl_don_goi_mon.find((o) => o.ma_order === item.ma_order);
      const ban = snapshot.tbl_ban.find((b) => b.ma_ban === order?.ma_ban);
      const mon = snapshot.tbl_mon_an.find((m) => m.ma_mon_an === item.ma_mon_an);
      return {
        item,
        order,
        ban,
        mon,
        isVip: Boolean(order?.vip_flag),
      };
    })
    .sort((a, b) => {
      if (a.isVip !== b.isVip) return a.isVip ? -1 : 1;
      return a.item.thoi_gian_goi.localeCompare(b.item.thoi_gian_goi);
    });

  const waitingList = kdsQueue.filter((q) => q.item.trang_thai_mon === 'ChoCheBien');
  const cookingList = kdsQueue.filter((q) => q.item.trang_thai_mon === 'DangCheBien');
  const completedList = kdsQueue.filter(
    (q) => q.item.trang_thai_mon === 'HoanThanh' || q.item.trang_thai_mon === 'DaPhucVu',
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
      {/* Màn hình KDS Dark Mode độ tương phản cao chống lóa bếp */}
      <div className="ac-kds-board">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--sp-4)',
            borderBottom: '1px solid var(--border-dark)',
            paddingBottom: 'var(--sp-4)',
            marginBottom: 'var(--sp-4)',
          }}
        >
          <div>
            <h1 className="t-h1" style={{ color: 'var(--text-inverse)' }}>
              Màn Hình Điều Phối Chế Biến Bếp KDS Thời Gian Thực
            </h1>
            <p className="t-small" style={{ color: 'var(--text-kds-muted)' }}>
              Tự động đẩy món bàn VIP lên đầu hàng đợi. Chỉ khi bấm Hoàn Thành, món mới nạp vào Bill tính tiền, trừ kho BOM và phát chuông Ting.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
            <span className="ac-badge ac-badge-vip">
              <Crown size={13} /> Ưu tiên VIP Flag
            </span>
            <span className="ac-badge ac-badge-orange">
              Chờ nấu: {waitingList.length}
            </span>
            <span className="ac-badge ac-badge-yellow">
              Đang nấu (Khóa hủy): {cookingList.length}
            </span>
            <span className="ac-badge ac-badge-green">
              Hoàn thành (Đã nạp Bill): {completedList.length}
            </span>
          </div>
        </div>

        {/* 3 Cột KDS Ticket Strips chuẩn Toast KDS */}
        <div className="ac-kds-columns">
          {/* CỘT 1: CHỜ CHẾ BIẾN */}
          <div className="ac-kds-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong className="t-h3" style={{ color: 'var(--table-billing)' }}>
                1. Chờ Chế Biến ({waitingList.length})
              </strong>
              <span className="t-caption" style={{ color: 'var(--text-kds-muted)' }}>FIFO + VIP</span>
            </div>

            {waitingList.length === 0 ? (
              <div className="t-small" style={{ color: 'var(--text-kds-muted)', padding: 'var(--sp-4) 0' }}>
                Không có món nào đang chờ chế biến.
              </div>
            ) : (
              waitingList.map(({ item, ban, mon, isVip }) => (
                <div
                  key={item.ma_chi_tiet_order}
                  className={`ac-kds-ticket ${isVip ? 'vip-priority' : ''}`}
                >
                  <div className="ac-kds-ticket-head">
                    <strong>{ban?.ten_ban}</strong>
                    <span>
                      {isVip ? '★ ƯU TIÊN VIP' : `Lượt #${item.lan_goi} • ${item.nguon_goi}`}
                    </span>
                  </div>

                  <div className="ac-kds-ticket-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <strong className="t-h3" style={{ color: 'var(--text-inverse)' }}>
                        {mon?.ten_mon_an}
                      </strong>
                      <span className="ac-badge ac-badge-vip">x{item.so_luong}</span>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span className="ac-badge ac-badge-neutral">
                        <Flame size={11} /> {getSpicyLabel(item.muc_do_cay_yc)}
                      </span>
                      <span className="ac-badge ac-badge-neutral">
                        {item.thoi_gian_goi.slice(11, 16)}
                      </span>
                    </div>

                    {item.ghi_chu_mon && (
                      <div
                        className="t-small"
                        style={{
                          color: 'var(--accent)',
                          borderLeft: '2px solid var(--accent)',
                          paddingLeft: 8,
                        }}
                      >
                        {item.ghi_chu_mon}
                      </div>
                    )}

                    <button
                      className="ac-btn ac-btn-warning"
                      style={{ width: '100%', marginTop: 4 }}
                      onClick={() => advanceKdsDishStatus(item.ma_chi_tiet_order, 'DangCheBien')}
                    >
                      <Play size={14} /> Nhận Nấu (Khóa Quyền Hủy Món)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CỘT 2: ĐANG CHẾ BIẾN */}
          <div className="ac-kds-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong className="t-h3" style={{ color: 'var(--accent)' }}>
                2. Đang Chế Biến ({cookingList.length})
              </strong>
              <span className="t-caption" style={{ color: 'var(--text-kds-muted)' }}>Đã khóa hủy</span>
            </div>

            {cookingList.length === 0 ? (
              <div className="t-small" style={{ color: 'var(--text-kds-muted)', padding: 'var(--sp-4) 0' }}>
                Chưa có món đang trên bếp lửa.
              </div>
            ) : (
              cookingList.map(({ item, ban, mon, isVip }) => (
                <div
                  key={item.ma_chi_tiet_order}
                  className={`ac-kds-ticket ${isVip ? 'vip-priority' : ''}`}
                >
                  <div className="ac-kds-ticket-head">
                    <strong>{ban?.ten_ban}</strong>
                    <span>
                      <ChefHat size={12} style={{ verticalAlign: 'middle' }} /> Đang nấu ({mon?.thoi_gian_nau_tb}p)
                    </span>
                  </div>

                  <div className="ac-kds-ticket-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <strong className="t-h3" style={{ color: 'var(--text-inverse)' }}>
                        {mon?.ten_mon_an}
                      </strong>
                      <span className="ac-badge ac-badge-yellow">x{item.so_luong}</span>
                    </div>

                    <div className="t-caption" style={{ color: 'var(--text-kds-muted)' }}>
                      {getSpicyLabel(item.muc_do_cay_yc)}
                      {item.ghi_chu_mon ? ` • ${item.ghi_chu_mon}` : ''}
                    </div>

                    <button
                      className="ac-btn ac-btn-success"
                      style={{ width: '100%', marginTop: 4 }}
                      onClick={() => advanceKdsDishStatus(item.ma_chi_tiet_order, 'HoanThanh')}
                    >
                      <BellRing size={14} /> Hoàn Thành → Chuông Ting & Nạp Bill
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CỘT 3: ĐÃ HOÀN THÀNH & NẠP BILL */}
          <div className="ac-kds-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong className="t-h3" style={{ color: 'var(--table-empty)' }}>
                3. Đã Hoàn Thành ({completedList.length})
              </strong>
              <span className="t-caption" style={{ color: 'var(--text-kds-muted)' }}>Đã nạp Bill & Trừ BOM</span>
            </div>

            {completedList.map(({ item, ban, mon }) => (
              <div key={item.ma_chi_tiet_order} className="ac-kds-ticket">
                <div className="ac-kds-ticket-head">
                  <strong>{ban?.ten_ban}</strong>
                  <span className="ac-badge ac-badge-green">
                    <CheckCircle2 size={11} /> {item.trang_thai_mon}
                  </span>
                </div>
                <div className="ac-kds-ticket-body">
                  <strong className="t-small" style={{ color: 'var(--text-inverse)' }}>
                    {item.so_luong}x {mon?.ten_mon_an}
                  </strong>
                  <div className="t-caption" style={{ color: 'var(--text-kds-muted)' }}>
                    ✓ Đã nạp vào hóa đơn • ✓ Đã trừ tồn kho BOM
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bảng Nhật ký KDS & Báo Hết món nhanh */}
      <div className="ac-split-60-40">
        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            Nhật Ký Điều Phối Chế Biến Bếp (`tbl_nhat_ky_bep`)
          </h2>
          <div className="ac-table-wrap">
            <table className="ac-data-table">
              <thead>
                <tr>
                  <th>Mã Log</th>
                  <th>Mã Chi Tiết Món</th>
                  <th>Đầu bếp</th>
                  <th>Tiếp nhận</th>
                  <th>Bắt đầu nấu</th>
                  <th>Hoàn thành (Nạp Bill)</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.tbl_nhat_ky_bep.map((log) => (
                  <tr key={log.ma_log_bep}>
                    <td className="t-num"><strong>{log.ma_log_bep}</strong></td>
                    <td className="t-num">{log.ma_chi_tiet_order}</td>
                    <td>{log.ma_dau_bep}</td>
                    <td className="t-num">{log.thoi_gian_tiep_nhan.slice(11)}</td>
                    <td className="t-num">{log.thoi_gian_bat_dau ? log.thoi_gian_bat_dau.slice(11) : '—'}</td>
                    <td className="t-num">
                      {log.thoi_gian_hoan_thanh ? (
                        <span className="ac-badge ac-badge-green">{log.thoi_gian_hoan_thanh.slice(11)}</span>
                      ) : (
                        <span className="ac-badge ac-badge-yellow">{log.trang_thai_che_bien}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ac-card">
          <h2 className="t-h2" style={{ marginBottom: 'var(--sp-3)' }}>
            Công Tắc Báo Còn Món / Hết Món Nhanh Tại Bếp
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {snapshot.tbl_mon_an.slice(0, 7).map((m) => (
              <div
                key={m.ma_mon_an}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  gap: 8,
                }}
              >
                <span className="t-small">{m.ten_mon_an}</span>
                <button
                  className={`ac-btn ac-btn-sm ${m.trang_thai_mon === 'ConMon' ? 'ac-btn-outline' : 'ac-btn-primary'}`}
                  onClick={() =>
                    toggleDishAvailability(
                      m.ma_mon_an,
                      m.trang_thai_mon === 'ConMon' ? 'HetMon' : 'ConMon',
                    )
                  }
                >
                  <Ban size={12} /> {m.trang_thai_mon === 'ConMon' ? 'Báo Hết Món' : 'Mở Lại Món'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
