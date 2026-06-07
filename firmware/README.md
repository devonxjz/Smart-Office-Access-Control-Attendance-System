# Firmware - Smart Office Access Controller

## Mô tả

Firmware cho **Access Controller** — thiết bị IoT dựa trên ESP32 đọc NFC card, điều khiển servo cửa, LED, buzzer và relay bóng đèn. Thiết bị kết nối WiFi, gọi Serverless API Layer (Google Apps Script) để xác thực và quản lý danh sách nhân sự trong phòng tự động.

## Tính năng

- **NFC Card Reader**: Đọc UID thẻ NFC qua MFRC522
- **Door Control**: Điều khiển servo mở/đóng cửa (tự động đóng sau 5 giây)
- **Presence Tracking**: Theo dõi danh sách nhân sự hiện tại trong phòng
- **Light Control**: Bật/tắt đèn tự động dựa trên số lượng người (via relay)
- **Visual & Audio Feedback**: LED xanh/đỏ, buzzer báo
- **WiFi Connectivity**: Kết nối WiFi, tự động reconnect
- **Server Verification**: Kiểm tra quyền truy cập từ Serverless API Layer

## Yêu cầu phần cứng

| Thành phần | Model/Chi tiết |
| --- | --- |
| Microcontroller | ESP32 |
| NFC Reader | MFRC522 (13.56 MHz) |
| Door Servo | Any 180° servo |
| LED Green | 3mm LED + 220Ω resistor |
| LED Red | 3mm LED + 220Ω resistor |
| Buzzer | Passive/Active buzzer (any) |
| Relay Module | 5V relay for light control |
| Power Supply | 5V >= 2A (USB or external) |

## Pin Mapping

| Component | ESP32 Pin | Config Define |
| --- | --- | --- |
| NFC Reader (SS) | GPIO 5 | `SS_PIN` |
| NFC Reader (RST) | GPIO 27 | `RST_PIN` |
| Door Servo | GPIO 13 | `SERVO_PIN` |
| LED Green | GPIO 4 | `LED_GREEN` |
| LED Red | GPIO 2 | `LED_RED` |
| Buzzer | GPIO 15 | `BUZZER` |
| Relay | GPIO 14 | `RELAY_PIN` |
| SPI MOSI | GPIO 23 | (SPI.begin) |
| SPI MISO | GPIO 19 | (SPI.begin) |
| SPI CLK | GPIO 18 | (SPI.begin) |

*(Lưu ý: Các pin này có thể cập nhật trực tiếp trong `base.ino` tại phần `#define PIN_DEFINITIONS`)*

## Cấu hình

Chỉnh sửa các hằng số tại đầu file `base.ino`:

```cpp
const char* wifiName = "Your-WiFi-SSID";
const char* password = "Your-WiFi-Password";
const char* serverURL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

Chi tiết xem [FIRMWARE_CONFIG.md](../docs/FIRMWARE_CONFIG.md).

## Cài đặt & Build

### 1. Chuẩn bị Arduino IDE hoặc PlatformIO

**Option A: Arduino IDE**
```bash
# 1. Cài Arduino IDE (nếu chưa có)
#    https://www.arduino.cc/en/software

# 2. Thêm board ESP32:
#    - File → Preferences
#    - Paste vào "Additional Boards Manager URLs":
#      https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
#    - Tools → Board Manager → Search "esp32" → Install

# 3. Cài library MFRC522, ESP32Servo:
#    - Sketch → Include Library → Manage Libraries
#    - Search và install:
#      * MFRC522 (by GithubCommunity)
#      * ESP32Servo (by John K. Bennett)
```

**Option B: PlatformIO (khuyên)**
```bash
# Cài PlatformIO CLI (hoặc VS Code extension)
# https://platformio.org/install

# Build & upload
cd firmware
platformio run --target upload
```

### 2. Upload code

**Arduino IDE:**
- Mở `base.ino` → Select Board: ESP32 Dev Module → Com port → Upload

**PlatformIO:**
```bash
platformio run --target upload
```

### 3. Monitor Serial Output

```bash
# Arduino IDE:
# Tools → Serial Monitor (115200 baud)

# PlatformIO:
platformio device monitor --baud 115200
```

## Flow hoạt động

```
┌─────────────────────────────────────────────┐
│  1. Setup: Init WiFi, RFID, Servo, Relay   │
│     (Thử kết nối WiFi)                      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  2. Loop: Lắng nghe card swipe + check WiFi │
│     - Nếu không WiFi → reconnect            │
│     - Nếu cửa mở > 5s → tự động đóng      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  3. New Card Detected                       │
│     - Đọc UID thẻ                          │
│     - Check cooldown (3s)                  │
│     - Phát âm báo                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  4. Check Access: Gửi UID tới Server        │
│     GET /?uid=XXXXX                         │
└────────────┬──────────────────────────────┬─┘
             │                              │
    GRANTED  │                              │  DENIED
             ▼                              ▼
        ✅ accessGranted()              🚫 accessDenied()
        - Mở cửa (servo 90°)           - Cấm truy cập
        - LED xanh + buzzer            - LED đỏ + buzzer
        - Add/remove UID khỏi list     - Tắt LED đỏ
        - Update relay (bật/tắt đèn)
        - Tự động đóng sau 5s
```

## Cấu trúc dữ liệu quan trọng

### `usersInRoom` (vector<String>)
- Danh sách UIDs nhân sự hiện tại trong phòng
- Được cập nhật khi quẹt thẻ (thêm nếu mới, xóa nếu đã có)
- Dùng để bật/tắt relay đèn

### State variables
- `doorOpenTime`: Timestamp cửa mở (để tự động đóng)
- `doorIsOpen`: Flag cửa đang mở
- `lastUID`: UID thẻ quẹt trước (cooldown)
- `lastScanTime`: Thời gian quẹt trước

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
| --- | --- | --- |
| Không kết nối WiFi | SSID/password sai, access point tắt | Kiểm tra `wifiName`, `password` trong code |
| MFRC522 không phát hiện | Kết nối SPI lỏng, pin sai | Kiểm tra wiring, SPI pins |
| Servo không động | Servo pin sai, power không đủ | Kiểm tra `SERVO_PIN`, power supply >= 2A |
| Server không response | Serverless API URL sai, WiFi bị chặn | Kiểm tra `serverURL`, network firewall |
| Relay không bật | Relay pin sai, relay hỏng | Kiểm tra `RELAY_PIN`, test relay riêng |

## API Format

Firmware gửi GET request tới backend:

```
GET /exec?uid=0A1B2C3D
Response: 
  - "GRANTED" → mở cửa, update list
  - "DENIED"  → từ chối
```

Xem [Serverless API Layer](../docs/architecture.md) để chi tiết backend.

## Ghi chú

- Firmware là **stateless** — tất cả dữ liệu nhân sự và trạng thái attendance lưu trên Server/Sheets.
- `usersInRoom` (local vector) chỉ dùng để điều khiển đèn cục bộ, không sync với server.
- Nếu cần persistent logging, extend firmware với SPIFFS hoặc gửi log tới server.

## Phát triển tiếp

- [ ] Thêm config từ SD card hoặc SPIFFS (thay vì hardcode)
- [ ] Thêm local display (OLED) để hiển thị trạng thái
- [ ] Thêm backup access (mechanical key, emergency button)
- [ ] OTA firmware update từ server
- [ ] Data logging cục bộ trước khi gửi server (offline mode)

---

**Liên hệ:** Xem `docs/UBIQUITOUS_LANGUAGE.md` để hiểu ngôn ngữ miền.
