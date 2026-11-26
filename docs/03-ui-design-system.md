# 03 — Hệ Thống Thiết Kế Giao Diện & Hợp Đồng Triển Khai UI (AC-RMS v2.0)

> **Phạm vi**: Dựng lại **tầng giao diện** của AC-RMS theo 18 ảnh mockup trong [`ui-mockups/`](./ui-mockups) (React 19 + TypeScript + Vite + **Tailwind CSS v4**), chuyển toàn bộ chữ sang tiếng Việt, tách **route riêng cho Mobile QR**.
> **Giữ nguyên** (không sửa): `src/store/`, `src/data/seedData.ts`, `src/types/database.ts`, `src/utils/`, `server/`, `database/` — toàn bộ nghiệp vụ, 27 bảng 3NF, realtime, unit test.
> **Thay thế**: `src/App.tsx`, `src/features/*`, `src/styles/design-system.css`. Bản UI cũ (v1.0) được sao lưu nguyên vẹn (đã đối chiếu hash) tại [`legacy/ui-v1.0/`](../legacy/ui-v1.0) — **chỉ đọc để tham khảo luồng nghiệp vụ**, không import.
> Quyết định kiến trúc: [ADR-002](./ADR-002-ui-rebuild-tailwind-router.md).

---

## 1. Hợp đồng thiết kế (Design Contract)

| Mục | Quyết định |
|:---|:---|
| **Mode** | **OPERATE** cho bộ nhân viên (quét nhanh, nhất quán, mật độ vừa); một khoảnh khắc **PERSUADE** nhỏ ở Cổng khách QR (hero serif). |
| **Cảnh sử dụng** | Nhân viên liếc màn hình giữa ca đông khách dưới ánh đèn vàng ấm của phòng ăn; khách cầm điện thoại ở bàn → **nền sáng giấy dó**, khung điều hướng **than chì**, nhấn **chu sa + đồng thau**. |
| **THESIS** | "Sổ tay của một nhà hàng có tay nghề": giấy ấm, mực đậm, một màu đỏ son duy nhất làm hành động chính. Từ chối: dashboard xanh–tím, thẻ icon tròn, gradient. |
| **OWN-WORLD** | Canvas `#F7F5F0`, sidebar `#25211F`, primary chu sa `#A82F2B`, accent đồng `#B3863A`; 4 màu trạng thái bàn Xanh ngọc / Vàng hổ phách / Đỏ chu sa / Cam đồng. Thẻ viền hairline, bo 8–12px, **không đổ bóng nặng**. |
| **Font** | Đúng **2 font**: `Source Serif 4` (display: tên thương hiệu `t-brand`, hero `t-hero`, tiêu đề trang `t-page`, tiêu đề modal/sheet/QR `t-display`) + `Be Vietnam Pro` (điều hướng, bảng, nút, số liệu, form, nội dung). Cả hai hỗ trợ đầy đủ dấu tiếng Việt; `Source Serif 4` có biến thể `opsz` tự điều chỉnh nét theo cỡ chữ. |
| **Thang cỡ chữ** | `text-xs 12` · `sm 14` · `base 16` · `lg 20` · `xl 24` · `2xl 32` · `3xl 48` — **không có cỡ nào khác**. |
| **Weight** | Chỉ `font-normal 400` · `font-medium 500` · `font-bold 700`. |
| **Emphasis tiêu đề** | Chọn **một**: italic *hoặc* màu *hoặc* đậm. |
| **Motion** | 1 khoảnh khắc điều phối (mở sheet/modal `animate-rise`, `animate-sheet-up`); hover = đổi màu; tôn trọng `prefers-reduced-motion` (đã xử lý global). |
| **Ngôn ngữ & viết chữ** | 100% tiếng Việt tự nhiên, ngắn gọn. Không hiện mã nội bộ (`MOD-0x`, `FR-xx`, `UC-xx`, `tbl_*`) hay dòng kicker in hoa dư thừa trên tiêu đề. Tiền: `formatVnd()` → `285.000 ₫`. |

---

## 2. Quy tắc Tailwind (bắt buộc — có lint)

