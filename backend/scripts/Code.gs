/**
 * CODE.GS - Trung tâm xử lý và điều hướng API các yêu cầu (Router Controller)
 */

function doGet(e) {
  try {
    const action = e.parameter.action?.toLowerCase().trim();

    if (action === "login") {
      return handleLogin(e);
    }

    if (action === "seed") {
      try {
        seedMockData();
        return respondJson({ success: true, message: "Khởi tạo dữ liệu mẫu thành công!" });
      } catch (err) {
        return respondJson({ success: false, message: "Lỗi khởi tạo dữ liệu: " + err.message });
      }
    }

    if (action === "getattendance") {
      return handleGetAttendance(e);
    }

    if (action === "read") {
      return handleRead(e);
    }

    if (action === "migrate") {
      return handleMigrate(e);
    }

    // Luồng xử lý quẹt thẻ tự động từ thiết bị phần cứng ESP32 (Mặc định khi không đi kèm action)
    return handleAttendance(e);
  } catch (err) {
    console.error("doGet Error:", err);
    return respond("ERROR: " + err.message);
  }
}

function handleLogin(e) {
  try {
    const email = e.parameter.email?.toString().trim().toLowerCase();
    const hashedPassword = e.parameter.hashedPassword?.toString().trim();

    if (!email || !hashedPassword) {
      return respondJson({ success: false, message: "Missing email or password" });
    }

    const employeeSheet = getEmployeeSheet();
    const data = employeeSheet.getDataRange().getValues();
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      const colA = data[i][0].toString().trim().toLowerCase();
      const colD = data[i][CONFIG.EMP_COL_EMAIL].toString().trim().toLowerCase();
      if (colA === email || colD === email) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex !== -1) {
      const storedHash = employeeSheet.getRange(rowIndex, CONFIG.EMP_COL_PASSWORD + 1).getValue().toString().trim();
      let finalStoredHash = storedHash;
      if (storedHash.length !== 64) {
        finalStoredHash = hashSHA256(storedHash);
      }

      if (finalStoredHash === hashedPassword) {
        const name = employeeSheet.getRange(rowIndex, CONFIG.EMP_COL_NAME + 1).getValue();
        return respondJson({
          success: true,
          data: { name: name, email: email, role: "admin" }
        });
      }
    }
    return respondJson({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
}

// Thuật toán cốt lõi xử lý Đóng / Mở phiên điểm danh linh hoạt theo cấu trúc Stack
function handleAttendance(e) {
  const uid = e.parameter.uid?.toString().toUpperCase().trim();
  if (!uid) return respond("ERROR: No UID");

  const employeeSheet = getEmployeeSheet();
  const attSheet = getAttendanceSheet();
  
  const today = getTodayString();
  const timeNow = getCurrentTimeString();

  const empData = employeeSheet.getDataRange().getValues();
  let employeeName = null;
  let shiftStart = CONFIG.DEFAULT_SHIFT_START;

  for (let i = 1; i < empData.length; i++) {
    const colAVal = empData[i][CONFIG.EMP_COL_UID].toString().toUpperCase().trim();
    const colCVal = empData[i][CONFIG.EMP_COL_RFID].toString().toUpperCase().trim();
    if (colAVal === uid || colCVal === uid) {
      employeeName = empData[i][CONFIG.EMP_COL_NAME];
      break;
    }
  }

  // Thẻ lạ chưa khai báo trong hệ thống danh sách Employee
  if (!employeeName) {
    attSheet.appendRow([today, uid, "Unknown", "", timeNow, "DENIED", "", ""]);
    return respond("DENIED");
  }

  const attData = attSheet.getDataRange().getValues();
  let existingRow = -1;

  // Quét ngược Stack từ dưới lên tìm dòng Check-in đang mở của nhân viên
  for (let i = attData.length - 1; i >= 1; i--) {
    const rowUid = attData[i][CONFIG.ATT_COL_UID].toString().toUpperCase().trim();
    const rowName = attData[i][CONFIG.ATT_COL_NAME].toString().trim();
    const timeInVal = attData[i][CONFIG.ATT_COL_TIME_IN];
    const timeOutVal = attData[i][CONFIG.ATT_COL_TIME_OUT];
    if ((rowUid === uid || rowName === employeeName) && 
        timeInVal && timeInVal.toString().trim() !== "" && 
        (!timeOutVal || timeOutVal.toString().trim() === "")) {
      existingRow = i + 1;
      break;
    }
  }

  if (existingRow === -1) {
    // TH1: TẠO PHIÊN CHECK-IN MỚI
    const status = calcStatus(timeNow, shiftStart);
    attSheet.appendRow([today, uid, employeeName, shiftStart, timeNow, status, "", ""]);
    return respond(`GRANTED|CHECKIN|${employeeName}|${status}`);
  } else {
    // TH2: GHI NHẬN CHECK-OUT ĐỂ ĐÓNG PHIÊN CA LÀM VIỆC
    attSheet.getRange(existingRow, CONFIG.ATT_COL_TIME_OUT + 1).setValue(timeNow);
    const timeIn = attSheet.getRange(existingRow, CONFIG.ATT_COL_TIME_IN + 1).getValue();
    const workingTime = calcOverall(timeIn, timeNow);
    attSheet.getRange(existingRow, CONFIG.ATT_COL_OVERALL + 1).setValue(workingTime);

    return respond(`GRANTED|CHECKOUT|${employeeName}|${timeNow}|${workingTime}`);
  }
}

function handleGetAttendance(e) {
  try {
    const attSheet = getAttendanceSheet();
    const data = attSheet.getDataRange().getValues();
    const dateFilter = (e.parameter.date || getTodayString()).toString().trim();
    
    const rows = data.slice(1)
      .filter(row => row[CONFIG.ATT_COL_DATE].toString().trim() === dateFilter)
      .map(row => ({
        date:       row[CONFIG.ATT_COL_DATE].toString()        || '',
        uid:        row[CONFIG.ATT_COL_UID].toString()         || '',
        name:       row[CONFIG.ATT_COL_NAME].toString()        || '',
        shiftStart: row[CONFIG.ATT_COL_SHIFT_START].toString() || '',
        timeIn:     row[CONFIG.ATT_COL_TIME_IN].toString()     || '',
        status:     row[CONFIG.ATT_COL_STATUS].toString()      || '',
        timeOut:    row[CONFIG.ATT_COL_TIME_OUT].toString()    || '',
        workingTime: row[CONFIG.ATT_COL_OVERALL] !== undefined ? row[CONFIG.ATT_COL_OVERALL].toString() : '',
        overall:     row[CONFIG.ATT_COL_OVERALL] !== undefined ? row[CONFIG.ATT_COL_OVERALL].toString() : '',
      }));
    return respondJson({ success: true, data: rows });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
}

function handleRead(e) {
  try {
    const sheetName = e.parameter.sheet;
    if (!sheetName) return respondJson({ success: false, message: "Missing sheet parameter" });

    const sheet = getSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return respondJson({ success: false, message: "Sheet not found: " + sheetName });

    const data = sheet.getDataRange().getDisplayValues();
    const headers = data[0];
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
    return respondJson({ success: false, message: "Lỗi máy chủ: " + err.message });
  }
}

function doPost(e) {
  try {
    const action = (e.parameter.action || '').toLowerCase().trim();
    if (action === "createemployee") return handleCreateEmployee(e);
    if (action === "updateemployee") return handleUpdateEmployee(e);
    if (action === "updatepassword") return handleUpdatePassword(e);
    if (action === "deactivateemployee") return handleDeactivateEmployee(e);
    if (action === "deleteemployee") return handleDeleteEmployee(e);

    return respondJson({ success: false, message: "Unknown POST action: " + action });
  } catch (err) {
    return respondJson({ success: false, message: "Server error: " + err.message });
  }
}

function handleCreateEmployee(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const empId = (data['Mã NV'] || '').toString().trim();
    const name = (data['Họ tên'] || '').toString().trim();
    const rfid = (data['RFID UID'] || '').toString().trim();
    const email = (data['Email'] || '').toString().trim();
    const dept = (data['Phòng ban'] || '').toString().trim();
    const status = (data['Trạng thái'] || 'Active').toString().trim();
    const password = (data['Password'] || '').toString();

    if (!empId || !name || !password) {
      return respondJson({ success: false, message: "Thiếu Mã NV, Họ tên hoặc Mật khẩu" });
    }

    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        return respondJson({ success: false, message: "Mã NV đã tồn tại: " + empId });
      }
    }

    const hashedPwd = hashSHA256(password);
    sheet.appendRow([empId, name, rfid, email, dept, status, hashedPwd]);
    return respondJson({ success: true, data: { 'Mã NV': empId } });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi tạo nhân viên: " + err.message });
  }
}

