# APPLICATION SECURITY AUDIT REPORT
## DỰ ÁN: RESTAURANT ASIA / QUẢN LÝ NHÀ HÀNG PRO
## TIÊU CHUẨN: OWASP TOP 10 API SECURITY & ENTERPRISE THREE-TIER V2.4

---

| Thông Tin Đánh Giá | Chi Tiết |
| :--- | :--- |
| **Phạm vi kiểm toán** | Tầng Web SPA, API Backend, Socket.IO Realtime, Cơ sở dữ liệu MySQL |
| **Vai trò thực hiện** | Application Security Engineer & Lead Architect |
| **Mục tiêu an ninh** | Triệt tiêu hoàn toàn các lỗ hổng OWASP: Nâng quyền (Privilege Escalation), SQL Injection, Bỏ qua phân quyền (BOLA/BFLA), Brute-force, Thu hồi phiên đăng nhập và Rò rỉ dữ liệu nhạy cảm |
| **Kết luận an ninh** | **SECURE - ALL HIGH & CRITICAL CONTROLS VERIFIED** |

---

## I. MA TRẬN KIỂM SOÁT AN NINH (SECURITY CONTROL MATRIX)

| Hạng Mục An Ninh | Cơ Chế Kiểm Soát Kỹ Thuật | Trạng Thái | Vị Trí Mã Nguồn / Bằng Chứng |
| :--- | :--- | :---: | :--- |
| **Băm mật khẩu (Password Hashing)** | Bcrypt với hệ số muối (Salt Rounds) = 12 | **ĐẠT** | `backend/src/modules/auth/auth.service.ts:25` |
| **Xác thực JWT (Access Token)** | HMAC-SHA256, thời hạn 15 phút, chứa `userId`, `role`, `tokenVersion` | **ĐẠT** | `backend/src/utils/token.ts:16` |
| **Thu hồi phiên tức thì (Token Revocation)** | Cơ chế `tokenVersion` đối chiếu trực tiếp với database trong mỗi request | **ĐẠT** | `backend/src/middlewares/auth.middleware.ts:58` |
| **Xoay vòng Refresh Token (RTR)** | Cấp phát token mới và thu hồi token cũ; nếu phát hiện tái sử dụng sẽ hủy toàn bộ `family` | **ĐẠT** | `backend/src/modules/auth/auth.service.ts:108` |
| **Phân quyền vai trò (RBAC)** | Middleware `requireRoles(...)` kiểm soát chặt chẽ ở tầng Backend | **ĐẠT** | `backend/src/middlewares/rbac.middleware.ts:5` |
| **Bảo vệ tài khoản mới (Activation Guard)** | Bắt buộc đổi mật khẩu lần đầu (`mustChangePassword`) trước khi thực hiện nghiệp vụ | **ĐẠT** | `backend/src/middlewares/activation.middleware.ts:4` |
| **Xác thực dữ liệu đầu vào (Input Validation)** | Thư viện Zod Schema kiểm tra kiểu, độ dài, khoảng giá trị trước Controller | **ĐẠT** | `backend/src/middlewares/validate.middleware.ts` |
| **Chống tấn công SQL Injection** | Sử dụng Prisma ORM Parameterized Query và Prepared Statements | **ĐẠT** | Toàn bộ 17 Domain Services |
| **Chống tấn công Brute-force** | Rate limiting trên endpoint `/api/v1/auth/login` (30 req/min/IP) | **ĐẠT** | `backend/src/modules/auth/auth.routes.ts:13` |
| **Bảo vệ tiêu đề HTTP (Security Headers)** | Middleware `helmet()` chống Clickjacking, MIME sniffing, HSTS | **ĐẠT** | `backend/src/app.ts:30` |
| **Kiểm soát nguồn gốc (CORS)** | Giới hạn chính xác danh sách whitelist domain được phép gọi API | **ĐẠT** | `backend/src/app.ts:32` |
| **Bảo vệ Socket.IO Realtime** | Xác thực JWT trong handshake; bảo vệ các room nghiệp vụ (`kitchen`, `cashier`, `waiter`) | **ĐẠT** | `backend/src/realtime/socket.ts:17-38` |
| **Bảo vệ chống trùng lặp (Idempotency)** | Middleware `idempotencyGuard` lưu cache kết quả theo `X-Idempotency-Key` | **ĐẠT** | `backend/src/middlewares/idempotency.middleware.ts` |
| **Kiểm toán bất biến (Audit Logging)** | Ghi nhận chi tiết hành động nhạy cảm vào bảng `audit_logs` (IP, User, Payload) | **ĐẠT** | `backend/src/middlewares/audit.middleware.ts` |
| **Chống lộ thông tin nhạy cảm** | Loại bỏ `passwordHash` trong response; lọc redacted logs qua Pino | **ĐẠT** | `backend/src/modules/auth/auth.service.ts:47` |

