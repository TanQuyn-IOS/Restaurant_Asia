# ADR-001: Kiến Trúc Unified React + Node.js Express/Socket.io + Cloud MySQL 3NF Trên Render

- **Trạng thái**: Approved & Implemented
- **Ngày**: 24/11/2026

## 1. Bối cảnh (Context)
Hệ thống Quản lý Nhà hàng Châu Á (AC-RMS) yêu cầu:
1. Giao diện Web xây dựng bằng **React** phục vụ 7 tác nhân (Khách hàng 4 nhóm, Phục vụ, Bếp KDS, Thu ngân Read-only, Quản lý sảnh, HR, Chủ nhà hàng).
2. Đồng bộ thời gian thực giữa Phục vụ / Mobile QR ↔ Màn hình Bếp KDS ↔ Quầy Thu ngân POS.
3. Lưu trữ đầy đủ **27 bảng CSDL chuẩn 3NF** trên **MySQL** và triển khai dễ dàng lên **Render** kết nối với **Cloud MySQL miễn phí** (Aiven Free MySQL / TiDB Cloud Serverless).

## 2. Quyết định Kiến trúc (Decision)
- **Unified Full-Stack Deployment (`render.yaml`)**: Trong môi trường Production trên Render, tiến trình Node.js (`server/index.ts`) vừa phục vụ bản build tĩnh của React (`dist/`), vừa cung cấp REST API `/api/v1/*` và WebSocket `Socket.io` trên cùng 1 cổng `PORT`.
- **Hybrid MySQL 3NF Engine (`server/db/mysqlPool.ts`)**: Kết nối tới Cloud MySQL qua `mysql2/promise` với SSL/TLS và tự động chạy `database/schema_27_tables.sql` + `database/seed_27_tables.sql` khi `AUTO_INIT_DB=true`. Khi chạy ở môi trường local chưa cấu hình `DATABASE_URL`, hệ thống tự động dùng bộ nhớ 27 bảng chuẩn 3NF để không bao giờ bị gián đoạn.

## 3. Hệ quả (Consequences)
- Triển khai lên Render chỉ tốn **1 Web Service miễn phí duy nhất**, không gặp lỗi CORS hay lỗi mất kết nối WebSocket giữa 2 domain khác nhau.
- Đảm bảo 100% các chốt chặn bảo mật nội bộ (Thu ngân Read-only 403, Quản lý sảnh bị ẩn doanh thu 403) ở cả tầng React UI lẫn tầng Express API.
