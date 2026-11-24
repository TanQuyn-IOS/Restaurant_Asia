# Đặc Tả Phân Tích & Thiết Kế Hệ Thống — AC-RMS (React Web UI)
**Đề tài**: Xây dựng Hệ thống Quản lý và Điều hành Toàn diện Chuỗi Nhà hàng Ẩm thực Châu Á (AC-RMS)  
**Phiên bản**: 1.0 | **Ngày lập**: 24/11/2026 | **Trạng thái**: DRAFT — Chờ phê duyệt  
**Tài liệu liên quan**: [02-implementation-plan.md](./02-implementation-plan.md)

---

## 1. Tổng Quan Dự Án & Tầm Nhìn (Project Brief)

### 1.1 Tầm nhìn (Vision)
Xây dựng ứng dụng Web đa vai trò theo thời gian thực (**Realtime Client–Server Web App**) trên nền tảng **React**, tự động hóa khép kín toàn bộ quy trình vận hành chuỗi nhà hàng ẩm thực Châu Á (Việt Nam, Trung Hoa, Nhật Bản, Hàn Quốc, Thái Lan): từ điều phối sơ đồ bàn, phục vụ 4 nhóm khách hàng, đồng bộ màn hình bếp KDS gắn chặt với hóa đơn, kiểm soát thu ngân chế độ Chỉ đọc (Read-only) chống thất thoát, quản trị nhân sự ca kíp & nghỉ phép 3 trạng thái, cổng khách hàng quét mã QR độc lập tại bàn, đến sổ quỹ dòng tiền & kho nguyên vật liệu độc quyền cho Chủ nhà hàng.

### 1.2 Năm Trụ Cột Nghiệp Vụ Cốt Lõi
1. **Chuẩn hóa phục vụ 4 nhóm khách hàng**: Khách vãng lai (mở bàn nhanh không cần tài khoản), Khách thường (tích/tiêu điểm thành viên), Khách VIP (chiết khấu 10%–20%, ưu tiên phòng VIP, gắn cờ `VIP Flag` đẩy món lên đầu KDS), Khách đoàn (ghép bàn dài, thực đơn Combo tiệc, đặt cọc tối thiểu 30%, xuất hóa đơn đỏ VAT).
2. **Liên thông Bếp KDS Realtime & Hóa đơn**: Order từ Phục vụ hoặc Mobile QR đẩy tức thì xuống KDS. Chỉ khi Đầu bếp bấm **`Hoàn thành`**, hệ thống mới phát chuông báo **`Ting`** cho Phục vụ bưng món, tự động trừ kho theo định mức BOM (`tbl_dinh_muc_mon`) và **TỰ ĐỘNG NẠP MÓN VÀO BILL TÍNH TIỀN**.
3. **Chống thất thoát nội bộ & Nút DELETE bàn**: Phục vụ kiểm tra và chốt Bill cùng khách tại bàn trước khi chuyển sang Thu ngân. Giao diện Thu ngân mở ở chế độ **Chỉ đọc (`Read-only`)**, khóa cứng mọi thao tác thêm/sửa/xóa món. Sau khi thanh toán, bàn không tự động trống mà chờ Phục vụ dọn sạch và bấm nút **`DELETE`** để giải phóng bàn về trạng thái trống.
4. **Phân quyền bảo mật tài chính đa tầng & Quản trị ca kíp**: Tài khoản Quản lý sảnh (`Manager`) bị **ẨN HOÀN TOÀN** doanh thu, sổ quỹ dòng tiền, lãi/lỗ và giá vốn nhập kho (chỉ `Owner` được phép xem). Lịch phân ca hiển thị rõ **Nhân viên nào – Làm Ca nào – Giờ nào – Khu vực nào**, kết hợp bộ lọc nghỉ phép 3 trạng thái: **ĐÃ NGHỈ – ĐANG NGHỈ – SẮP NGHỈ** kèm người trực thay ca.
5. **Cổng Khách hàng Mobile QR độc lập tại bàn**: Quét mã QR cố định trên mặt bàn mở giao diện Mobile khóa cứng theo số bàn, **ẩn hoàn toàn nút đăng nhập nhân viên/quản lý**, cho phép chọn món, chọn độ cay (0–3), theo dõi tiến độ KDS realtime, xem tạm tính và bấm nút gọi hỗ trợ.

### 1.3 Danh sách Tác nhân & Phân quyền RBAC (7 Actors)
| Mã Actor | Tác nhân (Actor) | Vai trò RBAC | Phạm vi giao diện React Web UI |
|:---|:---|:---|:---|
| **ACT-01** | Khách hàng (4 nhóm) | `Public Guest` | Cổng Mobile QR độc lập tại bàn (`/qr/:maBan`), Đặt bàn trước, Xem menu Châu Á & độ cay, Gọi món, Theo dõi KDS, Xem tạm tính, Gọi hỗ trợ. |
| **ACT-02** | Nhân viên Phục vụ | `Role Waitstaff` | Sơ đồ bàn trực quan (Xanh/Vàng/Đỏ/Cam), Mở bàn (chọn 4 nhóm khách), Chuyển/Ghép bàn đoàn, Gọi món/Hủy món chưa nấu, Nhận chuông Ting, Kiểm & Chốt Bill tại bàn, Nút `DELETE` giải phóng bàn. |
| **ACT-03** | Nhân viên Bếp | `Role Kitchen` | Màn hình cảm ứng KDS Realtime, Nhận order FIFO & ưu tiên `VIP Flag`, Chuyển trạng thái `Chờ → Đang chế biến → Hoàn thành` (nạp Bill & phát chuông Ting), Gạt công tắc Còn món / Hết món. |
| **ACT-04** | Nhân viên Thu ngân | `Role Cashier` | Màn hình POS Thu ngân chế độ **Chỉ đọc (`Read-only`)** (khóa thêm/sửa/xóa món), Tự động trừ tiền cọc, Giảm giá VIP/Điểm thưởng, Thu tiền (Tiền mặt/Thẻ/VietQR), Xuất hóa đơn đỏ điện tử VAT. |
| **ACT-05** | Quản lý sảnh | `Role Manager` | Quản trị khu vực/sơ đồ bàn, Danh mục thực đơn & Combo, Lập lịch phân ca (`Ca nào – Giờ nào`), Duyệt nghỉ phép 3 trạng thái (`Đã – Đang – Sắp nghỉ`). **Bị ẩn hoàn toàn Doanh thu/Sổ quỹ/Kho**. |
| **ACT-06** | Nhân sự (HR) | `Role HR` | Quản lý hồ sơ nhân viên, Cấu hình khung giờ ca (Sáng/Chiều/Tối) & hệ số lương, Phối hợp phân ca, Duyệt nghỉ phép 3 trạng thái, Chấm công Check-in/Check-out & Tự động tính bảng lương tháng. |
| **ACT-07** | Chủ nhà hàng | `Role Owner` | **Độc quyền** Dashboard Sổ quỹ dòng tiền Thu–Chi, Báo cáo Doanh thu & Lợi nhuận ròng (Lãi/Lỗ), Quản lý Nhà cung cấp & Phiếu nhập kho nguyên liệu, Cảnh báo tồn kho tối thiểu, Quản trị tài khoản & RBAC. |

