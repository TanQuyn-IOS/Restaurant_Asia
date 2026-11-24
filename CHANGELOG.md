# CHANGELOG — Hệ Thống Quản Lý Nhà Hàng Châu Á (AC-RMS)

## [2.2.0] - 2026-11-24
### Added & Fixed
- **Tách bàn thông minh tự động trả đúng món bàn đó đã gọi (MOD-01 / MOD-04):**
  - Bổ sung tiện ích theo dõi nguồn bàn gọi món [tableOriginTag.ts](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/floor/tableOriginTag.ts) (gắn dấu `[BAN:<ma_ban>]` trong `ghi_chu_mon`, giữ nguyên 100% schema 27 bảng 3NF) và lõi ghép/tách/chuyển bàn [tableSplit.ts](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/floor/tableSplit.ts):
    - **Ghép bàn (`applyTransferOrMergeTable`):** Hỗ trợ ghép cả bàn Trống lẫn bàn Đang phục vụ khác (chưa chốt bill); tự động lưu nguồn bàn cho mọi món gọi từ bàn phụ (qua QR bàn phụ, Phục vụ chọn bàn hoặc món có sẵn trước khi gộp).
    - **Tách bàn (`applyDetachMergedTable` / `detachMergedTable`):** Bỏ hẳn giao diện chia bill/tách đơn thủ công — khi bấm tách bàn, hệ thống **tự động kiểm tra và trả về đúng các món bàn đó đã gọi** sang phiên riêng (giữ nguyên nhật ký bếp KDS), hoặc trả bàn về trạng thái `Trong` nếu bàn phụ chưa gọi món nào. Chặn tách khi bàn chính đã chốt bill.
    - **Chuyển bàn:** Tự động cập nhật `ma_ban_chinh` của các bàn phụ đi kèm sang bàn đích mới.
  - Tinh gọn [MergeTransferModal.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/floor/components/MergeTransferModal.tsx) còn đúng 3 chế độ **Ghép bàn · Tách bàn · Chuyển bàn** kèm xem trước danh sách món sẽ tự động trả về; cập nhật [OrderingSheet.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/floor/components/OrderingSheet.tsx), [OrderingBillTab.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/floor/components/OrderingBillTab.tsx), [KdsTicketCard.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/kds/components/KdsTicketCard.tsx) và [OrderTrackingSheet.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/qr/components/OrderTrackingSheet.tsx) hiển thị badge nguồn bàn sạch sẽ thay cho tag nội bộ.
  - Bổ sung [tableSplit.test.ts](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/floor/tableSplit.test.ts) (6 unit tests).

## [2.1.0] - 2026-11-24
### Added
- **Xác thực đăng nhập phân quyền RBAC thật (FR-26):**
  - Trang đăng nhập nội bộ `/dang-nhap` ([LoginPage.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/auth/LoginPage.tsx)) xác thực 7 tài khoản nhân viên (`tbl_tai_khoan`), kiểm tra trạng thái khóa tài khoản, kèm chọn nhanh tài khoản demo (mật khẩu mặc định `123456`).
  - Bảo vệ toàn bộ route nhân viên qua `AppShell`, bỏ hoàn toàn dropdown tự chuyển vai trò trên Topbar/MobileNav và bỏ nút nâng quyền trên `RoleWorkspaceCard` để chống leo thang đặc quyền.
  - Modal **Đổi mật khẩu** ([ChangePasswordModal.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/auth/ChangePasswordModal.tsx)), nút **Đăng xuất** ở Sidebar/Topbar và nút **Khóa / Mở khóa tài khoản** dành cho Chủ nhà hàng tại `/phan-quyen`.
  - Backend Express ([server/auth.ts](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/server/auth.ts), [server/index.ts](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/server/index.ts)): cấp & kiểm chứng **JWT ký số HMAC-SHA256**, giới hạn tốc độ đăng nhập chống brute-force (HTTP 429), tách API `/api/v1/auth/{login,me,change-password}` và `/api/v1/accounts/:id/toggle-lock`, đồng thời lọc bảng nhạy cảm trên `/api/v1/state` theo đúng vai trò trong token.
