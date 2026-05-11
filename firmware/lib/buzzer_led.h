#ifndef BUZZER_LED_H
#define BUZZER_LED_H

#include <Arduino.h>
#include <ESP32Servo.h>

extern Servo doorServo;
extern bool doorIsOpen;
extern unsigned long doorOpenTime;

void initBuzzerLED();
void accessGranted();
void accessDenied();

#endif