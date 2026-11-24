-- =====================================================================
-- DỮ LIỆU MẪU CHUẨN 27 BẢNG 3NF CHO HỆ THỐNG AC-RMS (MySQL 8.0+)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Khu vực sảnh
INSERT IGNORE INTO tbl_khu_vuc (ma_khu_vuc, ten_khu_vuc, suc_chua_toi_da, mo_ta, trang_thai) VALUES
('KV-T1', 'Sảnh Chính Tầng 1 (Tre Việt)', 60, 'Không gian mở tầng 1, phù hợp khách vãng lai & khách thường', 'HoatDong'),
('KV-T2', 'Sảnh Gia Đình Tầng 2 (Đèn Lồng Đỏ)', 48, 'Không gian ấm cúng hướng phố cho gia đình & nhóm bạn', 'HoatDong'),
('KV-VIP', 'Phòng VIP Hoàng Gia (Sakura & Lotus)', 32, 'Phòng riêng cách âm, ưu tiên khách thẻ VIP Vàng/Kim Cương', 'HoatDong'),
('KV-DOAN', 'Sảnh Đại Tiệc Khách Đoàn (Asian Grand Hall)', 100, 'Sảnh lớn có sân khấu, hỗ trợ ghép bàn dài cho đoàn & công ty', 'HoatDong');

-- 2. Bàn ăn vật lý
INSERT IGNORE INTO tbl_ban (ma_ban, ten_ban, ma_khu_vuc, loai_ban, so_ghe, ma_qr_code, ma_ban_chinh, trang_thai_ban) VALUES
('B-101', 'Bàn 101', 'KV-T1', 'Thuong', 4, 'QR-ACRMS-B101', NULL, 'DangPhucVu'),
('B-102', 'Bàn 102', 'KV-T1', 'Thuong', 4, 'QR-ACRMS-B102', NULL, 'Trong'),
('B-103', 'Bàn 103', 'KV-T1', 'Thuong', 6, 'QR-ACRMS-B103', NULL, 'ChoThanhToan'),
('B-104', 'Bàn 104', 'KV-T1', 'Thuong', 4, 'QR-ACRMS-B104', NULL, 'Trong'),
('B-201', 'Bàn 201', 'KV-T2', 'Thuong', 6, 'QR-ACRMS-B201', NULL, 'DaDat'),
('B-202', 'Bàn 202', 'KV-T2', 'Thuong', 6, 'QR-ACRMS-B202', NULL, 'Trong'),
('B-203', 'Bàn 203', 'KV-T2', 'Thuong', 8, 'QR-ACRMS-B203', NULL, 'Trong'),
('VIP-01', 'Phòng VIP 01 (Hoàng Kim)', 'KV-VIP', 'VIP', 8, 'QR-ACRMS-VIP01', NULL, 'DangPhucVu'),
('VIP-02', 'Phòng VIP 02 (Phượng Hoàng)', 'KV-VIP', 'VIP', 10, 'QR-ACRMS-VIP02', NULL, 'Trong'),
('VIP-03', 'Phòng VIP 03 (Phú Sĩ)', 'KV-VIP', 'VIP', 8, 'QR-ACRMS-VIP03', NULL, 'DaDat'),
('D-301', 'Bàn Đoàn 301 (Chính)', 'KV-DOAN', 'BanDai', 12, 'QR-ACRMS-D301', NULL, 'DangPhucVu'),
('D-302', 'Bàn Đoàn 302 (Ghép D-301)', 'KV-DOAN', 'BanDai', 12, 'QR-ACRMS-D302', 'D-301', 'DangPhucVu'),
('D-303', 'Bàn Đoàn 303', 'KV-DOAN', 'BanDai', 16, 'QR-ACRMS-D303', NULL, 'Trong');

-- 3. Hồ sơ 4 nhóm khách hàng
INSERT IGNORE INTO tbl_khach_hang (ma_khach_hang, ho_ten, so_dien_thoai, email, loai_khach, hang_the, diem_tich_luy) VALUES
('KH-VL01', 'Khách vãng lai (Walk-in)', NULL, NULL, 'VangLai', 'Standard', 0),
('KH-TH01', 'Nguyễn Minh Tuấn', '0905123456', 'minhtuan.dn@gmail.com', 'Thuong', 'Silver', 340),
('KH-TH02', 'Trần Thị Thu Hà', '0914888999', 'thuha.tran@gmail.com', 'Thuong', 'Standard', 180),
('KH-VIP01', 'Chủ tịch Lê Quốc Bảo', '0988777666', 'quocbao.vip@luxury.vn', 'VIP', 'Diamond', 2450),
('KH-VIP02', 'Bà Phạm Ngọc Tuyết', '0977555444', 'ngoctuyet@partner.vn', 'VIP', 'Gold', 1120),
('KH-DOAN01', 'Công ty CP Công Nghệ & Du Lịch Á Châu', '02363888999', 'ketoan@achautech.vn', 'Doan', 'Gold', 890),
('KH-DOAN02', 'Đoàn Lữ Hành Quốc Tế Vietravel Đà Nẵng', '02363555777', 'dieuhanh@vietravel.com', 'Doan', 'Diamond', 1650);

