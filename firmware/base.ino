#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

// ===== PIN DEFINITIONS =====
#define SS_PIN      5    // Chip select RFID
#define RST_PIN     27   // Reset RFID
#define SERVO_PIN   13   // Dong co servo
#define RELAY_PIN   4    // Relay den phong
#define GREEN_LED   12   // LED xanh
#define RED_LED     14   // LED do
#define BUZZER_PIN  15   // Buzzer bao còi

// ===== OBJECTS =====
MFRC522 rfid(SS_PIN, RST_PIN);
Servo   doorServo;

// ===== CONFIG =====
const char* wifiName  = "P709";
const char* password  = "cochochopass";
const char* serverURL = "https://script.google.com/macros/s/AKfycbziy4rMhyLu-Bh9ohSdko_cp8DXwUU_R4zgBxv5_GGbCnoxx1AKUgjJJkw1p1L7j9LntQ/exec";

const int          HTTP_TIMEOUT         = 10000;
const unsigned long DOOR_OPEN_DURATION  = 5000;
const unsigned long SCAN_COOLDOWN       = 3000;
const unsigned long WIFI_RETRY_INTERVAL = 10000;

// ===== DANH SACH THE KHAN CAP =====
const char* emergencyUIDs[] = { "37BA66A3", "B76DCF25" ,"AD9CF106"};
const int   emergencyCount  = 3;

// ===== PRESENCE TRACKING =====
struct CardState {
  char uid[20];
  bool isInside;
};

CardState cardStates[20];
int       cardCount = 0;

// Thay doi trang thai ra vao cua the rfid
bool toggleCardState(const char* uid) {
  for (int i = 0; i < cardCount; i++) {
    if (strcmp(cardStates[i].uid, uid) == 0) {
      cardStates[i].isInside = !cardStates[i].isInside;
      return cardStates[i].isInside;
    }
  }
  if (cardCount < 20) {
    strncpy(cardStates[cardCount].uid, uid, sizeof(cardStates[cardCount].uid) - 1);
    cardStates[cardCount].uid[sizeof(cardStates[cardCount].uid) - 1] = '\0';
    cardStates[cardCount].isInside = true;
    cardCount++;
  }
  return true;
}

// Dem so nguoi dang o trong phong
int countPeopleInside() {
  int count = 0;
  for (int i = 0; i < cardCount; i++) {
    if (cardStates[i].isInside) count++;
  }
  return count;
}

// Cap nhat trang thai relay den dua tren so nguoi trong phong
void updateRoomLight() {
  int inside = countPeopleInside();
  if (inside > 0) {
    digitalWrite(RELAY_PIN, LOW);
    Serial.printf("Đèn BẬT — %d người trong phòng.\n", inside);
  } else {
    digitalWrite(RELAY_PIN, HIGH);
    Serial.println("Đèn TẮT — phòng trống.");
  }
}

// ===== SYSTEM STATE =====
unsigned long doorOpenTime    = 0;
bool          doorIsOpen      = false;
char          lastUID[20]     = "";
unsigned long lastScanTime    = 0;
unsigned long lastWiFiAttempt = 0;
int           consecutiveFails = 0;
unsigned long lastLightPoll   = 0;
const unsigned long LIGHT_POLL_INTERVAL = 10000;

// ===== BUZZER HELPERS =====
// Phat am thanh buzzer voi tan so va thoi gian chi dinh
void buzzerTone(int freq, int duration_ms) {
  ledcAttach(BUZZER_PIN, freq, 8);
  ledcWriteTone(BUZZER_PIN, freq);
  delay(duration_ms);
  ledcWriteTone(BUZZER_PIN, 0);
  ledcDetach(BUZZER_PIN);
}

// Coi bip xac nhan da quet the
void buzzerBeepConfirm() { buzzerTone(1000, 200); }

// Coi bip khi duoc phep truy cap
void buzzerBeepGranted() {
  buzzerTone(1200, 100);
  delay(100);
  buzzerTone(1200, 100);
}

// Coi bip khi bi tu choi truy cap
void buzzerBeepDenied() {
  for (int i = 0; i < 3; i++) {
    buzzerTone(500, 150);
    delay(50);
  }
}

// ===== SERVO HELPERS =====
// Dieu khien servo quay den goc chi dinh de dong mo cua
void setDoorAngle(int angle) {
  doorServo.attach(SERVO_PIN);
  delay(10);
  doorServo.write(angle);
  delay(700);
  doorServo.detach();
}

