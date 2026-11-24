import React, { useState } from 'react';
import { Flame, Clock, Layers, PlusCircle, CheckCircle, Ban } from 'lucide-react';
import { useRestaurantStore } from '../../store/useRestaurantStore';
import { CuisineSchool } from '../../types/database';
import { formatVnd, getSpicyLabel } from '../../utils/soundNotifier';

export const MenuManagerView: React.FC = () => {
  const { snapshot, toggleDishAvailability, addDishToMenu } = useRestaurantStore();
  const [selectedSchool, setSelectedSchool] = useState<CuisineSchool | 'ALL'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('DM-VN');
  const [newPrice, setNewPrice] = useState(195000);
  const [newSpicy, setNewSpicy] = useState<0 | 1 | 2 | 3>(1);
  const [newCookTime, setNewCookTime] = useState(12);
  const [newDesc, setNewDesc] = useState('');

  const filteredDishes = snapshot.tbl_mon_an.filter((mon) => {
    if (selectedSchool === 'ALL') return true;
    const dm = snapshot.tbl_danh_muc_mon.find((d) => d.ma_danh_muc === mon.ma_danh_muc);
    return dm?.truong_phai_am_thuc === selectedSchool;
  });

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    addDishToMenu({
      ten_mon_an: newName,
      ma_danh_muc: newCat,
      don_gia: newPrice,
      hinh_anh_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      mo_ta: newDesc || 'Món ngon đặc trưng chế biến nóng tại bếp Á Châu',
      muc_do_cay: newSpicy,
      thoi_gian_nau_tb: newCookTime,
      trang_thai_mon: 'ConMon',
      is_combo: newCat === 'DM-COMBO',
    });
    setNewName('');
    setShowAddModal(false);
  };

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
          <span className="t-caption">MOD-03 • QUẢN TRỊ THỰC ĐƠN 5 TRƯỜNG PHÁI ẨM THỰC CHÂU Á & ĐỊNH MỨC BOM</span>
          <h1 className="t-h1">Thực Đơn Ẩm Thực Châu Á, Cấp Độ Cay & Đồng Bộ Còn/Hết Món</h1>
        </div>
        <button className="ac-btn ac-btn-primary" onClick={() => setShowAddModal(true)}>
          <PlusCircle size={16} /> Thêm Món Ăn / Combo Mới
        </button>
      </div>

      {/* Bộ lọc 5 Trường phái ẩm thực Châu Á */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        {(
          [
            { id: 'ALL', label: `Tất cả thực đơn (${snapshot.tbl_mon_an.length})` },
            { id: 'VietNam', label: '🇻🇳 Ẩm Thực Việt Nam' },
            { id: 'TrungHoa', label: '🇨🇳 Trung Hoa Mỹ Vị' },
            { id: 'NhatBan', label: '🇯🇵 Nhật Bản Tuyệt Phẩm' },
            { id: 'HanQuoc', label: '🇰🇷 Hàn Quốc Nướng & Lẩu' },
            { id: 'ThaiLan', label: '🇹🇭 Thái Lan Chua Cay' },
          ] as { id: CuisineSchool | 'ALL'; label: string }[]
        ).map((s) => (
          <button
            key={s.id}
            className={`ac-btn ${selectedSchool === s.id ? 'ac-btn-primary' : 'ac-btn-outline'}`}
            onClick={() => setSelectedSchool(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Lưới Món ăn kèm Định mức tiêu hao nguyên vật liệu BOM & Chi tiết Combo */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 'var(--sp-4)',
        }}
      >
        {filteredDishes.map((mon) => {
          const dm = snapshot.tbl_danh_muc_mon.find((d) => d.ma_danh_muc === mon.ma_danh_muc);
          const boms = snapshot.tbl_dinh_muc_mon.filter((b) => b.ma_mon_an === mon.ma_mon_an);
          const comboItems = mon.is_combo
            ? snapshot.tbl_chi_tiet_combo.filter((c) => c.ma_combo === mon.ma_mon_an)
            : [];

          return (
            <div
              key={mon.ma_mon_an}
              className="ac-card"
              style={{
                padding: 'var(--sp-4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--sp-3)',
                opacity: mon.trang_thai_mon === 'ConMon' ? 1 : 0.72,
              }}
            >
              <div>
                <div
                  style={{
                    height: 170,
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: 'var(--sp-3)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  {mon.hinh_anh_url && (
                    <img
                      src={mon.hinh_anh_url}
                      alt={mon.ten_mon_an}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      display: 'flex',
                      gap: 6,
                    }}
                  >
                    <span className="ac-badge ac-badge-vip">
                      {dm?.truong_phai_am_thuc || 'Châu Á'}
                    </span>
                    {mon.is_combo && (
                      <span className="ac-badge ac-badge-red">GÓI COMBO TIỆC ĐOÀN</span>
                    )}
                  </div>
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span
                      className={`ac-badge ${
                        mon.trang_thai_mon === 'ConMon' ? 'ac-badge-green' : 'ac-badge-red'
                      }`}
                    >
                      {mon.trang_thai_mon === 'ConMon' ? '● Còn món' : '✕ Hết món (Đã khóa gọi)'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h3 className="t-h3">{mon.ten_mon_an}</h3>
                  <strong className="t-h3 t-num" style={{ color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    {formatVnd(mon.don_gia)}
                  </strong>
                </div>

                <p className="t-small" style={{ marginTop: 4 }}>
                  {mon.mo_ta}
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <span className="ac-badge ac-badge-neutral">
                    <Flame size={12} /> {getSpicyLabel(mon.muc_do_cay)}
                  </span>
                  <span className="ac-badge ac-badge-neutral">
                    <Clock size={12} /> Chuẩn nấu: {mon.thoi_gian_nau_tb} phút
                  </span>
                </div>

                {/* Định mức nguyên liệu BOM tự động trừ kho khi Bếp bấm Hoàn thành */}
                {boms.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 'var(--sp-2)',
                      background: 'var(--bg)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span className="t-caption">
                      <Layers size={11} /> Định mức BOM tự trừ kho khi Bếp Hoàn thành:
                    </span>
                    {boms.map((b) => {
                      const nl = snapshot.tbl_nguyen_lieu.find(
                        (n) => n.ma_nguyen_lieu === b.ma_nguyen_lieu,
                      );
                      return (
                        <div key={b.ma_dinh_muc} className="t-small t-num">
                          • {nl?.ten_nguyen_lieu}: <strong>{b.dinh_luong_tieu_hao} {b.don_vi_dinh_muc}</strong> (Hao hụt {b.ty_le_hao_hut}%)
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Chi tiết gói Combo tiệc đoàn */}
                {comboItems.length > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 'var(--sp-2)',
                      background: 'var(--accent-soft)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span className="t-caption">Thực đơn thành phần trong gói Combo đoàn:</span>
                    {comboItems.map((ci) => {
                      const sub = snapshot.tbl_mon_an.find(
                        (m) => m.ma_mon_an === ci.ma_mon_thanh_phan,
                      );
                      return (
                        <div key={ci.ma_chi_tiet_combo} className="t-small">
                          • {sub?.ten_mon_an} (x{ci.so_luong_mon})
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Nút Gạt Còn món / Hết món đồng bộ Realtime (FR-09) */}
              <div style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <button
                  className={`ac-btn ${mon.trang_thai_mon === 'ConMon' ? 'ac-btn-success' : 'ac-btn-outline'}`}
                  style={{ flex: 1 }}
                  onClick={() => toggleDishAvailability(mon.ma_mon_an, 'ConMon')}
                >
                  <CheckCircle size={14} /> Báo Còn Món
                </button>
                <button
                  className={`ac-btn ${mon.trang_thai_mon === 'HetMon' ? 'ac-btn-primary' : 'ac-btn-outline'}`}
                  style={{ flex: 1 }}
                  onClick={() => toggleDishAvailability(mon.ma_mon_an, 'HetMon')}
                >
                  <Ban size={14} /> Báo Hết Món (Realtime)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="ac-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="ac-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="t-h2">Thêm Món Ăn Mới Vào Thực Đơn Châu Á</h2>
            <form onSubmit={handleAddDish} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <div>
                <label className="t-caption">Tên món ăn</label>
                <input
                  className="ac-input"
                  required
                  placeholder="VD: Cá Tuyết Hấp Xì Dầu Thượng Hải"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                <div>
                  <label className="t-caption">Danh mục & Trường phái</label>
                  <select
                    className="ac-select"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  >
                    {snapshot.tbl_danh_muc_mon.map((d) => (
                      <option key={d.ma_danh_muc} value={d.ma_danh_muc}>
                        {d.ten_danh_muc} ({d.truong_phai_am_thuc})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="t-caption">Đơn giá bán (VND)</label>
                  <input
                    type="number"
                    min={10000}
                    step={5000}
                    className="ac-input"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)' }}>
                <div>
                  <label className="t-caption">Mức độ cay tiêu chuẩn (0-3)</label>
                  <select
                    className="ac-select"
                    value={newSpicy}
                    onChange={(e) => setNewSpicy(Number(e.target.value) as 0 | 1 | 2 | 3)}
                  >
                    <option value={0}>0 - Không cay</option>
                    <option value={1}>1 - Cay nhẹ</option>
                    <option value={2}>2 - Cay vừa</option>
                    <option value={3}>3 - Cay nồng</option>
                  </select>
                </div>
                <div>
                  <label className="t-caption">Thời gian chế biến chuẩn (Phút)</label>
                  <input
                    type="number"
                    min={1}
                    className="ac-input"
                    value={newCookTime}
                    onChange={(e) => setNewCookTime(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="t-caption">Mô tả thành phần & hương vị</label>
                <input
                  className="ac-input"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
                <button type="button" className="ac-btn ac-btn-outline" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="ac-btn ac-btn-primary">
                  Lưu Món Ăn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
