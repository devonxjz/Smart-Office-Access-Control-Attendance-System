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
#define RELAY_PIN   4    // Relay → đèn phòng (NO)
#define GREEN_LED   12   // LED xanh (access granted)
#define RED_LED     14   // LED đỏ (access denied / standby)
#define BUZZER_PIN  15   // Buzzer (ledcWriteTone)

// ==================== OBJECTS ====================
MFRC522 rfid(SS_PIN, RST_PIN);
Servo   doorServo;

// ==================== CONFIG ====================
const char* wifiName  = "P709";
const char* password  = "cochochopass";
const char* serverURL = "https://script.google.com/macros/s/AKfycbziy4rMhyLu-Bh9ohSdko_cp8DXwUU_R4zgBxv5_GGbCnoxx1AKUgjJJkw1p1L7j9LntQ/exec";

const int          HTTP_TIMEOUT         = 10000;
const unsigned long DOOR_OPEN_DURATION  = 5000;
const unsigned long SCAN_COOLDOWN       = 3000;
const unsigned long WIFI_RETRY_INTERVAL = 10000;

// ==================== THẺ KHẨN CẤP (offline) ====================
const char* emergencyUIDs[] = { "37BA66A3", "B76DCF25" };
const int   emergencyCount  = 2;

// ==================== PRESENCE TRACKING ====================
// Mỗi thẻ có trạng thái isInside riêng.
// Quẹt lần lẻ = vào, quẹt lần chẵn = ra.
// Relay bật khi ít nhất 1 người trong phòng, tắt khi phòng trống.

struct CardState {
  char uid[20];
  bool isInside;
};

CardState cardStates[20];
int       cardCount = 0;

// Trả về true nếu thẻ này vừa VÀO, false nếu vừa RA
bool toggleCardState(const char* uid) {
  for (int i = 0; i < cardCount; i++) {
    if (strcmp(cardStates[i].uid, uid) == 0) {
      cardStates[i].isInside = !cardStates[i].isInside;
      return cardStates[i].isInside;
    }
  }
  // Thẻ mới — lần đầu quẹt = vào
  if (cardCount < 20) {
    strncpy(cardStates[cardCount].uid, uid, sizeof(cardStates[cardCount].uid) - 1);
    cardStates[cardCount].uid[sizeof(cardStates[cardCount].uid) - 1] = '\0';
    cardStates[cardCount].isInside = true;
    cardCount++;
  }
  return true;
}

int countPeopleInside() {
  int count = 0;
  for (int i = 0; i < cardCount; i++) {
    if (cardStates[i].isInside) count++;
  }
  return count;
}

void updateRoomLight() {
  int inside = countPeopleInside();
  if (inside > 0) {
    digitalWrite(RELAY_PIN, LOW);  // LOW = BẬT (Active LOW)
    Serial.printf("💡 Đèn BẬT — %d người trong phòng.\n", inside);
  } else {
    digitalWrite(RELAY_PIN, HIGH); // HIGH = TẮT (Active LOW)
    Serial.println("💡 Đèn TẮT — phòng trống.");
  }
}

// ==================== STATE ====================
unsigned long doorOpenTime    = 0;
bool          doorIsOpen      = false;
char          lastUID[20]     = "";
unsigned long lastScanTime    = 0;
unsigned long lastWiFiAttempt = 0;

// ==================== BUZZER HELPERS ====================
// ⚠️ ledcAttach/Detach mỗi lần dùng — tránh xung đột timer với ESP32Servo

void buzzerTone(int freq, int duration_ms) {
  ledcAttach(BUZZER_PIN, freq, 8);
  ledcWriteTone(BUZZER_PIN, freq);
  delay(duration_ms);
  ledcWriteTone(BUZZER_PIN, 0);
  ledcDetach(BUZZER_PIN);
}

void buzzerBeepConfirm() { buzzerTone(1000, 200); }

void buzzerBeepGranted() {
  buzzerTone(1200, 100);
  delay(100);
  buzzerTone(1200, 100);
}

void buzzerBeepDenied() {
  for (int i = 0; i < 3; i++) {
    buzzerTone(500, 150);
    delay(50);
  }
}

