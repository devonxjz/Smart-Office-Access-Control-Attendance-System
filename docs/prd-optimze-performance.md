# PRD — Dashboard Prefetch & Data Preloading Strategy

**Dự án:** Smart Office Access Control  
**Module:** Dashboard Shell — Global Data Layer  
**Phiên bản:** 1.0  
**Trạng thái:** Draft  
**Tác giả:** _(tên bạn)_  
**Ngày:** 2026-05-13  

---

## 1. Vấn đề (Problem Statement)

Hiện tại mỗi trang trong dashboard (`/employee`, `/attendance`, `/settings`…) tự gọi API riêng lẻ khi người dùng **điều hướng đến trang đó**. Điều này gây ra:

- Người dùng thấy skeleton/spinner mỗi lần chuyển trang
- Các API call bị lặp lại không cần thiết (vd: danh sách nhân viên được fetch ở cả `/employee` lẫn `/attendance`)
- Perceived performance kém dù network thực tế không chậm

**Mục tiêu:** Khi người dùng vào dashboard lần đầu, toàn bộ dữ liệu cần thiết của **tất cả các trang** được fetch song song ngay lập tức — các trang con render tức thì từ cache, không chờ network.

---

## 2. Mục tiêu & Chỉ số thành công (Goals & Success Metrics)

| Mục tiêu | Chỉ số đo lường | Target |
|---|---|---|
| Giảm thời gian chờ khi chuyển trang | Time-to-interactive mỗi trang con | < 100ms (từ cache) |
| Giảm tổng số API call | Số request/session | Giảm ≥ 60% |
| Không block màn hình login | Time-to-first-render của Dashboard Shell | < 300ms |
| Dữ liệu không bị stale | Tuổi dữ liệu khi người dùng nhìn thấy | < 60 giây |

---

## 3. Phạm vi (Scope)

**Trong phạm vi v1.0:**
- Prefetch toàn bộ API call khi user vào `/` (dashboard shell)
- Global state/cache layer dùng chung cho tất cả trang con
- Background refetch tự động theo interval
- Loading state toàn cục (1 lần duy nhất lúc khởi động)

**Ngoài phạm vi:**
- Service Worker / offline caching
- Optimistic updates
- Real-time (WebSocket / SSE)
- Prefetch theo route (chỉ fetch khi hover link)

---

## 4. Kiến trúc tổng quan (Architecture Overview)

```
┌─────────────────────────────────────────────────────┐
│                   Browser                           │
│                                                     │
│  Route: /  (Dashboard Shell)                        │
│  ┌─────────────────────────────────────────────┐    │
│  │           AppDataProvider                   │    │
│  │  (mount) → Promise.all([                    │    │
│  │    fetchEmployees(),                        │    │
│  │    fetchAttendance(),                       │    │
│  │    fetchAccessLogs(),                       │    │
│  │    fetchSettings(),                         │    │
│  │  ])                                         │    │
│  │                                             │    │
│  │  → Lưu vào Global Cache (Context / Store)   │    │
│  └──────────────┬──────────────────────────────┘    │
│                 │ data sẵn sàng                      │
│    ┌────────────┼────────────┐                       │
│    ▼            ▼            ▼                       │
│  /employee  /attendance  /settings                   │
│  (đọc cache, (đọc cache, (đọc cache,                │
│   render ngay) render ngay) render ngay)             │
└─────────────────────────────────────────────────────┘
```

---

## 5. Các thành phần cần xây dựng (Components)

### 5.1 — `AppDataProvider` (Global Data Layer)

**Vai trò:** Context Provider bọc toàn bộ app, chịu trách nhiệm fetch và giữ data.

**Phải có:**
- Gọi `Promise.all()` với tất cả API ngay khi mount
- Expose `{ data, loading, error, refetch }` cho toàn app
- Một trạng thái `loading` duy nhất — `true` khi **bất kỳ** API nào chưa xong
- Sau khi fetch xong lần đầu, set `initialLoadComplete = true`

**Cấu trúc data shape:**
```js
{
  employees:    { data: [...], lastFetched: timestamp },
  attendance:   { data: [...], lastFetched: timestamp },
  accessLogs:   { data: [...], lastFetched: timestamp },
  settings:     { data: {...}, lastFetched: timestamp },
}
```

---

### 5.2 — `GlobalLoadingScreen`

**Vai trò:** Màn hình chờ hiển thị **duy nhất 1 lần** khi app khởi động, thay thế hoàn toàn cho spinner từng trang.

**Phải có:**
- Hiển thị khi `initialLoadComplete === false`
- Progress indicator thể hiện bao nhiêu API đã xong (vd: "3/4 nguồn dữ liệu")
- Sau khi xong → fade out, không bao giờ xuất hiện lại trong session
- **Không** block render nếu 1 API lỗi (hiển thị partial data, báo lỗi riêng)

---

### 5.3 — `useAppData(key)` — Custom Hook

**Vai trò:** Interface duy nhất để các trang con truy cập data từ cache. Trang con **không được** tự gọi API.

