# ADR-002 — Dựng lại tầng UI: Tailwind CSS v4 + React Router, giữ nguyên lõi nghiệp vụ

- **Trạng thái**: Chấp nhận (2026-11-24)
- **Bối cảnh**: v1.0 có đủ 10 phân hệ nhưng UI viết bằng một file CSS riêng, điều hướng bằng `activeTab` trong store, và chưa khớp bộ mockup 18 màn hình (thiết kế bằng v0). Yêu cầu mới: bám đúng mockup, toàn bộ tiếng Việt, dùng Tailwind CSS, **Mobile QR có route riêng**.
- **Quyết định**
  1. **Giữ** lớp domain: `src/store` (Zustand + realtime + hàm nghiệp vụ thuần), `src/data/seedData.ts` (27 bảng), `src/types`, `server/`, `database/`, test hiện có. Rủi ro hồi quy nghiệp vụ = 0.
  2. **Thay** lớp trình bày: `App.tsx`, `features/*`, `design-system.css` → `app/` (router, nav) + `components/{ui,layout,domain}` + `features/*` mới.
  3. **Tailwind v4 (CSS-first)** với `@theme` làm *single source of truth* của token; xóa bảng màu mặc định để **ép dùng token** (lint `npm run lint:ui`).
  4. **React Router v7**: URL là nguồn sự thật của điều hướng (`/so-do-ban`, `/bep`, `/qr/:maBan`…) → chia sẻ link, nút Back, mở QR ở tab mới. `activeTab`/`qrLockedTableId` trong store thành *legacy*, UI mới không đọc.
  5. **Code-splitting theo route** (`React.lazy`) để Recharts không nằm trong bundle đầu.
  6. **Cổng QR** nằm **ngoài** `AppShell` (không sidebar, không điều hướng nhân viên) — thực thi quy tắc FR-25 *"ẩn hoàn toàn đăng nhập NV"* bằng cấu trúc route, không bằng `if`.
  7. Chặn quyền xem cấp trang tập trung ở `AppShell` (`nav.config.ts`), hành động nhạy cảm vẫn kiểm tra tại màn hình + store.
- **Hệ quả**
  - (+) UI nhất quán, kiểm soát được bằng token + lint; điều hướng chuẩn web; bundle đầu nhẹ.
  - (−) Hai hệ thống style song song không còn: CSS cũ bị xóa. Bản UI cũ lưu tại `legacy/ui-v1.0/` (chỉ tham khảo; có thể xóa sau khi nghiệm thu).
  - (−) Thêm 4 phụ thuộc: `tailwindcss`, `@tailwindcss/vite`, `react-router-dom`, `recharts` (+ `clsx`).
- **Phương án đã loại**: (a) giữ CSS thủ công — không đáp ứng yêu cầu Tailwind; (b) Next.js — thêm SSR/độ phức tạp không cần cho SPA có sẵn Express; (c) xây app mới song song — nhân đôi nghiệp vụ & rủi ro lệch.