function handleUpdateEmployee(e) {
  try {
    const empId = (e.parameter.empId || '').toString().trim();
    if (!empId) return respondJson({ success: false, message: "Missing empId" });

    const data = JSON.parse(e.postData.contents);
    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        if (data['Họ tên'] !== undefined) sheet.getRange(i + 1, CONFIG.EMP_COL_NAME + 1).setValue(data['Họ tên']);
        if (data['RFID UID'] !== undefined) sheet.getRange(i + 1, CONFIG.EMP_COL_RFID + 1).setValue(data['RFID UID']);
        if (data['Email'] !== undefined) sheet.getRange(i + 1, CONFIG.EMP_COL_EMAIL + 1).setValue(data['Email']);
        if (data['Phòng ban'] !== undefined) sheet.getRange(i + 1, CONFIG.EMP_COL_DEPT + 1).setValue(data['Phòng ban']);
        if (data['Trạng thái'] !== undefined) sheet.getRange(i + 1, CONFIG.EMP_COL_STATUS + 1).setValue(data['Trạng thái']);
        return respondJson({ success: true });
      }
    }
    return respondJson({ success: false, message: "Không tìm thấy nhân viên: " + empId });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi cập nhật: " + err.message });
  }
}

function handleUpdatePassword(e) {
  try {
    const empId = (e.parameter.empId || '').toString().trim();
    if (!empId) return respondJson({ success: false, message: "Missing empId" });

    const data = JSON.parse(e.postData.contents);
    const newPassword = (data.password || '').toString();
    if (newPassword.length < 8) return respondJson({ success: false, message: "Mật khẩu phải có ít nhất 8 ký tự" });

    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        sheet.getRange(i + 1, CONFIG.EMP_COL_PASSWORD + 1).setValue(hashSHA256(newPassword));
        return respondJson({ success: true });
      }
    }
    return respondJson({ success: false, message: "Không tìm thấy nhân viên: " + empId });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi đổi mật khẩu: " + err.message });
  }
}