`src/styles/index.css` **xóa bảng màu mặc định** của Tailwind: chỉ dùng token bên dưới. Chạy `npm run lint:ui` — fail nếu dùng `font-semibold`, `text-[13px]`, `bg-blue-500`, hex thô `#fff`, `bg-gradient-*`, `fontFamily` inline.

**Màu (dùng như `bg-canvas`, `text-ink-muted`, `border-line`, …)**

| Nhóm | Token |
|:---|:---|
| Nền | `canvas` (trang) · `paper` (thẻ) · `paper-warm` (panel yên tĩnh/header bảng) · `sunken` (chip, input nền) |
| Viền | `line` · `line-strong` |
| Chữ | `ink` · `ink-soft` · `ink-muted` (≥4.5:1) · `ink-faint` (trang trí) |
| Khung điều hướng | `chrome` · `chrome-raised` · `chrome-line` · `chrome-ink` · `chrome-muted` |
| Thương hiệu | `primary` · `primary-hover` · `primary-soft` · `gold` · `gold-bright` · `gold-soft` · `gold-ink` |
| 4 trạng thái bàn | `st-empty` / `st-booked` / `st-serving` / `st-billing`, mỗi cái có `-soft` (nền nhạt) và `-ink` (chữ trên nền nhạt) |
| Thông tin | `info` · `info-soft` · `info-ink` |
| Khách QR | `cream` · `cream-line` |

> Chữ màu trạng thái **trên nền nhạt** phải dùng biến thể `*-ink` (đã đạt ≥4.5:1). Dùng `Badge`/`TONE` thay vì tự ghép.

**Kiểu chữ có tên** (utility trong CSS): `t-hero` (48 display) · `t-page` (32 display tiêu đề trang) · `t-display` (24 display modal/sheet/QR) · `t-brand` (16 display tên thương hiệu) · `t-card-title` (16/500 sans) · `t-metric` (32 số KPI sans) · `t-metric-sm` (24 sans) · `t-label` (12/500 nhãn thường) · `num` (tabular-nums — **bắt buộc cho mọi số tiền/giờ/số lượng**).

**Bo & bóng**: `rounded-md 8` (nút, input) · `rounded-lg 12` (thẻ) · `rounded-xl 16` (modal) · `rounded-2xl 24` (sheet). `shadow-card` · `shadow-lift` · `shadow-pop` (chỉ overlay).

**Không dùng**: gradient, glass, thẻ 3 cột bằng nhau có icon tròn ở giữa, hero căn giữa, `border-l-4` màu làm "accent stripe" thẻ (dùng viền trên theo trạng thái như thẻ bàn của mockup là ngoại lệ chính đáng).

---

## 3. Bộ linh kiện dùng chung (đã có — **không tự viết lại, không sửa**)

```ts
import { cn } from '@/lib/cn';
import { formatVnd, formatVndCompact, formatNumber, formatClock, formatDateVi, formatDayMonth,
         minutesSince, formatDuration, initialsOf } from '@/lib/format';
import { TABLE_STATUS_META, ITEM_STATUS_META, CUSTOMER_GROUP_META, CUISINE_META, DISH_AVAILABILITY_META,
         SPICE_LEVELS, LEAVE_STATE_META, CASHFLOW_META, PAYMENT_METHOD_META, GUEST_REQUEST_META,
         ROLE_META, STAFF_ROLES, type Tone } from '@/lib/labels';
import { DEMO_TODAY, useNow } from '@/lib/clock';           // '2026-11-24' — mốc "hôm nay" của seed
import { TONE } from '@/components/ui/tone';                // {badge,dot,solid,border,text,soft} theo Tone
import { Button, IconButton } from '@/components/ui/Button';   // variant: primary|secondary|ghost|danger|gold|dark; size sm|md|lg; icon, iconRight, loading, block
import { Badge, StatusDot } from '@/components/ui/Badge';      // tone, dot, icon, size sm|md
import { Card, CardHeader, CardBody, CardFooter, StatCard } from '@/components/ui/Card';
import { PageHeader, PageBody } from '@/components/ui/PageHeader';  // eyebrow, title, description, actions
import { UnderlineTabs, Segmented } from '@/components/ui/Tabs';    // UnderlineTabs: {id,label,sublabel,index,count,live}
import { Modal, Sheet } from '@/components/ui/Overlay';             // Modal size sm|md|lg|xl; Sheet side right|bottom, frame full|mobile
import { Field, Input, Textarea, Select, Switch, ChoiceChip, QuantityStepper } from '@/components/ui/Form';
import { Avatar, ProgressBar, EmptyState, Table, Th, Td, Tr } from '@/components/ui/Misc';
import { TableStatusBadge, TABLE_STATUS_CARD, CustomerGroupBadge, ItemStatusBadge,
         DishAvailabilityBadge, SpiceMeter, DishImage } from '@/components/domain/badges';
```