---

## II. ĐÁNH GIÁ CHI TIẾT CÁC RỦI RO OWASP TOP 10

### 1. BOLA / IDOR (Broken Object-Level Authorization)
- **Rủi ro:** Một người dùng đoán ID đơn hàng hoặc ID thanh toán của người khác để xem trộm hoặc thao tác.
- **Giải pháp:**
  - Tất cả các thao tác nhạy cảm đều thông qua middleware `authenticate` và `requireRoles`.
  - Bàn ăn và đơn hàng kiểm tra tính hợp lệ và ràng buộc trạng thái trước khi cho phép chuyển bàn hoặc thanh toán.
  - Khách hàng vãng lai chỉ có quyền truy cập menu và gửi order vào bàn mà mình đang ngồi (`customerTableId`), không có quyền xem thông tin tài chính hoặc sửa đổi đơn hàng bàn khác.

### 2. Broken Authentication & Session Management
- **Rủi ro:** Token bị rò rỉ hoặc nhân viên bị sa thải nhưng token vẫn còn hiệu lực.
- **Giải pháp:**
  - Access Token có thời hạn ngắn (15 phút).
  - Khi quản trị viên thay đổi vai trò hoặc khóa tài khoản (`isActive = false`), hệ thống tăng `tokenVersion`. Middleware `auth.middleware.ts` kiểm tra `user.tokenVersion !== payload.tokenVersion` và từ chối truy cập ngay lập tức (`TOKEN_OUTDATED`).
  - Refresh Token được lưu dưới dạng băm SHA-256 trong MySQL và xoay vòng theo họ (`family`).

### 3. Privilege Escalation (Tự nâng quyền)
- **Rủi ro:** Người dùng gửi request sửa đổi trường `role` hoặc `roleId` của mình.
- **Giải pháp:**
  - Quyền hạn được đọc trực tiếp từ bảng `roles` trong cơ sở dữ liệu qua token xác thực, tuyệt đối không tin cậy dữ liệu truyền lên từ client.
  - Các endpoint quản lý nhân sự, phân quyền chỉ mở cho vai trò `ADMIN`. Trong bài test `concurrency_idempotency.test.ts`, nhân viên Thu ngân (`CASHIER`) gọi endpoint `/hr/employees` đã bị chặn đứng với mã lỗi `403 Forbidden`.

### 4. Injection Attacks (SQL Injection, XSS)
- **SQL Injection:**
  - 100% các truy vấn cơ sở dữ liệu thông qua Prisma ORM Client đều được tham số hóa tự động (Parameterized Queries).
  - Các câu lệnh SQL đặc biệt như `SELECT ... FOR UPDATE SKIP LOCKED` trong Outbox Worker sử dụng bind parameters hoặc escaped literals, loại trừ hoàn toàn nguy cơ chèn chuỗi độc hại.
- **Cross-Site Scripting (XSS):**
  - Tầng hiển thị React 19 tự động escape toàn bộ dữ liệu động render ra DOM.
  - Tầng Backend kích hoạt Helmet cấu hình `Content-Security-Policy`, `X-XSS-Protection`, `X-Content-Type-Options: nosniff`.

### 5. Sensitive Data Exposure & Logging
- Trong tất cả các luồng xác thực và truy vấn người dùng, trường `passwordHash` luôn được loại trừ khỏi đối tượng trả về (`select: { id: true, username: true, fullName: true, role: true }`).
- Logger Pino được cấu hình không ghi nhận mật khẩu thô và token ra console/file logs.

---

## III. KẾT LUẬN VỀ AN NINH HỆ THỐNG
Hệ thống Restaurant Asia đáp ứng đầy đủ các tiêu chuẩn bảo mật cho ứng dụng F&B cấp doanh nghiệp. Không phát hiện bất kỳ lỗ hổng bảo mật mức CRITICAL hoặc HIGH nào trong toàn bộ mã nguồn và cấu hình đã kiểm toán.