---

## 2. Cấu Trúc Phân Rã Chức Năng Nguyên Tử (Functional Decomposition)

Toàn bộ hệ thống gồm **10 Phân hệ (MOD-01 đến MOD-10)**, **33 Nhóm chức năng** và được phân rã chi tiết đến cấp **96 Chức năng nguyên tử (Atomic Leaf Functions)** — mỗi chức năng nguyên tử tương ứng đúng 1 hành động đơn lẻ trên giao diện / API:

```text
HỆ THỐNG QUẢN LÝ & ĐIỀU HÀNH CHUỖI NHÀ HÀNG ẨM THỰC CHÂU Á (AC-RMS)
├── Phân hệ 1: Quản lý Bàn & Sơ đồ nhà hàng (MOD-01) — 14 chức năng nguyên tử
│   ├── 1.1 Quản lý khu vực sảnh
│   │   ├── 1.1.1 Thêm khu vực sảnh mới
│   │   ├── 1.1.2 Cập nhật thông tin khu vực sảnh
│   │   └── 1.1.3 Xóa khu vực sảnh trống
│   ├── 1.2 Quản lý danh mục bàn ăn
│   │   ├── 1.2.1 Tạo bàn ăn mới trong khu vực
│   │   ├── 1.2.2 Sinh mã QR cố định cho bàn ăn
│   │   ├── 1.2.3 Cập nhật thông tin bàn ăn
│   │   └── 1.2.4 Xóa bàn ăn chưa phát sinh giao dịch
│   ├── 1.3 Quản lý vòng đời trạng thái bàn & Giải phóng bàn
│   │   ├── 1.3.1 Hiển thị sơ đồ bàn theo 4 mã màu trạng thái thời gian thực
│   │   ├── 1.3.2 Chuyển trạng thái bàn sang Đã đặt trước (Màu vàng)
│   │   ├── 1.3.3 Chuyển trạng thái bàn sang Đang phục vụ (Màu đỏ)
│   │   ├── 1.3.4 Chuyển trạng thái bàn sang Chờ thanh toán (Màu cam)
│   │   └── 1.3.5 Bấm nút DELETE giải phóng bàn đã thanh toán về Bàn trống (Màu xanh lá)
│   └── 1.4 Điều phối đặt bàn, chuyển bàn & ghép bàn
│       ├── 1.4.1 Tạo phiếu đặt bàn trước theo khung giờ hẹn
│       └── 1.4.2 Ghép nhiều bàn liền kề hoặc chuyển bàn cho phiên phục vụ
│
├── Phân hệ 2: Quản lý Khách hàng — 4 Nhóm khách (MOD-02) — 11 chức năng nguyên tử
│   ├── 2.1 Phục vụ Khách vãng lai (Walk-in)
│   │   ├── 2.1.1 Khởi tạo nhanh phiên phục vụ khách vãng lai không cần định danh
│   │   └── 2.1.2 Xuất phiếu thanh toán bán lẻ trực tiếp cho khách vãng lai
│   ├── 2.2 Quản lý Khách hàng thường (Thành viên)
│   │   ├── 2.2.1 Đăng ký hồ sơ khách hàng thành viên mới
│   │   ├── 2.2.2 Cộng điểm thưởng tích lũy tự động sau thanh toán
│   │   └── 2.2.3 Khấu trừ điểm tích lũy thành tiền giảm giá trên hóa đơn
│   ├── 2.3 Quản lý Khách VIP
│   │   ├── 2.3.1 Nâng hạng thẻ VIP cho khách hàng
│   │   ├── 2.3.2 Áp dụng tỷ lệ chiết khấu tự động theo hạng thẻ VIP
│   │   └── 2.3.3 Gắn cờ VIP Flag ưu tiên vị trí bàn và thứ tự chế biến bếp
│   └── 2.4 Quản lý Khách đoàn (Group / Event)
│       ├── 2.4.1 Lưu hồ sơ pháp nhân khách đoàn (Công ty, Người đại diện, MST, Địa chỉ)
│       ├── 2.4.2 Ghi nhận tiền đặt cọc tiệc đoàn vào phiếu đặt bàn
│       └── 2.4.3 Áp dụng thực đơn gói Combo tiệc đoàn vào đơn gọi món
│
├── Phân hệ 3: Quản lý Thực đơn Ẩm thực Châu Á (MOD-03) — 10 chức năng nguyên tử
│   ├── 3.1 Quản lý danh mục & trường phái ẩm thực
│   │   ├── 3.1.1 Tạo danh mục nhóm món ăn mới
│   │   ├── 3.1.2 Phân loại danh mục theo 5 trường phái ẩm thực (Việt, Hoa, Nhật, Hàn, Thái)
│   │   └── 3.1.3 Cập nhật thứ tự hiển thị danh mục thực đơn
│   ├── 3.2 Quản lý món ăn, độ cay & gói Combo
│   │   ├── 3.2.1 Thêm món ăn mới kèm đơn giá và hình ảnh
│   │   ├── 3.2.2 Thiết lập cấp độ cay tiêu chuẩn (0 đến 3) và thời gian nấu trung bình
│   │   ├── 3.2.3 Cấu hình danh sách món thành phần cho gói Combo tiệc đoàn
│   │   ├── 3.2.4 Thiết lập định mức tiêu hao nguyên vật liệu (BOM) cho từng món ăn
│   │   └── 3.2.5 Chỉnh sửa thông tin và đơn giá món ăn
│   └── 3.3 Đồng bộ tình trạng món ăn Realtime
│       ├── 3.3.1 Chuyển trạng thái món ăn sang Hết món hoặc Tạm ngưng
│       └── 3.3.2 Khôi phục trạng thái Còn món đồng bộ tức thì lên App và Mobile QR
│
├── Phân hệ 4: Nghiệp vụ Phục vụ tại bàn — Waitstaff Flow (MOD-04) — 11 chức năng nguyên tử
│   ├── 4.1 Mở bàn đón khách
│   │   ├── 4.1.1 Chọn bàn trên sơ đồ để mở phiên phục vụ mới
│   │   └── 4.1.2 Gán phân loại đúng 1 trong 4 nhóm khách hàng cho phiên phục vụ
│   ├── 4.2 Ghi nhận món gọi ban đầu & gửi Bếp
│   │   ├── 4.2.1 Chọn món ăn kèm số lượng và mức độ cay khách yêu cầu
│   │   ├── 4.2.2 Nhập ghi chú khẩu vị riêng cho từng món gọi
│   │   └── 4.2.3 Gửi danh sách món gọi xuống màn hình KDS Bếp theo thời gian thực
│   ├── 4.3 Gọi thêm món & Hủy món chưa chế biến
│   │   ├── 4.3.1 Tạo lượt gọi thêm món phát sinh trong bữa ăn
│   │   └── 4.3.2 Hủy món đang ở trạng thái Chờ chế biến (chặn hủy khi Bếp đã nấu)
│   ├── 4.4 Nhận món từ Bếp & Phục vụ
│   │   ├── 4.4.1 Nhận thông báo chuông Ting khi Bếp hoàn thành món
│   │   └── 4.4.2 Xác nhận Đã phục vụ sau khi bưng món lên bàn khách
│   └── 4.5 Kiểm tra Bill cùng khách & Chốt Bill
│       ├── 4.5.1 Hiển thị danh sách món đã hoàn thành để đối chiếu trực tiếp với khách
│       └── 4.5.2 Bấm Chốt Bill khóa đơn gọi món và đẩy sang quầy Thu ngân
│
├── Phân hệ 5: Quản lý Bếp thời gian thực — KDS (MOD-05) — 8 chức năng nguyên tử
│   ├── 5.1 Tiếp nhận & Sắp xếp hàng đợi chế biến
│   │   ├── 5.1.1 Nhận đơn gọi món mới tức thì từ Phục vụ và Cổng Mobile QR
│   │   ├── 5.1.2 Sắp xếp danh sách món chờ theo thứ tự thời gian gọi (FIFO)
│   │   ├── 5.1.3 Đẩy các món có gắn cờ VIP Flag lên đầu hàng đợi KDS
│   │   └── 5.1.4 Hiển thị cảnh báo viền đỏ cho món vượt thời gian chế biến tiêu chuẩn
│   └── 5.2 Điều phối trạng thái nấu & Nạp món vào Bill
│       ├── 5.2.1 Bấm nhận nấu chuyển trạng thái món sang Đang chế biến (khóa quyền hủy)
│       ├── 5.2.2 Bấm Hoàn thành món ăn trên màn hình KDS
│       ├── 5.2.3 Phát tín hiệu chuông Ting thông báo đích danh cho Phục vụ bàn
│       └── 5.2.4 Tự động nạp món Hoàn thành vào hóa đơn tính tiền và trừ tồn kho BOM
│
├── Phân hệ 6: Thu ngân & Thanh toán Read-Only (MOD-06) — 9 chức năng nguyên tử
│   ├── 6.1 Tiếp nhận hóa đơn chốt ở chế độ Chỉ đọc
│   │   ├── 6.1.1 Nhận danh sách bàn đang ở trạng thái Chờ thanh toán
│   │   └── 6.1.2 Hiển thị chi tiết hóa đơn ở chế độ Read-only (khóa cứng thêm/sửa/xóa món)
│   ├── 6.2 Tính toán đối trừ công nợ cọc & ưu đãi
│   │   ├── 6.2.1 Khấu trừ tự động số tiền đặt cọc từ phiếu đặt bàn
│   │   ├── 6.2.2 Áp dụng giảm giá hạng thẻ VIP hoặc điểm tích lũy thành viên
│   │   └── 6.2.3 Tính thuế giá trị gia tăng (VAT 8% - 10%) trên hóa đơn
│   └── 6.3 Thực hiện thu tiền & Phát hành chứng từ
│       ├── 6.3.1 Ghi nhận giao dịch thanh toán theo phương thức (Tiền mặt, Thẻ POS, VietQR)
│       ├── 6.3.2 In phiếu thanh toán hóa đơn cho khách hàng
│       ├── 6.3.3 Phát hành hóa đơn đỏ điện tử VAT theo Mã số thuế của Khách đoàn
│       └── 6.3.4 Tự động ghi bút toán ThuHoaDon vào Sổ quỹ dòng tiền của Chủ nhà hàng
│
├── Phân hệ 7: Nhân sự, Ca kíp & Điều hành sảnh (MOD-07) — 11 chức năng nguyên tử
│   ├── 7.1 Kiểm soát ẩn dữ liệu tài chính với Quản lý sảnh
│   │   └── 7.1.1 Ẩn hoàn toàn các chỉ số doanh thu, dòng tiền, lãi/lỗ trên giao diện Quản lý sảnh
│   ├── 7.2 Quản lý hồ sơ nhân viên
│   │   ├── 7.2.1 Thêm mới hồ sơ nhân viên kèm chức vụ và định mức lương ca
│   │   └── 7.2.2 Cập nhật thông tin hồ sơ và trạng thái làm việc của nhân viên
│   ├── 7.3 Quản lý Ca làm việc & Lịch phân ca (Ca nào – Giờ nào)
│   │   ├── 7.3.1 Thiết lập danh mục khung giờ ca (Ca Sáng, Ca Chiều, Ca Tối) và hệ số lương
│   │   └── 7.3.2 Phân công nhân viên vào lịch trực chi tiết (Ca nào – Giờ nào – Khu vực nào)
│   ├── 7.4 Quản lý Nghỉ phép theo 3 trạng thái (Đã – Đang – Sắp nghỉ)
│   │   ├── 7.4.1 Tạo đơn xin nghỉ phép kèm đề xuất nhân viên trực thay ca
│   │   ├── 7.4.2 Phê duyệt hoặc từ chối đơn nghỉ phép và tự động gán người thay ca
│   │   ├── 7.4.3 Lọc danh sách nghỉ phép theo 3 trạng thái: ĐÃ NGHỈ, ĐANG NGHỈ, SẮP NGHỈ
│   └── 7.5 Chấm công & Tính lương tự động theo ca
│       ├── 7.5.1 Ghi nhận thời gian Check-in vào ca và Check-out ra ca
│       ├── 7.5.2 Tổng hợp số ca thực tế, nhân hệ số ca và đối trừ số ca ĐÃ NGHỈ
│       └── 7.5.3 Xuất bảng lương tháng và kết chuyển bút toán ChiLuong vào Sổ quỹ
│
├── Phân hệ 8: Dòng tiền, Doanh thu & Hàng nhập — Độc quyền Chủ (MOD-08) — 10 chức năng nguyên tử
│   ├── 8.1 Quản trị Sổ quỹ dòng tiền ròng (Cashflow)
│   │   ├── 8.1.1 Xem sổ quỹ tổng hợp các bút toán Thu (Cọc, Hóa đơn) và Chi (Nhập hàng, Lương)
│   │   ├── 8.1.2 Theo dõi số dư tức thì tách biệt giữa Quỹ tiền mặt và Tài khoản ngân hàng
│   │   └── 8.1.3 Tính toán báo cáo Lợi nhuận ròng (Lãi / Lỗ) theo kỳ kinh doanh
│   ├── 8.2 Thống kê Doanh thu đa chiều
│   │   ├── 8.2.1 Xem biểu đồ doanh thu theo ngày, tuần, tháng, năm
│   │   ├── 8.2.2 Phân tích cơ cấu doanh thu theo 4 nhóm khách hàng (Vãng lai, Thường, VIP, Đoàn)
│   │   └── 8.2.3 Thống kê bảng xếp hạng Top món ăn Châu Á bán chạy nhất
│   └── 8.3 Quản lý Nhà cung cấp, Nhập kho & Cảnh báo tồn kho
│       ├── 8.3.1 Thêm và quản lý danh bạ Nhà cung cấp thực phẩm kèm công nợ hiện tại
│       ├── 8.3.2 Lập phiếu nhập kho nguyên vật liệu đầu vào (số lượng, đơn giá, hạn dùng lô)
│       ├── 8.3.3 Cập nhật cộng tồn kho, tính giá nhập bình quân và ghi nhận công nợ NCC
│       └── 8.3.4 Phát cảnh báo tự động các nguyên liệu chạm ngưỡng tồn kho tối thiểu
│
├── Phân hệ 9: Cổng Khách hàng Mobile QR Độc lập tại bàn (MOD-09) — 7 chức năng nguyên tử
│   ├── 9.1 Khởi tạo & Cô lập phiên Mobile QR tại bàn
│   │   ├── 9.1.1 Giải mã token QR bàn ăn và khóa cứng giao diện theo đúng mã bàn
│   │   └── 9.1.2 Ẩn hoàn toàn các liên kết và nút đăng nhập nội bộ của nhân viên/quản lý
│   └── 9.2 Trải nghiệm thực khách tự phục vụ trên Mobile
│       ├── 9.2.1 Duyệt thực đơn Châu Á theo trường phái, xem hình ảnh và chọn mức độ cay
│       ├── 9.2.2 Gửi yêu cầu đặt món trực tiếp từ điện thoại xuống Bếp KDS
│       ├── 9.2.3 Theo dõi trực tiếp tiến độ chế biến từng món (Chờ → Đang nấu → Hoàn thành)
│       ├── 9.2.4 Xem bảng tạm tính tiền các món ăn của bàn theo thời gian thực
│       └── 9.2.5 Gửi yêu cầu hỗ trợ nhanh (Gọi nước lọc, Khăn lạnh, Kiểm Bill, Gặp phục vụ)
│
└── Phân hệ 10: Tài khoản & Phân quyền Bảo mật RBAC (MOD-10) — 5 chức năng nguyên tử
    ├── 10.1 Xác thực người dùng nội bộ (Authentication)
    │   ├── 10.1.1 Đăng nhập hệ thống theo tài khoản nhân viên và vai trò RBAC
    │   └── 10.1.2 Đổi mật khẩu hoặc khóa/mở khóa tài khoản nhân viên
    └── 10.2 Kiểm soát truy cập phân tầng (Authorization)
        ├── 10.2.1 Cấp mới tài khoản đăng nhập gắn với hồ sơ nhân viên và vai trò
        ├── 10.2.2 Cấu hình ma trận quyền truy cập cho 6 vai trò nội bộ
        └── 10.2.3 Chặn truy cập trái phép (HTTP 403 / Route Guard) khi Quản lý vào trang Dòng tiền hoặc Thu ngân sửa món
```

