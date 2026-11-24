# AC-RMS — Hệ Thống Quản Lý & Điều Hành Toàn Diện Chuỗi Nhà Hàng Ẩm Thực Châu Á
**Trường Đại học Kiến trúc Đà Nẵng — Khoa Công nghệ Thông tin**  
**Đề tài học phần Phân tích Hệ thống Thông tin** | **Nhóm thực hiện**: Nhóm PCCC (Lớp 23CT2) | **GVHD**: TS. Đặng Hùng Vĩ

---

## 1. Kiến trúc Công nghệ (React + Node.js + Cloud MySQL + Render)
- **Frontend**: React 19 + Vite + TypeScript + CSS Variables Design System (`Spectral` + `Be Vietnam Pro`) + `Socket.io-client` + Zustand Cross-Tab Sync.
- **Backend**: Node.js + Express + `Socket.io` (`server/index.ts`) + `mysql2/promise` (`server/db/mysqlPool.ts`).
- **Cơ sở dữ liệu (27 Bảng chuẩn 3NF)**:
  - File cấu trúc bảng MySQL 8.0: [`database/schema_27_tables.sql`](./database/schema_27_tables.sql)
  - File dữ liệu mẫu 27 bảng: [`database/seed_27_tables.sql`](./database/seed_27_tables.sql)

---

## 2. Hướng dẫn chạy Local (1 Lệnh duy nhất)

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy đồng thời cả Frontend React (cổng 5173) và Backend Node.js + Socket.io (cổng 4000)
npm run dev
```
> **Lưu ý thông minh**: Nếu bạn chưa cấu hình biến `DATABASE_URL` trong file `.env`, Backend Node.js sẽ tự động kích hoạt **Hybrid MySQL 3NF Engine (27 bảng sẵn có trong bộ nhớ)** để bạn chạy demo đầy đủ 100% tính năng ngay lập tức. Khi bạn điền `DATABASE_URL` của Cloud MySQL vào `.env`, hệ thống sẽ tự động tạo 27 bảng và đồng bộ trực tiếp lên MySQL thật.

---

## 3. Hướng dẫn Đưa CSDL MySQL lên Cloud Miễn phí & Deploy lên Render

### Bước 1: Tạo CSDL Cloud MySQL Miễn phí (Khuyên dùng Aiven hoặc TiDB Cloud)
1. Truy cập **[Aiven Console](https://console.aiven.io/)** (hoặc **[TiDB Cloud Serverless](https://tidbcloud.com/)**).
2. Chọn **Create Service** → Chọn **MySQL** → Chọn gói **Free Plan (Miễn phí vĩnh viễn: 1GB RAM, 5GB Storage)**.
3. Sau khi khởi tạo xong (khoảng 1–2 phút), copy đường dẫn **Service URI**:
   ```text
   mysql://avnadmin:MAT_KHAU@mysql-xxxx.aivencloud.com:12345/defaultdb?ssl-mode=REQUIRED
   ```

### Bước 2: Đưa ứng dụng React + Node.js lên Render (Free Tier)
Dự án đã có sẵn file cấu hình [`render.yaml`](./render.yaml) (Unified Web Service: Render tự build React ra `dist/` và chạy Node.js Express phục vụ cả giao diện lẫn REST API `/api/v1/*` và `Socket.io` trên cùng 1 domain):
1. Đẩy thư mục dự án này lên GitHub repository của bạn.
2. Đăng nhập **[Render Dashboard](https://dashboard.render.com/)** → Bấm **New +** → Chọn **Web Service** (hoặc **Blueprint**).
3. Kết nối tới GitHub repo của bạn:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Trong mục **Environment Variables** trên Render, thêm các biến sau:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = *(Dán Service URI MySQL từ Aiven / TiDB Cloud ở Bước 1)*
   - `DB_SSL` = `true`
   - `AUTO_INIT_DB` = `true` *(Server sẽ tự động chạy `schema_27_tables.sql` và `seed_27_tables.sql` tạo đủ 27 bảng ngay lần khởi động đầu tiên!)*
5. Bấm **Deploy Web Service** — hoàn tất!