`Field` dùng render-prop để gắn `id`/`aria-describedby`:
```tsx
<Field label="Nhân viên nghỉ" error={err}>
  {({ id, describedBy, invalid }) => <Select id={id} aria-describedby={describedBy} invalid={invalid}>…</Select>}
</Field>
```
Mọi trang bọc nội dung bằng `<PageBody>` và mở đầu bằng `<PageHeader eyebrow="… · MOD-0x" title="…" description="…" actions={…} />`.

Nếu cần linh kiện dùng chung mới → tạo trong thư mục feature của bạn (`features/<x>/components/`). **Phát hiện lỗi ở file dùng chung → báo lại, không tự sửa.**

---

## 4. Bản đồ route & quyền sở hữu file

| Route | File (export có tên) | Chủ sở hữu | Vai trò xem |
|:---|:---|:---|:---|
| `/tong-quan` | `features/overview/OverviewPage.tsx` → `OverviewPage` | Điều phối | Tất cả NV |
| `/so-do-ban` | `features/floor/FloorPage.tsx` → `FloorPage` | **Agent FLOOR** | Tất cả NV |
| `/bep` | `features/kds/KitchenPage.tsx` → `KitchenPage` | **Agent OPS2** | Tất cả NV |
| `/thu-ngan` | `features/cashier/CashierPage.tsx` → `CashierPage` | **Agent OPS2** | Tất cả NV |
| `/nhan-su/ca-lam` | `features/hr/ShiftSchedulePage.tsx` → `ShiftSchedulePage` | **Agent PEOPLE-FIN** | Owner · Manager · HR |
| `/nhan-su/nghi-phep` | `features/hr/LeavePage.tsx` → `LeavePage` | **Agent PEOPLE-FIN** | Owner · Manager · HR |
| `/nhan-su/bang-luong` | `features/hr/PayrollPage.tsx` → `PayrollPage` | **Agent PEOPLE-FIN** | Owner · Manager · HR |
| `/tai-chinh/so-quy` | `features/finance/CashflowPage.tsx` → `CashflowPage` | **Agent PEOPLE-FIN** | **Owner** |
| `/tai-chinh/doanh-thu` | `features/finance/RevenuePage.tsx` → `RevenuePage` | **Agent PEOPLE-FIN** | **Owner** |
| `/tai-chinh/kho` | `features/finance/InventoryPage.tsx` → `InventoryPage` | **Agent PEOPLE-FIN** | **Owner** |
| `/thuc-don` | `features/menu/MenuPage.tsx` → `MenuPage` | **Agent ADMIN** | Tất cả NV |
| `/khach-hang` | `features/customers/CustomersPage.tsx` → `CustomersPage` | **Agent ADMIN** | Owner · Manager · Waitstaff · Cashier |
| `/phan-quyen` | `features/rbac/RbacPage.tsx` → `RbacPage` | **Agent ADMIN** | Owner · Manager |
| `/qr` | `features/qr/QrEntryPage.tsx` → `QrEntryPage` | **Agent QR** | Công khai |
| `/qr/:maBan` | `features/qr/QrPortalPage.tsx` → `QrPortalPage` | **Agent QR** | Công khai (khách) |