### Tổng kết số lượng chức năng nguyên tử (Atomic Function Count)
| Mã phân hệ | Tên phân hệ | Số nhóm (Cấp 2) | Số chức năng nguyên tử (Cấp 3) |
|:---|:---|:---:|:---:|
| **MOD-01** | Quản lý Bàn & Sơ đồ nhà hàng | 4 | 14 |
| **MOD-02** | Quản lý Khách hàng (4 nhóm khách) | 4 | 11 |
| **MOD-03** | Quản lý Thực đơn (Menu ẩm thực Châu Á) | 3 | 10 |
| **MOD-04** | Nghiệp vụ Phục vụ tại bàn (Waitstaff Flow) | 5 | 11 |
| **MOD-05** | Quản lý Bếp thời gian thực (KDS) | 2 | 8 |
| **MOD-06** | Thu ngân & Thanh toán (Read-Only) | 3 | 9 |
| **MOD-07** | Nhân sự, Ca kíp & Điều hành sảnh | 5 | 11 |
| **MOD-08** | Dòng tiền, Doanh thu & Hàng nhập (Độc quyền Chủ) | 3 | 10 |
| **MOD-09** | Cổng Khách hàng Mobile QR độc lập tại bàn | 2 | 7 |
| **MOD-10** | Tài khoản & Phân quyền bảo mật RBAC | 2 | 5 |
| **TỔNG CỘNG** | **10 Phân hệ nghiệp vụ** | **33 Nhóm** | **96 Chức năng nguyên tử** |

