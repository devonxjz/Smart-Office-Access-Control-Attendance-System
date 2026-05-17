/**
 * CODE.GS - File chính
 */

function doGet(e) {
  try {
    const action = e.parameter.action?.toLowerCase().trim();

    // === XỬ LÝ LOGIN ===
    if (action === "login") {
      return handleLogin(e);
    }

    // === ĐỌC DỮ LIỆU CHẤM CÔNG (Frontend gọi) ===
    if (action === "getattendance") {
      return handleGetAttendance(e);
    }

    // === XỬ LÝ READ DATA (generic) ===
    if (action === "read") {
      return handleRead(e);
    }

    // === XỬ LÝ CHẤM CÔNG (mặc định — ESP32 gọi) ===
    return handleAttendance(e);

  } catch (err) {
    console.error("doGet Error:", err);
    return respond("ERROR: " + err.message);
  }
}

// ====================== LOGIN HANDLER ======================
function handleLogin(e) {
  try {
    const email = e.parameter.email?.toString().trim().toLowerCase();
    const hashedPassword = e.parameter.hashedPassword?.toString().trim();

    if (!email || !hashedPassword) {
      return respondJson({ success: false, message: "Missing email or password" });
    }

    const employeeSheet = getEmployeeSheet();
    const finder = employeeSheet.getRange(2, CONFIG.EMP_COL_EMAIL + 1, Math.max(1, employeeSheet.getLastRow() - 1)).createTextFinder(email).matchEntireCell(true).findNext();

    if (finder) {
      const rowIndex = finder.getRow();
      const storedHash = employeeSheet.getRange(rowIndex, CONFIG.EMP_COL_PASSWORD + 1).getValue().toString().trim();

      // Hỗ trợ trường hợp password trong Sheet đang là plaintext (chưa băm)
      let finalStoredHash = storedHash;
      if (storedHash.length !== 64) {
        finalStoredHash = hashSHA256(storedHash);
      }

      if (finalStoredHash === hashedPassword) {
        const name = employeeSheet.getRange(rowIndex, CONFIG.EMP_COL_NAME + 1).getValue();
        return respondJson({
          success: true,
          data: {
            name: name,
            email: email,
            role: "admin"
          }
        });
      }
    }

    return respondJson({ success: false, message: "Sai tài khoản hoặc mật khẩu" });

  } catch (err) {
    console.error("handleLogin Error:", err);
    return respondJson({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
}

// ====================== ATTENDANCE HANDLER (giữ nguyên logic cũ) ======================
function handleAttendance(e) {
  const uid = e.parameter.uid?.toString().toUpperCase().trim();
  
  if (!uid) return respond("ERROR: No UID");

  const employeeSheet = getEmployeeSheet();
  const attSheet = getAttendanceSheet();
  
  const today = getTodayString();
  const timeNow = getCurrentTimeString();

  // Tra cứu nhân viên
  const empData = employeeSheet.getDataRange().getValues();
  let employeeName = null;
  let shiftStart = CONFIG.DEFAULT_SHIFT_START;

  for (let i = 1; i < empData.length; i++) {
    if (empData[i][CONFIG.EMP_COL_UID].toString().toUpperCase().trim() === uid) {
      employeeName = empData[i][CONFIG.EMP_COL_NAME];
      break;
    }
  }

  if (!employeeName) {
    attSheet.appendRow([uid, "Unknown", "", timeNow, "DENIED", "", ""]);
    return respond("DENIED");
  }

  // Kiểm tra đã có bản ghi hôm nay
  const attData = attSheet.getDataRange().getValues();
  let existingRow = -1;

  for (let i = 1; i < attData.length; i++) {
    // 💡 Thêm điều kiện check ngày hôm nay
    if (attData[i][CONFIG.ATT_COL_UID] === uid && 
        attData[i][CONFIG.ATT_COL_DATE] === today) {
      existingRow = i + 1;
      break;
    }
  }

  if (existingRow === -1) {
    // CHECK IN
    const status = calcStatus(timeNow, shiftStart);
    // Cần thêm biến today vào mảng record nếu thêm cột DATE đầu tiên
    attSheet.appendRow([today, uid, employeeName, shiftStart, timeNow, status, "", ""]);
    return respond(`GRANTED|CHECKIN|${employeeName}|${status}`);
  } else {
    // CHECK OUT
    attSheet.getRange(existingRow, CONFIG.ATT_COL_TIME_OUT + 1).setValue(timeNow);
    return respond(`GRANTED|CHECKOUT|${employeeName}|${timeNow}`);
  }
}


// ====================== GET ATTENDANCE HANDLER ======================
/**
 * Frontend gọi: ?action=getAttendance&date=yyyy-MM-dd
 * Mặc định: hôm nay nếu không truyền date
 */
function handleGetAttendance(e) {
  try {
    const attSheet = getAttendanceSheet();
    const data = attSheet.getDataRange().getValues();

    const dateFilter = (e.parameter.date || getTodayString()).toString().trim();

    const rows = data.slice(1)
      .filter(function(row) {
        return row[CONFIG.ATT_COL_DATE].toString().trim() === dateFilter;
      })
      .map(function(row) {
        return {
          date:       row[CONFIG.ATT_COL_DATE].toString()        || '',
          uid:        row[CONFIG.ATT_COL_UID].toString()         || '',
          name:       row[CONFIG.ATT_COL_NAME].toString()        || '',
          shiftStart: row[CONFIG.ATT_COL_SHIFT_START].toString() || '',
          timeIn:     row[CONFIG.ATT_COL_TIME_IN].toString()     || '',
          status:     row[CONFIG.ATT_COL_STATUS].toString()      || '',
          timeOut:    row[CONFIG.ATT_COL_TIME_OUT].toString()    || '',
        };
      });

    return respondJson({ success: true, data: rows });

  } catch (err) {
    console.error("handleGetAttendance Error:", err);
    return respondJson({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
}

// ====================== READ HANDLER ======================
function handleRead(e) {
  try {
    const sheetName = e.parameter.sheet;
    if (!sheetName) {
      return respondJson({ success: false, message: "Missing sheet parameter" });
    }

    const sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return respondJson({ success: false, message: "Sheet not found: " + sheetName });
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    // Blacklist các cột nhạy cảm — không bao giờ trả về hash mật khẩu
    const HIDDEN_COLS = ["Password", "password", "Mật khẩu", "mat_khau"];

    const rows = data.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        if (!HIDDEN_COLS.includes(h.toString().trim())) obj[h] = row[i];
      });
      return obj;
    });

    return respondJson({ success: true, data: rows });

  } catch (err) {
    console.error("handleRead Error:", err);
    return respondJson({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
}


// ====================== doPost - Xử lý POST requests ======================
function doPost(e) {
  try {
    const action = (e.parameter.action || '').toLowerCase().trim();

    if (action === "createemployee") {
      return handleCreateEmployee(e);
    }
    if (action === "updateemployee") {
      return handleUpdateEmployee(e);
    }
    if (action === "updatepassword") {
      return handleUpdatePassword(e);
    }
    if (action === "deactivateemployee") {
      return handleDeactivateEmployee(e);
    }

    return respondJson({ success: false, message: "Unknown POST action: " + action });
  } catch (err) {
    console.error("doPost Error:", err);
    return respondJson({ success: false, message: "Server error: " + err.message });
  }
}

// ====================== CREATE EMPLOYEE ======================
function handleCreateEmployee(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const empId = (data['Mã NV'] || '').toString().trim();
    const name = (data['Họ tên'] || '').toString().trim();
    const rfid = (data['RFID UID'] || '').toString().trim();
    const dept = (data['Phòng ban'] || '').toString().trim();
    const status = (data['Trạng thái'] || 'Active').toString().trim();
    const password = (data['Password'] || '').toString();

    if (!empId || !name || !password) {
      return respondJson({ success: false, message: "Thiếu Mã NV, Họ tên hoặc Mật khẩu" });
    }

    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();

    // Check duplicate empId
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        return respondJson({ success: false, message: "Mã NV đã tồn tại: " + empId });
      }
    }

    const hashedPwd = hashSHA256(password);
    sheet.appendRow([empId, name, rfid, dept, status, hashedPwd]);

    return respondJson({ success: true, data: { 'Mã NV': empId } });
  } catch (err) {
    console.error("handleCreateEmployee Error:", err);
    return respondJson({ success: false, message: "Lỗi tạo nhân viên: " + err.message });
  }
}

// ====================== UPDATE EMPLOYEE ======================
function handleUpdateEmployee(e) {
  try {
    const empId = (e.parameter.empId || '').toString().trim();
    if (!empId) {
      return respondJson({ success: false, message: "Missing empId" });
    }

    const data = JSON.parse(e.postData.contents);
    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        if (data['Họ tên'] !== undefined) sheet.getRange(i + 1, 2).setValue(data['Họ tên']);
        if (data['RFID UID'] !== undefined) sheet.getRange(i + 1, 3).setValue(data['RFID UID']);
        if (data['Phòng ban'] !== undefined) sheet.getRange(i + 1, 4).setValue(data['Phòng ban']);
        if (data['Trạng thái'] !== undefined) sheet.getRange(i + 1, 5).setValue(data['Trạng thái']);
        return respondJson({ success: true });
      }
    }

    return respondJson({ success: false, message: "Không tìm thấy nhân viên: " + empId });
  } catch (err) {
    console.error("handleUpdateEmployee Error:", err);
    return respondJson({ success: false, message: "Lỗi cập nhật: " + err.message });
  }
}

