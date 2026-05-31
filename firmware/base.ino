#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

// ==================== PIN DEFINITIONS ====================
#define SS_PIN   5
#define RST_PIN  27
#define SERVO_PIN 13
#define LED_GREEN 4
#define LED_RED 2
#define BUZZER 15

// ==================== OBJECTS ====================
MFRC522 rfid(SS_PIN, RST_PIN);
Servo doorServo;

// ==================== CONFIG ====================
const char* wifiName = "Wokwi-GUEST";
const char* password = "";
const char* serverURL = "https://script.google.com/macros/s/AKfycby8TzP2mtOV_DdX-R-dQZN6_-GqOjYpnCD2fKaQLrAM8yeYFwm5S1g6MqqRVPDjHlMzug/exec";

// ==================== STATE ====================
unsigned long doorOpenTime = 0;
bool doorIsOpen = false;

// Cooldown: chống quẹt trùng liên tục cùng 1 thẻ
char lastUID[20] = "";  // char[] thay String, tránh heap fragmentation
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN = 3000; // 3 giây cooldown giữa 2 lần quẹt cùng thẻ

// HTTP timeout (ms) — SSL handshake với Google chậm, cần đủ thời gian
const int HTTP_TIMEOUT = 10000;

// Non-blocking WiFi reconnect state
unsigned long lastWiFiAttempt = 0;
const unsigned long WIFI_RETRY_INTERVAL = 10000;

// ==================== WiFi ====================
// Blocking — chỉ dùng trong setup()
void connectWiFiBlocking() {
  Serial.println("Đang kết nối WiFi...");
  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiName, password);
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 30) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nKết nối WiFi thành công! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nKhông thể kết nối WiFi. Sẽ thử lại ở vòng loop tiếp.");
  }
}

// Non-blocking — dùng trong loop()
void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (lastWiFiAttempt != 0 && (millis() - lastWiFiAttempt < WIFI_RETRY_INTERVAL)) return;
  lastWiFiAttempt = millis();
  
  Serial.println("WiFi mất kết nối. Khởi động reconnect...");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiName, password);
}

// Helper điều khiển Servo an toàn (chống xung đột LEDC/timer và bảo vệ servo)
void setDoorAngle(int angle) {
  doorServo.attach(SERVO_PIN);
  doorServo.write(angle);
  delay(600); // Đợi servo quay xong
  doorServo.detach(); // Giải phóng để tránh xung đột timer/buzzer và chống nóng/stuck servo
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  // Buzzer — Core v3.x: ledcAttach(pin, freq, resolution_bits)
  ledcAttach(BUZZER, 2000, 8);
  
  // Khởi tạo SPI + RFID
  SPI.begin(18, 19, 23, SS_PIN);
  rfid.PCD_Init();
  delay(50);
  
  // Kiểm tra RFID reader hoạt động
  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.print("MFRC522 Firmware Version: 0x");
  Serial.println(version, HEX);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("⚠️ CẢNH BÁO: Không phát hiện MFRC522! Kiểm tra dây nối SPI.");
  }
  
  // Đưa servo về góc 0 ban đầu an toàn
  setDoorAngle(0);
  
  connectWiFiBlocking();
  Serial.println("==========================================");
  Serial.println("  Hệ thống sẵn sàng. Vui lòng quẹt thẻ...");
  Serial.println("==========================================");
}

// ==================== LOOP ====================
void loop() {
  // Kiểm tra WiFi mỗi vòng loop
  ensureWiFiConnected();

  // Đóng cửa tự động (non-blocking)
  if (doorIsOpen && (millis() - doorOpenTime >= 5000)) {
    setDoorAngle(0);
    digitalWrite(LED_GREEN, LOW);
    doorIsOpen = false;
    Serial.println("🔒 Đã đóng cửa tự động.");
  }

  // ===== ĐỌC THẺ RFID =====
  // Health-check: chỉ re-init nếu reader mất kết nối
  byte v = rfid.PCD_ReadRegister(rfid.VersionReg);
  if (v == 0x00 || v == 0xFF) {
    Serial.println("⚠️ RFID reader mất kết nối, re-init...");
    rfid.PCD_Init();
    delay(50);
    return;
  }

  // Bước 1: Kiểm tra có thẻ mới không
  if (!rfid.PICC_IsNewCardPresent()) return;
  
  // Bước 2: Đọc serial number
  if (!rfid.PICC_ReadCardSerial()) return;

  // Bước 3: Tạo chuỗi UID (char[] cố định, tránh heap fragmentation)
  char uidString[20];
  int pos = 0;
  for (byte i = 0; i < rfid.uid.size && pos < 18; i++) {
    pos += sprintf(uidString + pos, "%02X", rfid.uid.uidByte[i]);
  }
  uidString[pos] = '\0';

  // Bước 4: Halt thẻ + stop crypto
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // Bước 5: Cooldown — chống quẹt trùng lặp liên tục
  if (strcmp(uidString, lastUID) == 0 && (millis() - lastScanTime < SCAN_COOLDOWN)) {
    Serial.printf("⏳ Thẻ %s vừa quẹt, đợi cooldown...\n", uidString);
    return;
  }
  strncpy(lastUID, uidString, sizeof(lastUID) - 1);
  lastUID[sizeof(lastUID) - 1] = '\0';
  lastScanTime = millis();

  // Bước 6: Beep xác nhận đã đọc thẻ
  ledcWriteTone(BUZZER, 1000);
  delay(200);
  ledcWriteTone(BUZZER, 0);
  Serial.printf("\n📋 Mã thẻ quẹt: %s\n", uidString);

  // Bước 7: Gọi Server kiểm tra
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi chưa kết nối. Bỏ qua lần quẹt này.");
    accessDenied();
    return;
  }
  checkAccess(uidString);
}

