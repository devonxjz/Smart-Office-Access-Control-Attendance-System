
iot-attendance-system/                  # Root project
├── firmware/                           # Firmware đơn giản (Arduino/ESP32)
├── backend/                            # Google Apps Script sources + data exports
├── dashboard/                          # Frontend (Vite + React + TypeScript)
├── docs/                               # Tài liệu dự án
├── README.md 
└── LICENSE


Tóm tắt hiện trạng (phù hợp với repository hiện tại):

1. `firmware/`
- **Entry point**: `firmware/base.ino` — code chính ESP32
- **Tính năng chính**:
  - Đọc NFC Card UID qua MFRC522 module
  - Gửi Access Request tới Serverless API Layer (Google Apps Script)
  - Điều khiển servo mở cửa (tự động đóng sau 5 giây)
  - Điều khiển LED xanh/đỏ + buzzer (visual/audio feedback)
  - Quản lý presence tracking — danh sách nhân sự hiện tại trong phòng
  - Điều khiển relay bật/tắt đèn dựa trên số lượng người
- **Tài liệu**:
  - `firmware/README.md` — hướng dẫn build, flash, pin mapping
  - `docs/FIRMWARE_CONFIG.md` — cấu hình WiFi, server URL, timeouts, pin
- **Phát triển**:
  - Nếu mở rộng, tổ chức thành `src/`, `lib/`, `platformio.ini` (PlatformIO structure)
  - Xem `firmware/README.md` → Troubleshooting & Development roadmap

2. `backend/`
- `backend/scripts/` — Google Apps Script chính (ví dụ: `backend/scripts/Code.gs`). Đây là nơi có các hàm `doGet`/`doPost` hoặc các API endpoint được deploy dưới dạng Apps Script Web App.
- `backend/data/` — các mẫu dữ liệu hoặc helper scripts liên quan (ví dụ `backend/data/employee.gs`).

3. `dashboard/` (Frontend)
- Ứng dụng được xây dựng bằng Vite + React + TypeScript (không phải "plain HTML/CSS/JS"). Các tệp entry chính:
	- `dashboard/src/main.tsx` — entry point React
	- `dashboard/src/App.tsx` — component cấp cao
	- `dashboard/src/pages/*` — các trang như `AttendancePage.tsx`, `EmployeesPage.tsx`, `LoginPage.tsx`

- Scripts/commands chính nằm trong `dashboard/package.json` (ví dụ `npm run dev`, `npm test`).

4. `docs/` — Tài liệu dự án, bao gồm `docs/architecture.md` (tài liệu hiện tại đã được cập nhật), PRD và các hướng dẫn khác.

5. Root và tệp hỗ trợ
- `README.md` — mô tả dự án tổng quan (lưu ý: tệp này đang ở encoding UTF-16 và tiếng Việt).


Chú ý và hướng dẫn ngắn:

- Thực tế: `docs/architecture.md` trước đây mô tả một layout khác (ví dụ `appsscript/`, `webapp/`) — tôi đã cập nhật để phản ánh cấu trúc hiện tại (`backend/scripts`, `backend/data`, `dashboard` là Vite+React+TS).
- Nếu bạn muốn chuẩn hoá firmware thành cấu trúc PlatformIO (nhiều file), hãy thêm hướng dẫn đó vào `docs/`.
- Thêm hướng dẫn chạy nhanh cho frontend (dưới) vào `README.md` hoặc `docs/quick-start.md` sẽ hữu ích cho người mới.

Lệnh chạy nhanh (frontend):

```bash
cd dashboard
npm install
npm run dev
```

Chạy test frontend:

```bash
cd dashboard
npm test
```

Kiểm tra lịch sử thay đổi của backend (git):

```bash
git log --oneline --decorate -- backend/scripts/Code.gs
git blame backend/scripts/Code.gs
```

Ghi chú thêm:
- Nếu bạn muốn, tôi có thể chuẩn hoá `README.md` sang UTF-8 và tóm tắt nội dung (tiếng Việt) để dễ đọc.




