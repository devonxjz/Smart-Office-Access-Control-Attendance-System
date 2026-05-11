# PRD: Hiển thị Dữ liệu Google Sheets lên Dashboard

> **Revision 3 — Final.** Approved. Clarified Date column position, removed `refetch` out-of-scope, thêm acceptance criteria empty state.

---

## Problem Statement

Sau khi đăng nhập thành công, admin chỉ thấy một trang placeholder tĩnh. Hệ thống đang ghi dữ liệu chấm công và nhân viên vào Google Sheet từ ESP32, nhưng không có giao diện nào để admin xem và tra cứu.

---

## Solution

Xây dựng 3 trang dashboard kết nối thực với GAS backend (qua endpoint `action=read`), hiển thị dữ liệu nhân viên và nhật ký chấm công theo thời gian thực (load khi mở trang).

**Thứ tự thực hiện bắt buộc:**
1. ✅ **[DONE] Fix backend bugs**
2. 🔲 **Verify data** — Kiểm tra sheet thực tế có đúng format chưa
3. 🔲 **Build UI** — Chỉ khi data đã chính xác

---

## Backend Prerequisites

### ✅ Đã fix
| Bug | Fix |
|---|---|
| `handleRead` expose cột Password (hash leak) | Blacklist `["Password", "password", "Mật khẩu"]` trong `handleRead` |
| `getTodayString()` locale-dependent | `Utilities.formatDate(..., "yyyy-MM-dd")` — timezone VN, ISO cố định |
| `handleAttendance` không lọc theo ngày | Check `ATT_COL_DATE === today` thay vì chỉ so UID |

### Cấu trúc sheet `Attendance sheet` — sau khi fix
Cột **Date được thêm vào Cột A**. Các cột cũ dịch sang phải 1 vị trí:

| Cột | Index | Header gợi ý |
|---|---|---|
| A | 0 | `Ngày` |
| B | 1 | `UID` |
| C | 2 | `Tên` |
| D | 3 | `Ca` |
| E | 4 | `Giờ vào` |
| F | 5 | `Trạng thái` |
| G | 6 | `Giờ ra` |
| H | 7 | `Tổng kết` |

> **Quan trọng:** Tên header dòng 1 trong Google Sheet phải khớp **chính xác** với các field trong TypeScript interface. Confirm tên thực tế trong sheet trước khi code interface.

### 🔲 Checklist verify trước khi build UI
- [ ] Sheet `Attendance sheet` có cột `Ngày` ở Cột A (header dòng 1)
- [ ] Quẹt thẻ thử → ngày được ghi dạng `2026-05-10` (ISO, không phải `10/5/2026`)
- [ ] `?action=read&sheet=Employee` → response **không chứa** trường Password
- [ ] `?action=read&sheet=Attendance sheet` → response chứa field `Ngày` ở đầu mỗi record

---

## User Stories

1. Là admin, tôi muốn thấy tổng số nhân viên và số người đã check-in **hôm nay** (múi giờ Asia/Ho_Chi_Minh) trên trang Overview.
2. Là admin, tôi muốn xem bảng nhật ký chấm công, để tra cứu giờ vào/ra của từng nhân viên.
3. Là admin, tôi muốn xem danh sách tất cả nhân viên (không thấy mật khẩu).
4. Là admin, tôi muốn thấy loading state khi data đang fetch.
5. Là admin, tôi muốn thấy thông báo lỗi rõ ràng nếu kết nối GAS thất bại.

---

## Implementation Decisions

### 1. Data Layer — `src/hooks/useSheetsData.ts` (New)

```typescript
interface UseSheetsDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  // refetch: OUT OF SCOPE — không có manual refresh hay polling trong phiên bản này
}

function useSheetsData<T>(sheetName: string): UseSheetsDataResult<T>
```

**TypeScript interfaces** — tên field phải khớp **chính xác** header trong sheet:

```typescript
// Khớp với sheet "Employee" — Config.gs EMP_COL_*
interface Employee {
  UID: string;
  // Tên các field còn lại cần xác nhận với header thực tế trong sheet
  // trước khi code. Ví dụ nếu header là "Tên" thì field là "Tên", không phải "Name"
  // Password: KHÔNG có — bị filter ở backend
}

// Khớp với sheet "Attendance sheet" — Config.gs ATT_COL_*
// Date ở Cột A (index 0) — các field đặt tên theo header thực tế trong sheet
interface AttendanceRecord {
  // Field đầu tiên là ngày, format "yyyy-MM-dd"
  // Tên field phụ thuộc header sheet (VD: "Ngày")
  // Xác nhận tên header trước khi code
}
```

> **Action item trước khi code:** Mở Google Sheet, đọc tên header dòng 1 của cả 2 sheet, cập nhật interface cho khớp.

### 2. API Contract

**Request:** `GET {VITE_GAS_URL}?action=read&sheet={sheetName}`

| Scenario | Response |
|---|---|
| Thành công | `{ "success": true, "data": [...] }` |
| Lỗi server | `{ "success": false, "message": "..." }` |
| Sheet không tồn tại | `{ "success": false, "message": "Sheet not found: XYZ" }` |
| Mạng lỗi | fetch() throws → catch → hiển thị "Không thể kết nối máy chủ" |
| Data rỗng | `{ "success": true, "data": [] }` → hiển thị empty state (xem spec bên dưới) |

### 3. Routing — `src/App.tsx` (Modified)

```
/dashboard            → <Overview />
/dashboard/attendance → <AttendanceLogs />
/dashboard/employees  → <EmployeeList />
```

`react-router-dom` đã có sẵn (đã dùng cho Login/ProtectedRoute).

### 4. UI Components

**`Overview.tsx`** (New)
- Fetch cả `Employee` và `Attendance sheet`
- Tính toán: tổng nhân viên, số check-in hôm nay
  - `today` = `new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })` → `"2026-05-10"` (sv-SE cho ra ISO format trên mọi browser)
  - Filter: records có `record["Ngày"] === today` (tên field theo header thực tế)
- **Acceptance criteria — empty state:**
  - 0 nhân viên → hiển thị `0` + text "Chưa có nhân viên nào"
  - 0 check-in hôm nay → hiển thị `0` + text "Chưa có ai check-in hôm nay" (không crash, không ẩn card)

**`AttendanceLogs.tsx`** (New)
- Bảng: Ngày · UID · Tên · Ca · Giờ vào · Trạng thái · Giờ ra
- Loading skeleton + empty state "Chưa có dữ liệu chấm công"

**`EmployeeList.tsx`** (New)
- Bảng: UID · Tên · Email · SĐT · Giới tính
- Không hiển thị cột Password (defense in depth — dù backend đã filter)

---

## Testing Decisions

- **Nguyên tắc:** Test behavior bên ngoài, không test implementation details
- **Modules:**
  - `useSheetsData` — mock `GoogleSheetsClient`, verify 3 states: loading / data / error
  - `AttendanceLogs` — mock hook với fixture 3 records, verify render đúng số dòng
  - `Overview` — mock hook với fixture có 2 records hôm nay + 1 ngày cũ, verify đếm đúng là `2`
  - `Overview` empty state — mock với `data: []`, verify hiển thị `0` và text fallback
- **Prior art:** Pattern `Login.test.tsx` (Vitest + React Testing Library)

---

## Out of Scope

- Tạo/sửa/xóa nhân viên từ dashboard (read-only)
- Real-time updates, polling, WebSocket
- Manual refresh button (`refetch`)
- Phân trang
- Export CSV/Excel
