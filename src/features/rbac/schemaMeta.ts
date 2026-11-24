import type { DatabaseSnapshot } from '@/types/database';

export interface Table3nfMeta {
  key: keyof DatabaseSnapshot;
  label: string;
  moduleCode: string;
  ownerFinancialOnly?: boolean;
}

/** Danh mục đầy đủ 27 bảng chuẩn 3NF của AC-RMS theo đúng từ điển dữ liệu Chương 4. */
export const TABLE_3NF_LIST: Table3nfMeta[] = [
  { key: 'tbl_khu_vuc', label: 'Khu vực sảnh', moduleCode: 'MOD-01' },
  { key: 'tbl_ban', label: 'Danh mục bàn ăn & QR', moduleCode: 'MOD-01' },
  { key: 'tbl_khach_hang', label: 'Hồ sơ 4 nhóm khách', moduleCode: 'MOD-02' },
  { key: 'tbl_khach_doan', label: 'Pháp nhân đoàn & VAT', moduleCode: 'MOD-02' },
  { key: 'tbl_danh_muc_mon', label: 'Danh mục 5 trường phái', moduleCode: 'MOD-03' },
  { key: 'tbl_mon_an', label: 'Thực đơn món & Combo', moduleCode: 'MOD-03' },
  { key: 'tbl_chi_tiet_combo', label: 'Thành phần gói Combo', moduleCode: 'MOD-03' },
  { key: 'tbl_nguyen_lieu', label: 'Nguyên liệu tồn kho', moduleCode: 'MOD-08' },
  { key: 'tbl_dinh_muc_mon', label: 'Định mức tiêu hao BOM', moduleCode: 'MOD-03' },
  { key: 'tbl_nhan_vien', label: 'Hồ sơ nhân viên', moduleCode: 'MOD-07' },
  { key: 'tbl_vai_tro', label: 'Danh mục vai trò RBAC', moduleCode: 'MOD-10' },
  { key: 'tbl_tai_khoan', label: 'Tài khoản nội bộ', moduleCode: 'MOD-10' },
  { key: 'tbl_ca_lam_viec', label: 'Khung giờ ca & hệ số', moduleCode: 'MOD-07' },
  { key: 'tbl_phan_cong_ca', label: 'Lịch phân công ca trực', moduleCode: 'MOD-07' },
  { key: 'tbl_don_nghi_phep', label: 'Đơn nghỉ phép 3 trạng thái', moduleCode: 'MOD-07' },
  { key: 'tbl_bang_luong', label: 'Bảng lương theo ca', moduleCode: 'MOD-07' },
  { key: 'tbl_phieu_dat_ban', label: 'Phiếu đặt bàn & cọc', moduleCode: 'MOD-01' },
  { key: 'tbl_don_goi_mon', label: 'Phiên gọi món tại bàn', moduleCode: 'MOD-04' },
  { key: 'tbl_chi_tiet_don_goi', label: 'Chi tiết món gọi & KDS', moduleCode: 'MOD-04' },
  { key: 'tbl_nhat_ky_bep', label: 'Nhật ký chế biến bếp', moduleCode: 'MOD-05' },
  {
    key: 'tbl_hoa_don',
    label: 'Hóa đơn thanh toán',
    moduleCode: 'MOD-06',
    ownerFinancialOnly: true,
  },
  {
    key: 'tbl_giao_dich_thanh_toan',
    label: 'Giao dịch thu tiền',
    moduleCode: 'MOD-06',
    ownerFinancialOnly: true,
  },
  {
    key: 'tbl_nha_cung_cap',
    label: 'Nhà cung cấp & công nợ',
    moduleCode: 'MOD-08',
    ownerFinancialOnly: true,
  },
  {
    key: 'tbl_phieu_nhap_hang',
    label: 'Phiếu nhập kho',
    moduleCode: 'MOD-08',
    ownerFinancialOnly: true,
  },
  {
    key: 'tbl_chi_tiet_phieu_nhap',
    label: 'Chi tiết lô nhập kho',
    moduleCode: 'MOD-08',
    ownerFinancialOnly: true,
  },
  {
    key: 'tbl_so_quy_dong_tien',
    label: 'Sổ quỹ dòng tiền',
    moduleCode: 'MOD-08',
    ownerFinancialOnly: true,
  },
  { key: 'tbl_yeu_cau_khach_hang', label: 'Yêu cầu hỗ trợ QR', moduleCode: 'MOD-09' },
];

export const TABLE_3NF_BY_KEY = new Map<keyof DatabaseSnapshot, Table3nfMeta>(
  TABLE_3NF_LIST.map((m) => [m.key, m]),
);
