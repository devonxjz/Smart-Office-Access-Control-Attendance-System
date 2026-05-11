#ifndef RFID_H
#define RFID_H

#include <Arduino.h>
#include <MFRC522.h>

extern MFRC522 rfid;

String readRFIDCard();
void initRFID();

#endif