// ====================== UPDATE PASSWORD ======================
function handleUpdatePassword(e) {
  try {
    const empId = (e.parameter.empId || '').toString().trim();
    if (!empId) {
      return respondJson({ success: false, message: "Missing empId" });
    }

    const data = JSON.parse(e.postData.contents);
    const newPassword = (data.password || '').toString();
    if (newPassword.length < 8) {
      return respondJson({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }

    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        sheet.getRange(i + 1, 6).setValue(hashSHA256(newPassword));
        return respondJson({ success: true });
      }
    }

    return respondJson({ success: false, message: "Không tìm thấy nhân viên: " + empId });
  } catch (err) {
    console.error("handleUpdatePassword Error:", err);
    return respondJson({ success: false, message: "Lỗi đổi mật khẩu: " + err.message });
  }
}

// ====================== DEACTIVATE EMPLOYEE ======================
function handleDeactivateEmployee(e) {
  try {
    const empId = (e.parameter.empId || '').toString().trim();
    if (!empId) {
      return respondJson({ success: false, message: "Missing empId" });
    }

    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        sheet.getRange(i + 1, 5).setValue("Inactive");
        return respondJson({ success: true });
      }
    }

    return respondJson({ success: false, message: "Không tìm thấy nhân viên: " + empId });
  } catch (err) {
    console.error("handleDeactivateEmployee Error:", err);
    return respondJson({ success: false, message: "Lỗi vô hiệu hóa: " + err.message });
  }
}

