import os

file_path = r"C:\Users\ADMIN\.gemini\antigravity\brain\38bdc278-52d0-4ec2-8b5d-1992f5bb62b0\walkthrough.md"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Trang Đăng nhập Sinh động section
old_effect = """*   **Trang Đăng nhập Sinh động**:
    *   Tạo dòng thời gian (Timeline) GSAP để tạo hoạt ảnh xuất hiện đồng bộ: staggered slide-up cho các dòng văn bản bên trái, fade/slide-up cho ảnh minh họa, và slide-in từ bên phải cho form đăng nhập.
    *   Hiệu ứng chuyển động liên tục: các họa tiết trang trí (lưới chấm tròn, vòng tròn sóng NFC) được tạo hiệu ứng bay lơ lửng (`float`) và xoay vô tận (`infinite rotation`) cực kỳ bắt mắt."""

new_effect = """*   **Trang Đăng nhập Sinh động**:
    *   Loại bỏ hoàn toàn hoạt ảnh xuất hiện đồng bộ (entrance load animation) khi khởi động trang để cải thiện tốc độ hiển thị tức thì, giảm độ trễ trải nghiệm cho người dùng.
    *   Giữ lại hiệu ứng chuyển động liên tục ở nền: các họa tiết trang trí (lưới chấm tròn, vòng tròn sóng NFC) vẫn tự động bay lơ lửng (`float`) và xoay vô tận (`infinite rotation`) nhẹ nhàng."""

content = content.replace(old_effect.replace("\n", "\r\n"), new_effect.replace("\n", "\r\n"))
content = content.replace(old_effect, new_effect)

# Replace NFC Laser Data Flow section
old_nfc = """## 6. Sửa lỗi Hoạt ảnh Luồng Dữ liệu NFC (NFC Laser Data Flow Animation)
*   **Vấn đề (Diagnose)**: Hoạt ảnh luồng dữ liệu NFC trước đó sử dụng đường dẫn SVG cố định (`M 330,360 Q 520,160 740,320`) cắt ngang qua trực tiếp trên các trường nhập liệu mật khẩu và tài khoản, gây ảnh hưởng nghiêm trọng đến khả năng hiển thị và tính thẩm mỹ của form. Đồng thời, việc điều khiển animation dashoffset bằng GSAP JS thỉnh thoảng có độ trễ nhỏ khi khởi động trang.
*   **Giải pháp xử lý**:
     1.  **Căn chỉnh Tọa độ chuẩn xác**: Thay đổi điểm bắt đầu và kết thúc của đường cong SVG (`M 465,300 Q 550,150 640,165`) để xuất phát chính xác từ tâm vòng tròn phát sóng NFC (pulsing target circle) của ảnh minh họa, hướng chéo lên góc trên bên phải.
     2.  **Lớp chuyển màu che phủ (Fade-out Linear Gradient)**: Thiết kế một dải màu gradient tuyến tính (`linearGradient`) với chế độ tọa độ `userSpaceOnUse` bắt đầu từ `x1=465` (đầu ra NFC) đến `x2=640` (gần form). Dải màu sẽ tự động mờ dần từ đục sang trong suốt và biến mất hoàn toàn ở mức 85% hành trình (`stopOpacity="0"`), giúp luồng dữ liệu biến mất hoàn toàn trong không gian trống trước khi chạm tới mép của form đăng nhập. Điều này hoàn toàn ngăn chặn hiện tượng đè chữ hay che khuất hộp thoại.
     3.  **Chuyển độ sang CSS Animation**: Thay thế việc điều khiển GSAP JS bằng hoạt ảnh `@keyframes` CSS nội bộ (`nfcFlow` và `nfcGlowPulse`), giúp giảm tải xử lý JavaScript, đảm bảo luồng animation mượt mà tuyệt đối 60fps và hoạt động tin cậy trên mọi trình duyệt."""

# Let's check alternative spelling "Chuyển đổi sang CSS Animation"
old_nfc_alt = """## 6. Sửa lỗi Hoạt ảnh Luồng Dữ liệu NFC (NFC Laser Data Flow Animation)
*   **Vấn đề (Diagnose)**: Hoạt ảnh luồng dữ liệu NFC trước đó sử dụng đường dẫn SVG cố định (`M 330,360 Q 520,160 740,320`) cắt ngang qua trực tiếp trên các trường nhập liệu mật khẩu và tài khoản, gây ảnh hưởng nghiêm trọng đến khả năng hiển thị và tính thẩm mỹ của form. Đồng thời, việc điều khiển animation dashoffset bằng GSAP JS thỉnh thoảng có độ trễ nhỏ khi khởi động trang.
*   **Giải pháp xử lý**:
     1.  **Căn chỉnh Tọa độ chuẩn xác**: Thay đổi điểm bắt đầu và kết thúc của đường cong SVG (`M 465,300 Q 550,150 640,165`) để xuất phát chính xác từ tâm vòng tròn phát sóng NFC (pulsing target circle) của ảnh minh họa, hướng chéo lên góc trên bên phải.
     2.  **Lớp chuyển màu che phủ (Fade-out Linear Gradient)**: Thiết kế một dải màu gradient tuyến tính (`linearGradient`) với chế độ tọa độ `userSpaceOnUse` bắt đầu từ `x1=465` (đầu ra NFC) đến `x2=640` (gần form). Dải màu sẽ tự động mờ dần từ đục sang trong suốt và biến mất hoàn toàn ở mức 85% hành trình (`stopOpacity="0"`), giúp luồng dữ liệu biến mất hoàn toàn trong không gian trống trước khi chạm tới mép của form đăng nhập. Điều này hoàn toàn ngăn chặn hiện tượng đè chữ hay che khuất hộp thoại.
     3.  **Chuyển đổi sang CSS Animation**: Thay thế việc điều khiển GSAP JS bằng hoạt ảnh `@keyframes` CSS nội bộ (`nfcFlow` và `nfcGlowPulse`), giúp giảm tải xử lý JavaScript, đảm bảo luồng animation mượt mà tuyệt đối 60fps và hoạt động tin cậy trên mọi trình duyệt."""

new_nfc = """## 6. Loại bỏ Hoạt ảnh Luồng Dữ liệu NFC (NFC Laser Data Flow Animation)
*   **Quyết định**: Nhằm tối ưu hóa giao diện trang login sạch sẽ, thoáng mát, tập trung trải nghiệm tối đa vào form đăng nhập và loại bỏ bất kỳ cản trở thị giác nào đè lên form, hoạt ảnh luồng dữ liệu NFC chạy chéo nối giữa hình minh họa và thẻ đăng nhập đã được loại bỏ hoàn toàn khỏi giao diện."""

content = content.replace(old_nfc.replace("\n", "\r\n"), new_nfc.replace("\n", "\r\n"))
content = content.replace(old_nfc, new_nfc)
content = content.replace(old_nfc_alt.replace("\n", "\r\n"), new_nfc.replace("\n", "\r\n"))
content = content.replace(old_nfc_alt, new_nfc)

with open(file_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(content)

print("Successfully updated walkthrough.md")