Chặn quyền xem cấp **trang** do `AppShell` đảm nhiệm (xem `src/app/nav.config.ts`) → trang không cần tự chặn lại, nhưng **hành động nhạy cảm vẫn phải kiểm tra vai trò** (nút disabled + lý do, và gọi `verifyRbacPermission` khi có). Vai trò đọc bằng `useRestaurantStore((s) => s.currentRole)`.

**Mỗi agent chỉ được ghi vào thư mục feature của mình.** Cấm sửa: `src/components/ui|layout|domain`, `src/lib`, `src/app`, `src/styles`, `src/store`, `src/data`, `src/types`, `server/`, `database/`.

---

## 5. Hợp đồng dữ liệu (Store)

```ts
import { useRestaurantStore, calculateCompletedOrderBill, canCancelOrderItem,
         canReleaseTableWithDeleteButton, verifyRbacPermission, classifyLeaveThreeState } from '@/store/useRestaurantStore';
const snapshot = useRestaurantStore((s) => s.snapshot);        // 27 bảng 3NF — chọn selector hẹp để tránh re-render thừa
const openTableSession = useRestaurantStore((s) => s.openTableSession);
```
- **Không viết lại nghiệp vụ**: dùng đúng action của store (mở bàn, gọi món, hủy món, KDS, thanh toán, nghỉ phép, nhập kho…) và hàm thuần ở trên.
- Realtime: store đã đồng bộ localStorage + BroadcastChannel + Socket.io → mở `/qr/B-101` ở **tab mới** sẽ thấy đơn/KDS cập nhật tức thì.
- `lastBannerAlert` của store được `ToastViewport` hiển thị → **không tự dựng toast thành công/thất bại cho action của store**. Với lỗi validate phía form, hiển thị lỗi ngay tại field.
- Mốc "hôm nay" của seed là `DEMO_TODAY = '2026-11-24'`: lọc ca/nghỉ phép/bảng lương theo mốc này.
- Hook chọn dữ liệu phái sinh (join bảng) đặt trong `features/<x>/use<Name>.ts`; component chỉ render.

---

## 6. Đặc tả từng màn hình (đối chiếu ảnh mockup)

> Mở ảnh tương ứng bằng `read_file` **trước khi code**. Bám đúng bố cục, nhịp khoảng cách, thứ bậc chữ, màu; dữ liệu lấy từ store (tiếng Việt), không dùng dữ liệu tiếng Anh trong ảnh.

