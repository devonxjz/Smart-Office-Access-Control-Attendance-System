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
  
  // Cột trong Sheet "Attendance sheet"
  ATT_COL_UID: 0,        // A
  ATT_COL_NAME: 1,       // B
  ATT_COL_SHIFT_START: 2, // C
  ATT_COL_TIME_IN: 3,    // D  (time_acces)
  ATT_COL_STATUS: 4,     // E
  ATT_COL_TIME_OUT: 5,   // F
  ATT_COL_OVERALL: 6,    // G
  
  // Giá trị mặc định
  DEFAULT_SHIFT_START: "08:00",
  
  // Timezone Việt Nam
  TIMEZONE: "Asia/Ho_Chi_Minh",
  LOCALE: "vi-VN"
};

// Hàm lấy Spreadsheet
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