// ============================================================================
// AC-RMS — TỪ ĐIỂN DỮ LIỆU TYPESCRIPT CHUẨN 3NF (ĐẦY ĐỦ 27 BẢNG CSDL)
// Khớp 100% với Mục 4.3 & 4.4 của Báo cáo Phân tích Hệ thống Thông tin
// ============================================================================

export type RoleCode =
  | 'Owner'
  | 'Manager'
  | 'Waitstaff'
  | 'Kitchen'
  | 'Cashier'
  | 'HR'
  | 'GuestQR';

export type CustomerGroupType = 'VangLai' | 'Thuong' | 'VIP' | 'Doan';
export type CardTier = 'Standard' | 'Silver' | 'Gold' | 'Diamond';
export type TableStatus = 'Trong' | 'DaDat' | 'DangPhucVu' | 'ChoThanhToan';
export type TableType = 'Thuong' | 'VIP' | 'BanDai';
export type CuisineSchool = 'VietNam' | 'TrungHoa' | 'NhatBan' | 'HanQuoc' | 'ThaiLan';
export type DishAvailability = 'ConMon' | 'HetMon' | 'TamNgung';
export type OrderItemStatus = 'ChoCheBien' | 'DangCheBien' | 'HoanThanh' | 'DaPhucVu' | 'DaHuy';
export type OrderStatus = 'DangPhucVu' | 'ChoThanhToan' | 'DaThanhToan' | 'DaGiaiPhong';
export type PaymentMethodType = 'TienMat' | 'TheNganHang' | 'ChuyenKhoanQR';
export type LeaveApprovalStatus = 'ChoDuyet' | 'DaDuyet' | 'TuChoi';
export type LeaveThreeState = 'DaNghi' | 'DangNghi' | 'SapNghi';
export type CashflowType =
  | 'ThuTienCoc'
  | 'ThuHoaDon'
  | 'ChiNhapHang'
  | 'ChiLuong'
  | 'ChiVanHanhKhac';
export type GuestRequestType = 'GoiNuocLoc' | 'GoiKhanLanh' | 'YeuCauKiemBill' | 'GapPhucVu';

// 1. tbl_khu_vuc
export interface KhuVuc {
  ma_khu_vuc: string;
  ten_khu_vuc: string;
  suc_chua_toi_da: number;
  mo_ta: string | null;
  trang_thai: 'HoatDong' | 'BaoTri';
}

// 2. tbl_ban
export interface Ban {
  ma_ban: string;
  ten_ban: string;
  ma_khu_vuc: string;
  loai_ban: TableType;
  so_ghe: number;
  ma_qr_code: string;
  ma_ban_chinh: string | null;
  trang_thai_ban: TableStatus;
}

// 3. tbl_khach_hang
export interface KhachHang {
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string | null;
  email: string | null;
  loai_khach: CustomerGroupType;
  hang_the: CardTier;
  diem_tich_luy: number;
  ngay_tao: string;
}

// 4. tbl_khach_doan
export interface KhachDoan {
  ma_khach_hang: string;
  ten_cong_ty: string | null;
  nguoi_dai_dien: string;
  ma_so_thue: string | null;
  dia_chi_cong_ty: string | null;
  email_nhan_hoa_don: string | null;
  ghi_chu_hop_dong: string | null;
}

// 5. tbl_danh_muc_mon
export interface DanhMucMon {
  ma_danh_muc: string;
  ten_danh_muc: string;
  truong_phai_am_thuc: CuisineSchool;
  thu_tu_hien_thi: number;
  trang_thai: 'HoatDong' | 'TamNgung';
}

// 6. tbl_mon_an
export interface MonAn {
  ma_mon_an: string;
  ten_mon_an: string;
  ma_danh_muc: string;
  don_gia: number;
  hinh_anh_url: string | null;
  mo_ta: string | null;
  muc_do_cay: 0 | 1 | 2 | 3;
  thoi_gian_nau_tb: number;
  trang_thai_mon: DishAvailability;
  is_combo: boolean;
}

// 7. tbl_chi_tiet_combo
export interface ChiTietCombo {
  ma_chi_tiet_combo: string;
  ma_combo: string;
  ma_mon_thanh_phan: string;
  so_luong_mon: number;
  ghi_chu_combo: string | null;
}

// 8. tbl_nguyen_lieu
export interface NguyenLieu {
  ma_nguyen_lieu: string;
  ten_nguyen_lieu: string;
  don_vi_tinh: string;
  so_luong_ton_kho: number;
  nguong_ton_toi_thieu: number;
  don_gia_nhap_bq: number;
  han_su_dung: string | null;
}

