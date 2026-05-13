Tôi sẽ phân tích kỹ từng màn hình trước khi đưa ra PRD.

**Nhận xét tổng quan:** Dashboard hiện tại có nền đen, layout sạch nhưng **quá tối giản đến mức trống rỗng** — thiếu visual hierarchy, không truyền tải được cảm giác "smart" và "professional" của một hệ thống IoT thực thụ.

---

## PRD — SmartOffice Dashboard Redesign

---

### 1. TỔNG QUAN VẤN ĐỀ

| Màn hình | Vấn đề cốt lõi |
|---|---|
| **Tổng quan** | 4 card số liệu trơ trọi, không có chart/trend, nửa dưới hoàn toàn trống |
| **Chấm công** | Table thuần, không có filter/search, không highlight trạng thái nổi bật |
| **Nhân viên** | Danh sách phẳng, thiếu avatar/badge, không có action |
| **Cài đặt** | Trang **hoàn toàn trắng** — lỗi render hoặc chưa build |

---

### 2. DESIGN SYSTEM — NỀN TẢNG TRƯỚC KHI LÀM GÌ CŨNG PHẢI CÓ

**2.1 Color Palette mới**

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--bg-base` | `#0A0F1E` | Nền toàn trang |
| `--bg-surface` | `#111827` | Card, panel |
| `--bg-elevated` | `#1C2537` | Hover state, active row |
| `--accent-primary` | `#3B82F6` (Blue) | CTA, active nav, border highlight |
| `--accent-success` | `#10B981` (Emerald) | Đúng giờ, online, OK |
| `--accent-warning` | `#F59E0B` (Amber) | Trễ, cảnh báo |
| `--accent-danger` | `#EF4444` (Red) | Từ chối, lỗi |
| `--accent-glow` | `rgba(59,130,246,0.15)` | Card glow effect |
| `--text-primary` | `#F1F5F9` | Tiêu đề |
| `--text-secondary` | `#94A3B8` | Label phụ |

**2.2 Typography**
- Font: `Inter` hoặc `Plus Jakarta Sans`
- Số liệu lớn: `48px / 700 weight`
- Heading card: `12px / 500 / uppercase / letter-spacing: 0.1em`

**2.3 Hiệu ứng chung**
- Card: `border: 1px solid rgba(255,255,255,0.06)` + `box-shadow: 0 0 20px var(--accent-glow)`
- Hover card: border đổi sang `--accent-primary` với transition 200ms
- Sidebar active item: thanh `3px` màu `--accent-primary` bên trái + background tinted

---

### 3. CHI TIẾT TỪNG TRANG

---

#### 3.1 TRANG TỔNG QUAN (Dashboard)

**Vấn đề:** Nửa dưới trống hoàn toàn. 4 card chỉ hiển thị số, không có ngữ cảnh.

**Yêu cầu thiết kế:**

**Row 1 — Stat Cards (giữ layout 4 cột, nâng cấp nội dung)**

Mỗi card cần bổ sung:
- Icon nền mờ kích thước lớn (40px) góc phải, màu theo accent tương ứng
- Micro-trend: text nhỏ bên dưới số lớn, ví dụ `↑ +3 so với hôm qua`
- Bottom border highlight màu accent riêng cho từng card
- Card "Đi trễ hôm nay": đổi màu số sang `--accent-warning` nếu > 0, sang `--accent-success` nếu = 0

**Row 2 — Section mới: Biểu đồ Check-in theo giờ (chiếm 8/12 cột)**
- Chart dạng `Area Chart` (filled, gradient từ `--accent-primary` → transparent)
- Trục X: các khung giờ trong ngày (7:00 → 18:00)
- Trục Y: số lượt check-in
- Tooltip khi hover hiển thị số lượt + tên ca
- Title: "Lưu lượng check-in hôm nay"

**Row 2 — Section phụ: Live Feed (chiếm 4/12 cột)**
- Panel dọc, title: "Hoạt động gần đây"
- Danh sách scroll được, mỗi item gồm:
  - Avatar viết tắt tên (initials) màu random seed theo UID
  - Tên nhân viên + hành động (`đã check-in lúc 08:03`)
  - Badge trạng thái nhỏ (`Đúng giờ` / `Trễ`)
  - Timestamp relative (`5 phút trước`)
- Tự động refresh mỗi 2s (đã có sync interval)
- Có animation `slide-in-from-top` khi item mới xuất hiện

**Row 3 — Stats bổ sung (3 cột × 1 row)**
- **Tỷ lệ đúng giờ hôm nay:** Circular progress bar, số % lớn ở giữa
- **Cửa đang mở/đóng:** 8 indicator nhỏ dạng grid (map với "8/8 cửa hoạt động" đang có), mỗi cửa là 1 dot màu xanh/đỏ với label
- **Thời gian check-in trung bình:** Số liệu đơn giản + so sánh với tuần trước

---

#### 3.2 TRANG CHẤM CÔNG

**Vấn đề:** Table trần, không có filter, trạng thái chưa nổi bật đủ.

