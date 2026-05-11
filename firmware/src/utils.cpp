// utils.h (phiên bản có triển khai)
#ifndef UTILS_H
#define UTILS_H

#include <WiFi.h>
#include <Arduino.h>

extern const char* ssid;
extern const char* password;

inline void ensureWiFiConnected() {
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

#endif