// ===== WIFI HELPERS =====
// Ket noi wifi o che do chan khi khoi dong
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
    Serial.println("\nKhông thể kết nối WiFi. Sẽ thử lại sau.");
  }
}

// Tu dong ket noi lai wifi neu bi mat ket noi
void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) return;
  if (lastWiFiAttempt != 0 && (millis() - lastWiFiAttempt < WIFI_RETRY_INTERVAL)) return;
  lastWiFiAttempt = millis();
  Serial.println("WiFi mất kết nối. Đang reconnect...");
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiName, password);
}

// ===== FORWARD DECLARATIONS =====
void accessGranted(const char* uid);
void accessDenied();
void pollLightStatus();
void alertOfflineAlarm();

// ===== SETUP =====
// Khoi tao cac thiet bi ngoai vi va ket noi ban dau
void setup() {
  Serial.begin(115200);
  delay(100);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED,   OUTPUT);

  digitalWrite(RELAY_PIN, HIGH);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED,   HIGH);

  Serial.println("Khởi tạo: Đưa cửa về vị trí ĐÓNG (0 độ)...");
  setDoorAngle(0);
  Serial.println("Servo sẵn sàng.");

  SPI.begin(18, 19, 23, SS_PIN);
  rfid.PCD_Init();
  delay(50);

  byte version = rfid.PCD_ReadRegister(rfid.VersionReg);
  Serial.printf("MFRC522 Firmware Version: 0x%02X\n", version);
  if (version == 0x00 || version == 0xFF) {
    Serial.println("CẢNH BÁO: Không phát hiện MFRC522! Kiểm tra dây SPI.");
  } else {
    Serial.println("MFRC522 sẵn sàng.");
  }

  connectWiFiBlocking();

  Serial.println("==========================================");
  Serial.println("  Hệ thống sẵn sàng. Vui lòng quẹt thẻ...");
  Serial.println("==========================================");
}

// ===== MAIN LOOP =====
// Chu ky quet the va xu ly logic he thong
void loop() {
  ensureWiFiConnected();

  // Poll light status from server every 10 seconds
  if (millis() - lastLightPoll >= LIGHT_POLL_INTERVAL) {
    lastLightPoll = millis();
    pollLightStatus();
  }

  // Tu dong dong cua sau thoi gian mo
  if (doorIsOpen && (millis() - doorOpenTime >= DOOR_OPEN_DURATION)) {
    Serial.println("Hết giờ — đang đóng cửa tự động...");
    setDoorAngle(0);
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED,   HIGH);
    doorIsOpen = false;
    Serial.println("Đã đóng cửa.");
  }

  // Kiem tra trang thai RFID reader
  byte v = rfid.PCD_ReadRegister(rfid.VersionReg);
  if (v == 0x00 || v == 0xFF) {
    Serial.println("RFID reader mất kết nối, re-init...");
    rfid.PCD_Init();
    delay(50);
    return;
  }

  // Kiem tra co the moi
  if (!rfid.PICC_IsNewCardPresent()) return;

  // Doc thong tin the
  if (!rfid.PICC_ReadCardSerial()) return;

  // Chuyen UID sang chuoi hex
  char uidString[20];
  int pos = 0;
  for (byte i = 0; i < rfid.uid.size && pos < 18; i++) {
    pos += sprintf(uidString + pos, "%02X", rfid.uid.uidByte[i]);
  }
  uidString[pos] = '\0';

  // Dung giao tiep voi the
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  // Kiem tra thoi gian cho giua 2 lan quet the
  if (strcmp(uidString, lastUID) == 0 && (millis() - lastScanTime < SCAN_COOLDOWN)) {
    Serial.printf("Thẻ %s vừa quẹt, đợi cooldown...\n", uidString);
    return;
  }
  strncpy(lastUID, uidString, sizeof(lastUID) - 1);
  lastUID[sizeof(lastUID) - 1] = '\0';
  lastScanTime = millis();

  // Kiem tra the khan cap de mo cua offline truoc
  for (int i = 0; i < emergencyCount; i++) {
    if (strcmp(uidString, emergencyUIDs[i]) == 0) {
      Serial.println("Thẻ khẩn cấp — mở cửa offline.");
      buzzerBeepConfirm();
      accessGranted(uidString);
      return;
    }
  }

  // Beep xac nhan quet the hop le
  buzzerBeepConfirm();
  Serial.printf("\nMã thẻ quẹt: %s\n", uidString);

  // Gui yeu cau den Google Sheets neu wifi ket noi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi chưa kết nối. Bỏ qua lần quẹt này.");
    accessDenied();
    return;
  }
  checkAccess(uidString);
}