// 9. tbl_dinh_muc_mon (BOM)
export interface DinhMucMon {
  ma_dinh_muc: string;
  ma_mon_an: string;
  ma_nguyen_lieu: string;
  dinh_luong_tieu_hao: number;
  don_vi_dinh_muc: string;
  ty_le_hao_hut: number;
}

// 10. tbl_nhan_vien
export interface NhanVien {
  ma_nhan_vien: string;
  ho_ten: string;
  so_dien_thoai: string;
  cccd: string;
  ngay_sinh: string;
  chuc_vu: 'PhucVu' | 'Bep' | 'ThuNgan' | 'HR' | 'QuanLy' | 'ChuNhaHang';
  luong_co_ban_ca: number;
  trang_thai_lam_viec: 'DangLamViec' | 'TamNghi' | 'DaNghiViec';
}

// 11. tbl_vai_tro
export interface VaiTro {
  ma_vai_tro: string;
  ten_vai_tro: RoleCode;
  mo_ta_quyen_han: string;
  pham_vi_truy_cap: string;
}

// 12. tbl_tai_khoan
export interface TaiKhoan {
  ma_tai_khoan: string;
  ten_dang_nhap: string;
  mat_khau_hash: string;
  ma_nhan_vien: string;
  ma_vai_tro: string;
  ngay_kich_hoat: string;
  trang_thai_khoa: boolean;
}

// 13. tbl_ca_lam_viec
export interface CaLamViec {
  ma_ca: string;
  ten_ca: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  he_so_luong_ca: number;
  mo_ta: string | null;
}

// 14. tbl_phan_cong_ca
export interface PhanCongCa {
  ma_phan_cong: string;
  ma_nhan_vien: string;
  ma_ca: string;
  ngay_lam_viec: string;
  ma_khu_vuc_truc: string | null;
  gio_check_in: string | null;
  gio_check_out: string | null;
  trang_thai_ca: 'ChuaTruc' | 'DangTruc' | 'HoanThanh' | 'VangCoPhep' | 'VangKhongPhep';
}

// 15. tbl_don_nghi_phep
export interface DonNghiPhep {
  ma_don_nghi: string;
  ma_nhan_vien: string;
  ngay_nghi: string;
  ma_ca_nghi: string;
  ly_do: string;
  ma_nv_thay_ca: string | null;
  trang_thai_duyet: LeaveApprovalStatus;
  trang_thai_nghi: LeaveThreeState;
}

// 16. tbl_bang_luong
export interface BangLuong {
  ma_bang_luong: string;
  ma_nhan_vien: string;
  thang_nam: string;
  tong_so_ca: number;
  so_ca_sang: number;
  so_ca_chieu: number;
  so_ca_toi: number;
  so_ngay_da_nghi: number;
  tien_phu_cap: number;
  tong_luong_thuc_linh: number;
  ngay_chi_tra: string | null;
}

// 17. tbl_phieu_dat_ban
export interface PhieuDatBan {
  ma_phieu_dat: string;
  ma_khach_hang: string;
  ma_ban: string;
  thoi_gian_dat: string;
  thoi_gian_den: string;
  so_nguoi: number;
  tien_dat_coc: number;
  ghi_chu_tiec: string | null;
  trang_thai_dat: 'DaNhan' | 'DaDen' | 'DaHuy';
}

// 18. tbl_don_goi_mon
export interface DonGoiMon {
  ma_order: string;
  ma_ban: string;
  ma_phieu_dat: string | null;
  ma_khach_hang: string | null;
  ma_nhan_vien_phuc_vu: string;
  loai_khach_phien: CustomerGroupType;
  vip_flag: boolean;
  thoi_gian_mo_ban: string;
  trang_thai_order: OrderStatus;
}

// 19. tbl_chi_tiet_don_goi
export interface ChiTietDonGoi {
  ma_chi_tiet_order: string;
  ma_order: string;
  ma_mon_an: string;
  so_luong: number;
  don_gia_thoi_diem: number;
  muc_do_cay_yc: 0 | 1 | 2 | 3;
  ghi_chu_mon: string | null;
  lan_goi: number;
  nguon_goi: 'Waitstaff' | 'MobileQR';
  thoi_gian_goi: string;
  trang_thai_mon: OrderItemStatus;
}

// 20. tbl_nhat_ky_bep
export interface NhatKyBep {
  ma_log_bep: string;
  ma_chi_tiet_order: string;
  ma_dau_bep: string;
  thoi_gian_tiep_nhan: string;
  thoi_gian_bat_dau: string | null;
  thoi_gian_hoan_thanh: string | null;
  trang_thai_che_bien: 'ChoCheBien' | 'DangCheBien' | 'HoanThanh';
}