| Ảnh | Màn hình | Ghi chú bắt buộc |
|:---|:---|:---|
| `01-ops-floor-table-map.png` | **Sơ đồ bàn** | 4 `StatCard` (Tổng số bàn · Còn trống · Khách đang ngồi · Thời gian quay bàn TB); tab khu vực đánh số `01–04` (Tầng 1 / Tầng 2 / VIP / Khu đoàn); hàng chú giải 4 màu + "Gọi món QR: bật"; lưới thẻ bàn (viền trên theo trạng thái, minh họa bàn–ghế, số ghế, icon QR, chip nhóm khách + số tiền/giờ). Nút `Ghép bàn` (secondary) + `Mở bàn` (primary). |
| *(không có ảnh)* | Modal **Mở bàn** · Ngăn **Gọi món** · Modal **Ghép/Chuyển bàn** · Đặt bàn trước | Cùng ngôn ngữ thị giác với modal "Duyệt nghỉ phép" (`06-…`). Mở bàn: chọn 1 trong **4 nhóm khách** (Vãng lai · Thường · VIP · Đoàn có combo/cọc/MST). Gọi món: tab ẩm thực, độ cay 0–3, ghi chú, `Gửi bếp`, `Hủy món` (khóa khi đã nấu), `Kiểm bill cùng khách`, `Chốt bill & chuyển Thu ngân`; bàn đã thanh toán hiện nút **`DELETE — Dọn & giải phóng bàn`** (danger). |
| `02-ops-kitchen-kds.png` | **Màn hình bếp KDS** | Thẻ tổng "Đơn đang chờ" + chú giải Chờ/Đang nấu/Xong + "Sắp xếp: VIP + FIFO"; banner quy tắc "Chỉ món Hoàn thành mới vào bill"; `Segmented` lọc; lưới phiếu 2 cột (VIP ghim đầu, nền `gold-soft`, nhãn "VIP ƯU TIÊN"), đồng hồ phút, nút `Bắt đầu nấu` → `Hoàn thành`; cột phải "Tình trạng món" với `Switch` còn/hết món realtime. |
| `03-ops-cashier-pos-readonly.png` | **Thu ngân POS (chỉ đọc)** | 3 KPI; danh sách "Hóa đơn chờ" (bàn chờ thanh toán) + panel chi tiết; huy hiệu **CHỈ ĐỌC**; thẻ "An toàn theo thiết kế"; hóa đơn khóa dòng món (cố sửa → `attemptIllegalCashierModification`); tính: tiền món hoàn thành − cọc − giảm VIP + VAT 8%; thanh toán Tiền mặt / Thẻ / **VietQR (modal QR)**; `Xuất hóa đơn VAT`. |
| `04-hr-shift-schedule.png` | **Lịch ca làm** | Thẻ "Không gian theo vai trò" (chuyển Quản lý/HR ⇄ Chủ qua `setRole`) + nhãn "Ẩn doanh thu"; 4 KPI; lịch tuần (tab thứ T2–CN); bảng: Nhân viên · Chức vụ · Ca · **Giờ chính xác** · Khu vực · Check-in/out (`toggleShiftCheckInOut`); thẻ khóa "Phân hệ tài chính chỉ dành cho Chủ" ở sidebar (đã có). `Thêm ca` → modal `assignStaffShift`. |
| `05-hr-leave-management.png` + `06-hr-approve-leave-modal.png` | **Nghỉ phép 3 trạng thái** | 3 chỉ số + chip "Đã đồng bộ lương tháng"; tab **Đã nghỉ / Đang nghỉ / Sắp nghỉ** (có số đếm); banner cam khi có người vắng hôm nay; bảng: NV · Chức vụ · Ngày nghỉ · Thời lượng · Lý do · **Người trực thay** · Trạng thái. Modal "Duyệt nghỉ phép & xếp người thay" (khớp ảnh 06) → `submitLeaveRequest` / `approveOrRejectLeave`. |
| `07-hr-shift-payroll.png` | **Bảng lương ca** | 4 KPI (Kỳ lương · Tổng giờ · Khấu trừ nghỉ phép · Trạng thái); bảng lương: Giờ chính xác · Số ca · Lương gộp · Khấu trừ · Thực lĩnh; tổng cuối; chip "Chế độ Quản lý — đã ẩn doanh thu". |
| `08-owner-cashflow-ledger.png` | **Sổ quỹ dòng tiền** (Owner) | 4 KPI (Tiền mặt · Ngân hàng · Dòng tiền ròng · Lãi/Lỗ ròng); sổ cái: tìm kiếm + lọc loại + chú giải 4 loại (Thu cọc · Thu hóa đơn · Nhập hàng · Lương & chi phí), cột Giao dịch · Loại · Thời gian · Hình thức · Số tiền (xanh `+`, đỏ `−`). |
| `09-owner-revenue-analytics.png` | **Phân tích doanh thu** (Owner) | 4 KPI; **donut Recharts** doanh thu theo 4 nhóm khách (tổng ở giữa, legend có % và số tiền); danh sách "Top món bán chạy" có thanh tiến độ; dải ghi chú "Chỉ Chủ nhà hàng được xem". Biểu đồ dùng `var(--color-*)`, có bảng dữ liệu thay thế (a11y). |
| `10-owner-inventory-restock.png` | **Kho & nhập hàng** (Owner) | 4 KPI (Nguyên liệu · Cảnh báo tồn thấp · Công nợ NCC · Giá trị tồn); bảng tồn kho có cột **Tồn / Mức tối thiểu / Đơn giá / NCC / Trạng thái** (badge đỏ "Sắp hết" khi < tối thiểu); panel công nợ NCC + `Ghi nhận thanh toán`; nút `Lập phiếu nhập` → modal (`createWarehouseImportOrder`: NCC, nguyên liệu, SL, đơn giá, **HSD lô**, đã trả/ghi nợ, hình thức quỹ). |
| `11…13-mobile-qr-menu-*.png` | **Cổng QR — Thực đơn** | Khung điện thoại 430px canh giữa trên desktop, full màn trên điện thoại. Header khóa: logo + "Bàn 101 · Tầng 1" + nhãn `ĐÃ KHÓA`; **không có** nút đăng nhập NV; hero serif `t-hero` ("Một chút hương vị *Á Châu*."); chip lọc Tất cả/Việt/Trung/Nhật/Hàn/Thái/Combo; lưới 2 cột thẻ món (ảnh, tên, mô tả, giá, badge cay, nút +; **HẾT MÓN** làm mờ + khóa); thanh dưới dính: giỏ hàng + `Xem đơn`; 2 tab dưới "Tiến độ bếp" (chấm đỏ) / "Tạm tính"; nút nổi `Gọi phục vụ`. |
| `14-mobile-qr-dish-spice-modal.png` | **Chi tiết món** | Bottom-sheet: ảnh, nhãn ẩm thực, tên (display), mô tả, giá, **độ cay 0–3** (4 ô chọn), ghi chú ăn uống (Không hành · Chay · Không đậu phộng · Không gluten), stepper số lượng + nút `Thêm vào đơn — giá`. |
| `15,16-mobile-qr-kitchen-status-*.png` | **Tiến độ bếp** | Mỗi món: ảnh nhỏ, SL×tên, ghi chú, badge trạng thái, **thanh 3 mốc Chờ → Nấu → Xong**; cập nhật realtime khi bếp bấm. |
| `17-mobile-qr-bill-preview.png` | **Tạm tính** | Banner "Chỉ món đã phục vụ mới nằm trong hóa đơn"; danh sách món đã xong, tạm tính, "Phí dịch vụ & VAT: hiển thị ở hóa đơn cuối", tổng tạm tính. |
| `18-mobile-qr-call-waiter-sheet.png` | **Gọi hỗ trợ** | Sheet 4 hành động: Xin nước · Khăn lạnh · Kiểm tra hóa đơn · Gọi nhân viên → `sendGuestQrSupportRequest` (hiện ở chuông thông báo của NV). |