-- 4. Chi tiết pháp nhân Khách đoàn (Xuất hóa đơn đỏ VAT)
INSERT IGNORE INTO tbl_khach_doan (ma_khach_hang, ten_cong_ty, nguoi_dai_dien, ma_so_thue, dia_chi_cong_ty, email_nhan_hoa_don, ghi_chu_hop_dong) VALUES
('KH-DOAN01', 'CÔNG TY CỔ PHẦN CÔNG NGHỆ VÀ DU LỊCH Á CHÂU', 'Ông Đặng Văn Khoa', '0401987654', 'Số 88 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng', 'ketoan.vat@achautech.vn', 'Hợp đồng tiệc tất niên & tiếp khách quý; xuất hóa đơn VAT 8% ngay sau thanh toán.'),
('KH-DOAN02', 'CHI NHÁNH CÔNG TY CP DU LỊCH VIETRAVEL TẠI ĐÀ NẴNG', 'Bà Hoàng Thanh Tâm', '0300465937-005', 'Số 58 Pasteur, Quận Hải Châu, TP. Đà Nẵng', 'vat.danang@vietravel.com', 'Đối tác lữ hành đặt cọc định kỳ 30%, ưu tiên khu sảnh đoàn tầng 3.');

-- 5. Danh mục thực đơn & 5 Trường phái ẩm thực Châu Á
INSERT IGNORE INTO tbl_danh_muc_mon (ma_danh_muc, ten_danh_muc, truong_phai_am_thuc, thu_tu_hien_thi, trang_thai) VALUES
('DM-VN', 'Tinh Hoa Ẩm Thực Việt Nam', 'VietNam', 1, 'HoatDong'),
('DM-TH', 'Trung Hoa Mỹ Vị (Dimsum & Quay)', 'TrungHoa', 2, 'HoatDong'),
('DM-NB', 'Nhật Bản Tuyệt Phẩm (Sashimi & Wagyu)', 'NhatBan', 3, 'HoatDong'),
('DM-HQ', 'Hàn Quốc Nướng & Lẩu Cay', 'HanQuoc', 4, 'HoatDong'),
('DM-TL', 'Thái Lan Chua Cay Đậm Đà', 'ThaiLan', 5, 'HoatDong'),
('DM-COMBO', 'Gói Combo Đại Tiệc Khách Đoàn', 'VietNam', 6, 'HoatDong');