---

## 3. Sơ Đồ Use Case & Luồng Nghiệp Vụ (Mermaid Diagrams)

### 3.1 Sơ đồ Use Case: Luồng Vận hành Tuyến đầu (Phục vụ – Mobile QR – Bếp KDS – Thu ngân)
```mermaid
flowchart LR
    subgraph Actors ["Tác nhân Tuyến đầu"]
        Guest["Khách hàng (4 nhóm)"]
        Waiter["Nhân viên Phục vụ"]
        Chef["Nhân viên Bếp (KDS)"]
        Cashier["Nhân viên Thu ngân"]
    end

    subgraph Frontline ["Luồng Phục vụ - KDS - Thu ngân"]
        UC01["UC-01: Đặt bàn trước"]
        UC01A["Ghi nhận tiền cọc tiệc đoàn"]
        UC02["UC-02: Mở bàn & Chọn 1 trong 4 nhóm khách"]
        UC02A["Chuyển bàn / Ghép bàn đoàn"]
        UC03["UC-03: Gọi món tại bàn & Gửi KDS"]
        UC03A["Hủy món khi Bếp chưa nấu"]
        UC04["UC-04: Quét QR tại bàn (Khóa bàn, Ẩn Login NV)"]
        UC05["UC-05: Chế biến KDS & Đẩy món Hoàn thành vào Bill"]
        UC06["UC-06: Cập nhật Còn món / Hết món Realtime"]
        UC07["UC-07: Kiểm tra Bill cùng khách & Chốt Bill"]
        UC08["UC-08: Thanh toán Read-only & Xuất VAT"]
        UC09["UC-09: Dọn sạch bàn & Bấm nút DELETE"]
    end

    Guest --> UC01
    Guest --> UC04
    Waiter --> UC01
    Waiter --> UC02
    Waiter --> UC03
    Waiter --> UC07
    Waiter --> UC09
    Chef --> UC05
    Chef --> UC06
    Cashier --> UC08

    UC01 -.->|extend| UC01A
    UC02 -.->|extend| UC02A
    UC03 -.->|extend| UC03A
    UC04 -.->|include| UC03
    UC08 -.->|include| UC07
    UC09 -.->|include| UC08
```