// 21. tbl_hoa_don
export interface HoaDon {
  ma_hoa_don: string;
  ma_order: string;
  ma_khach_hang: string | null;
  ma_thu_ngan: string;
  ngay_lap_hoa_don: string;
  tong_tien_mon: number;
  tien_giam_gia: number;
  tien_coc_tru: number;
  tien_thue_vat: number;
  tong_tien_phai_tra: number;
  xuat_vat: boolean;
  ma_so_thue_vat: string | null;
  ten_cong_ty_vat: string | null;
  trang_thai_tt: 'ChoThanhToan' | 'DaThanhToan' | 'DaHuy';
}

// 22. tbl_giao_dich_thanh_toan
export interface GiaoDichThanhToan {
  ma_giao_dich: string;
  ma_hoa_don: string;
  phuong_thuc: PaymentMethodType;
  so_tien_nhan: number;
  tien_thoi: number;
  ma_tham_chieu_nh: string | null;
  thoi_gian_giao_dich: string;
}

// 23. tbl_nha_cung_cap
export interface NhaCungCap {
  ma_nha_cung_cap: string;
  ten_nha_cung_cap: string;
  nguoi_lien_he: string;
  so_dien_thoai: string;
  dia_chi: string | null;
  so_tai_khoan: string | null;
  cong_no_hien_tai: number;
}

// 24. tbl_phieu_nhap_hang
export interface PhieuNhapHang {
  ma_phieu_nhap: string;
  ma_nha_cung_cap: string;
  ma_nguoi_nhan: string;
  ngay_nhap: string;
  tong_tien_hang: number;
  tien_da_thanh_toan: number;
  tien_no_lai: number;
  nguoi_giao_hang: string | null;
}

// 25. tbl_chi_tiet_phieu_nhap
export interface ChiTietPhieuNhap {
  ma_chi_tiet_nhap: string;
  ma_phieu_nhap: string;
  ma_nguyen_lieu: string;
  so_luong_nhap: number;
  don_gia_nhap: number;
  thanh_tien: number;
  han_su_dung_lo: string;
}

// 26. tbl_so_quy_dong_tien
export interface SoQuyDongTien {
  ma_giao_dich_quy: string;
  ngay_ghi_so: string;
  loai_thu_chi: CashflowType;
  so_tien: number;
  hinh_thuc_quy: 'TienMat' | 'TaiKhoanNganHang';
  ma_chung_tu_goc: string | null;
  so_du_quy_sau_gd: number;
  dien_giai: string | null;
}

// 27. tbl_yeu_cau_khach_hang
export interface YeuCauKhachHang {
  ma_yeu_cau: string;
  ma_ban: string;
  loai_yeu_cau: GuestRequestType;
  ghi_chu_yeu_cau: string | null;
  thoi_gian_gui: string;
  trang_thai_xu_ly: 'ChoXuLy' | 'DangXuLy' | 'DaHoanTat';
}

export interface TingNotification {
  id: string;
  ma_ban: string;
  ten_ban: string;
  ten_mon_an: string;
  thoi_gian: string;
  da_doc: boolean;
}

// Toàn bộ Snapshot 27 bảng chuẩn 3NF
export interface DatabaseSnapshot {
  tbl_khu_vuc: KhuVuc[];
  tbl_ban: Ban[];
  tbl_khach_hang: KhachHang[];
  tbl_khach_doan: KhachDoan[];
  tbl_danh_muc_mon: DanhMucMon[];
  tbl_mon_an: MonAn[];
  tbl_chi_tiet_combo: ChiTietCombo[];
  tbl_nguyen_lieu: NguyenLieu[];
  tbl_dinh_muc_mon: DinhMucMon[];
  tbl_nhan_vien: NhanVien[];
  tbl_vai_tro: VaiTro[];
  tbl_tai_khoan: TaiKhoan[];
  tbl_ca_lam_viec: CaLamViec[];
  tbl_phan_cong_ca: PhanCongCa[];
  tbl_don_nghi_phep: DonNghiPhep[];
  tbl_bang_luong: BangLuong[];
  tbl_phieu_dat_ban: PhieuDatBan[];
  tbl_don_goi_mon: DonGoiMon[];
  tbl_chi_tiet_don_goi: ChiTietDonGoi[];
  tbl_nhat_ky_bep: NhatKyBep[];
  tbl_hoa_don: HoaDon[];
  tbl_giao_dich_thanh_toan: GiaoDichThanhToan[];
  tbl_nha_cung_cap: NhaCungCap[];
  tbl_phieu_nhap_hang: PhieuNhapHang[];
  tbl_chi_tiet_phieu_nhap: ChiTietPhieuNhap[];
  tbl_so_quy_dong_tien: SoQuyDongTien[];
  tbl_yeu_cau_khach_hang: YeuCauKhachHang[];
}
