-- =====================================================================
-- HỆ THỐNG QUẢN LÝ & ĐIỀU HÀNH CHUỖI NHÀ HÀNG ẨM THỰC CHÂU Á (AC-RMS)
-- THIẾT KẾ CSDL CHUẨN 3NF: ĐẦY ĐỦ 27 BẢNG DỮ LIỆU (MySQL 8.0+)
-- Tương thích: Aiven Free MySQL, TiDB Cloud Serverless, MySQL Local
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Bảng tbl_khu_vuc (MOD-01: Khu vực / Tầng trong nhà hàng)
CREATE TABLE IF NOT EXISTS tbl_khu_vuc (
    ma_khu_vuc VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_khu_vuc VARCHAR(100) NOT NULL UNIQUE,
    suc_chua_toi_da INT NOT NULL DEFAULT 50 CHECK (suc_chua_toi_da > 0),
    mo_ta VARCHAR(255) DEFAULT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HoatDong' CHECK (trang_thai IN ('HoatDong', 'BaoTri'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng tbl_ban (MOD-01: Bàn ăn vật lý & Mã QR định danh)
CREATE TABLE IF NOT EXISTS tbl_ban (
    ma_ban VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_ban VARCHAR(50) NOT NULL,
    ma_khu_vuc VARCHAR(20) NOT NULL,
    loai_ban VARCHAR(30) NOT NULL DEFAULT 'Thuong' CHECK (loai_ban IN ('Thuong', 'VIP', 'BanDai')),
    so_ghe INT NOT NULL DEFAULT 4 CHECK (so_ghe >= 2),
    ma_qr_code VARCHAR(100) NOT NULL UNIQUE,
    ma_ban_chinh VARCHAR(20) DEFAULT NULL,
    trang_thai_ban VARCHAR(30) NOT NULL DEFAULT 'Trong' CHECK (trang_thai_ban IN ('Trong', 'DaDat', 'DangPhucVu', 'ChoThanhToan')),
    CONSTRAINT fk_ban_khuvuc FOREIGN KEY (ma_khu_vuc) REFERENCES tbl_khu_vuc(ma_khu_vuc) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_ban_banchinh FOREIGN KEY (ma_ban_chinh) REFERENCES tbl_ban(ma_ban) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng tbl_khach_hang (MOD-02: Hồ sơ 4 nhóm khách hàng)
CREATE TABLE IF NOT EXISTS tbl_khach_hang (
    ma_khach_hang VARCHAR(20) NOT NULL PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL DEFAULT 'Khách vãng lai',
    so_dien_thoai VARCHAR(15) DEFAULT NULL UNIQUE,
    email VARCHAR(100) DEFAULT NULL,
    loai_khach VARCHAR(20) NOT NULL DEFAULT 'VangLai' CHECK (loai_khach IN ('VangLai', 'Thuong', 'VIP', 'Doan')),
    hang_the VARCHAR(20) DEFAULT 'Standard' CHECK (hang_the IN ('Standard', 'Silver', 'Gold', 'Diamond')),
    diem_tich_luy INT NOT NULL DEFAULT 0 CHECK (diem_tich_luy >= 0),
    ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng tbl_khach_doan (MOD-02: Pháp nhân Khách đoàn & Xuất hóa đơn đỏ VAT)
CREATE TABLE IF NOT EXISTS tbl_khach_doan (
    ma_khach_hang VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_cong_ty VARCHAR(200) DEFAULT NULL,
    nguoi_dai_dien VARCHAR(100) NOT NULL,
    ma_so_thue VARCHAR(20) DEFAULT NULL,
    dia_chi_cong_ty VARCHAR(255) DEFAULT NULL,
    email_nhan_hoa_don VARCHAR(100) DEFAULT NULL,
    ghi_chu_hop_dong TEXT DEFAULT NULL,
    CONSTRAINT fk_khachdoan_khachhang FOREIGN KEY (ma_khach_hang) REFERENCES tbl_khach_hang(ma_khach_hang) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng tbl_danh_muc_mon (MOD-03: Danh mục thực đơn & 5 Trường phái ẩm thực Châu Á)
CREATE TABLE IF NOT EXISTS tbl_danh_muc_mon (
    ma_danh_muc VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL UNIQUE,
    truong_phai_am_thuc VARCHAR(30) NOT NULL DEFAULT 'VietNam' CHECK (truong_phai_am_thuc IN ('VietNam', 'TrungHoa', 'NhatBan', 'HanQuoc', 'ThaiLan')),
    thu_tu_hien_thi INT NOT NULL DEFAULT 1 CHECK (thu_tu_hien_thi > 0),
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'HoatDong' CHECK (trang_thai IN ('HoatDong', 'TamNgung'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Bảng tbl_mon_an (MOD-03: Món ăn Châu Á, Độ cay 0-3 & Gói Combo)
CREATE TABLE IF NOT EXISTS tbl_mon_an (
    ma_mon_an VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_mon_an VARCHAR(150) NOT NULL,
    ma_danh_muc VARCHAR(20) NOT NULL,
    don_gia DECIMAL(18,2) NOT NULL CHECK (don_gia > 0),
    hinh_anh_url VARCHAR(255) DEFAULT NULL,
    mo_ta VARCHAR(255) DEFAULT NULL,
    muc_do_cay INT NOT NULL DEFAULT 0 CHECK (muc_do_cay BETWEEN 0 AND 3),
    thoi_gian_nau_tb INT NOT NULL DEFAULT 15 CHECK (thoi_gian_nau_tb > 0),
    trang_thai_mon VARCHAR(20) NOT NULL DEFAULT 'ConMon' CHECK (trang_thai_mon IN ('ConMon', 'HetMon', 'TamNgung')),
    is_combo BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_monan_danhmuc FOREIGN KEY (ma_danh_muc) REFERENCES tbl_danh_muc_mon(ma_danh_muc) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Bảng tbl_chi_tiet_combo (MOD-03: Chi tiết món thành phần trong gói Combo tiệc đoàn)
CREATE TABLE IF NOT EXISTS tbl_chi_tiet_combo (
    ma_chi_tiet_combo VARCHAR(25) NOT NULL PRIMARY KEY,
    ma_combo VARCHAR(20) NOT NULL,
    ma_mon_thanh_phan VARCHAR(20) NOT NULL,
    so_luong_mon INT NOT NULL DEFAULT 1 CHECK (so_luong_mon > 0),
    ghi_chu_combo VARCHAR(255) DEFAULT NULL,
    CONSTRAINT fk_combo_main FOREIGN KEY (ma_combo) REFERENCES tbl_mon_an(ma_mon_an) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_combo_item FOREIGN KEY (ma_mon_thanh_phan) REFERENCES tbl_mon_an(ma_mon_an) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Bảng tbl_nguyen_lieu (MOD-08: Danh mục kho nguyên vật liệu đầu vào)
CREATE TABLE IF NOT EXISTS tbl_nguyen_lieu (
    ma_nguyen_lieu VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_nguyen_lieu VARCHAR(150) NOT NULL UNIQUE,
    don_vi_tinh VARCHAR(20) NOT NULL DEFAULT 'Kg',
    so_luong_ton_kho DECIMAL(12,3) NOT NULL DEFAULT 0.000 CHECK (so_luong_ton_kho >= 0),
    nguong_ton_toi_thieu DECIMAL(12,3) NOT NULL DEFAULT 5.000 CHECK (nguong_ton_toi_thieu >= 0),
    don_gia_nhap_bq DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (don_gia_nhap_bq >= 0),
    han_su_dung DATE DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Bảng tbl_dinh_muc_mon (MOD-03 & MOD-08: Định mức tiêu hao nguyên vật liệu - BOM)
CREATE TABLE IF NOT EXISTS tbl_dinh_muc_mon (
    ma_dinh_muc VARCHAR(25) NOT NULL PRIMARY KEY,
    ma_mon_an VARCHAR(20) NOT NULL,
    ma_nguyen_lieu VARCHAR(20) NOT NULL,
    dinh_luong_tieu_hao DECIMAL(10,3) NOT NULL CHECK (dinh_luong_tieu_hao > 0),
    don_vi_dinh_muc VARCHAR(20) NOT NULL DEFAULT 'Kg',
    ty_le_hao_hut DECIMAL(5,2) NOT NULL DEFAULT 0.00 CHECK (ty_le_hao_hut >= 0),
    CONSTRAINT fk_bom_monan FOREIGN KEY (ma_mon_an) REFERENCES tbl_mon_an(ma_mon_an) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_bom_nguyenlieu FOREIGN KEY (ma_nguyen_lieu) REFERENCES tbl_nguyen_lieu(ma_nguyen_lieu) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Bảng tbl_nhan_vien (MOD-07: Hồ sơ nhân sự các bộ phận)
CREATE TABLE IF NOT EXISTS tbl_nhan_vien (
    ma_nhan_vien VARCHAR(20) NOT NULL PRIMARY KEY,
    ho_ten VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL UNIQUE,
    cccd VARCHAR(20) NOT NULL UNIQUE,
    ngay_sinh DATE NOT NULL,
    chuc_vu VARCHAR(30) NOT NULL DEFAULT 'PhucVu' CHECK (chuc_vu IN ('PhucVu', 'Bep', 'ThuNgan', 'HR', 'QuanLy', 'ChuNhaHang')),
    luong_co_ban_ca DECIMAL(18,2) NOT NULL DEFAULT 200000.00 CHECK (luong_co_ban_ca > 0),
    trang_thai_lam_viec VARCHAR(25) NOT NULL DEFAULT 'DangLamViec' CHECK (trang_thai_lam_viec IN ('DangLamViec', 'TamNghi', 'DaNghiViec'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Bảng tbl_vai_tro (MOD-10: Danh mục vai trò & Phân quyền bảo mật RBAC)
CREATE TABLE IF NOT EXISTS tbl_vai_tro (
    ma_vai_tro VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_vai_tro VARCHAR(50) NOT NULL UNIQUE,
    mo_ta_quyen_han VARCHAR(255) NOT NULL,
    pham_vi_truy_cap TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Bảng tbl_tai_khoan (MOD-10: Tài khoản đăng nhập nội bộ)
CREATE TABLE IF NOT EXISTS tbl_tai_khoan (
    ma_tai_khoan VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau_hash VARCHAR(255) NOT NULL,
    ma_nhan_vien VARCHAR(20) NOT NULL UNIQUE,
    ma_vai_tro VARCHAR(20) NOT NULL,
    ngay_kich_hoat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trang_thai_khoa BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_tk_nhanvien FOREIGN KEY (ma_nhan_vien) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tk_vaitro FOREIGN KEY (ma_vai_tro) REFERENCES tbl_vai_tro(ma_vai_tro) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bảng tbl_ca_lam_viec (MOD-07: Danh mục khung giờ ca Sáng, Chiều, Tối)
CREATE TABLE IF NOT EXISTS tbl_ca_lam_viec (
    ma_ca VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_ca VARCHAR(50) NOT NULL UNIQUE,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    he_so_luong_ca DECIMAL(4,2) NOT NULL DEFAULT 1.00 CHECK (he_so_luong_ca >= 1.0),
    mo_ta VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Bảng tbl_phan_cong_ca (MOD-07: Phân công Ca nào – Giờ nào – Khu vực nào)
CREATE TABLE IF NOT EXISTS tbl_phan_cong_ca (
    ma_phan_cong VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_nhan_vien VARCHAR(20) NOT NULL,
    ma_ca VARCHAR(20) NOT NULL,
    ngay_lam_viec DATE NOT NULL,
    ma_khu_vuc_truc VARCHAR(20) DEFAULT NULL,
    gio_check_in DATETIME DEFAULT NULL,
    gio_check_out DATETIME DEFAULT NULL,
    trang_thai_ca VARCHAR(25) NOT NULL DEFAULT 'ChuaTruc' CHECK (trang_thai_ca IN ('ChuaTruc', 'DangTruc', 'HoanThanh', 'VangCoPhep', 'VangKhongPhep')),
    CONSTRAINT fk_pcc_nhanvien FOREIGN KEY (ma_nhan_vien) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pcc_ca FOREIGN KEY (ma_ca) REFERENCES tbl_ca_lam_viec(ma_ca) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pcc_khuvuc FOREIGN KEY (ma_khu_vuc_truc) REFERENCES tbl_khu_vuc(ma_khu_vuc) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Bảng tbl_don_nghi_phep (MOD-07: Nghỉ phép 3 trạng thái: Đã - Đang - Sắp nghỉ)
CREATE TABLE IF NOT EXISTS tbl_don_nghi_phep (
    ma_don_nghi VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_nhan_vien VARCHAR(20) NOT NULL,
    ngay_nghi DATE NOT NULL,
    ma_ca_nghi VARCHAR(20) NOT NULL,
    ly_do VARCHAR(255) NOT NULL,
    ma_nv_thay_ca VARCHAR(20) DEFAULT NULL,
    trang_thai_duyet VARCHAR(20) NOT NULL DEFAULT 'ChoDuyet' CHECK (trang_thai_duyet IN ('ChoDuyet', 'DaDuyet', 'TuChoi')),
    trang_thai_nghi VARCHAR(20) NOT NULL DEFAULT 'SapNghi' CHECK (trang_thai_nghi IN ('DaNghi', 'DangNghi', 'SapNghi')),
    CONSTRAINT fk_dnp_nhanvien FOREIGN KEY (ma_nhan_vien) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_dnp_ca FOREIGN KEY (ma_ca_nghi) REFERENCES tbl_ca_lam_viec(ma_ca) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dnp_thayca FOREIGN KEY (ma_nv_thay_ca) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Bảng tbl_bang_luong (MOD-07: Bảng tổng hợp lương nhân viên theo ca kíp)
CREATE TABLE IF NOT EXISTS tbl_bang_luong (
    ma_bang_luong VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_nhan_vien VARCHAR(20) NOT NULL,
    thang_nam VARCHAR(7) NOT NULL,
    tong_so_ca INT NOT NULL DEFAULT 0 CHECK (tong_so_ca >= 0),
    so_ca_sang INT NOT NULL DEFAULT 0,
    so_ca_chieu INT NOT NULL DEFAULT 0,
    so_ca_toi INT NOT NULL DEFAULT 0,
    so_ngay_da_nghi INT NOT NULL DEFAULT 0 CHECK (so_ngay_da_nghi >= 0),
    tien_phu_cap DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    tong_luong_thuc_linh DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (tong_luong_thuc_linh >= 0),
    ngay_chi_tra DATETIME DEFAULT NULL,
    CONSTRAINT fk_bl_nhanvien FOREIGN KEY (ma_nhan_vien) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Bảng tbl_phieu_dat_ban (MOD-01 & MOD-02: Phiếu đặt bàn trước & Tiền đặt cọc)
CREATE TABLE IF NOT EXISTS tbl_phieu_dat_ban (
    ma_phieu_dat VARCHAR(20) NOT NULL PRIMARY KEY,
    ma_khach_hang VARCHAR(20) NOT NULL,
    ma_ban VARCHAR(20) NOT NULL,
    thoi_gian_dat DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_den DATETIME NOT NULL,
    so_nguoi INT NOT NULL DEFAULT 2 CHECK (so_nguoi > 0),
    tien_dat_coc DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (tien_dat_coc >= 0),
    ghi_chu_tiec VARCHAR(255) DEFAULT NULL,
    trang_thai_dat VARCHAR(20) NOT NULL DEFAULT 'DaNhan' CHECK (trang_thai_dat IN ('DaNhan', 'DaDen', 'DaHuy')),
    CONSTRAINT fk_pdb_khachhang FOREIGN KEY (ma_khach_hang) REFERENCES tbl_khach_hang(ma_khach_hang) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pdb_ban FOREIGN KEY (ma_ban) REFERENCES tbl_ban(ma_ban) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Bảng tbl_don_goi_mon (MOD-04: Phiên phục vụ tại bàn - Order)
CREATE TABLE IF NOT EXISTS tbl_don_goi_mon (
    ma_order VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_ban VARCHAR(20) NOT NULL,
    ma_phieu_dat VARCHAR(20) DEFAULT NULL,
    ma_khach_hang VARCHAR(20) DEFAULT NULL,
    ma_nhan_vien_phuc_vu VARCHAR(20) NOT NULL,
    loai_khach_phien VARCHAR(20) NOT NULL DEFAULT 'VangLai' CHECK (loai_khach_phien IN ('VangLai', 'Thuong', 'VIP', 'Doan')),
    vip_flag BOOLEAN NOT NULL DEFAULT FALSE,
    thoi_gian_mo_ban DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trang_thai_order VARCHAR(30) NOT NULL DEFAULT 'DangPhucVu' CHECK (trang_thai_order IN ('DangPhucVu', 'ChoThanhToan', 'DaThanhToan', 'DaGiaiPhong')),
    CONSTRAINT fk_dgm_ban FOREIGN KEY (ma_ban) REFERENCES tbl_ban(ma_ban) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_dgm_phieudat FOREIGN KEY (ma_phieu_dat) REFERENCES tbl_phieu_dat_ban(ma_phieu_dat) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dgm_khachhang FOREIGN KEY (ma_khach_hang) REFERENCES tbl_khach_hang(ma_khach_hang) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_dgm_nhanvien FOREIGN KEY (ma_nhan_vien_phuc_vu) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Bảng tbl_chi_tiet_don_goi (MOD-04 & MOD-05: Chi tiết món gọi trong Order)
CREATE TABLE IF NOT EXISTS tbl_chi_tiet_don_goi (
    ma_chi_tiet_order VARCHAR(35) NOT NULL PRIMARY KEY,
    ma_order VARCHAR(30) NOT NULL,
    ma_mon_an VARCHAR(20) NOT NULL,
    so_luong INT NOT NULL DEFAULT 1 CHECK (so_luong > 0),
    don_gia_thoi_diem DECIMAL(18,2) NOT NULL,
    muc_do_cay_yc INT NOT NULL DEFAULT 0 CHECK (muc_do_cay_yc BETWEEN 0 AND 3),
    ghi_chu_mon VARCHAR(255) DEFAULT NULL,
    lan_goi INT NOT NULL DEFAULT 1 CHECK (lan_goi >= 1),
    nguon_goi VARCHAR(20) NOT NULL DEFAULT 'Waitstaff' CHECK (nguon_goi IN ('Waitstaff', 'MobileQR')),
    thoi_gian_goi DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trang_thai_mon VARCHAR(25) NOT NULL DEFAULT 'ChoCheBien' CHECK (trang_thai_mon IN ('ChoCheBien', 'DangCheBien', 'HoanThanh', 'DaPhucVu', 'DaHuy')),
    CONSTRAINT fk_ctdg_order FOREIGN KEY (ma_order) REFERENCES tbl_don_goi_mon(ma_order) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ctdg_monan FOREIGN KEY (ma_mon_an) REFERENCES tbl_mon_an(ma_mon_an) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Bảng tbl_nhat_ky_bep (MOD-05: Nhật ký điều phối chế biến KDS - LogBep)
CREATE TABLE IF NOT EXISTS tbl_nhat_ky_bep (
    ma_log_bep VARCHAR(35) NOT NULL PRIMARY KEY,
    ma_chi_tiet_order VARCHAR(35) NOT NULL,
    ma_dau_bep VARCHAR(20) NOT NULL,
    thoi_gian_tiep_nhan DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_bat_dau DATETIME DEFAULT NULL,
    thoi_gian_hoan_thanh DATETIME DEFAULT NULL,
    trang_thai_che_bien VARCHAR(25) NOT NULL DEFAULT 'ChoCheBien' CHECK (trang_thai_che_bien IN ('ChoCheBien', 'DangCheBien', 'HoanThanh')),
    CONSTRAINT fk_nkb_chitiet FOREIGN KEY (ma_chi_tiet_order) REFERENCES tbl_chi_tiet_don_goi(ma_chi_tiet_order) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_nkb_daubep FOREIGN KEY (ma_dau_bep) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Bảng tbl_hoa_don (MOD-06: Hóa đơn thanh toán - Chế độ Read-only)
CREATE TABLE IF NOT EXISTS tbl_hoa_don (
    ma_hoa_don VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_order VARCHAR(30) NOT NULL UNIQUE,
    ma_khach_hang VARCHAR(20) DEFAULT NULL,
    ma_thu_ngan VARCHAR(20) NOT NULL,
    ngay_lap_hoa_don DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tong_tien_mon DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    tien_giam_gia DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    tien_coc_tru DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    tien_thue_vat DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    tong_tien_phai_tra DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    xuat_vat BOOLEAN NOT NULL DEFAULT FALSE,
    ma_so_thue_vat VARCHAR(20) DEFAULT NULL,
    ten_cong_ty_vat VARCHAR(200) DEFAULT NULL,
    trang_thai_tt VARCHAR(25) NOT NULL DEFAULT 'ChoThanhToan' CHECK (trang_thai_tt IN ('ChoThanhToan', 'DaThanhToan', 'DaHuy')),
    CONSTRAINT fk_hd_order FOREIGN KEY (ma_order) REFERENCES tbl_don_goi_mon(ma_order) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_hd_khachhang FOREIGN KEY (ma_khach_hang) REFERENCES tbl_khach_hang(ma_khach_hang) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_hd_thungan FOREIGN KEY (ma_thu_ngan) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Bảng tbl_giao_dich_thanh_toan (MOD-06: Giao dịch thu tiền tại quầy Thu ngân)
CREATE TABLE IF NOT EXISTS tbl_giao_dich_thanh_toan (
    ma_giao_dich VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_hoa_don VARCHAR(30) NOT NULL,
    phuong_thuc VARCHAR(25) NOT NULL DEFAULT 'TienMat' CHECK (phuong_thuc IN ('TienMat', 'TheNganHang', 'ChuyenKhoanQR')),
    so_tien_nhan DECIMAL(18,2) NOT NULL CHECK (so_tien_nhan > 0),
    tien_thoi DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (tien_thoi >= 0),
    ma_tham_chieu_nh VARCHAR(50) DEFAULT NULL,
    thoi_gian_giao_dich DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gdtt_hoadon FOREIGN KEY (ma_hoa_don) REFERENCES tbl_hoa_don(ma_hoa_don) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Bảng tbl_nha_cung_cap (MOD-08: Danh mục nhà cung cấp thực phẩm & Công nợ)
CREATE TABLE IF NOT EXISTS tbl_nha_cung_cap (
    ma_nha_cung_cap VARCHAR(20) NOT NULL PRIMARY KEY,
    ten_nha_cung_cap VARCHAR(150) NOT NULL,
    nguoi_lien_he VARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15) NOT NULL UNIQUE,
    dia_chi VARCHAR(255) DEFAULT NULL,
    so_tai_khoan VARCHAR(50) DEFAULT NULL,
    cong_no_hien_tai DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (cong_no_hien_tai >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Bảng tbl_phieu_nhap_hang (MOD-08: Phiếu nhập kho nguyên vật liệu - Chủ/Kho)
CREATE TABLE IF NOT EXISTS tbl_phieu_nhap_hang (
    ma_phieu_nhap VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_nha_cung_cap VARCHAR(20) NOT NULL,
    ma_nguoi_nhan VARCHAR(20) NOT NULL,
    ngay_nhap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tong_tien_hang DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (tong_tien_hang > 0),
    tien_da_thanh_toan DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (tien_da_thanh_toan >= 0),
    tien_no_lai DECIMAL(18,2) NOT NULL DEFAULT 0.00 CHECK (tien_no_lai >= 0),
    nguoi_giao_hang VARCHAR(100) DEFAULT NULL,
    CONSTRAINT fk_pnh_ncc FOREIGN KEY (ma_nha_cung_cap) REFERENCES tbl_nha_cung_cap(ma_nha_cung_cap) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pnh_nguoinhan FOREIGN KEY (ma_nguoi_nhan) REFERENCES tbl_nhan_vien(ma_nhan_vien) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Bảng tbl_chi_tiet_phieu_nhap (MOD-08: Chi tiết từng mặt hàng trong phiếu nhập kho)
CREATE TABLE IF NOT EXISTS tbl_chi_tiet_phieu_nhap (
    ma_chi_tiet_nhap VARCHAR(35) NOT NULL PRIMARY KEY,
    ma_phieu_nhap VARCHAR(30) NOT NULL,
    ma_nguyen_lieu VARCHAR(20) NOT NULL,
    so_luong_nhap DECIMAL(12,3) NOT NULL CHECK (so_luong_nhap > 0),
    don_gia_nhap DECIMAL(18,2) NOT NULL CHECK (don_gia_nhap > 0),
    thanh_tien DECIMAL(18,2) NOT NULL,
    han_su_dung_lo DATE NOT NULL,
    CONSTRAINT fk_ctpn_phieunhap FOREIGN KEY (ma_phieu_nhap) REFERENCES tbl_phieu_nhap_hang(ma_phieu_nhap) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_ctpn_nguyenlieu FOREIGN KEY (ma_nguyen_lieu) REFERENCES tbl_nguyen_lieu(ma_nguyen_lieu) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Bảng tbl_so_quy_dong_tien (MOD-08: Sổ quỹ dòng tiền Thu - Chi độc quyền Chủ nhà hàng)
CREATE TABLE IF NOT EXISTS tbl_so_quy_dong_tien (
    ma_giao_dich_quy VARCHAR(35) NOT NULL PRIMARY KEY,
    ngay_ghi_so DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    loai_thu_chi VARCHAR(30) NOT NULL CHECK (loai_thu_chi IN ('ThuTienCoc', 'ThuHoaDon', 'ChiNhapHang', 'ChiLuong', 'ChiVanHanhKhac')),
    so_tien DECIMAL(18,2) NOT NULL CHECK (so_tien > 0),
    hinh_thuc_quy VARCHAR(30) NOT NULL DEFAULT 'TienMat' CHECK (hinh_thuc_quy IN ('TienMat', 'TaiKhoanNganHang')),
    ma_chung_tu_goc VARCHAR(35) DEFAULT NULL,
    so_du_quy_sau_gd DECIMAL(18,2) NOT NULL DEFAULT 0.00,
    dien_giai VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Bảng tbl_yeu_cau_khach_hang (MOD-09: Yêu cầu tương tác từ Cổng Mobile QR tại bàn)
CREATE TABLE IF NOT EXISTS tbl_yeu_cau_khach_hang (
    ma_yeu_cau VARCHAR(30) NOT NULL PRIMARY KEY,
    ma_ban VARCHAR(20) NOT NULL,
    loai_yeu_cau VARCHAR(35) NOT NULL CHECK (loai_yeu_cau IN ('GoiNuocLoc', 'GoiKhanLanh', 'YeuCauKiemBill', 'GapPhucVu')),
    ghi_chu_yeu_cau VARCHAR(255) DEFAULT NULL,
    thoi_gian_gui DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    trang_thai_xu_ly VARCHAR(25) NOT NULL DEFAULT 'ChoXuLy' CHECK (trang_thai_xu_ly IN ('ChoXuLy', 'DangXuLy', 'DaHoanTat')),
    CONSTRAINT fk_yckh_ban FOREIGN KEY (ma_ban) REFERENCES tbl_ban(ma_ban) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chỉ mục tối ưu truy vấn B-Tree theo Mục 4.5 báo cáo
CREATE INDEX idx_ban_khuvuc_trangthai ON tbl_ban (ma_khu_vuc, trang_thai_ban);
CREATE INDEX idx_khachhang_loai ON tbl_khach_hang (loai_khach);
CREATE INDEX idx_monan_trangthai ON tbl_mon_an (trang_thai_mon);
CREATE INDEX idx_order_ban_trangthai ON tbl_don_goi_mon (ma_ban, trang_thai_order);
CREATE INDEX idx_ctdg_order_trangthai ON tbl_chi_tiet_don_goi (ma_order, trang_thai_mon);
CREATE INDEX idx_phancong_ngay ON tbl_phan_cong_ca (ngay_lam_viec);
CREATE INDEX idx_nghiphep_trangthai ON tbl_don_nghi_phep (trang_thai_nghi);
CREATE INDEX idx_soquy_loai ON tbl_so_quy_dong_tien (loai_thu_chi, ngay_ghi_so);

SET FOREIGN_KEY_CHECKS = 1;
