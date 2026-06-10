# BẢN ĐẶC TẢ TÍNH NĂNG HỆ THỐNG (FEAT.md)
## Smart Office Access Control & Attendance System

Hệ thống quản lý ra vào văn phòng thông minh kết hợp chấm công sử dụng vi điều khiển ESP32, đầu đọc thẻ RFID/NFC, cơ sở dữ liệu Google Sheets thông qua Google Apps Script (Serverless API) và Web Dashboard quản lý (React + Vite + TypeScript).

Dưới đây là đặc tả chi tiết của toàn bộ các tính năng được phát triển trong dự án:

### 1. Tính năng Phần cứng & IoT Firmware (ESP32)
Phát triển trực tiếp trong file: `firmware/base.ino`

- **Đọc thẻ NFC/RFID**:
  - Giao tiếp qua module SPI MFRC522 để đọc mã định danh 8 ký tự Hex (`NFC Card UID`).
- **Xác thực quyền truy cập cục bộ & đám mây**:
  - **Cục bộ (Emergency Access)**: Lưu danh sách các thẻ khẩn cấp để truy cập tức thì không cần kết nối mạng.
  - **Đám mây**: Gửi HTTPS request tới API Google Apps Script để kiểm tra tính hợp lệ của thẻ.
- **Điều khiển khóa servo (Servo Control)**:
  - Hàm `setDoorAngle(angle)` điều khiển góc quay của Servo SG90 để mở cửa (góc mở 90 độ) khi được phép và đóng lại sau 5 giây (góc đóng 0 độ).
- **Phản hồi âm thanh & ánh sáng (LED & Buzzer)**:
  - Flashing LED xanh & kêu bíp ngắn (`buzzerBeepGranted()`) khi truy cập được chấp nhận (`GRANTED`).
  - Flashing LED đỏ & kêu còi cảnh báo (`buzzerBeepDenied()`) khi truy cập bị từ chối (`DENIED`).
- **Presence Tracking (Giám sát số lượng người)**:
  - Tự động đếm số lượng nhân viên hiện có mặt trong phòng bằng cơ chế toggle trạng thái khi quẹt thẻ ra/vào (`toggleCardState`, `countPeopleInside`).
- **Điều khiển thiết bị điện thông minh (Smart Device Control)**:
  - Tự động bật/tắt thiết bị đèn phòng (`updateRoomLight()`) dựa trên số lượng người trong phòng. Nếu `countPeopleInside() > 0` thì bật đèn, nếu không còn ai (`== 0`) thì tự động tắt đèn để tiết kiệm điện.

### 2. Tính năng Backend & Serverless API Layer
Phát triển trực tiếp trong thư mục: `backend/scripts/`

- **Cổng định tuyến API (doGet / doPost)**:
  - Tích hợp các route hành động (`action`) để xử lý các nghiệp vụ khác nhau qua giao thức HTTP/HTTPS.
- **Xác thực & Bảo mật mật khẩu**:
  - Kiểm tra tài khoản admin đăng nhập dashboard bằng mật mã được băm mã hóa SHA-256 (`hashSHA256`).
- **Xử lý Chấm công tự động (`handleAttendance`)**:
  - Tự động xác định lần quẹt thẻ trong ngày là Check-in hay Check-out.
  - Tự động so sánh thời gian quẹt thẻ với thời gian ca bắt đầu (`Shift Start Time`) để phân loại trạng thái chấm công (`ON_TIME` - Đúng giờ, `LATE` - Đi trễ).
  - Tự động tính tổng thời gian làm việc trong ngày (`Overall duration`) khi Check-out.
- **Quản lý Nhân viên (`handleCreateEmployee`, `handleUpdateEmployee`, `handleDeactivateEmployee`)**:
  - Cung cấp API thêm nhân viên mới, cập nhật thông tin và vô hiệu hóa thẻ khi nghỉ việc hoặc mất thẻ.
- **Cơ sở dữ liệu Google Sheets (`Config.gs`)**:
  - Lưu trữ dữ liệu trực tiếp trên bảng tính Google Sheets với 2 Sheet chính:
    - **`Employee`**: Thông tin nhân sự (UID, Họ tên, RFID UID, Email, Phòng ban, Trạng thái hoạt động, Mật khẩu băm).
    - **`Attendance sheet`**: Nhật ký chấm công (Ngày, UID nhân viên, Họ tên, Giờ bắt đầu ca, Giờ check-in thực tế, Trạng thái đi muộn/đúng giờ, Giờ check-out thực tế, Tổng thời gian).

### 3. Tính năng Web Dashboard
Phát triển trực tiếp trong thư mục: `dashboard/src/`

- **Xác thực Đăng nhập (`LoginPage.tsx`)**:
  - Giao diện đăng nhập bảo mật cho quản trị viên, tự động băm SHA-256 mật khẩu dưới Client trước khi truyền tải.
