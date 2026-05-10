/**
 * CONFIGURATION - Cấu hình cho hệ thống chấm công
 */

const CONFIG = {
  // Tên các Sheet
  SHEET_EMPLOYEE: "Employee",
  SHEET_ATTENDANCE: "Attendance sheet",
  
  // Cột trong Sheet "Employee"
  EMP_COL_UID: 0,        // A
  EMP_COL_NAME: 1,       // B
  EMP_COL_PHONE: 2,      // C
  EMP_COL_EMAIL: 3,      // D
  EMP_COL_GENDER: 4,     // E
  EMP_COL_PASSWORD: 5,   // F — SHA-256 hash của mật khẩu
  
  // Cột trong Sheet "Attendance sheet"
  ATT_COL_DATE: 0,       // A (Thêm cột DATE)
  ATT_COL_UID: 1,        // B
  ATT_COL_NAME: 2,       // C
  ATT_COL_SHIFT_START: 3, // D
  ATT_COL_TIME_IN: 4,    // E  (time_acces)
  ATT_COL_STATUS: 5,     // F
  ATT_COL_TIME_OUT: 6,   // G
  ATT_COL_OVERALL: 7,    // H
  
  // Giá trị mặc định
  DEFAULT_SHIFT_START: "08:00",
  
  // Timezone Việt Nam
  TIMEZONE: "Asia/Ho_Chi_Minh",
  LOCALE: "vi-VN"
};

// Hàm lấy Spreadsheet — dùng openById vì Web App không có Active Spreadsheet
function getSpreadsheet() {
  return SpreadsheetApp.openById("1m-SfidtbPE_yFrQoRcxjsVnY52yZklRq9xEW3eH2uxk");
}

// Lấy các Sheet
function getEmployeeSheet() {
  return getSpreadsheet().getSheetByName(CONFIG.SHEET_EMPLOYEE);
}

function getAttendanceSheet() {
  return getSpreadsheet().getSheetByName(CONFIG.SHEET_ATTENDANCE);
}