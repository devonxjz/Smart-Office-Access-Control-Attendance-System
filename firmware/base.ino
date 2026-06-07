#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

// ==================== PIN DEFINITIONS ====================
#define SS_PIN      5    // RFID Chip Select
#define RST_PIN     27   // RFID Reset
#define SERVO_PIN   13   // Servo motor
#define RELAY_PIN   4    // Relay (đèn LED trắng)
#define GREEN_LED   12   // LED xanh (access granted)
#define RED_LED     14   // LED đỏ (access denied / standby)
#define BUZZER_PIN  15   // Buzzer (ledcWriteTone)

// ==================== OBJECTS ====================
MFRC522 rfid(SS_PIN, RST_PIN);
Servo doorServo;

// ==================== CONFIG ====================
const char* wifiName  = "P709";
const char* password  = "cochochopass";
const char* serverURL = "https://script.google.com/macros/s/AKfycbziy4rMhyLu-Bh9ohSdko_cp8DXwUU_R4zgBxv5_GGbCnoxx1AKUgjJJkw1p1L7j9LntQ/exec";

const int   HTTP_TIMEOUT        = 10000; // ms — SSL handshake Google cần thời gian
const unsigned long DOOR_OPEN_DURATION = 5000; // ms — cửa mở 5 giây rồi tự đóng
const unsigned long SCAN_COOLDOWN      = 3000; // ms — chống quẹt trùng lặp cùng thẻ
const unsigned long WIFI_RETRY_INTERVAL = 10000; // ms — thử lại WiFi mỗi 10 giây

// ==================== STATE ====================
unsigned long doorOpenTime  = 0;
bool          doorIsOpen    = false;

char          lastUID[20]   = "";
unsigned long lastScanTime  = 0;
unsigned long lastWiFiAttempt = 0;

// ==================== BUZZER HELPERS ====================
// ⚠️ QUAN TRỌNG: Chỉ ledcAttach ngay trước khi dùng, ledcDetach ngay sau.
// Lý do: ESP32Servo và LEDC dùng chung hardware timer.
// Nếu ledcAttach tồn tại liên tục → servo không có timer → im hoàn toàn.

void buzzerTone(int freq, int duration_ms) {
  ledcAttach(BUZZER_PIN, freq, 8);
  ledcWriteTone(BUZZER_PIN, freq);
  delay(duration_ms);
  ledcWriteTone(BUZZER_PIN, 0);
  ledcDetach(BUZZER_PIN);
}

void buzzerBeepConfirm() {
  // 1 tiếng bíp ngắn — xác nhận đã đọc thẻ
  buzzerTone(1000, 200);
}

void buzzerBeepGranted() {
  // 2 tiếng bíp — access granted
  buzzerTone(1200, 100);
  delay(100);
  buzzerTone(1200, 100);
}

void buzzerBeepDenied() {
  // 3 tiếng bíp ngắn — access denied
  for (int i = 0; i < 3; i++) {
    buzzerTone(500, 150);
    delay(50);
  }
}

// ==================== SERVO HELPERS ====================
void setDoorAngle(int angle) {
  // Attach → write → chờ servo quay xong → detach
  // Detach sau mỗi lần dùng: giải phóng timer cho LEDC, tránh servo nóng/stuck
  doorServo.attach(SERVO_PIN);
  delay(10); // Đảm bảo attach ổn định trước khi write
  doorServo.write(angle);
  delay(700); // Đủ thời gian servo quay đến vị trí đích
  doorServo.detach();
}

// ==================== WIFI ====================
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
    Serial.println("\n✅ Kết nối WiFi thành công! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n⚠️ Không thể kết nối WiFi. Sẽ thử lại sau.");
  }
}

void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (lastWiFiAttempt != 0 && (millis() - lastWiFiAttempt < WIFI_RETRY_INTERVAL)) return;
  lastWiFiAttempt = millis();
  Serial.println("WiFi mất kết nối. Đang reconnect...");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiName, password);
}

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);

  // 1. Khởi tạo Output — RELAY, LED
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(GREEN_LED,  OUTPUT);
  pinMode(RED_LED,    OUTPUT);

  // Trạng thái ban đầu: cửa đóng, đèn đỏ
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(GREEN_LED,  LOW);
  digitalWrite(RED_LED,    HIGH);

  // 2. Khởi tạo Servo TRƯỚC — đảm bảo servo chiếm timer trước LEDC
  //    Sau khi setDoorAngle() xong, detach() sẽ trả lại timer
  Serial.println("Khởi tạo: Đưa cửa về vị trí ĐÓNG (0 độ)...");
  setDoorAngle(0);
  Serial.println("✅ Servo sẵn sàng.");

  // 3. Khởi tạo SPI + RFID
  SPI.begin(18, 19, 23, SS_PIN);
  rfid.PCD_Init();
  delay(50);

  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("MFRC522 Firmware Version: 0x%02X\n", version);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("⚠️ CẢNH BÁO: Không phát hiện MFRC522! Kiểm tra dây SPI.");
  } else {
    Serial.println("✅ MFRC522 sẵn sàng.");
  }

  // 4. Kết nối WiFi
  connectWiFiBlocking();

  Serial.println("==========================================");
  Serial.println("  Hệ thống sẵn sàng. Vui lòng quẹt thẻ...");
  Serial.println("==========================================");
}