### 3.2 Sơ đồ Use Case: Quản trị Sảnh, Nhân sự Ca kíp & Tài chính Độc quyền Chủ
```mermaid
flowchart LR
    subgraph BackOfficeActors ["Tác nhân Quản trị"]
        Manager["Quản lý sảnh (Ẩn Doanh thu)"]
        HR["Nhân sự (HR)"]
        Staff["Nhân viên các bộ phận"]
        Owner["Chủ nhà hàng (Owner)"]
    end

    subgraph HallAndHR ["Phân vùng Điều hành Sảnh & Nhân sự (MOD-01, 03, 07)"]
        UC_Menu["Quản lý Sơ đồ bàn & Thực đơn Châu Á"]
        UC10["UC-10: Phân công ca (Ca nào - Giờ nào - Khu vực)"]
        UC11["UC-11: Duyệt nghỉ phép 3 trạng thái (Đã - Đang - Sắp)"]
        UC11A["Chỉ định người trực thay ca"]
        UC_Pay["Chấm công & Tự động tính lương theo ca"]
    end

    subgraph OwnerExclusive ["Phân vùng Độc quyền Chủ nhà hàng (MOD-08, 10)"]
        UC12["UC-12: Quản trị Sổ quỹ Dòng tiền & Báo cáo Lãi/Lỗ"]
        UC_Inv["Lập phiếu nhập kho & Cảnh báo tồn tối thiểu"]
        UC_RBAC["Quản lý Tài khoản & Ma trận RBAC 6 vai trò"]
    end

    Manager --> UC_Menu
    Manager --> UC10
    Manager --> UC11
    HR --> UC10
    HR --> UC11
    HR --> UC_Pay
    Staff --> UC11
    Owner --> UC12
    Owner --> UC_Inv
    Owner --> UC_RBAC

    UC11 -.->|include| UC11A
    UC_Inv -.->|include| UC12
```

