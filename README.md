# 🍽️ Restaurant Asia - Hệ Thống Quản Lý Nhà Hàng

Dự án phát triển ứng dụng quản lý nhà hàng toàn diện (POS, Bếp, Sơ đồ bàn, Quản trị thực đơn & Báo cáo thu chi).

---

## 👥 Bảng Phân Công Nhiệm Vụ & Phân Nhánh (Team Members)

Mỗi thành viên làm việc độc lập trên nhánh của mình. Bấm vào tên nhánh để chuyển nhanh trên GitHub:

| STT | Thành viên | Nhánh làm việc | Chức năng phụ trách | Thư mục chính |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Thắng** | [`feature/pos-billing`](https://github.com/TanQuyn-IOS/Restaurant_Asia/tree/feature/pos-billing) | **Thu ngân & Thanh toán:** Bán hàng, tạo hóa đơn, in bill, tính tiền | `src/components/POS/` |
| 2 | **Thiện** | [`feature/kitchen-waiter`](https://github.com/TanQuyn-IOS/Restaurant_Asia/tree/feature/kitchen-waiter) | **Phục vụ & Bếp:** Gọi món tại bàn, màn hình hiển thị order trong bếp (KDS) | `src/components/Kitchen/`, `src/components/Waiter/` |
| 3 | **Hào** | [`feature/floorplan-tables`](https://github.com/TanQuyn-IOS/Restaurant_Asia/tree/feature/floorplan-tables) | **Sơ đồ & Bàn ăn:** Tạo sơ đồ bàn theo tầng, trạng thái bàn, đặt bàn trước | `src/components/FloorPlan/` |
| 4 | **Anh** | [`feature/admin-management`](https://github.com/TanQuyn-IOS/Restaurant_Asia/tree/feature/admin-management) | **Quản trị & Báo cáo:** Quản lý thực đơn, nhân sự, nhập kho & thống kê doanh thu | `src/components/Menu/`, `src/components/Staff/`, `src/components/Analytics/` |

---

## 🚀 Hướng Dẫn Cài Đặt Dự Án

### 1. Clone dự án về máy:
```bash
git clone https://github.com/TanQuyn-IOS/Restaurant_Asia.git
cd Restaurant_Asia
```

### 2. Cài đặt thư viện:
```bash
npm install
```

### 3. Cấu hình biến môi trường:
Tạo file `.env` (tham khảo `.env.example`) và điền API key nếu có:
```env
GEMINI_API_KEY=your_api_key_here
```

### 4. Chạy dự án ở chế độ phát triển:
```bash
npm run dev
```

---

## 📌 Quy Trình Làm Việc Nhóm Với Git (Bắt Buộc)

> **LƯU Ý:** Tuyệt đối **KHÔNG** code hoặc push trực tiếp lên nhánh `main`.

### Bước 1: Chuyển sang nhánh của mình trước khi code
Mỗi bạn chỉ làm việc trên nhánh đã được phân công:
* **Thắng:** `git checkout feature/pos-billing`
* **Thiện:** `git checkout feature/kitchen-waiter`
* **Hào:** `git checkout feature/floorplan-tables`
* **Anh:** `git checkout feature/admin-management`

### Bước 2: Lưu và đẩy code lên GitHub
Sau khi code xong chức năng:
```bash
git add .
git commit -m "feat: mô tả chức năng vừa làm"
git push origin <tên-nhánh-của-mình>
```

### Bước 3: Tạo Pull Request (PR)
1. Lên GitHub: https://github.com/TanQuyn-IOS/Restaurant_Asia/pulls
2. Nhấn nút **New pull request**.
3. Chọn gộp từ nhánh của bạn vào nhánh `main`.
4. Báo cho nhóm trưởng để duyệt và gộp code vào `main`.