function testLogin() {
  const testEvent = {
    parameter: {
      action: "login",
      email: "admin@gmail.com",
      hashedPassword: "..." // SHA256 of "password"
    }
  };
  console.log(handleLogin(testEvent).getContent());
}

// ====================== SEED MOCK DATA ======================
// Chạy hàm này 1 lần từ Apps Script Editor để tạo header + mock data
function seedMockData() {
  const ss = getSpreadsheet();

  // ---- Employee Sheet ----
  let empSheet = ss.getSheetByName(CONFIG.SHEET_EMPLOYEE);
  if (!empSheet) empSheet = ss.insertSheet(CONFIG.SHEET_EMPLOYEE);
  empSheet.clearContents();

  empSheet.getRange(1, 1, 1, 6).setValues([[
    "UID", "Name", "Phone", "Email", "Gender", "Password"
  ]]);
  empSheet.getRange(2, 1, 5, 6).setValues([
    ["NV01", "Trần Lê Thái",  "869655077", "admin@gmail.com",  "Nam",  hashSHA256("123123")],
    ["NV02", "Nguyễn Thị Lan","912345678", "lan@gmail.com",    "Nữ",   hashSHA256("123123")],
    ["NV03", "Nhân viên 3",   "901155480", "nv03@gmail.com",   "Nam",  hashSHA256("123123")],
    ["NV04", "Lê Thị Hoa",    "933445566", "hoa@gmail.com",    "Nữ",   hashSHA256("123123")],
    ["NV05", "Phạm Văn Đức",  "944556677", "duc@gmail.com",    "Nam",  hashSHA256("123123")],
  ]);

  // ---- Attendance Sheet ----
  let attSheet = ss.getSheetByName(CONFIG.SHEET_ATTENDANCE);
  if (!attSheet) attSheet = ss.insertSheet(CONFIG.SHEET_ATTENDANCE);
  attSheet.clearContents();

  attSheet.getRange(1, 1, 1, 8).setValues([[
    "Date", "UID", "Name", "ShiftStart", "TimeIn", "Status", "TimeOut", "Note"
  ]]);

  const today = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
  const yesterday = Utilities.formatDate(new Date(Date.now() - 86400000), CONFIG.TIMEZONE, "yyyy-MM-dd");

  attSheet.getRange(2, 1, 8, 8).setValues([
    // Hôm nay
    [today, "NV01", "Trần Lê Thái",  "08:00", "07:52", "ON_TIME", "17:05", ""],
    [today, "NV02", "Nguyễn Thị Lan","08:00", "08:10", "LATE",    "17:30", ""],
    [today, "NV03", "Nhân viên 3",   "08:00", "09:00", "LATE",    "",      ""],
    [today, "NV04", "Lê Thị Hoa",    "08:00", "07:58", "ON_TIME", "17:00", ""],
    // Hôm qua
    [yesterday, "NV01", "Trần Lê Thái",  "08:00", "08:00", "ON_TIME", "17:00", ""],
    [yesterday, "NV02", "Nguyễn Thị Lan","08:00", "08:05", "ON_TIME", "17:15", ""],
    [yesterday, "NV05", "Phạm Văn Đức",  "08:00", "08:25", "LATE",    "17:00", ""],
    [yesterday, "NV04", "Lê Thị Hoa",    "08:00", "08:00", "ON_TIME", "16:55", ""],
  ]);

  console.log("✅ Seed mock data xong! Employee: 5 rows, Attendance: 8 rows");
}