### 3.3 Sơ đồ Tuần tự (Sequence Diagram): Luồng Gọi món → KDS Hoàn thành → Chốt Bill → Thu ngân Read-Only → DELETE Bàn
```mermaid
sequenceDiagram
    actor Guest as Khách hàng (QR/Tại bàn)
    actor Waiter as Nhân viên Phục vụ
    participant UI as React Web App
    participant Store as Realtime State / API
    actor Chef as Bếp (Màn hình KDS)
    actor Cashier as Thu ngân (POS Read-Only)

    Waiter->>UI: 1. Mở bàn, chọn nhóm khách (Vãng lai/Thường/VIP/Đoàn)
    UI->>Store: Tạo DonGoiMon (DangPhucVu), đổi bàn sang Màu Đỏ
    Guest->>UI: 2. Chọn món Châu Á, độ cay (0-3), ghi chú
    UI->>Store: Lưu ChiTietDonGoi (ChoCheBien) & đẩy sự kiện KDS
    Store-->>Chef: 3. Hiển thị món trên KDS (Ưu tiên cờ VIP Flag lên đầu)

    alt Khách đổi ý muốn hủy món
        Waiter->>Store: Yêu cầu hủy món
        Store-->>UI: Cho phép hủy nếu ChoCheBien / Chặn nếu DangCheBien
    end

    Chef->>Store: 4. Bấm Nhận nấu (DangCheBien) -> Bấm HOÀN THÀNH
    Store->>Store: 5. Trừ kho BOM (tbl_dinh_muc_mon) & Nạp món vào Bill
    Store-->>Waiter: 6. Phát chuông TING báo Phục vụ bưng món ra bàn
    Waiter->>Store: 7. Kiểm tra Bill cùng khách & Bấm CHỐT BILL
    Store-->>Cashier: 8. Mở HoaDon chế độ READ-ONLY (Khóa thêm/xóa món), bàn Màu Cam

    Cashier->>Store: 9. Trừ tiền cọc, giảm VIP/Điểm, tính VAT, thu tiền (TM/Thẻ/VietQR)
    Store->>Store: 10. Cập nhật DaThanhToan & Ghi ThuHoaDon vào Sổ quỹ Chủ
    Store-->>Waiter: 11. Báo bàn đã thanh toán xong
    Waiter->>Store: 12. Dọn sạch bàn & Bấm nút DELETE giải phóng bàn
    Store-->>UI: 13. Đóng phiên (DaGiaiPhong), bàn về Màu Xanh lá (Bàn trống)
```

---

## 4. Kiến Trúc Hệ Thống & Thiết Kế Giao Diện (UI/UX Architecture)

### 4.1 Kiến trúc Tổng thể Ứng dụng (React + Node.js Express/Socket.io + Cloud MySQL trên Render)
Hệ thống được thiết kế theo mô hình **Full-Stack Client–Server (React SPA + Node.js/Express + Socket.io + Cloud MySQL 8.0)**, tối ưu hóa để triển khai lên **Render (Free Web Service)** kết nối với **Cloud MySQL miễn phí (Aiven Free MySQL / TiDB Cloud Serverless / Clever Cloud)**:

```mermaid
flowchart TB
    subgraph ClientLayer ["Tầng Giao Diện React 19 + Vite (Multi-Role Views)"]
        V_Waiter["Phân hệ Sảnh & Phục vụ (MOD-01, 02, 04)"]
        V_KDS["Màn hình Bếp KDS Realtime (MOD-05)"]
        V_POS["Quầy Thu ngân POS Read-Only (MOD-06)"]
        V_QR["Cổng Mobile QR Độc lập /qr/:tableId (MOD-09)"]
        V_MgrHR["Quản trị Sảnh, Menu & Nhân sự Ca kíp (MOD-03, 07)"]
        V_Owner["Dashboard Độc quyền Chủ: Sổ quỹ & Kho (MOD-08, 10)"]
    end

    subgraph RenderBackend ["Tầng Backend Node.js trên Render (Express + Socket.io)"]
        API_GW["REST API /api/v1/* + Static React Build Server"]
        WS_Hub["Socket.io Realtime Hub (Order, KDS, Chuông Ting, Sơ đồ bàn)"]
        G_RBAC["RBAC & Internal Control Middleware (Chặn 403 Manager/Cashier)"]
        Svc_Layer["Business Services (Order, KDS BOM, Read-Only POS, HR 3-State, Cashflow)"]
        DB_Pool["MySQL2 Connection Pool (SSL/TLS + Auto-Init/Seed + Fallback)"]
    end

    subgraph CloudDB ["Tầng CSDL Cloud MySQL Miễn Phí (Aiven / TiDB Cloud)"]
        MySQL_3NF[("MySQL 8.0 (27 Bảng chuẩn 3NF: tbl_khu_vuc .. tbl_yeu_cau_khach_hang)")]
    end

    V_Waiter --> API_GW
    V_KDS --> API_GW
    V_POS --> API_GW
    V_QR --> API_GW
    V_MgrHR --> API_GW
    V_Owner --> API_GW

    V_Waiter -.->|WebSocket| WS_Hub
    V_KDS -.->|WebSocket| WS_Hub
    V_POS -.->|WebSocket| WS_Hub
    V_QR -.->|WebSocket| WS_Hub

    API_GW --> G_RBAC
    G_RBAC --> Svc_Layer
    WS_Hub --> Svc_Layer
    Svc_Layer --> DB_Pool
    DB_Pool --> MySQL_3NF
```

### 4.2 Hệ thống Thiết kế Giao diện (Design System & Craft Standards)
Tuân thủ quy chuẩn thiết kế **Operate + Experience Mode** cho ngành F&B Ẩm thực Châu Á đương đại:
- **Bối cảnh vật lý & Ánh sáng**: Nhân viên phục vụ, thu ngân và quản lý thao tác liên tục dưới ánh đèn ấm của nhà hàng Châu Á; màn hình KDS bếp cần độ tương phản cực cao chống lóa dầu mỡ; cổng Mobile QR của thực khách cần sự ấm áp, kích thích vị giác.
- **Hệ thống Typography (Đúng 2 Font chuẩn tiếng Việt, không dùng font AI-cliché)**:
  - `--font-display: 'Spectral', Georgia, serif` — Dùng riêng cho tiêu đề thương hiệu, tên khu vực sảnh, tiêu đề trang và tên món đặc sản trên cổng Mobile QR.
  - `--font-body: 'Be Vietnam Pro', system-ui, sans-serif` — Dùng cho toàn bộ giao diện điều hành POS, KDS, bảng phân ca, số liệu tài chính (`font-variant-numeric: tabular-nums`) giúp đọc số tiền và thời gian chính xác tuyệt đối.