- **Nhận diện thành viên tùy chọn bằng SĐT trên Cổng Mobile QR (`/qr/:maBan`):**
  - Khách vãng lai vẫn gọi món ngay không cần mật khẩu (đúng FR-04 & FR-25); khách Thường/VIP/Đoàn có thể bấm thanh nhận diện SĐT ([MemberLookupSheet.tsx](file:///e:/KIEN_TRUC/NAM_4/KI_1/LAPTRINHMANG/nha_hang/src/features/qr/components/MemberLookupSheet.tsx)) để liên kết thẻ ưu đãi & kích hoạt cờ VIP KDS cho bàn đang ngồi.
- **Unit Tests:** Bổ sung `src/lib/auth.test.ts` (9 tests) và `server/auth.test.ts` (3 tests) kiểm chứng SHA-256, khóa tài khoản, đổi mật khẩu, chống giả mạo JWT, rate limit và tra cứu thành viên QR.

## [2.0.0] - 2026-11-24
### Changed
- **Dựng lại toàn bộ giao diện Frontend theo 18 ảnh mockup (`docs/ui-mockups/`)** bằng **Tailwind CSS v4 + React Router v7 + Recharts + Lucide Icons**, chuyển 100% nhãn sang tiếng Việt và giữ nguyên lõi nghiệp vụ Zustand 27 bảng 3NF + Socket.io/BroadcastChannel.
- **Hệ thống Design Tokens (`src/styles/index.css`) & Kiểm soát thiết kế (`npm run lint:ui`)**: Khóa cứng bảng màu thương hiệu *Atelier d'Asie* (giấy kem `#F7F5F0`, khung than chì `#25211F`, đỏ son `#A82F2B`, vàng đồng `#B3863A`, 4 màu trạng thái bàn), đúng 2 font tiếng Việt (`Spectral` + `Be Vietnam Pro`) và thang cỡ chữ chuẩn 12–48px.
- **Bộ linh kiện UI dùng chung (`src/components/ui/`, `src/components/layout/`, `src/components/domain/`)**: Sidebar than chì theo vai trò, Topbar có tìm nhanh `Ctrl+K` và chuông thông báo Ting/QR, `Modal`/`Sheet` có focus-trap, `StatCard`, `UnderlineTabs`, `Table`, `ToastViewport`.
- **Tách route riêng độc lập cho Cổng Khách hàng Mobile QR (`/qr`, `/qr/:maBan`)**: Nằm hoàn toàn ngoài `AppShell` nhân viên — khóa cứng số bàn (`ĐÃ KHÓA`), ẩn tuyệt đối nút đăng nhập/điều hướng nội bộ (FR-25), hỗ trợ chọn độ cay 0–3, ghi chú ăn uống, theo dõi tiến độ Bếp realtime, xem tạm tính và gọi hỗ trợ có cooldown chống spam.
- **15 màn hình hoàn chỉnh có code-splitting theo route**:
  - `/tong-quan`: Tổng quan vận hành thích ứng vai trò (ẩn hoàn toàn tài chính với phi-Chủ theo FR-19).
  - `/so-do-ban`: Sơ đồ bàn 4 màu theo khu vực, mở bàn 4 nhóm khách, đặt bàn thu cọc, ghép/chuyển bàn, ngăn gọi món, chốt bill và nút `DELETE` giải phóng bàn sau thanh toán.
  - `/bep`: Màn hình Bếp KDS Realtime ưu tiên `VIP Flag` + FIFO, đồng hồ phút sống, gạt Còn món / Hết món tức thì.
  - `/thu-ngan`: Thu ngân POS chế độ Chỉ đọc (`Read-Only`) khóa cứng thêm/sửa/xóa món (test chặn HTTP 403), khấu trừ cọc/VIP + VAT 8%, Tiền mặt / Thẻ / mô phỏng VietQR SVG và in/xuất hóa đơn VAT.
  - `/nhan-su/{ca-lam,nghi-phep,bang-luong}`: Lịch phân ca rõ giờ chính xác & chấm công, nghỉ phép 3 trạng thái (`Đã nghỉ – Đang nghỉ – Sắp nghỉ`) kèm modal duyệt & xếp người thay, bảng lương ca đồng bộ nghỉ phép (ẩn hoàn toàn doanh thu với Quản lý/HR).
  - `/tai-chinh/{so-quy,doanh-thu,kho}` *(độc quyền Chủ)*: Sổ quỹ dòng tiền Thu–Chi + xuất CSV, biểu đồ Donut Recharts doanh thu theo 4 nhóm khách + Top món bán chạy (kèm bảng a11y), quản lý tồn kho cảnh báo tối thiểu, công nợ NCC và modal lập phiếu nhập kho.
  - `/thuc-don`, `/khach-hang`, `/phan-quyen`: Thực đơn Châu Á & định mức BOM/Combo, danh bạ 4 nhóm khách + thông tin pháp nhân VAT, ma trận RBAC + tài khoản ẩn hash + trình duyệt 27 bảng 3NF (ẩn bảng tài chính với phi-Chủ) + khôi phục dữ liệu mẫu có xác nhận `XOA`.
- **Tài liệu & Kiểm thử**: Bổ sung `docs/03-ui-design-system.md`, `docs/ADR-002-ui-rebuild-tailwind-router.md`, sao lưu bản giao diện v1.0 tại `legacy/ui-v1.0/` và mở rộng bộ kiểm thử lên **10 file / 69 unit tests** (`npm test`).

## [1.0.0] - 2026-11-24
### Added
- **Đặc tả & Kế hoạch (`docs/`)**: Hoàn thiện `01-analysis-spec.md` (96 chức năng nguyên tử qua 10 phân hệ) và `02-implementation-plan.md`.
- **CSDL MySQL Chuẩn 3NF (`database/`)**: Đầy đủ 27 bảng dữ liệu (`schema_27_tables.sql` & `seed_27_tables.sql`) khớp 100% với Chương 4 báo cáo.
- **Backend Node.js (`server/`)**: Express REST API `/api/v1/*`, `Socket.io` Realtime Hub, `mysql2/promise` Connection Pool hỗ trợ SSL cho Cloud MySQL (Aiven / TiDB Cloud) kèm Hybrid Fallback Engine và Middleware chặn HTTP 403 theo vai trò RBAC.
- **Giao diện React 10 Phân hệ (`src/`)**:
  - `MOD-01 & MOD-04`: Sơ đồ bàn 4 màu trạng thái (`Xanh lá`, `Vàng`, `Đỏ`, `Cam`), đặt bàn thu cọc đoàn, ghép bàn, gọi món/hủy món chưa nấu, kiểm chốt Bill và **Nút `DELETE` giải phóng bàn**.
  - `MOD-02`: Quản lý 4 nhóm khách hàng (`Vãng lai`, `Thường`, `VIP`, `Đoàn` kèm MST xuất hóa đơn đỏ VAT).
  - `MOD-03`: Thực đơn 5 trường phái ẩm thực Châu Á, độ cay 0–3, gói Combo đoàn, định mức BOM và gạt Còn món / Hết món Realtime.
  - `MOD-05`: Màn hình Bếp KDS Realtime ưu tiên `VIP Flag`, bấm **`Hoàn thành`** tự động trừ kho BOM, phát chuông **`Ting`** và **TỰ ĐỘNG NẠP MÓN VÀO BILL**.
  - `MOD-06`: Quầy Thu ngân POS chế độ **Chỉ đọc (`Read-Only`)** khóa cứng thêm/sửa/xóa món, khấu trừ tiền cọc, giảm VIP, thanh toán VietQR và xuất hóa đơn đỏ VAT.
  - `MOD-07`: Quản trị nhân sự ca kíp (`Ca nào – Giờ nào – Khu vực nào`), lọc nghỉ phép **3 trạng thái (`ĐÃ NGHỈ – ĐANG NGHỈ – SẮP NGHỈ`)** kèm người trực thay ca và tính bảng lương.
  - `MOD-08`: Dashboard Sổ quỹ dòng tiền Thu–Chi, Lãi/Lỗ ròng và Lập phiếu nhập kho nguyên liệu dành **độc quyền cho Chủ nhà hàng** (Ẩn 100% với Quản lý sảnh).
  - `MOD-09`: Cổng Khách hàng quét mã QR độc lập tại bàn trên Mobile (khóa cứng số bàn, ẩn hoàn toàn nút đăng nhập nhân viên).
  - `MOD-10`: Quản lý tài khoản, ma trận phân quyền RBAC 6 vai trò và trình duyệt trực tiếp 27 bảng CSDL 3NF.
- **Triển khai Cloud (`render.yaml`)**: Cấu hình Unified Web Service trên Render kết nối Cloud MySQL miễn phí.