- **Trang Tổng quan trực quan (`OverviewPage.tsx`)**:
  - Hiển thị các chỉ số KPI động: Số nhân viên đang làm việc, tỉ lệ đi làm đúng giờ hôm nay, số lượng người thực tế đang ở trong phòng.
  - **Real-time IoT Monitor**: Hiển thị trạng thái ảo của Cửa chính (Mở/Đóng), Cửa phụ, Đèn dây tóc (Bật/Tắt) và Ổ cắm nguồn dựa trên các sự kiện quẹt thẻ mới nhất trong vòng 30 giây.
  - **Biểu đồ thống kê sinh động**:
    - `HourlyAreaChart`: Tần suất check-in của nhân viên theo khung giờ trong ngày.
    - `WeeklyBarChart`: Biểu đồ cột so sánh số lượng nhân sự đúng giờ/đi muộn của 7 ngày gần nhất.
    - `PunctualityDonutChart`: Biểu đồ hình khuyên phân tích tỷ lệ đi đúng giờ, đi trễ, và vắng mặt trong ngày.
- **Trang Lịch sử Chấm công (`AttendancePage.tsx`)**:
  - Danh sách bảng chấm công trực quan với định dạng trạng thái màu sắc (Xanh: Đúng giờ, Cam: Đi trễ, Đỏ: Vắng mặt).
  - Hỗ trợ bộ lọc tìm kiếm theo tên/phòng ban, lọc theo khoảng ngày cụ thể, phân trang dữ liệu.
- **Trang Quản lý Nhân viên (`EmployeesPage.tsx`)**:
  - Danh sách toàn bộ nhân sự kèm trạng thái hoạt động (Active / Inactive).
  - Modal Thêm nhân sự mới (`AddEmployeeModal.tsx`) và Xem chi tiết nhân viên (`EmployeeDetailModal.tsx`).
  - Hỗ trợ đổi trạng thái hoạt động của thẻ hoặc đổi quyền quản trị.
- **Trang Cài đặt (`SettingsPage.tsx`)**:
  - Cấu hình URL endpoint kết nối Google Apps Script.
  - Kiểm tra kết nối tới Database Google Sheets.
  - Chuyển đổi ngôn ngữ hệ thống (Tiếng Việt / Tiếng Anh) và chủ đề giao diện (Sáng / Tối).
  - Thay đổi mật khẩu tài khoản quản trị.

### 4. Cơ chế Cải tiến Trải nghiệm & Tối ưu hóa (UX/Performance)
- **Parallel Prefetch & Caching (`dataCache.ts`, `app-data-context.tsx`)**:
  - Cơ chế tải song song dữ liệu các trang ngay khi chuyển trang để tránh tình trạng màn hình bị giật lag hoặc nhấp nháy Loading Screen liên tục.
  - Bộ đệm Client-side giúp lưu trữ tạm thời dữ liệu quẹt thẻ và thông tin nhân viên, giảm tải số lượng yêu cầu gọi đến Google Sheets API, kéo dài vòng đời hạn ngạch Google Apps Script.

---

### 5. Ánh xạ Mã nguồn & Hàm logic (Code Mapping)

Dưới đây là bảng ánh xạ các chức năng và các file/hàm cụ thể được quét từ **CodeGraph**:

| Tên chức năng | File triển khai | Hàm / Lớp xử lý chính |
| :--- | :--- | :--- |
| **Đọc & xác thực RFID** | `firmware/base.ino` | `checkAccess(uid)`, `loop()`, `MFRC522` library |
| **Hành vi mở/đóng cửa** | `firmware/base.ino` | `accessGranted(uid)`, `accessDenied()`, `setDoorAngle(angle)` |
| **Đếm người & điều khiển đèn** | `firmware/base.ino` | `toggleCardState(uid)`, `countPeopleInside()`, `updateRoomLight()` |
| **Buzzer âm thanh** | `firmware/base.ino` | `buzzerTone()`, `buzzerBeepConfirm()`, `buzzerBeepGranted()`, `buzzerBeepDenied()` |
| **API định tuyến backend** | `backend/scripts/Code.gs` | `doGet(e)`, `doPost(e)` |
| **Xử lý chấm công backend** | `backend/scripts/Code.gs` | `handleAttendance(uid)`, `handleGetAttendance()` |
| **Tính toán đi muộn/đúng giờ**| `backend/scripts/Helpers.gs` | `calcStatus(timeIn, shiftStart)`, `calcOverall()` |
| **Băm mật mã SHA-256** | `backend/scripts/Helpers.gs`<br>`dashboard/src/lib/crypto.ts` | `hashSHA256(text)` |
| **Cấu hình chỉ mục cột DB** | `backend/scripts/Config.gs` | `CONFIG` object |
| **Quản lý nhân viên (API)** | `backend/scripts/Code.gs` | `handleCreateEmployee()`, `handleUpdateEmployee()`, `handleDeactivateEmployee()` |
| **Tải và đệm dữ liệu SPA** | `dashboard/src/lib/dataCache.ts` | `SheetsDataCache` class |
| **Tính trạng thái IoT Monitor** | `dashboard/src/lib/chart-transforms.ts` | `getDoorStatuses(records)` |
| **Biểu đồ thống kê** | `dashboard/src/features/dashboard/` | `HourlyAreaChart`, `WeeklyBarChart`, `PunctualityDonutChart` |
| **Quản lý phiên đăng nhập** | `dashboard/src/features/auth/` | `ProtectedRoute`, `auth.ts` (`login()`, `logout()`, `isAuthenticated()`) |
| **Định tuyến toàn ứng dụng** | `dashboard/src/App.tsx` | `App()`, `<Routes>`, `<Route>` |
| **Khung giao diện (Shell)** | `dashboard/src/components/layout/` | `DashboardShell` (Xử lý đa ngôn ngữ, dark/light theme, thanh menu bên) |
