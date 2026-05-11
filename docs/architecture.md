iot-attendance-system/                  # Root project
├── firmware/                           # Code ESP32
├── backend/                            # Google Apps Script + Web App đơn giản
├── dashboard/                          # Frontend (HTML + CSS + JS)
├── docs/                               # Tài liệu
├── scripts/                            # Các script hỗ trợ (nếu cần)
├── config/                             # File cấu hình
├── .gitignore
├── README.md
└── LICENSE

1. firmware/
├── src/                          # Source code chính
│   ├── main.ino                  # File chính
│   ├── config.h                  # Cấu hình WiFi, Server, PIN...
│   ├── rfid.h                    # Hàm đọc RFID
│   ├── display.h                 # Điều khiển OLED/LCD
│   ├── buzzer_led.h              # Điều khiển buzzer + LED
│   └── utils.h                   # Các hàm tiện ích
├── lib/                          # Thư viện (nếu dùng PlatformIO)
├── platformio.ini                # Nếu dùng PlatformIO
├── README.md                     # Hướng dẫn flash firmware
└── build/                        # (Tự sinh) file build


2. backend/
├── appsscript/                        # Code Google Apps Script
│   ├── Code.gs                        # File chính (doGet, doPost...)
│   ├── config.gs                      # Cấu hình (Sheet ID, Tab name...)
│   └── helpers.gs                     # Các hàm phụ (calcStatus, respond...)
│
├── webapp/                            # Web App tĩnh (không framework)
│   ├── index.html                     # Trang chính Dashboard
│   ├── login.html                     # (Tùy chọn) Trang đăng nhập
│   ├── attendance.html                # Trang chấm công thủ công
│   │
│   ├── css/
│   │   ├── style.css
│   │   ├── dashboard.css
│   │   └── table.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── api.js                     # Hàm gọi Google Apps Script Web App
│   │   ├── dashboard.js
│   │   ├── attendance.js
│   │   └── utils.js
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
├── data/                              # Dữ liệu mẫu (export)
│   └── sample_attendance.csv
│
└── README.md

Mục đích của backend/webapp/:

Dễ deploy lên GitHub Pages / Vercel / Netlify
Hoặc nhúng trực tiếp vào Google Apps Script Web App
Dễ dàng gọi dữ liệu từ Google Sheet qua api.js