// ==================== HTTP CHECK ====================
void checkAccess(const char* uid) {
  WiFiClientSecure client;
  client.setInsecure();
  // Tăng timeout cho SSL handshake — Google Apps Script cần thời gian
  client.setTimeout(HTTP_TIMEOUT / 1000); // setTimeout tính bằng giây
  
  HTTPClient http;
  
  String requestURL = String(serverURL) + "?uid=" + uid;
  http.begin(client, requestURL);
  http.setTimeout(HTTP_TIMEOUT);
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  
  Serial.println("🔄 Đang kiểm tra trên Server...");
  
  // Retry tối đa 2 lần nếu lỗi kết nối
  int httpResponseCode = -1;
  String response = "";
  
  for (int attempt = 1; attempt <= 2; attempt++) {
    httpResponseCode = http.GET();
    
    if (httpResponseCode > 0) {
      response = http.getString();
      response.trim();
      break; // Thành công, thoát retry
    }
    
    Serial.printf("⚠️ Lần thử %d thất bại: %s\n", attempt, http.errorToString(httpResponseCode).c_str());
    
    if (attempt < 2) {
      Serial.println("🔁 Đang thử lại...");
      delay(1000);
    }
  }
  
  // Lưu error string TRƯỚC khi giải phóng HTTP object
  String lastError = (httpResponseCode < 0) ? http.errorToString(httpResponseCode) : "";
  http.end();
  
  // Xử lý phản hồi
  if (httpResponseCode == 200) {
    Serial.printf("[DEBUG] HTTP 200 | Body: %s\n", response.c_str());
    
    if (response.startsWith("GRANTED")) {
      Serial.println("✅ " + response);
      accessGranted();
    } else if (response.startsWith("DENIED")) {
      Serial.println("❌ Thẻ không có trong danh sách nhân viên.");
      accessDenied();
    } else if (response.startsWith("ERROR")) {
      Serial.println("⚠️ Server báo lỗi: " + response);
      accessDenied();
    } else {
      Serial.println("❓ Phản hồi không xác định: " + response);
      accessDenied();
    }
  } else if (httpResponseCode > 0) {
    Serial.printf("⚠️ HTTP %d — phản hồi bất thường.\n", httpResponseCode);
    accessDenied();
  } else {
    Serial.printf("❌ Lỗi kết nối sau 2 lần thử: %s\n", lastError.c_str());
    accessDenied();
  }
}

// ==================== ACCESS GRANTED ====================
void accessGranted() {
  Serial.println("🔓 Mở cửa...");
  digitalWrite(LED_GREEN, HIGH);
  setDoorAngle(90);
  
  doorOpenTime = millis(); 
  doorIsOpen = true;       
}

// ==================== ACCESS DENIED ====================
void accessDenied() {
  Serial.println("🚫 Từ chối truy cập.");

  // Tắt GREEN nếu đang sáng (tránh xung đột visual khi cửa đang mở)
  bool wasGreenOn = digitalRead(LED_GREEN);
  digitalWrite(LED_GREEN, LOW);

  digitalWrite(LED_RED, HIGH);
  
  // Buzzer cảnh báo 3 tiếng beep
  for (int i = 0; i < 3; i++) {
    ledcWriteTone(BUZZER, 500);
    delay(150);
    ledcWriteTone(BUZZER, 0);
    delay(50);
  }
  
  digitalWrite(LED_RED, LOW);

  // Khôi phục GREEN nếu cửa vẫn đang mở
  if (wasGreenOn && doorIsOpen) {
    digitalWrite(LED_GREEN, HIGH);
  }
}