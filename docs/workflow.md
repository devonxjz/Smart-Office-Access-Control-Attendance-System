Phần cứng:  ESP32 + MFRC522 (SPI) + Servo SG90 + LED + Buzzer
Backend:    Google Apps Script (REST API) + Google Sheets (Database)
Frontend:   Dashboard Web (đang plan)

Luồng:
Quẹt thẻ RFID → ESP32 gửi GET request (HTTPS)
→ Apps Script tra AuthorizedCards
→ Ghi Attendance (CheckIn/CheckOut + Status)
→ Trả về GRANTED/DENIED + tên + trạng thái
→ ESP32 mở cửa / kêu buzzer