-- 6. Thực đơn món ăn Châu Á (Độ cay 0-3 & Gói Combo)
INSERT IGNORE INTO tbl_mon_an (ma_mon_an, ten_mon_an, ma_danh_muc, don_gia, hinh_anh_url, mo_ta, muc_do_cay, thoi_gian_nau_tb, trang_thai_mon, is_combo) VALUES
('MON-VN01', 'Phở Bò Wagyu Trần Nước Dùng Quế Hồi', 'DM-VN', 145000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600', 'Bò Wagyu thái mỏng trần nước dùng ninh xương 18 giờ thơm thảo quả', 1, 10, 'ConMon', FALSE),
('MON-VN02', 'Gỏi Cuốn Tôm Hùm Nha Trang Sốt Bơ Đậu', 'DM-VN', 185000, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600', 'Tôm hùm tươi cuốn bánh tráng dẻo kèm rau thơm và tương đậu phộng', 0, 8, 'ConMon', FALSE),
('MON-TH01', 'Vịt Quay Bắc Kinh Da Giòn Nguyên Con', 'DM-TH', 680000, 'https://images.unsplash.com/photo-1518492104633-130d0cc84637?w=600', 'Vịt quay lò gạch truyền thống, cuốn bánh pía kèm sốt Hoisin gia truyền', 0, 20, 'ConMon', FALSE),
('MON-TH02', 'Há Cảo Tôm Thủy Tinh & Xíu Mại Bào Ngư', 'DM-TH', 165000, 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600', 'Xửng hấp 6 viên dimsum tôm tươi và bào ngư viền trứng cua', 0, 12, 'ConMon', FALSE),
('MON-TH03', 'Đậu Hũ Tứ Xuyên Sốt Tiêu Hồng Mapo', 'DM-TH', 155000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600', 'Đậu hũ non mềm mượt xào thịt băm sốt tiêu Tứ Xuyên tê cay nồng', 3, 12, 'ConMon', FALSE),
('MON-NB01', 'Thuyền Sashimi Cá Hồi & Cá Ngừ Đại Dương', 'DM-NB', 590000, 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600', 'Cá hồi Nauy, cá ngừ vây xanh, sò điệp Hokkaido tươi sống trên đá tuyết', 0, 10, 'ConMon', FALSE),
('MON-NB02', 'Bò Wagyu A5 Áp Chảo Đá Núi Lửa', 'DM-NB', 890000, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600', 'Thăn ngoại Wagyu A5 vân cẩm thạch nướng đá nóng kèm muối hồng', 0, 15, 'ConMon', FALSE),
('MON-HQ01', 'Sườn Bò Hoàng Đế Nướng Sốt Lê Hàn Quốc', 'DM-HQ', 420000, 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600', 'Sườn bò Mỹ ướp nước ép lê Hàn Quốc nướng than hoa kèm kim chi', 1, 15, 'ConMon', FALSE),
('MON-HQ02', 'Lẩu Kim Chi Hải Sản Bạch Tuộc Cay Nồng', 'DM-HQ', 450000, 'https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=600', 'Bạch tuộc sống, tôm sú, thịt ba chỉ bò trong nước lẩu kim chi ủ 6 tháng', 3, 18, 'ConMon', FALSE),
('MON-TL01', 'Lẩu Tomyum Tôm Càng Xanh Nước Cốt Dừa', 'DM-TL', 480000, 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600', 'Tôm càng xanh, nấm rơm, lá chanh Kaffir, sả và ớt hiểm Thái Lan', 2, 16, 'ConMon', FALSE),
('MON-TL02', 'Gỏi Đu Đủ Somtum Tôm Khô Ba Khía', 'DM-TL', 125000, 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600', 'Đu đủ xanh giã cối đất chua cay giòn rụm chuẩn vị Bangkok', 2, 8, 'HetMon', FALSE),
('CB-DOAN01', 'Combo Đại Tiệc Ngũ Quốc Á Châu (Bàn 10 Khách)', 'DM-COMBO', 3250000, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600', 'Gồm Gỏi cuốn tôm hùm, Dimsum bào ngư, Vịt quay Bắc Kinh, Thuyền Sashimi & Lẩu Tomyum', 1, 25, 'ConMon', TRUE);

-- 7. Chi tiết gói Combo tiệc đoàn
INSERT IGNORE INTO tbl_chi_tiet_combo (ma_chi_tiet_combo, ma_combo, ma_mon_thanh_phan, so_luong_mon, ghi_chu_combo) VALUES
('CTC-01', 'CB-DOAN01', 'MON-VN02', 2, 'Khai vị 2 đĩa lớn cho bàn 10 khách'),
('CTC-02', 'CB-DOAN01', 'MON-TH02', 2, '2 xửng Dimsum nóng'),
('CTC-03', 'CB-DOAN01', 'MON-TH01', 1, '1 con Vịt quay Bắc Kinh nguyên con'),
('CTC-04', 'CB-DOAN01', 'MON-NB01', 1, '1 thuyền Sashimi tổng hợp'),
('CTC-05', 'CB-DOAN01', 'MON-TL01', 1, '1 nồi Lẩu Tomyum tôm càng lớn');

-- 8. Danh mục kho nguyên vật liệu
INSERT IGNORE INTO tbl_nguyen_lieu (ma_nguyen_lieu, ten_nguyen_lieu, don_vi_tinh, so_luong_ton_kho, nguong_ton_toi_thieu, don_gia_nhap_bq, han_su_dung) VALUES
('NL-01', 'Thăn Bò Wagyu A5 Nhật Bản', 'Kg', 14.500, 5.000, 1850000, '2026-12-15'),
('NL-02', 'Cá Hồi Nauy Phi Lê Tươi', 'Kg', 18.200, 6.000, 480000, '2026-11-30'),
('NL-03', 'Vịt Tơ Tuyển Chọn Quay Bắc Kinh', 'Con', 22.000, 8.000, 260000, '2026-12-05'),
('NL-04', 'Tôm Càng Xanh & Tôm Hùm Tươi', 'Kg', 4.200, 5.000, 620000, '2026-11-28'),
('NL-05', 'Sườn Bò Mỹ Có Xương (Galbi)', 'Kg', 25.000, 8.000, 390000, '2026-12-20'),
('NL-06', 'Gia Vị Sốt Tomyum & Lá Chanh Thái', 'Gói', 3.000, 5.000, 85000, '2027-03-01');

-- 9. Định mức tiêu hao nguyên vật liệu (BOM)
INSERT IGNORE INTO tbl_dinh_muc_mon (ma_dinh_muc, ma_mon_an, ma_nguyen_lieu, dinh_luong_tieu_hao, don_vi_dinh_muc, ty_le_hao_hut) VALUES
('BOM-01', 'MON-VN01', 'NL-01', 0.180, 'Kg', 2.00),
('BOM-02', 'MON-VN02', 'NL-04', 0.250, 'Kg', 5.00),
('BOM-03', 'MON-TH01', 'NL-03', 1.000, 'Con', 0.00),
('BOM-04', 'MON-NB01', 'NL-02', 0.450, 'Kg', 4.00),
('BOM-05', 'MON-NB02', 'NL-01', 0.300, 'Kg', 2.00),
('BOM-06', 'MON-HQ01', 'NL-05', 0.400, 'Kg', 3.00),
('BOM-07', 'MON-TL01', 'NL-04', 0.350, 'Kg', 4.00),
('BOM-08', 'MON-TL01', 'NL-06', 0.500, 'Gói', 0.00);

-- 10. Hồ sơ nhân sự
INSERT IGNORE INTO tbl_nhan_vien (ma_nhan_vien, ho_ten, so_dien_thoai, cccd, ngay_sinh, chuc_vu, luong_co_ban_ca, trang_thai_lam_viec) VALUES
('NV-OWNER', 'Nguyễn Tấn Quyn (Chủ Nhà Hàng)', '0901000001', '048099000001', '1992-05-12', 'ChuNhaHang', 500000, 'DangLamViec'),
('NV-MGR01', 'Nguyễn Ngọc Thắng (Quản Lý Sảnh)', '0901000002', '048099000002', '1995-08-20', 'QuanLy', 320000, 'DangLamViec'),
('NV-PV01', 'Lê Hoàng Thiện (Phục Vụ Sảnh T1)', '0901000003', '048099000003', '2002-03-15', 'PhucVu', 210000, 'DangLamViec'),
('NV-PV02', 'Phạm Mai Linh (Phục Vụ Phòng VIP)', '0901000004', '048099000004', '2003-11-08', 'PhucVu', 230000, 'DangLamViec'),
('NV-BEP01', 'Nguyễn Trọng Anh Hào (Bếp Trưởng KDS)', '0901000005', '048099000005', '1990-01-25', 'Bep', 380000, 'DangLamViec'),
('NV-TN01', 'Giản Trần Phước Anh (Thu Ngân POS)', '0901000006', '048099000006', '2001-07-19', 'ThuNgan', 240000, 'DangLamViec'),
('NV-HR01', 'Đỗ Thu Trang (Trưởng Phòng HR)', '0901000007', '048099000007', '1996-09-30', 'HR', 290000, 'DangLamViec');

-- 11. Vai trò RBAC
INSERT IGNORE INTO tbl_vai_tro (ma_vai_tro, ten_vai_tro, mo_ta_quyen_han, pham_vi_truy_cap) VALUES
('ROLE-OWNER', 'Owner', 'Chủ nhà hàng: Toàn quyền hệ thống, độc quyền xem Sổ quỹ Dòng tiền, Doanh thu, Lãi/Lỗ & Nhập kho', 'MOD-01..MOD-10 (Full Financial & Warehouse Access)'),
('ROLE-MANAGER', 'Manager', 'Quản lý sảnh: Điều hành bàn, menu, phân ca & duyệt nghỉ phép. BỊ ẨN HOÀN TOÀN DOANH THU & SỔ QUỸ', 'MOD-01,MOD-02,MOD-03,MOD-07 (Blocked: MOD-08 Cashflow/Revenue/Inventory)'),
('ROLE-WAITSTAFF', 'Waitstaff', 'Nhân viên phục vụ: Mở bàn, gọi món, hủy món chưa nấu, nhận chuông Ting, chốt Bill & bấm DELETE bàn', 'MOD-01,MOD-02,MOD-04'),
('ROLE-KITCHEN', 'Kitchen', 'Nhân viên bếp KDS: Nhận order realtime, ưu tiên VIP, bấm Hoàn thành nạp Bill & báo Còn/Hết món', 'MOD-03,MOD-05'),
('ROLE-CASHIER', 'Cashier', 'Nhân viên thu ngân: Mở Bill chế độ CHỈ ĐỌC (Read-only, khóa sửa/xóa món), trừ cọc, thu tiền & xuất VAT', 'MOD-06 (Read-Only Invoice Guard)'),
('ROLE-HR', 'HR', 'Nhân sự: Quản lý hồ sơ, lập lịch phân ca Ca nào - Giờ nào, duyệt nghỉ phép 3 trạng thái & tính lương', 'MOD-07');

-- 12. Tài khoản đăng nhập
INSERT IGNORE INTO tbl_tai_khoan (ma_tai_khoan, ten_dang_nhap, mat_khau_hash, ma_nhan_vien, ma_vai_tro, trang_thai_khoa) VALUES
('TK-01', 'owner.quyn', '$2b$12$acrmsOwnerHash2026', 'NV-OWNER', 'ROLE-OWNER', FALSE),
('TK-02', 'manager.thang', '$2b$12$acrmsManagerHash2026', 'NV-MGR01', 'ROLE-MANAGER', FALSE),
('TK-03', 'waiter.thien', '$2b$12$acrmsWaiterHash2026', 'NV-PV01', 'ROLE-WAITSTAFF', FALSE),
('TK-04', 'waiter.linh', '$2b$12$acrmsWaiter2Hash2026', 'NV-PV02', 'ROLE-WAITSTAFF', FALSE),
('TK-05', 'chef.hao', '$2b$12$acrmsChefHash2026', 'NV-BEP01', 'ROLE-KITCHEN', FALSE),
('TK-06', 'cashier.anh', '$2b$12$acrmsCashierHash2026', 'NV-TN01', 'ROLE-CASHIER', FALSE),
('TK-07', 'hr.trang', '$2b$12$acrmsHrHash2026', 'NV-HR01', 'ROLE-HR', FALSE);

-- 13. Danh mục khung giờ ca làm việc
INSERT IGNORE INTO tbl_ca_lam_viec (ma_ca, ten_ca, gio_bat_dau, gio_ket_thuc, he_so_luong_ca, mo_ta) VALUES
('CA-SANG', 'Ca Sáng (06:00 – 14:00)', '06:00:00', '14:00:00', 1.00, 'Chuẩn bị nguyên liệu sáng, đón khách điểm tâm Dimsum & bữa trưa'),
('CA-CHIEU', 'Ca Chiều (14:00 – 22:00)', '14:00:00', '22:00:00', 1.10, 'Phục vụ khung giờ chiều và cao điểm tiệc tối'),
('CA-TOI', 'Ca Tối Cao Điểm (17:00 – 22:30)', '17:00:00', '22:30:00', 1.25, 'Ca tăng cường phục vụ phòng VIP và sảnh tiệc đoàn buổi tối');

-- 14. Lịch phân công ca làm việc chi tiết (Ca nào – Giờ nào – Khu vực nào)
INSERT IGNORE INTO tbl_phan_cong_ca (ma_phan_cong, ma_nhan_vien, ma_ca, ngay_lam_viec, ma_khu_vuc_truc, gio_check_in, gio_check_out, trang_thai_ca) VALUES
('PC-01', 'NV-MGR01', 'CA-SANG', '2026-11-24', 'KV-T1', '2026-11-24 05:55:00', '2026-11-24 14:05:00', 'HoanThanh'),
('PC-02', 'NV-PV01', 'CA-CHIEU', '2026-11-24', 'KV-T1', '2026-11-24 13:52:00', NULL, 'DangTruc'),
('PC-03', 'NV-PV02', 'CA-TOI', '2026-11-24', 'KV-VIP', '2026-11-24 16:50:00', NULL, 'DangTruc'),
('PC-04', 'NV-BEP01', 'CA-CHIEU', '2026-11-24', 'KV-T1', '2026-11-24 13:50:00', NULL, 'DangTruc'),
('PC-05', 'NV-TN01', 'CA-CHIEU', '2026-11-24', 'KV-T1', '2026-11-24 13:55:00', NULL, 'DangTruc'),
('PC-06', 'NV-PV01', 'CA-SANG', '2026-11-25', 'KV-DOAN', NULL, NULL, 'ChuaTruc');

-- 15. Đơn nghỉ phép theo 3 trạng thái (ĐÃ NGHỈ - ĐANG NGHỈ - SẮP NGHỈ)
INSERT IGNORE INTO tbl_don_nghi_phep (ma_don_nghi, ma_nhan_vien, ngay_nghi, ma_ca_nghi, ly_do, ma_nv_thay_ca, trang_thai_duyet, trang_thai_nghi) VALUES
('NP-01', 'NV-PV01', '2026-11-20', 'CA-SANG', 'Khám sức khỏe định kỳ (Đã hoàn tất, dùng đối chiếu trừ ngày công)', 'NV-PV02', 'DaDuyet', 'DaNghi'),
('NP-02', 'NV-PV02', '2026-11-24', 'CA-SANG', 'Nghỉ việc gia đình buổi sáng hôm nay (Đã có Lê Hoàng Thiện trực thay)', 'NV-PV01', 'DaDuyet', 'DangNghi'),
('NP-03', 'NV-TN01', '2026-11-27', 'CA-TOI', 'Xin nghỉ phép dự lễ tốt nghiệp tuần tới', 'NV-MGR01', 'ChoDuyet', 'SapNghi');

-- 16. Bảng lương tháng
INSERT IGNORE INTO tbl_bang_luong (ma_bang_luong, ma_nhan_vien, thang_nam, tong_so_ca, so_ca_sang, so_ca_chieu, so_ca_toi, so_ngay_da_nghi, tien_phu_cap, tong_luong_thuc_linh, ngay_chi_tra) VALUES
('BL-202611-PV01', 'NV-PV01', '2026-11', 26, 10, 12, 4, 1, 650000, 6414000, '2026-11-23 17:00:00'),
('BL-202611-BEP01', 'NV-BEP01', '2026-11', 28, 8, 14, 6, 0, 1200000, 12866000, '2026-11-23 17:00:00'),
('BL-202611-TN01', 'NV-TN01', '2026-11', 25, 12, 10, 3, 1, 500000, 6788000, NULL);

-- 17. Phiếu đặt bàn trước & Tiền đặt cọc
INSERT IGNORE INTO tbl_phieu_dat_ban (ma_phieu_dat, ma_khach_hang, ma_ban, thoi_gian_dat, thoi_gian_den, so_nguoi, tien_dat_coc, ghi_chu_tiec, trang_thai_dat) VALUES
('PDB-01', 'KH-DOAN01', 'D-301', '2026-11-23 10:00:00', '2026-11-24 18:00:00', 20, 1500000, 'Đoàn Công ty Á Châu 20 khách, ghép bàn D-301 & D-302, đặt cọc trước 1.500.000đ, xuất hóa đơn đỏ VAT', 'DaDen'),
('PDB-02', 'KH-TH01', 'B-201', '2026-11-24 09:30:00', '2026-11-24 19:30:00', 6, 0, 'Gia đình kỷ niệm ngày cưới, cần ghế trẻ em', 'DaNhan'),
('PDB-03', 'KH-VIP02', 'VIP-03', '2026-11-24 11:00:00', '2026-11-24 20:00:00', 8, 500000, 'Khách VIP hạng Gold tiếp đối tác Nhật Bản', 'DaNhan');

-- 18. Phiên phục vụ tại bàn (DonGoiMon)
INSERT IGNORE INTO tbl_don_goi_mon (ma_order, ma_ban, ma_phieu_dat, ma_khach_hang, ma_nhan_vien_phuc_vu, loai_khach_phien, vip_flag, thoi_gian_mo_ban, trang_thai_order) VALUES
('ORD-101', 'B-101', NULL, 'KH-VL01', 'NV-PV01', 'VangLai', FALSE, '2026-11-24 17:20:00', 'DangPhucVu'),
('ORD-VIP01', 'VIP-01', NULL, 'KH-VIP01', 'NV-PV02', 'VIP', TRUE, '2026-11-24 17:35:00', 'DangPhucVu'),
('ORD-DOAN301', 'D-301', 'PDB-01', 'KH-DOAN01', 'NV-PV01', 'Doan', FALSE, '2026-11-24 18:00:00', 'DangPhucVu'),
('ORD-103', 'B-103', NULL, 'KH-TH01', 'NV-PV01', 'Thuong', FALSE, '2026-11-24 16:45:00', 'ChoThanhToan');

-- 19. Chi tiết món gọi trong Order
INSERT IGNORE INTO tbl_chi_tiet_don_goi (ma_chi_tiet_order, ma_order, ma_mon_an, so_luong, don_gia_thoi_diem, muc_do_cay_yc, ghi_chu_mon, lan_goi, nguon_goi, thoi_gian_goi, trang_thai_mon) VALUES
('CT-101-1', 'ORD-101', 'MON-VN01', 2, 145000, 1, 'Ít hành lá, nước dùng nóng già', 1, 'Waitstaff', '2026-11-24 17:22:00', 'DaPhucVu'),
('CT-101-2', 'ORD-101', 'MON-TH02', 1, 165000, 0, 'Kèm xì dầu ớt tươi', 1, 'MobileQR', '2026-11-24 17:25:00', 'DangCheBien'),
('CT-101-3', 'ORD-101', 'MON-TH03', 1, 155000, 3, 'Chuẩn vị cay nồng Tứ Xuyên', 2, 'MobileQR', '2026-11-24 17:40:00', 'ChoCheBien'),
('CT-VIP01-1', 'ORD-VIP01', 'MON-NB02', 2, 890000, 0, 'ƯU TIÊN VIP: Độ chín Medium Rare', 1, 'Waitstaff', '2026-11-24 17:36:00', 'ChoCheBien'),
('CT-VIP01-2', 'ORD-VIP01', 'MON-NB01', 1, 590000, 0, 'Thêm wasabi tươi', 1, 'Waitstaff', '2026-11-24 17:36:00', 'HoanThanh'),
('CT-DOAN-1', 'ORD-DOAN301', 'CB-DOAN01', 2, 3250000, 1, '2 set Combo Đại Tiệc cho 20 khách bàn ghép D-301 + D-302', 1, 'Waitstaff', '2026-11-24 18:02:00', 'HoanThanh'),
('CT-103-1', 'ORD-103', 'MON-HQ01', 2, 420000, 1, 'Nướng chín kỹ tại bếp', 1, 'Waitstaff', '2026-11-24 16:50:00', 'DaPhucVu'),
('CT-103-2', 'ORD-103', 'MON-TL01', 1, 480000, 2, 'Cay vừa, nhiều nấm', 1, 'Waitstaff', '2026-11-24 16:50:00', 'DaPhucVu');

-- 20. Nhật ký điều phối chế biến KDS (LogBep)
INSERT IGNORE INTO tbl_nhat_ky_bep (ma_log_bep, ma_chi_tiet_order, ma_dau_bep, thoi_gian_tiep_nhan, thoi_gian_bat_dau, thoi_gian_hoan_thanh, trang_thai_che_bien) VALUES
('LOG-01', 'CT-101-1', 'NV-BEP01', '2026-11-24 17:22:00', '2026-11-24 17:23:00', '2026-11-24 17:31:00', 'HoanThanh'),
('LOG-02', 'CT-101-2', 'NV-BEP01', '2026-11-24 17:25:00', '2026-11-24 17:32:00', NULL, 'DangCheBien'),
('LOG-03', 'CT-VIP01-2', 'NV-BEP01', '2026-11-24 17:36:00', '2026-11-24 17:37:00', '2026-11-24 17:44:00', 'HoanThanh'),
('LOG-04', 'CT-DOAN-1', 'NV-BEP01', '2026-11-24 18:02:00', '2026-11-24 18:03:00', '2026-11-24 18:22:00', 'HoanThanh'),
('LOG-05', 'CT-103-1', 'NV-BEP01', '2026-11-24 16:50:00', '2026-11-24 16:51:00', '2026-11-24 17:04:00', 'HoanThanh'),
('LOG-06', 'CT-103-2', 'NV-BEP01', '2026-11-24 16:50:00', '2026-11-24 16:52:00', '2026-11-24 17:08:00', 'HoanThanh');

-- 21. Hóa đơn thanh toán (Bàn 103 đang Chờ thanh toán tại quầy Thu ngân Read-only)
INSERT IGNORE INTO tbl_hoa_don (ma_hoa_don, ma_order, ma_khach_hang, ma_thu_ngan, ngay_lap_hoa_don, tong_tien_mon, tien_giam_gia, tien_coc_tru, tien_thue_vat, tong_tien_phai_tra, xuat_vat, ma_so_thue_vat, ten_cong_ty_vat, trang_thai_tt) VALUES
('HD-20261124-103', 'ORD-103', 'KH-TH01', 'NV-TN01', '2026-11-24 17:38:00', 1320000, 66000, 0, 100320, 1354320, FALSE, NULL, NULL, 'ChoThanhToan');

-- 22. Giao dịch thanh toán
INSERT IGNORE INTO tbl_giao_dich_thanh_toan (ma_giao_dich, ma_hoa_don, phuong_thuc, so_tien_nhan, tien_thoi, ma_tham_chieu_nh, thoi_gian_giao_dich) VALUES
('GD-DEMO-01', 'HD-20261124-103', 'ChuyenKhoanQR', 1354320, 0, 'VIETQR-ACRMS-9981', '2026-11-24 14:15:00');

-- 23. Nhà cung cấp thực phẩm & Công nợ
INSERT IGNORE INTO tbl_nha_cung_cap (ma_nha_cung_cap, ten_nha_cung_cap, nguoi_lien_he, so_dien_thoai, dia_chi, so_tai_khoan, cong_no_hien_tai) VALUES
('NCC-01', 'Công ty TNHH Thực Phẩm Nhập Khẩu Kobe & Hải Sản Biển Đông', 'Ông Trần Quốc Tuấn', '0903111222', 'KCN Dịch Vụ Thủy Sản Thọ Quang, Sơn Trà, Đà Nẵng', 'Vietcombank - 0041000888999', 8500000),
('NCC-02', 'Nhà Phân Phối Gia Vị & Nông Sản Truyền Thống Á Đông', 'Bà Lý Mỹ Linh', '0913444555', 'Số 142 Hùng Vương, Hải Châu, Đà Nẵng', 'Techcombank - 1903555666777', 2400000);

-- 24. Phiếu nhập kho nguyên vật liệu
INSERT IGNORE INTO tbl_phieu_nhap_hang (ma_phieu_nhap, ma_nha_cung_cap, ma_nguoi_nhan, ngay_nhap, tong_tien_hang, tien_da_thanh_toan, tien_no_lai, nguoi_giao_hang) VALUES
('PN-202611-01', 'NCC-01', 'NV-OWNER', '2026-11-22 08:30:00', 28500000, 20000000, 8500000, 'Nguyễn Văn Hải'),
('PN-202611-02', 'NCC-02', 'NV-OWNER', '2026-11-23 09:15:00', 8120000, 5720000, 2400000, 'Trần Đình Phong');

-- 25. Chi tiết phiếu nhập kho
INSERT IGNORE INTO tbl_chi_tiet_phieu_nhap (ma_chi_tiet_nhap, ma_phieu_nhap, ma_nguyen_lieu, so_luong_nhap, don_gia_nhap, thanh_tien, han_su_dung_lo) VALUES
('CTPN-01', 'PN-202611-01', 'NL-01', 10.000, 1850000, 18500000, '2026-12-15'),
('CTPN-02', 'PN-202611-01', 'NL-02', 20.833, 480000, 10000000, '2026-11-30'),
('CTPN-03', 'PN-202611-02', 'NL-03', 22.000, 260000, 5720000, '2026-12-05'),
('CTPN-04', 'PN-202611-02', 'NL-06', 28.235, 85000, 2400000, '2027-03-01');

-- 26. Sổ quỹ dòng tiền Thu - Chi dành riêng cho Chủ nhà hàng
INSERT IGNORE INTO tbl_so_quy_dong_tien (ma_giao_dich_quy, ngay_ghi_so, loai_thu_chi, so_tien, hinh_thuc_quy, ma_chung_tu_goc, so_du_quy_sau_gd, dien_giai) VALUES
('SQ-01', '2026-11-21 21:00:00', 'ThuHoaDon', 68500000, 'TaiKhoanNganHang', 'HD-20261121-TONG', 168500000, 'Kết sổ doanh thu hóa đơn tiệc cuối tuần qua VietQR & POS'),
('SQ-02', '2026-11-22 08:35:00', 'ChiNhapHang', 20000000, 'TaiKhoanNganHang', 'PN-202611-01', 148500000, 'Thanh toán đợt 1 nhập bò Wagyu A5 & cá hồi Nauy (NCC Biển Đông)'),
('SQ-03', '2026-11-23 09:20:00', 'ChiNhapHang', 5720000, 'TienMat', 'PN-202611-02', 142780000, 'Thanh toán tiền mặt nhập vịt quay Bắc Kinh & gia vị Thái'),
('SQ-04', '2026-11-23 10:05:00', 'ThuTienCoc', 1500000, 'TaiKhoanNganHang', 'PDB-01', 144280000, 'Thu tiền đặt cọc tiệc đoàn 20 khách Công ty CP Á Châu'),
('SQ-05', '2026-11-23 17:05:00', 'ChiLuong', 19280000, 'TaiKhoanNganHang', 'BL-202611-DOT1', 125000000, 'Chi trả lương ca kíp đợt 1 cho bộ phận Bếp & Phục vụ'),
('SQ-06', '2026-11-24 11:05:00', 'ThuTienCoc', 500000, 'TaiKhoanNganHang', 'PDB-03', 125500000, 'Thu tiền cọc đặt phòng VIP-03 của Bà Phạm Ngọc Tuyết');

-- 27. Yêu cầu tương tác từ Cổng Mobile QR tại bàn
INSERT IGNORE INTO tbl_yeu_cau_khach_hang (ma_yeu_cau, ma_ban, loai_yeu_cau, ghi_chu_yeu_cau, thoi_gian_gui, trang_thai_xu_ly) VALUES
('YC-01', 'B-101', 'GoiKhanLanh', 'Cho thêm 2 khăn lạnh và 1 chén ớt tươi', '2026-11-24 17:28:00', 'ChoXuLy'),
('YC-02', 'VIP-01', 'GoiNuocLoc', 'Châm thêm trà Ô Long ấm cho Chủ tịch', '2026-11-24 17:41:00', 'DangXuLy'),
('YC-03', 'B-103', 'YeuCauKiemBill', 'Khách bàn 103 bấm gọi Phục vụ kiểm tra Bill tại bàn', '2026-11-24 17:35:00', 'DaHoanTat');

SET FOREIGN_KEY_CHECKS = 1;
