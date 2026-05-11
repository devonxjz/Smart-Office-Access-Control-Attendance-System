#ifndef CONFIG_H
#define CONFIG_H

// ==================== CẤU HÌNH CHÂN GPIO ====================
#define SS_PIN      5
#define RST_PIN     27
#define SERVO_PIN   13
#define LED_GREEN   4
#define LED_RED     2
#define BUZZER      15

// ==================== CẤU HÌNH MẠNG & SERVER ====================
const char* ssid          = "Wokwi-GUEST";
const char* password      = "";
const char* serverURL     = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// ==================== CẤU HÌNH HỆ THỐNG ====================
#define DOOR_OPEN_TIME  5000   // milliseconds

#endif