// ===== HTTP CHECK =====
// Gui yeu cau den Google Sheets de kiem tra ma the
void checkAccess(const char* uid) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(HTTP_TIMEOUT / 1000);

  HTTPClient http;
  String requestURL = String(serverURL) + "?uid=" + uid;
  http.begin(client, requestURL);
  http.setTimeout(HTTP_TIMEOUT);
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  Serial.println("Đang kiểm tra trên Server...");

  int    httpResponseCode = -1;
  String response         = "";

  for (int attempt = 1; attempt <= 2; attempt++) {
    httpResponseCode = http.GET();
    if (httpResponseCode > 0) {
      response = http.getString();
      response.trim();
      break;
    }
    Serial.printf("Lần thử %d thất bại: %s\n", attempt, http.errorToString(httpResponseCode).c_str());
    if (attempt < 2) {
      Serial.println("Đang thử lại...");
      delay(1000);
    }
  }

  String lastError = (httpResponseCode < 0) ? http.errorToString(httpResponseCode) : "";
  http.end();

  if (httpResponseCode == 200) {
    Serial.printf("[DEBUG] HTTP 200 | Body: %s\n", response.c_str());
    if (response.startsWith("GRANTED")) {
      Serial.println(response);
      accessGranted(uid);
    } else if (response.startsWith("DENIED")) {
      Serial.println("Thẻ không có trong danh sách.");
      accessDenied();
    } else if (response.startsWith("ERROR")) {
      Serial.println("Server báo lỗi: " + response);
      accessDenied();
    } else {
      Serial.println("Phản hồi không xác định: " + response);
      accessDenied();
    }
  } else if (httpResponseCode > 0) {
    Serial.printf("HTTP %d — phản hồi bất thường.\n", httpResponseCode);
    accessDenied();
  } else {
    Serial.printf("Lỗi kết nối sau 2 lần thử: %s\n", lastError.c_str());
    accessDenied();
  }
}

// ===== ACCESS GRANTED =====
// Xu ly logic mo cua, LED, coi buzzer va den phong khi duoc cap quyen
void accessGranted(const char* uid) {
  consecutiveFails = 0; // reset counter
  bool entering = toggleCardState(uid);
  int  inside   = countPeopleInside();

  if (entering) {
    Serial.printf("VÀO phòng. Trong phòng: %d người.\n", inside);
  } else {
    Serial.printf("RA phòng. Trong phòng: %d người.\n", inside);
  }

  updateRoomLight();

  Serial.println("Mở cửa...");
  digitalWrite(RED_LED,   LOW);
  digitalWrite(GREEN_LED, HIGH);
  buzzerBeepGranted();
  setDoorAngle(90);

  doorOpenTime = millis();
  doorIsOpen   = true;
}

// ===== ACCESS DENIED =====
// Xu ly logic coi buzzer va LED khi truy cap bi tu choi
void accessDenied() {
  Serial.println("Từ chối truy cập.");

  consecutiveFails++;
  if (consecutiveFails >= 3) {
    alertOfflineAlarm();
    consecutiveFails = 0;
    return;
  }

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

// ===== ALARM FOR 3 CONSECUTIVE FAILS =====
void alertOfflineAlarm() {
  Serial.println("CẢNH BÁO: Quẹt thẻ sai 3 lần liên tiếp!");
  for (int i = 0; i < 5; i++) {
    digitalWrite(RED_LED, HIGH);
    buzzerTone(300, 300);
    digitalWrite(RED_LED, LOW);
    delay(100);
  }
  digitalWrite(RED_LED, HIGH); // standard state
}

// ===== POLL LIGHT STATUS FROM SERVER =====
void pollLightStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(HTTP_TIMEOUT / 1000);

  HTTPClient http;
  String requestURL = String(serverURL) + "?action=getLightStatus";
  http.begin(client, requestURL);
  http.setTimeout(HTTP_TIMEOUT);
  http.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS);

  int httpResponseCode = http.GET();
  if (httpResponseCode == 200) {
    String response = http.getString();
    response.trim();
    if (response.indexOf("\"resolvedState\":\"ON\"") != -1) {
      digitalWrite(RELAY_PIN, LOW); // Relay ON (active low)
    } else if (response.indexOf("\"resolvedState\":\"OFF\"") != -1) {
      digitalWrite(RELAY_PIN, HIGH); // Relay OFF (active high)
    }
  }
  http.end();
}