**API:**
```js
const { data, loading, error, refetch } = useAppData('employees')
// loading = false ngay nếu data đã có trong cache
// refetch() = gọi lại API cho riêng key đó, cập nhật cache
```

**Quy tắc:**
- Nếu `lastFetched` < 60 giây trước → trả cache ngay, không fetch
- Nếu `lastFetched` > 60 giây → tự động refetch ngầm (stale-while-revalidate: vẫn trả cache cũ trước, cập nhật sau)

---

### 5.4 — Background Refetch Scheduler

**Vai trò:** Tự động làm mới dữ liệu theo interval khi user đang dùng app, không cần user thao tác.

**Phải có:**
- Interval mặc định: 60 giây cho dữ liệu động (employees, attendance, logs)
- Interval dài hơn: 300 giây cho dữ liệu tĩnh (settings)
- Dừng refetch khi tab bị ẩn (`document.visibilityState === 'hidden'`) → tiếp tục khi tab active lại
- Không refetch nếu đang có request cùng key chưa xong (dedup)

---

### 5.5 — Error Boundary per Data Source

**Vai trò:** Xử lý lỗi riêng cho từng API, không để 1 API lỗi crash toàn bộ dashboard.

**Phải có:**
- Mỗi key trong cache có `error` state độc lập
- Trang con hiển thị inline error (banner nhỏ) thay vì crash
- Nút "Thử lại" gọi `refetch(key)` cho đúng nguồn bị lỗi
- Log lỗi kèm timestamp để debug

---

## 6. Luồng người dùng (User Flow)

```
User mở dashboard
       │
       ▼
AppDataProvider mount
       │
       ▼
Promise.all([API1, API2, API3, API4]) — chạy song song
       │
       ├─── GlobalLoadingScreen hiển thị ("Đang tải hệ thống...")
       │
       ▼ (tất cả API xong)
Cache được điền đầy đủ
       │
       ▼
GlobalLoadingScreen fade out
       │
       ▼
User thấy Dashboard (trang mặc định, vd /employee)
— Render tức thì từ cache, 0ms chờ
       │
       ▼
User click sang /attendance
— Render tức thì từ cache, 0ms chờ
       │
       ▼
(sau 60 giây)
Background Scheduler tự refetch ngầm
— User không thấy gì, data tự cập nhật
```

---

## 7. Các trường hợp đặc biệt (Edge Cases)

| Tình huống | Xử lý |
|---|---|
| 1 trong 4 API lỗi khi load lần đầu | Load các API còn lại bình thường. Trang liên quan hiển thị inline error + nút Thử lại. Không block dashboard. |
| User chuyển trang trong khi đang fetch lần đầu | GlobalLoadingScreen giữ nguyên cho đến khi xong |
| Mất mạng sau khi đã load xong | Cache vẫn dùng được. Background refetch thất bại silently. Hiển thị badge "Dữ liệu có thể đã cũ" nếu `lastFetched` > 5 phút |
| User bấm Làm mới thủ công | Gọi lại toàn bộ `Promise.all()`, cập nhật cache, không hiện GlobalLoadingScreen lại |
| Nhiều tab mở cùng lúc | Mỗi tab quản lý cache độc lập (không cần cross-tab sync ở v1.0) |

---

## 8. Ràng buộc kỹ thuật (Technical Constraints)

- **Không** dùng thư viện nặng (Redux, Zustand) — dùng React Context + `useReducer` thuần
- Nếu sau này muốn nâng cấp: toàn bộ logic trong `AppDataProvider` tương thích để migrate sang React Query hoặc SWR mà không cần sửa các trang con
- Google Apps Script có rate limit — không fetch quá 1 request/giây cho cùng 1 endpoint
- Tất cả API call phải đi qua `api/sheets.js`, không gọi fetch trực tiếp trong component

---

## 9. Thứ tự triển khai (Implementation Order)

```
Bước 1 — Xây AppDataProvider + useAppData hook (core)
       ↓
Bước 2 — Xây GlobalLoadingScreen
       ↓
Bước 3 — Refactor các trang con: thay useEmployees() cục bộ → useAppData('employees')
       ↓
Bước 4 — Thêm Background Refetch Scheduler
       ↓
Bước 5 — Thêm stale-while-revalidate logic vào useAppData
       ↓
Bước 6 — Test edge cases: lỗi mạng, tab ẩn, nhiều tab
```

---

## 10. Câu hỏi còn mở (Open Questions)

| # | Câu hỏi | Người quyết định | Deadline |
|---|---|---|---|
| 1 | Stale threshold nên là 60s hay 30s? Tuỳ vào tần suất dữ liệu thay đổi thực tế | Lead dev | Trước Bước 4 |
| 2 | Có cần persist cache vào `sessionStorage` để F5 không fetch lại? | PM | Trước Bước 5 |
| 3 | GlobalLoadingScreen nên có timeout tối đa không? (vd: sau 10s thì hiện dashboard dù chưa xong?) | UX | Trước Bước 2 |