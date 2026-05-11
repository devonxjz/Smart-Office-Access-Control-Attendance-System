# PRD: Attendance Data Integration — SmartOffice Dashboard

---

## 1. Vấn đề hiện tại

Dashboard đang hiển thị dữ liệu tĩnh (NV01–NV16 với toàn bộ `–`). Sheet `attendance` đã tồn tại nhưng **pipeline đọc dữ liệu chưa được nối thông** từ Google Sheets → API → Frontend.

---

## 2. Mục tiêu

Màn hình **Chấm công** hiển thị đúng, đủ dữ liệu thực từ `attendance sheet`, tự động cập nhật khi có quẹt thẻ mới.

---

## 3. Luồng dữ liệu mục tiêu

```
ESP32 quẹt thẻ
    → POST UID lên Google Apps Script
        → Script ghi vào Attendance Sheet
            → Frontend GET /api/attendance
                → Render bảng
```

---

## 4. Cấu trúc Attendance Sheet (Source of Truth)

| Cột | Tên cột | Kiểu dữ liệu | Ghi chú |
|---|---|---|---|
| A | DATE | `DD/MM/YYYY` | Ngày quẹt thẻ |
| B | UID | `String` | Mã thẻ từ ESP32 |
| C | NAME | `String` | Tra từ bảng Nhân viên |
| D | SHIFTSTART | `HH:MM` | Ca làm việc |
| E | TIMEIN | `HH:MM:SS` | Thời điểm quẹt vào |
| F | STATUS | `ON_TIME / LATE / ABSENT` | Logic tính tự động |
| G | TIMEOUT | `HH:MM:SS` | Thời điểm quẹt ra (lần 2) |

---

## 5. Các tính năng cần xây dựng

### 5.1 Google Apps Script — Endpoint ghi & đọc

**Endpoint A — Ghi dữ liệu (ESP32 gọi)**
- Method: `GET` (giữ nguyên theo thiết kế hiện tại)
- Param: `?uid=XXXX`
- Logic:
  - Tra bảng Nhân viên theo UID → lấy NAME, SHIFTSTART
  - Nếu UID chưa có bản ghi hôm nay → ghi hàng mới (TIMEIN = now)
  - Nếu đã có bản ghi hôm nay → cập nhật TIMEOUT = now
  - Tính STATUS: `TIMEIN ≤ SHIFTSTART + 5 phút` → `ON_TIME`, còn lại → `LATE`
- Response: `GRANTED` hoặc `DENIED`

**Endpoint B — Đọc dữ liệu (Frontend gọi)**
- Method: `GET`
- Param: `?action=getAttendance&date=DD/MM/YYYY` (mặc định hôm nay nếu không truyền)
- Response: JSON array
```json
[
  {
    "date": "11/05/2026",
    "uid": "NV01",
    "name": "Nguyễn Văn A",
    "shiftStart": "08:00",
    "timeIn": "07:58:12",
    "status": "ON_TIME",
    "timeOut": "17:05:33"
  }
]
```

---

### 5.2 Frontend — Màn hình Chấm công

**Yêu cầu hiển thị:**
- Fetch dữ liệu từ Endpoint B mỗi **2 giây** (đã thấy `Sync: 2s` ở sidebar)
- Chỉ fetch lại khi tab Chấm công đang active
- Hiển thị tổng số bản ghi (`52 bản ghi` → số thực)

**Xử lý trạng thái STATUS:**

| Giá trị | Màu hiển thị |
|---|---|
| `ON_TIME` | 🟢 Xanh |
| `LATE` | 🟡 Vàng |
| `ABSENT` | 🔴 Đỏ |
| `–` (chưa checkout) | Xám |

**Lọc & Tìm kiếm (ưu tiên thấp, có thể làm sau):**
- Filter theo ngày (date picker)
- Filter theo STATUS
- Search theo NAME hoặc UID

---

## 6. Điều kiện hoàn thành (Definition of Done)

| # | Tiêu chí |
|---|---|
| 1 | Quẹt thẻ hợp lệ → hàng mới xuất hiện trên bảng trong vòng **≤ 4 giây** |
| 2 | Quẹt lần 2 cùng ngày → cột TIMEOUT được cập nhật, không tạo hàng mới |
| 3 | STATUS hiển thị đúng màu |
| 4 | Khi mất mạng hoặc Sheet lỗi → bảng hiển thị trạng thái `"Đang mất kết nối..."`, không crash |
| 5 | Các ô không có dữ liệu hiển thị `–`, không hiển thị `null` hoặc `undefined` |

---

## 7. Rủi ro & Lưu ý

- **Google Apps Script có quota** ~20,000 request/ngày ở tài khoản miễn phí — đủ dùng cho prototype.
- **Độ trễ ghi Sheet** có thể 1–2 giây, cần tính vào SLA sync 2 giây.
- UID từ ESP32 cần được **chuẩn hóa chữ hoa** trước khi tra bảng để tránh mismatch.