- **Hệ màu Ngữ nghĩa Nghiệp vụ (Semantic Culinary Palette)**:
  - **Nền & Bề mặt**: Giấy dó ấm (`--bg: #FAF7F2`), Bề mặt thẻ (`--surface: #FFFFFF`), Chữ chính mực tàu (`--text: #181615`).
  - **Thương hiệu Châu Á**: Đỏ son Chu sa (`--primary: #B8332A`), Vàng kim Hoàng gia cho thẻ VIP (`--accent: #C68B2C`).
  - **4 Màu Trạng thái Bàn chuẩn FR-02**:
    - Bàn trống (`Trong`): Xanh ngọc bích (`#16805C`)
    - Đã đặt trước (`DaDat`): Vàng hổ phách (`#D9822B`)
    - Đang phục vụ (`DangPhucVu`): Đỏ chu sa (`#C93B2B`)
    - Chờ thanh toán (`ChoThanhToan`): Cam đồng (`#E05A1E`)

---

## 5. Mô Hình Dữ Liệu Chuẩn 3NF (27 Bảng CSDL) & Hợp Đồng API

### 5.1 Sơ đồ Quan hệ Thực thể (Mermaid ERD — 27 Bảng)
```mermaid
erDiagram
    tbl_khu_vuc ||--o{ tbl_ban : "chứa"
    tbl_ban ||--o{ tbl_ban : "ghép_vào_ma_ban_chinh"
    tbl_ban ||--o{ tbl_phieu_dat_ban : "được_đặt"
    tbl_ban ||--o{ tbl_don_goi_mon : "phục_vụ"
    tbl_ban ||--o{ tbl_yeu_cau_khach_hang : "gửi_yêu_cầu_QR"

    tbl_khach_hang ||--o| tbl_khach_doan : "kế_thừa_1_1"
    tbl_khach_hang ||--o{ tbl_phieu_dat_ban : "đặt_chỗ"
    tbl_khach_hang ||--o{ tbl_don_goi_mon : "dùng_bữa"
    tbl_khach_hang ||--o{ tbl_hoa_don : "thanh_toán"

    tbl_phieu_dat_ban ||--o| tbl_don_goi_mon : "liên_kết_trừ_cọc"
    tbl_danh_muc_mon ||--o{ tbl_mon_an : "phân_loại"
    tbl_mon_an ||--o{ tbl_chi_tiet_combo : "cấu_thành_combo"
    tbl_mon_an ||--o{ tbl_dinh_muc_mon : "định_mức_BOM"
    tbl_nguyen_lieu ||--o{ tbl_dinh_muc_mon : "tiêu_hao"

    tbl_don_goi_mon ||--|{ tbl_chi_tiet_don_goi : "gồm_các_món"
    tbl_mon_an ||--o{ tbl_chi_tiet_don_goi : "được_gọi"
    tbl_chi_tiet_don_goi ||--o{ tbl_nhat_ky_bep : "ghi_log_KDS"

    tbl_don_goi_mon ||--o| tbl_hoa_don : "chốt_bill_1_1"
    tbl_hoa_don ||--|{ tbl_giao_dich_thanh_toan : "thu_tiền"

    tbl_nhan_vien ||--o| tbl_tai_khoan : "sở_hữu"
    tbl_vai_tro ||--o{ tbl_tai_khoan : "phân_quyền_RBAC"
    tbl_nhan_vien ||--o{ tbl_phan_cong_ca : "trực_ca"
    tbl_ca_lam_viec ||--o{ tbl_phan_cong_ca : "khung_giờ"
    tbl_khu_vuc ||--o{ tbl_phan_cong_ca : "khu_vực_trực"
    tbl_nhan_vien ||--o{ tbl_don_nghi_phep : "xin_nghỉ_và_thay_ca"
    tbl_ca_lam_viec ||--o{ tbl_don_nghi_phep : "ca_xin_nghỉ"
    tbl_nhan_vien ||--o{ tbl_bang_luong : "nhận_lương"

    tbl_nha_cung_cap ||--o{ tbl_phieu_nhap_hang : "cung_ứng"
    tbl_phieu_nhap_hang ||--|{ tbl_chi_tiet_phieu_nhap : "chi_tiết_lô"
    tbl_nguyen_lieu ||--o{ tbl_chi_tiet_phieu_nhap : "nhập_kho"

    tbl_phieu_dat_ban ||--o| tbl_so_quy_dong_tien : "ThuTienCoc"
    tbl_giao_dich_thanh_toan ||--o| tbl_so_quy_dong_tien : "ThuHoaDon"
    tbl_phieu_nhap_hang ||--o{ tbl_so_quy_dong_tien : "ChiNhapHang"
    tbl_bang_luong ||--o{ tbl_so_quy_dong_tien : "ChiLuong"
```

### 5.2 Danh mục 27 Bảng dữ liệu ánh xạ trong Store/Database
Toàn bộ 27 bảng từ báo cáo (`tbl_khu_vuc`, `tbl_ban`, `tbl_khach_hang`, `tbl_khach_doan`, `tbl_danh_muc_mon`, `tbl_mon_an`, `tbl_chi_tiet_combo`, `tbl_dinh_muc_mon`, `tbl_phieu_dat_ban`, `tbl_don_goi_mon`, `tbl_chi_tiet_don_goi`, `tbl_nhat_ky_bep`, `tbl_hoa_don`, `tbl_giao_dich_thanh_toan`, `tbl_nhan_vien`, `tbl_ca_lam_viec`, `tbl_phan_cong_ca`, `tbl_don_nghi_phep`, `tbl_bang_luong`, `tbl_nha_cung_cap`, `tbl_nguyen_lieu`, `tbl_phieu_nhap_hang`, `tbl_chi_tiet_phieu_nhap`, `tbl_so_quy_dong_tien`, `tbl_tai_khoan`, `tbl_vai_tro`, `tbl_yeu_cau_khach_hang`) được định nghĩa kiểu TypeScript chuẩn xác 100% theo đúng tên cột và ràng buộc `CHECK IN` trong Mục 4.4 của báo cáo.

