# Restaurant Asia - Mobile Waiter Application (React Native)

Ứng dụng di động dành riêng cho nhân viên phục vụ bàn (Waiter & Floor Staff) thuộc hệ thống Restaurant Asia Three-Tier Architecture.

## 1. Tính Năng Chính
- **Sơ đồ bàn thời gian thực:** Đồng bộ trạng thái bàn (Trống, Đang ăn, Đang dọn dẹp) với Web POS và MySQL.
- **Nhận thông báo Real-time từ Bếp (KDS):** Lắng nghe sự kiện `kitchen.item_ready` qua Socket.IO và rung/chuông khi món ăn nấu xong.
- **Xác nhận phục vụ (Served):** Nhân viên xác nhận đã bưng món ra bàn chỉ với 1 chạm.
- **Gọi phục vụ & Hỗ trợ:** Tiếp nhận các yêu cầu gọi nước, đổi bát đũa, xin hóa đơn từ khách tại bàn.

## 2. Cài Đặt & Khởi Chạy
```bash
cd mobile
npm install
npm start
```

### Chạy trên thiết bị thật hoặc máy ảo:
- **Android:** `npm run android`
- **iOS:** `npm run ios`
- **Expo Go:** Quét mã QR hiển thị trên màn hình terminal bằng ứng dụng Expo Go trên điện thoại.
