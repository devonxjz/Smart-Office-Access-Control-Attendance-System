Quản lý nhân viên — PRD

Smart Office Access Control · Module: Employee Management

v1.0
Prototype
Backend: Google Sheets + Apps Script
Tính năng chính
4
Màn hình
3
Quy tắc bảo mật
2
API endpoint
5
F1 · Danh sách nhân viên (Dashboard chính)

Bảng danh sách nhân viên
Hiển thị toàn bộ nhân viên kèm thông tin cơ bản. Mật khẩu không bao giờ hiển thị trực tiếp tại đây.
Core
Hiển thị: Tên, Mã NV, RFID UID, Phòng ban, Trạng thái (active/inactive)
Cột mật khẩu: ẩn hoàn toàn — không render, không tooltip, không placeholder dạng ●●●●
Nút [+ Thêm nhân viên] ở góc trên phải → mở modal tạo mới
Mỗi hàng có nút [Xem chi tiết] → mở trang Employee Detail
Filter theo phòng ban; tìm kiếm theo tên hoặc mã NV
Dashboard — cột mật khẩu ẩn
NT
Nguyễn Thành
A1B2C3D4
Chi tiết
LH
Lê Hương
F3E2A1B0
Chi tiết
TM
Trần Minh
C0D1E2F3
Chi tiết
↑ Không có cột Password
Google Sheets — lưu mật khẩu
Tên
Nguyễn Thành
UID
A1B2C3D4
Password (hash)
$2b$10$xyz...
↑ Chỉ Sheets Admin thấy
F2 · Thêm nhân viên mới

Modal tạo nhân viên
Form inline (modal/drawer). Tạo mật khẩu ngay tại bước này. Submit → ghi vào Google Sheets.
Core
Trường bắt buộc: Họ tên, Mã NV, Phòng ban, RFID UID, Mật khẩu, Xác nhận mật khẩu
Mật khẩu: input type=password + nút toggle show/hide; validate tối thiểu 8 ký tự
Tùy chọn [Tạo ngẫu nhiên] → sinh password mạnh, hiển thị 1 lần để admin copy, sau đó ẩn
Submit gọi Apps Script API (POST) → Sheets ghi hàng mới với password đã hash (bcrypt hoặc SHA-256)
Trả về thành công → đóng modal, refresh danh sách, toast "Đã thêm nhân viên"
Điền form
→
Validate client
→
POST /api/employee
→
Apps Script hash PW
→
Ghi Sheets
→
200 OK
F3 · Chi tiết & Sửa nhân viên

Trang Employee Detail
Mở khi bấm [Chi tiết] trên bảng. Hiển thị đầy đủ thông tin, cho phép chỉnh sửa và đổi mật khẩu.
Core
Hiển thị tất cả thông tin nhân viên; trường mật khẩu vẫn ẩn (chỉ thấy "●●●●●●●● · Đã thiết lập")
Nút [Chỉnh sửa thông tin] → unlock các field, cho phép sửa tên/phòng ban/UID/trạng thái
Section riêng "Đổi mật khẩu" gồm: Mật khẩu mới + Xác nhận mật khẩu (không yêu cầu nhập mật khẩu cũ vì đây là admin)
Submit đổi mật khẩu → PATCH /api/employee/{id}/password → Sheets cập nhật hash
Mật khẩu mới này dùng để đăng nhập Dashboard (admin panel) sau khi cập nhật
Quy tắc bảo mật: Dashboard chỉ lưu session token sau login. Mật khẩu plain-text không bao giờ đi qua response API — chỉ có hash được lưu và so sánh phía Apps Script.
F4 · Xóa nhân viên

Soft delete & xác nhận
Không xóa cứng để giữ lịch sử chấm công. Đổi trạng thái sang "inactive".
Caution
Nút [Vô hiệu hóa] (không phải "Xóa") trên trang chi tiết → confirm dialog "Bạn chắc chắn?"
Confirm → PATCH status=inactive → Sheets cập nhật cột Status → ESP32 sẽ từ chối UID này
Nhân viên inactive vẫn xuất hiện trong danh sách với badge màu đỏ, có thể kích hoạt lại
Nếu cần xóa hoàn toàn: chỉ superadmin mới xóa hàng khỏi Sheets (ngoài phạm vi Dashboard)
API contracts (Google Apps Script)

GET /api/employees — Lấy danh sách (không trả password field)
GET /api/employees/{id} — Chi tiết 1 NV (không trả password field)
POST /api/employees — Tạo mới (nhận plain PW, hash server-side, lưu hash)
PATCH /api/employees/{id} — Sửa thông tin (không bao gồm password)
PATCH /api/employees/{id}/password — Đổi mật khẩu riêng biệt
POST /api/auth/login — Đăng nhập Dashboard (nhận email+PW, so hash trong Sheets)
GET /api/check?uid=XXXX — Endpoint ESP32 gọi để kiểm tra thẻ (trả OK/DENIED)
Luồng đổi mật khẩu → đăng nhập dashboard

Admin vào chi tiết NV
→
Nhập mật khẩu mới
→
PATCH /password
→
Apps Script hash
→
Sheets cập nhật
NV dùng PW mới
→
POST /auth/login
→
So sánh hash
→
Trả session token
→
Vào Dashboard
Ngoài phạm vi v1.0

Phân quyền RBAC
Audit log
2FA
Export CSV
Avatar upload

Đây là PRD dạng interactive mockup cho tính năng quản lý nhân viên:Tóm lại những điểm cốt lõi của PRD này:

**Quy tắc mật khẩu:** Dashboard không bao giờ render password — kể cả dạng `●●●●`. Chỉ Sheets Admin mới thấy hash trong file. Khi admin đổi mật khẩu cho nhân viên, Apps Script hash phía server rồi mới lưu, plain-text không xuất hiện trong bất kỳ response nào.

**Trang chi tiết nhân viên** là nơi duy nhất cho phép đổi mật khẩu — tách biệt hẳn với form sửa thông tin để tránh sửa nhầm. Mật khẩu mới sau khi cập nhật Sheets sẽ có hiệu lực ngay cho lần đăng nhập Dashboard tiếp theo.

**Soft delete** thay vì xóa cứng — giữ lại lịch sử chấm công, chỉ đổi trạng thái sang `inactive`. ESP32 sẽ tự động từ chối UID của nhân viên inactive khi Apps Script trả `DENIED`.

Bạn muốn tôi tiếp tục làm phần nào trước — code Google Apps Script cho các API endpoints, hay UI React/HTML cho Dashboard?