#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

// Định nghĩa chân an toàn (Không xung đột I2C)
#define SS_PIN   5
#define RST_PIN  27
#define SERVO_PIN 13
#define LED_GREEN 4
#define LED_RED 2
#define BUZZER 15

MFRC522 rfid(SS_PIN, RST_PIN);
Servo doorServo;

const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Link Google Apps Script (Sử dụng const char* lưu vào Flash, tiết kiệm RAM)
const char* serverURL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// Biến quản lý Non-blocking cho Servo
unsigned long doorOpenTime = 0;
bool doorIsOpen = false;

// Hàm tự động kết nối lại WiFi khi rớt mạng
void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;
  
  Serial.println("WiFi mất kết nối. Đang kết nối lại...");
  WiFi.disconnect();
  WiFi.begin(ssid, password);
  
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nKết nối WiFi thành công!");
  } else {
    Serial.println("\nKhông thể kết nối lại WiFi.");
  }
}

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  // Khởi tạo SPI với các chân tường minh
  SPI.begin(18, 19, 23, SS_PIN);
  rfid.PCD_Init();
  
  doorServo.attach(SERVO_PIN);
  doorServo.write(0);
  
  ensureWiFiConnected();
  Serial.println("Hệ thống sẵn sàng. Vui lòng quẹt thẻ...");
}

void loop() {
  ensureWiFiConnected();

  // Đóng cửa tự động bằng millis() (Non-blocking)
  if (doorIsOpen && (millis() - doorOpenTime >= 5000)) {
    doorServo.write(0);
    digitalWrite(LED_GREEN, LOW);
    doorIsOpen = false;
    Serial.println("Đã đóng cửa tự động.");
  }

  // Tìm và đọc thẻ
  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  tone(BUZZER, 1000, 200);

  String uidString = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uidString += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uidString += String(rfid.uid.uidByte[i], HEX);
  }
  uidString.toUpperCase();
  Serial.println("\nMã thẻ quẹt: " + uidString);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1(); // Ngăn lỗi mã hóa cho lần đọc tiếp theo

  // Kiểm tra quyền trên Server
  checkAccess(uidString);
}

// Pass-by-reference (const String&) để không tốn RAM copy biến String
void checkAccess(const String& uid) {
  WiFiClientSecure client;
  client.setInsecure(); // Phù hợp cho ESP32 prototype
  HTTPClient http;
  
  String requestURL = String(serverURL) + "?uid=" + uid;
  http.begin(client, requestURL);

  // QUAN TRỌNG: Google Apps Script trả 302 redirect.
  // Phải follow redirect mới tới đúng endpoint thực thi.
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);
  
  Serial.println("Đang kiểm tra trên Server...");
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    response.trim();

    // Debug: in HTTP code và body để dễ chẩn đoán
    Serial.printf("[DEBUG] HTTP %d | Body: %s\n", httpResponseCode, response.c_str());
    
    if (httpResponseCode == 200 && response.startsWith("GRANTED")) {
      // Server trả "GRANTED|CHECKIN|Tên|status" hoặc "GRANTED|CHECKOUT|Tên|giờ"
      Serial.println("✅ " + response);
      accessGranted();
    } else if (httpResponseCode == 200 && response.startsWith("DENIED")) {
      Serial.println("❌ Thẻ không có trong danh sách nhân viên.");
      accessDenied();
    } else if (httpResponseCode == 404) {
      Serial.println("Lỗi: API endpoint không tồn tại (404).");
      accessDenied();
    } else if (httpResponseCode == 500) {
      Serial.println("Lỗi: Server lỗi nội bộ (500).");
      accessDenied();
    } else {
      Serial.println("Phản hồi không xác định.");
      accessDenied();
    }
  } else {
    Serial.printf("Lỗi kết nối API: %s\n", http.errorToString(httpResponseCode).c_str());
    accessDenied();
  }
  
  http.end();
}

void accessGranted() {
  Serial.println("Hợp lệ! Đang mở cửa...");
  digitalWrite(LED_GREEN, HIGH);
  doorServo.write(90);
  
  doorOpenTime = millis(); 
  doorIsOpen = true;       
}

void accessDenied() {
  Serial.println("Thẻ không hợp lệ hoặc lỗi mạng!");
  digitalWrite(LED_RED, HIGH);
  
  // NOTE FOR REVIEW: Vòng lặp này tốn ~600ms blocking. 
  // Chấp nhận được ở mức Prototype để tiết kiệm logic state machine phức tạp.
  // Trong 600ms này nếu có người quẹt thẻ sẽ bị bỏ qua (miss scan).
  for(int i = 0; i < 3; i++) {
    tone(BUZZER, 500, 150);
    delay(200); 
  }
  
  digitalWrite(LED_RED, LOW);
}