**Màn hình ngoài mockup** (`/tong-quan`, `/thuc-don`, `/khach-hang`, `/phan-quyen`, `/qr` chọn bàn) phải **dùng đúng cùng ngôn ngữ thị giác** (PageHeader + StatCard + Card + Table…), không tạo phong cách mới.

---

## 7. Responsive, A11y, Chất lượng (Definition of Done mỗi màn hình)

- [ ] Hiển thị đúng ở **375 / 768 / 1024 / 1440px** (sidebar → drawer < 1024; bảng cuộn ngang trong `Table`; lưới giảm cột). QR: tối ưu 375–430px, chạm ≥ 44px.
- [ ] **Mọi trạng thái**: loading/empty (`EmptyState`) / lỗi / disabled-có-lý-do. Không có nút bấm vô tác dụng.
- [ ] Bàn phím: mọi điều khiển focus được, thứ tự hợp lý, modal bẫy focus (đã có trong `Modal`/`Sheet`); icon-only button có `aria-label` (`IconButton label`).
- [ ] Không chỉ dựa vào màu: trạng thái luôn có **chữ** (badge) kèm chấm màu; biểu đồ có bảng/legend số liệu.
- [ ] Tương phản AA (dùng token `*-ink` trên nền nhạt). Số/tiền/giờ dùng `num`.
- [ ] Ảnh món dùng `DishImage` (fallback offline), `loading="lazy"`.
- [ ] Không còn `console.log`, `any` không cần thiết, TODO treo; `npm run typecheck` và `npm run lint:ui` sạch **trong thư mục feature của bạn**.
- [ ] Đã tự chạy thử luồng chính trong trình duyệt hoặc test (Vitest + Testing Library không có sẵn — nghiệp vụ đã được `src/tests/businessRules.test.ts` bảo vệ; hãy bổ sung test cho **hàm thuần mới** bạn tạo, đặt trong `features/<x>/*.test.ts`).