**Yêu cầu:**

**Thanh công cụ phía trên table:**
- Input search: "Tìm theo tên hoặc UID..."
- Dropdown filter: "Tất cả trạng thái / Đúng giờ / Trễ / Vắng"
- Date picker: chọn ngày xem lịch sử
- Button export: "Xuất Excel" (icon download)

**Nâng cấp Table:**
- Header: background `--bg-elevated`, sticky khi scroll
- Cột **TRẠNG THÁI**: thay text thuần bằng **Badge component**
  - `Đúng giờ` → pill xanh emerald, background mờ
  - `Trễ` → pill vàng amber, có icon ⚠
  - `Vắng` → pill đỏ
- Cột **UID**: font monospace, màu `--accent-primary`, có thể click để xem profile
- Row hover: background đổi sang `--bg-elevated` + transition
- Cột **GIỜ VÀO**: nếu trễ hơn ca vào, tô màu `--accent-warning`

**Summary bar phía trên table (giữa toolbar và table):**
- 3 số inline: `✅ 48 đúng giờ · ⚠ 3 trễ · ❌ 0 vắng` — update realtime theo filter

---

#### 3.3 TRANG NHÂN VIÊN

**Vấn đề:** Danh sách phẳng, thiếu visual nhận diện và hành động.

**Yêu cầu:**

**Chuyển từ Table sang Card Grid (2 chế độ toggle)**

*Chế độ Grid (default):*
- Mỗi nhân viên là 1 card 200×240px
- Avatar hình tròn: initials 2 chữ cái, màu nền tạo từ hash của UID (đảm bảo unique)
- Badge status nhỏ góc dưới phải avatar: 🟢 Online / ⚫ Offline (dựa vào check-in hôm nay)
- Tên, UID, email
- Nút action: `Xem chi tiết` (icon eye)

*Chế độ Table (toggle):*
- Giữ layout hiện tại nhưng bổ sung cột Avatar và cột Action
- Thêm avatar initials vào đầu mỗi row

**Thanh công cụ:**
- Search theo tên/UID/email
- Filter theo giới tính
- Button "Thêm nhân viên" (primary button, góc phải)

---

#### 3.4 TRANG CÀI ĐẶT

**Vấn đề:** Trang **hoàn toàn trống** — đây là lỗi nghiêm trọng nhất về UX.

**Yêu cầu — build từ đầu:**

**Layout 2 cột: Sidebar danh mục | Content panel**

Danh mục cài đặt:
- **Kết nối hệ thống:** URL server, API key, timeout (ms)
- **Cấu hình cửa:** Thời gian mở tối đa (giây), góc servo mở/đóng
- **Thông báo:** Bật/tắt cảnh báo khi có người trễ, ngưỡng trễ (phút)
- **Tài khoản Admin:** Đổi email, đổi mật khẩu
- **Về hệ thống:** Version firmware, uptime, trạng thái 8 cửa dạng bảng

Mỗi section: card riêng, nút `Lưu thay đổi` cuối section, toast notification khi save thành công.

---

### 4. SIDEBAR — NÂNG CẤP TOÀN BỘ

**Hiện tại:** Text đơn giản, icon nhỏ, không có visual hierarchy rõ.

**Yêu cầu:**
- Logo "SmartOffice" kèm animated dot pulse màu xanh (thay cho dot tĩnh)
- Nav item active: left border 3px accent + background gradient nhẹ + text trắng
- Nav item hover: background `--bg-elevated`
- Section label "QUẢN LÝ": uppercase, letter-spacing, màu `--text-secondary`
- Status block phía dưới (`Hệ thống online`): nâng cấp thành mini-panel với:
  - Dot xanh animate pulse
  - Text: `Online · Sync 2s`
  - Sub-text: `8/8 cửa · Latency: 45ms`
  - Màu background khác biệt nhẹ để tách khỏi nav

---

### 5. GLOBAL COMPONENTS

| Component | Spec |
|---|---|
| **Toast notification** | Góc dưới phải, slide-in animation, auto-dismiss 3s |
| **Loading skeleton** | Thay spinner bằng skeleton shimmer khi fetch data |
| **Empty state** | Khi không có data: illustration nhỏ + text hướng dẫn (thay vì bảng trống) |
| **Confirm dialog** | Trước các action nguy hiểm (xóa NV), modal backdrop blur |

---

### 6. PRIORITY THỰC HIỆN

| Priority | Hạng mục | Lý do |
|---|---|---|
| 🔴 P0 | Fix trang Cài đặt trắng | Bug hiển thị, không thể dùng được |
| 🔴 P0 | Badge trạng thái chấm công | Core UX của sản phẩm |
| 🟡 P1 | Area chart + Live Feed ở Dashboard | Biến trang trống thành trang có giá trị |
| 🟡 P1 | Design system tokens | Nền tảng cho mọi thứ sau |
| 🔵 P2 | Card grid nhân viên | Nice-to-have, tăng visual |
| 🔵 P2 | Trang Cài đặt đầy đủ | Functional nhưng không urgent |