### 5.3 Hợp đồng API / Service Layer (API Contract)
| Nhóm phân hệ | Method / Action | Endpoint / Service Action | Quyền RBAC | Quy tắc kiểm soát đặc biệt |
|:---|:---|:---|:---|:---|
| **MOD-01** | `POST` | `/api/v1/tables/:maBan/open` | `Waitstaff`, `Manager` | Chọn 1 trong 4 nhóm khách; gắn `VIP Flag` nếu khách VIP; hỗ trợ ghép bàn (`ma_ban_chinh`). |
| **MOD-01** | `POST` | `/api/v1/tables/:maBan/delete-session` | `Waitstaff`, `Manager` | **Nút DELETE bàn**: Chỉ cho phép khi `HoaDon.trang_thai_tt === 'DaThanhToan'`. |
| **MOD-04 / 09** | `POST` | `/api/v1/orders/:maOrder/items` | `Waitstaff`, `GuestQR` | Kiểm tra `MonAn.trang_thai_mon === 'ConMon'`; lưu `muc_do_cay_yc` (0–3) & đẩy xuống KDS. |
| **MOD-04** | `DELETE` | `/api/v1/orders/items/:maChiTietOrder` | `Waitstaff` | Chỉ cho phép hủy khi `trang_thai_mon === 'ChoCheBien'`; chặn hủy nếu Bếp đã bấm nấu. |
| **MOD-05** | `PATCH` | `/api/v1/kds/items/:maChiTietOrder/status` | `Kitchen` | Khi chuyển sang `'HoanThanh'`: trừ tồn kho BOM, phát chuông `Ting` và **tự động nạp món vào Bill**. |
| **MOD-04** | `POST` | `/api/v1/orders/:maOrder/lock-bill` | `Waitstaff` | Kiểm Bill cùng khách & Chốt Bill: chỉ tính các món `IN ('HoanThanh', 'DaPhucVu')`, chuyển bàn sang màu Cam. |
| **MOD-06** | `POST` | `/api/v1/invoices/:maHoaDon/pay` | `Cashier` | **Chế độ Read-Only**: Chặn 403 mọi yêu cầu sửa/xóa món; tự động trừ cọc, giảm VIP, tính VAT & ghi `ThuHoaDon`. |
| **MOD-07** | `GET / POST` | `/api/v1/hr/shifts` & `/api/v1/hr/leaves` | `Manager`, `HR` | Hiển thị rõ `Ca nào – Giờ nào – Khu vực nào`; lọc nghỉ phép 3 trạng thái `DaNghi`, `DangNghi`, `SapNghi`. |
| **MOD-08** | `GET / POST` | `/api/v1/owner/cashflow` & `/api/v1/owner/imports` | **Chỉ `Owner`** | **Chặn 403 tuyệt đối với `Manager`**; tự động cộng kho, cập nhật công nợ NCC và ghi `ChiNhapHang`. |

---

## 6. Kiến Trúc Công Nghệ Đã Chốt (React + Node.js + Cloud MySQL + Render)

Theo yêu cầu của bạn, hệ thống sử dụng kiến trúc **React + Node.js + MySQL** tối ưu hóa cho triển khai **Render + Cloud MySQL miễn phí**:

### 6.1 Chi tiết Tech Stack
- **Frontend (Client UI)**: **React 19 + Vite + TypeScript + CSS Variables Design System + Socket.io-client + Lucide Icons**.
- **Backend (Server API & Realtime)**: **Node.js + Express.js + Socket.io + `mysql2/promise`** (hỗ trợ Connection Pool, SSL/TLS cho Cloud DB, REST API `/api/v1/*`, Middleware kiểm soát RBAC chặn HTTP 403 khi Quản lý sảnh gọi API doanh thu hoặc Thu ngân gọi API sửa món).
- **Cơ sở dữ liệu (Database)**: **MySQL 8.0** chuẩn 3NF gồm đầy đủ **27 bảng dữ liệu** (`database/schema.sql` & `database/seed.sql`).
  - **Cơ chế Auto-Migrate & Auto-Seed**: Khi server Node.js khởi động trên Render (hoặc chạy lệnh `npm run db:init`), hệ thống tự động tạo đủ 27 bảng MySQL và nạp dữ liệu mẫu nếu DB đang trống.
  - **Cơ chế Hybrid Fallback thông minh**: Nếu biến môi trường `DATABASE_URL` / `DB_HOST` được cấu hình (trên Render hoặc máy local có MySQL), hệ thống chạy trực tiếp trên MySQL thật; nếu chạy thử nghiệm nhanh khi chưa bật MySQL, Server tự động kích hoạt MySQL-compatible Store trong bộ nhớ để ứng dụng luôn chạy mượt 100% không bao giờ lỗi kết nối.
- **Triển khai Cloud (Deployment Architecture)**:
  - **Ứng dụng Web trên Render (`render.yaml`)**: Cấu hình Unified Web Service trên Render Free Tier — trong quá trình build trên Render, Vite sẽ build React ra thư mục `dist/` và Express Server sẽ vừa phục vụ giao diện React, vừa chạy `/api/v1/*` và `Socket.io` trên cùng 1 cổng `PORT` (tránh hoàn toàn lỗi CORS và giới hạn ngủ của 2 service rời).
  - **CSDL Cloud MySQL Miễn phí khuyên dùng**:
    1. **Aiven for MySQL (Free Tier — Khuyên dùng số 1)**: Miễn phí vĩnh viễn 1 MySQL 8.0 instance (1GB RAM, 5GB SSD), cung cấp sẵn `Service URI` (`mysql://avnadmin:...@...aivencloud.com:.../defaultdb?ssl-mode=REQUIRED`) dán thẳng vào biến `DATABASE_URL` trên Render.
    2. **TiDB Cloud Serverless (Free Tier)**: Tương thích 100% MySQL, miễn phí 25GB lưu trữ.
    3. **Clever Cloud / Filess.io (Free MySQL Add-on)**.