function handleDeactivateEmployee(e) {
  try {
    const empId = (e.parameter.empId || '').toString().trim();
    if (!empId) return respondJson({ success: false, message: "Missing empId" });

    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        sheet.getRange(i + 1, CONFIG.EMP_COL_STATUS + 1).setValue("Inactive");
        return respondJson({ success: true });
      }
    }
    return respondJson({ success: false, message: "Không tìm thấy nhân viên: " + empId });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi vô hiệu hóa: " + err.message });
  }
}

function handleDeleteEmployee(e) {
  try {
    const empId = (e.parameter.empId || '').toString().trim();
    if (!empId) return respondJson({ success: false, message: "Missing empId" });

    const sheet = getEmployeeSheet();
    const allData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0].toString().trim() === empId) {
        sheet.deleteRow(i + 1);
        return respondJson({ success: true, message: "Nhân viên đã được xóa" });
      }
    }
    return respondJson({ success: false, message: "Không tìm thấy nhân viên: " + empId });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi xóa nhân viên: " + err.message });
  }
}

function seedMockData() {
  const ss = getSpreadsheet();
  let empSheet = ss.getSheetByName(CONFIG.SHEET_EMPLOYEE);
  if (!empSheet) empSheet = ss.insertSheet(CONFIG.SHEET_EMPLOYEE);
  empSheet.clearContents();
  
  empSheet.getRange(1, 1, 1, 7).setValues([[
    "Mã NV", "Họ tên", "RFID UID", "Email", "Phòng ban", "Trạng thái", "Password"
  ]]);
  
  empSheet.getRange(2, 1, 5, 7).setValues([
    ["NV01", "Trần Lê Thái",   "37BA66A3", "admin@gmail.com", "IT",        "Active",   hashSHA256("123123")],
    ["NV02", "Nguyễn Thị Lan", "B76DCF25", "lan@gmail.com",   "HR",        "Active",   hashSHA256("123123")],
    ["NV03", "Nhân viên 3",    "",          "nv3@gmail.com",   "Sales",     "Active",   hashSHA256("123123")],
    ["NV04", "Lê Thị Hoa",     "",          "hoa@gmail.com",   "Marketing", "Active",   hashSHA256("123123")],
    ["NV05", "Phạm Văn Đức",   "",          "duc@gmail.com",   "Operations","Inactive", hashSHA256("123123")],
  ]);

  let attSheet = ss.getSheetByName(CONFIG.SHEET_ATTENDANCE);
  if (!attSheet) attSheet = ss.insertSheet(CONFIG.SHEET_ATTENDANCE);
  attSheet.clearContents();
  
  attSheet.getRange(1, 1, 1, 8).setValues([[
    "Date", "UID", "Name", "ShiftStart", "TimeIn", "Status", "TimeOut", "WorkingTime"
  ]]);
  
  const records = [];
  const employeesList = [
    { uid: "NV01", name: "Trần Lê Thái" },
    { uid: "NV02", name: "Nguyễn Thị Lan" },
    { uid: "NV03", name: "Nhân viên 3" },
    { uid: "NV04", name: "Lê Thị Hoa" },
    { uid: "NV05", name: "Phạm Văn Đức" },
  ];

  for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    if (d.getDay() === 0) continue; // Bỏ qua chủ nhật
    const dateStr = Utilities.formatDate(d, CONFIG.TIMEZONE, "yyyy-MM-dd");
    
    employeesList.forEach(emp => {
      if (emp.uid === "NV05" && Math.random() > 0.3) return;
      if (emp.uid !== "NV05" && Math.random() > 0.92) return; 

      let timeInHour, timeInMin;
      if (Math.random() > 0.25) {
        timeInHour = 7;
        timeInMin = Math.floor(40 + Math.random() * 20);
      } else {
        timeInHour = 8;
        timeInMin = Math.floor(Math.random() * 30);
      }
      const timeInStr = `${String(timeInHour).padStart(2, "0")}:${String(timeInMin).padStart(2, "0")}`;
      const status = calcStatus(timeInStr, CONFIG.DEFAULT_SHIFT_START);
      
      const timeOutHour = 17;
      const timeOutMin = Math.floor(Math.random() * 60);
      const timeOutStr = `${String(timeOutHour).padStart(2, "0")}:${String(timeOutMin).padStart(2, "0")}`;
      const overallTime = calcOverall(timeInStr, timeOutStr);
      records.push([dateStr, emp.uid, emp.name, CONFIG.DEFAULT_SHIFT_START, timeInStr, status, timeOutStr, overallTime]);
    });
  }

  if (records.length > 0) {
    attSheet.getRange(2, 1, records.length, 8).setValues(records);
  }
  console.log("✅ Seed dữ liệu thành công!");
}