// ==================== SERVO HELPERS ====================
void setDoorAngle(int angle) {
  doorServo.attach(SERVO_PIN);
  delay(10);
  doorServo.write(angle);
  delay(700);
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

// ==================== FORWARD DECLARATIONS ====================
void accessGranted(const char* uid);
void accessDenied();

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED,   OUTPUT);

  digitalWrite(RELAY_PIN, HIGH);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED,   HIGH);

  // Servo trước — chiếm timer trước LEDC
  Serial.println("Khởi tạo: Đưa cửa về vị trí ĐÓNG (0 độ)...");
  setDoorAngle(0);
  Serial.println("✅ Servo sẵn sàng.");

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

  connectWiFiBlocking();

  Serial.println("==========================================");
  Serial.println("  Hệ thống sẵn sàng. Vui lòng quẹt thẻ...");
  Serial.println("==========================================");
}

// ==================== LOOP ====================
void loop() {
  ensureWiFiConnected();

  // --- Tự động đóng cửa (non-blocking) ---
  if (doorIsOpen && (millis() - doorOpenTime >= DOOR_OPEN_DURATION)) {
    Serial.println("⏱️ Hết giờ — đang đóng cửa tự động...");
    setDoorAngle(0);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED,   HIGH);
    doorIsOpen = false;
    Serial.println("🔒 Đã đóng cửa.");
    // Relay (đèn phòng) KHÔNG tắt ở đây — do updateRoomLight() quản lý
  }

  // --- Health-check RFID ---
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

  // --- Bước 4: Halt thẻ ---
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // --- Bước 5: Cooldown ---
  if (strcmp(uidString, lastUID) == 0 && (millis() - lastScanTime < SCAN_COOLDOWN)) {
    Serial.printf("⏳ Thẻ %s vừa quẹt, đợi cooldown...\n", uidString);
    return;
  }
  strncpy(lastUID, uidString, sizeof(lastUID) - 1);
  lastUID[sizeof(lastUID) - 1] = '\0';
  lastScanTime = millis();

  // --- Bước 5.5: Thẻ khẩn cấp — mở cửa offline, không cần WiFi ---
  for (int i = 0; i < emergencyCount; i++) {
    if (strcmp(uidString, emergencyUIDs[i]) == 0) {
      Serial.println("🔑 Thẻ khẩn cấp — mở cửa offline.");
      buzzerBeepConfirm();
      accessGranted(uidString);
      return;
    }
  }

  // --- Bước 6: Beep xác nhận ---
  buzzerBeepConfirm();
  Serial.printf("\n📋 Mã thẻ quẹt: %s\n", uidString);

  // --- Bước 7: Gọi server ---
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
  client.setTimeout(HTTP_TIMEOUT / 1000);

  HTTPClient http;
  String requestURL = String(serverURL) + "?uid=" + uid;
  http.begin(client, requestURL);
  http.setTimeout(HTTP_TIMEOUT);
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  Serial.println("🔄 Đang kiểm tra trên Server...");

  int    httpResponseCode = -1;
  String response         = "";

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
      accessGranted(uid);
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
void accessGranted(const char* uid) {
  // Toggle trạng thái vào/ra của thẻ này
  bool entering = toggleCardState(uid);
  int  inside   = countPeopleInside();

  if (entering) {
    Serial.printf("➡️  VÀO phòng. Trong phòng: %d người.\n", inside);
  } else {
    Serial.printf("⬅️  RA phòng. Trong phòng: %d người.\n", inside);
  }

  // Cập nhật đèn phòng theo số người hiện tại
  updateRoomLight();

  // LED + servo mở cửa
  Serial.println("🔓 Mở cửa...");
  digitalWrite(RED_LED,   LOW);
  digitalWrite(GREEN_LED, HIGH);
  buzzerBeepGranted();
  setDoorAngle(90);

  doorOpenTime = millis();
  doorIsOpen   = true;
}

// ==================== ACCESS DENIED ====================
void accessDenied() {
  Serial.println("🚫 Từ chối truy cập.");

  bool wasGreenOn = digitalRead(GREEN_LED);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED,   HIGH);

  buzzerBeepDenied();

  digitalWrite(RED_LED, LOW);

  if (wasGreenOn && doorIsOpen) {
    digitalWrite(GREEN_LED, HIGH);
  } else if (!doorIsOpen) {
    digitalWrite(RED_LED, HIGH);
  }
}