// ==================== LOOP ====================
void loop() {
  // Kiểm tra WiFi mỗi vòng
  ensureWiFiConnected();

  // --- Tự động đóng cửa (non-blocking) ---
  if (doorIsOpen && (millis() - doorOpenTime >= DOOR_OPEN_DURATION)) {
    Serial.println("⏱️ Hết giờ — đang đóng cửa tự động...");
    setDoorAngle(0);
    digitalWrite(RELAY_PIN, LOW);
    digitalWrite(GREEN_LED,  LOW);
    digitalWrite(RED_LED,    HIGH);
    doorIsOpen = false;
    Serial.println("🔒 Đã đóng cửa.");
  }

  // --- Health-check RFID reader ---
  byte v = rfid.PCD_ReadRegister(rfid.VersionReg);
  if (v == 0x00 || v == 0xFF) {
    Serial.println("⚠️ RFID reader mất kết nối, re-init...");
    rfid.PCD_Init();
    delay(50);
    return;
  }

  // --- Bước 1: Kiểm tra có thẻ mới ---
  if (!rfid.PICC_IsNewCardPresent()) return;

  // --- Bước 2: Đọc serial number ---
  if (!rfid.PICC_ReadCardSerial()) return;

  // --- Bước 3: Tạo chuỗi UID ---
  char uidString[20];
  int pos = 0;
  for (byte i = 0; i < rfid.uid.size && pos < 18; i++) {
    pos += sprintf(uidString + pos, "%02X", rfid.uid.uidByte[i]);
  }
  uidString[pos] = '\0';

  // --- Bước 4: Halt thẻ + stop crypto ---
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // --- Bước 5: Cooldown chống quẹt trùng ---
  if (strcmp(uidString, lastUID) == 0 && (millis() - lastScanTime < SCAN_COOLDOWN)) {
    Serial.printf("⏳ Thẻ %s vừa quẹt, đợi cooldown...\n", uidString);
    return;
  }
  strncpy(lastUID, uidString, sizeof(lastUID) - 1);
  lastUID[sizeof(lastUID) - 1] = '\0';
  lastScanTime = millis();

  // emergency case
  const char* emergencyUIDs[] = {"37BA66A3", "B76DCF25"};
  for (int i = 0; i < 2; i++) {
    if (strcmp(uidString, emergencyUIDs[i]) == 0) {
      Serial.println("🔑 Thẻ khẩn cấp — mở cửa offline.");
      buzzerBeepConfirm();
      accessGranted();
      return;
    }
  }

  // --- Bước 6: Beep xác nhận đã đọc thẻ ---
  buzzerBeepConfirm();
  Serial.printf("\n📋 Mã thẻ quẹt: %s\n", uidString);

  // --- Bước 7: Kiểm tra WiFi rồi gọi server ---
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
  client.setTimeout(HTTP_TIMEOUT / 1000); // setTimeout tính bằng giây

  HTTPClient http;
  String requestURL = String(serverURL) + "?uid=" + uid;
  http.begin(client, requestURL);
  http.setTimeout(HTTP_TIMEOUT);
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  Serial.println("🔄 Đang kiểm tra trên Server...");

  int    httpResponseCode = -1;
  String response         = "";

  // Retry tối đa 2 lần nếu lỗi kết nối
  for (int attempt = 1; attempt <= 2; attempt++) {
    httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
      response = http.getString();
      response.trim();
      break;
    }

    Serial.printf("⚠️ Lần thử %d thất bại: %s\n", attempt, http.errorToString(httpResponseCode).c_str());
    if (attempt < 2) {
      Serial.println("🔁 Đang thử lại...");
      delay(1000);
    }
  }

  String lastError = (httpResponseCode < 0) ? http.errorToString(httpResponseCode) : "";
  http.end();

  if (httpResponseCode == 200) {
    Serial.printf("[DEBUG] HTTP 200 | Body: %s\n", response.c_str());

    if (response.startsWith("GRANTED")) {
      Serial.println("✅ " + response);
      accessGranted();
    } else if (response.startsWith("DENIED")) {
      Serial.println("❌ Thẻ không có trong danh sách.");
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

  digitalWrite(RED_LED,    LOW);
  digitalWrite(GREEN_LED,  HIGH);
  digitalWrite(RELAY_PIN,  HIGH); // Bật đèn LED trắng qua Relay

  buzzerBeepGranted();

  // Mở cửa — attach/write/detach bên trong setDoorAngle()
  setDoorAngle(90);

  doorOpenTime = millis();
  doorIsOpen   = true;
}

// ==================== ACCESS DENIED ====================
void accessDenied() {
  Serial.println("🚫 Từ chối truy cập.");

  // Lưu trạng thái GREEN trước khi tắt tạm
  bool wasGreenOn = digitalRead(GREEN_LED);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED,   HIGH);

  buzzerBeepDenied();

  digitalWrite(RED_LED, LOW);

  // Khôi phục GREEN nếu cửa vẫn đang mở
  if (wasGreenOn && doorIsOpen) {
    digitalWrite(GREEN_LED, HIGH);
  } else if (!doorIsOpen) {
    // Cửa đóng → trả về trạng thái standby: đèn đỏ
    digitalWrite(RED_LED, HIGH);
  }
}
