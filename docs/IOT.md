### **`1.Main workflow`**

    ESP32 → Google Apps Script → Google Sheets ← Dashboard (Web App)

### **2\. App Scripts**

`Thiết kế lại Google Sheet`

`Tab 1: AuthorizedCards`

| `A` | `B` | `C` |
| ----- | ----- | ----- |
| `UID` | `Name` | `ShiftStart` |
| `A1B2C3D4` | `Nguyen Van A` | `08:00` |
| `B2C3D4E5` | `Tran Thi B` | `08:00` |

`ShiftStart là giờ bắt đầu ca — dùng để tính trễ/đúng giờ.`

`Tab 2: Attendance (thay AccessLog)`

| `A` | `B` | `C` | `D` | `E` |
| ----- | ----- | ----- | ----- | ----- |
| `Date` | `UID` | `Name` | `CheckIn` | `CheckOut` |

---

`Apps Script nâng cấp`

`function doGet(e) {`  
  `try {`  
    `const uid = e.parameter.uid?.toString().toUpperCase().trim();`  
    `if (!uid) return respond("ERROR: No UID");`

    `const ss        = SpreadsheetApp.getActiveSpreadsheet();`  
    `const authSheet = ss.getSheetByName("AuthorizedCards");`  
    `const attSheet  = ss.getSheetByName("Attendance");`

    `const now       = new Date();`  
    `const today     = now.toLocaleDateString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh"});`  
    `const timeNow   = now.toLocaleTimeString("vi-VN", {timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit"});`

    `// --- Tra cứu nhân viên ---`  
    `const authData = authSheet.getDataRange().getValues();`  
    `let ownerName = null;`  
    `let shiftStart = "08:00"; // Mặc định nếu không khai báo`

    `for (let i = 1; i < authData.length; i++) {`  
      `if (authData[i][0].toString().toUpperCase().trim() === uid) {`  
        `ownerName  = authData[i][1];`  
        `shiftStart = authData[i][2] || "08:00";`  
        `break;`  
      `}`  
    `}`

    `if (!ownerName) {`  
      `attSheet.appendRow([today, uid, "Unknown", timeNow, "", "DENIED"]);`  
      `return respond("DENIED");`  
    `}`

    `// --- Kiểm tra hôm nay đã có dòng chưa ---`  
    `const attData = attSheet.getDataRange().getValues();`  
    `let existingRow = -1;`

    `for (let i = 1; i < attData.length; i++) {`  
      `if (attData[i][0] === today && attData[i][1] === uid) {`  
        `existingRow = i + 1; // Số hàng thực tế trên Sheet (1-based)`  
        `break;`  
      `}`  
    `}`

    `if (existingRow === -1) {`  
      `// --- Lần quẹt đầu tiên trong ngày = CHECK IN ---`  
      `const status = calcStatus(timeNow, shiftStart);`  
      `attSheet.appendRow([today, uid, ownerName, timeNow, "", status]);`  
      `return respond("GRANTED|CHECKIN|" + ownerName + "|" + status);`

    `} else {`  
      `// --- Lần quẹt thứ hai = CHECK OUT ---`  
      `attSheet.getRange(existingRow, 5).setValue(timeNow); // Ghi vào cột CheckOut`  
      `return respond("GRANTED|CHECKOUT|" + ownerName + "|" + timeNow);`  
    `}`

  `} catch (err) {`  
    `return respond("ERROR: " + err.message);`  
  `}`  
`}`

`// Tính trạng thái dựa vào giờ vào và ca làm`  
`function calcStatus(timeNow, shiftStart) {`  
  `const [nowH, nowM]   = timeNow.split(":").map(Number);`  
  `const [shiftH, shiftM] = shiftStart.split(":").map(Number);`

  `const nowMinutes   = nowH * 60 + nowM;`  
  `const shiftMinutes = shiftH * 60 + shiftM;`

  `if (nowMinutes <= shiftMinutes)       return "Đúng giờ";`  
  `if (nowMinutes <= shiftMinutes + 15)  return "Trễ nhẹ (<15p)";`  
  `return "Trễ";`  
`}`

`function respond(text) {`  
  `return ContentService.createTextOutput(text)`  
    `.setMimeType(ContentService.MimeType.TEXT);`  
`}`

---

`Cập nhật firmware ESP32`

`Parse response mới có dạng GRANTED|CHECKIN|Nguyen Van A|Đúng giờ:`

`if (response.startsWith("GRANTED")) {`  
  `// Tách thông tin từ response`  
  `int p1 = response.indexOf('|');`  
  `int p2 = response.indexOf('|', p1 + 1);`  
  `int p3 = response.indexOf('|', p2 + 1);`

  `String action = response.substring(p1 + 1, p2); // CHECKIN / CHECKOUT`  
  `String name   = response.substring(p2 + 1, p3); // Tên nhân viên`  
  `String status = response.substring(p3 + 1);      // Đúng giờ / Trễ`

  `Serial.println("Xin chào: " + name);`  
  `Serial.println("Trạng thái: " + action + " | " + status);`  
  `accessGranted();`

`} else if (response == "DENIED") {`  
  `accessDenied();`  
`}`

`Kết quả trong Google Sheet`

| `Date` | `UID` | `Name` | `CheckIn` | `CheckOut` | `Status` |
| ----- | ----- | ----- | ----- | ----- | ----- |
| `08/05/2025` | `A1B2C3D4` | `Nguyen Van A` | `07:58` | `17:03` | `Đúng giờ` |
| `08/05/2025` | `B2C3D4E5` | `Tran Thi B` | `08:17` | `17:10` | `Trễ` |

---