function handleMigrate(e) {
  try {
    const sheet = getEmployeeSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Check if migration is needed (less than 7 columns or contains merged header slash)
    const needsMigration = data[0].length < 7 || headers.some(h => h.toString().includes("/"));
    
    if (!needsMigration) {
      return respondJson({ success: true, message: "Cột bảng tính đã chuẩn, không cần migrate!" });
    }
    
    const newRows = [[
      "Mã NV", "Họ tên", "RFID UID", "Email", "Phòng ban", "Trạng thái", "Password"
    ]];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const empId = (row[0] || "").toString().trim();
      const name = (row[1] || "").toString().trim();
      const rfid = (row[2] || "").toString().trim();
      const emailOrDept = (row[3] || "").toString().trim();
      const status = (row[4] || "Active").toString().trim();
      const password = (row[5] || "").toString().trim(); // Original password is in column index 5 (F)
      
      let email = "";
      let dept = "";
      
      if (emailOrDept.includes("@")) {
        email = emailOrDept;
        dept = (empId === "NV01") ? "IT" : "IT"; // Default to IT or another department
      } else {
        dept = emailOrDept || "IT";
        // Generate clean email based on Vietnamese name
        const cleanName = name.toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
          .replace(/[đĐ]/g, "d")
          .replace(/[^a-z0-9]/g, "");
        email = cleanName ? `${cleanName}@gmail.com` : `${empId.toLowerCase()}@gmail.com`;
      }
      
      // Make sure NV01 is Active so they can log in
      const finalStatus = (empId === "NV01") ? "Active" : status;
      
      newRows.push([empId, name, rfid, email, dept, finalStatus, password]);
    }
    
    // Clear and write new columns
    sheet.clearContents();
    sheet.getRange(1, 1, newRows.length, 7).setValues(newRows);
    
    return respondJson({ success: true, message: "Cấu trúc cột bảng tính đã được sửa đổi và di chuyển thành công!", data: newRows });
  } catch (err) {
    return respondJson({ success: false, message: "Lỗi di chuyển dữ liệu: " + err.message });
  }
}