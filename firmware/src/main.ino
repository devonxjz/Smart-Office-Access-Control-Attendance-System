#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>

#include "config.h"
#include "utils.h"
#include "rfid.h"
#include "buzzer_led.h"

// Biến toàn cục
Servo doorServo;
bool doorIsOpen = false;
unsigned long doorOpenTime = 0;

void checkAccess(const String& uid);

void setup() {
  Serial.begin(115200);
  
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  
  initRFID();
  
  doorServo.attach(SERVO_PIN);
  doorServo.write(0);
  
  ensureWiFiConnected();
  
  Serial.println("=== HỆ THỐNG KIỂM SOÁT CỬA RFID ===");
  Serial.println("Hệ thống sẵn sàng. Vui lòng quẹt thẻ...");
}

void loop() {
  ensureWiFiConnected();

  // Tự động đóng cửa sau 5 giây
  if (doorIsOpen && (millis() - doorOpenTime >= DOOR_OPEN_TIME)) {
    doorServo.write(0);
    digitalWrite(LED_GREEN, LOW);
    doorIsOpen = false;
    Serial.println("Đã đóng cửa tự động.");
  }

  // Đọc thẻ RFID
  String uid = readRFIDCard();
  if (uid != "") {
    Serial.println("\nMã thẻ quẹt: " + uid);
    tone(BUZZER, 1000, 200);
    checkAccess(uid);
  }
}

// Kiểm tra quyền truy cập qua Google Apps Script
void checkAccess(const String& uid) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  
  String requestURL = String(serverURL) + "?uid=" + uid;
  http.begin(client, requestURL);
  
  Serial.println("Đang kiểm tra trên Server...");
  int httpResponseCode = http.GET();
  
  if (httpResponseCode == 200) {
    accessGranted();
  } else {
    Serial.printf("Phản hồi: %d\n", httpResponseCode);
    accessDenied();
  }
  
  http.end();
}