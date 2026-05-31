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
String lastUID = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_COOLDOWN = 3000; // 3 giây cooldown giữa 2 lần quẹt cùng thẻ

// HTTP timeout (ms) — SSL handshake với Google chậm, cần đủ thời gian
const int HTTP_TIMEOUT = 10000;

// ==================== WiFi ====================
void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  Serial.println("WiFi mất kết nối. Đang kết nối lại...");
  WiFi.disconnect(true);  // true = xóa cached credentials
  delay(100);
  WiFi.mode(WIFI_STA);    // Station mode rõ ràng
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

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);
  
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
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
  
  doorServo.attach(SERVO_PIN);
  doorServo.write(0);
  
  ensureWiFiConnected();
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
    doorServo.write(0);
    digitalWrite(LED_GREEN, LOW);
    doorIsOpen = false;
    Serial.println("🔒 Đã đóng cửa tự động.");
  }

  // ===== ĐỌC THẺ RFID =====
  // Reset RFID reader antenna mỗi vòng loop để đảm bảo đọc liên tục
  rfid.PCD_Init();
  delay(50);

  // Bước 1: Kiểm tra có thẻ mới không
  if (!rfid.PICC_IsNewCardPresent()) return;
  
  // Bước 2: Đọc serial number
  if (!rfid.PICC_ReadCardSerial()) return;

  // Bước 3: Tạo chuỗi UID
  String uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uidString += "0";
    uidString += String(rfid.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();

  // Bước 4: Halt thẻ + stop crypto
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // Bước 5: Cooldown — chống quẹt trùng lặp liên tục
  if (uidString == lastUID && (millis() - lastScanTime < SCAN_COOLDOWN)) {
    Serial.println("⏳ Thẻ " + uidString + " vừa quẹt, đợi cooldown...");
    return;
  }
  lastUID = uidString;
  lastScanTime = millis();

  // Bước 6: Beep xác nhận đã đọc thẻ
  tone(BUZZER, 1000, 200);
  Serial.println("\n📋 Mã thẻ quẹt: " + uidString);

  // Bước 7: Gọi Server kiểm tra
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi chưa kết nối. Bỏ qua lần quẹt này.");
    accessDenied();
    return;
  }
  checkAccess(uidString);
}

// ==================== HTTP CHECK ====================
void checkAccess(const String& uid) {
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
    Serial.printf("❌ Lỗi kết nối sau 2 lần thử: %s\n", http.errorToString(httpResponseCode).c_str());
    accessDenied();
  }
}

// ==================== ACCESS GRANTED ====================
void accessGranted() {
  Serial.println("🔓 Mở cửa...");
  digitalWrite(LED_GREEN, HIGH);
  doorServo.write(90);
  
  doorOpenTime = millis(); 
  doorIsOpen = true;       
}

// ==================== ACCESS DENIED ====================
void accessDenied() {
  Serial.println("🚫 Từ chối truy cập.");
  digitalWrite(LED_RED, HIGH);
  
  // Buzzer cảnh báo 3 tiếng beep (~600ms blocking — chấp nhận cho prototype)
  for(int i = 0; i < 3; i++) {
    tone(BUZZER, 500, 150);
    delay(200); 
  }
  
  digitalWrite(LED_RED, LOW);
}