/**
 * CONFIGURATION - Cấu hình định vị cột và tham số cho hệ thống chấm công
 */

const CONFIG = {
  // Tên các trang tính (Tabs)
  SHEET_EMPLOYEE: "Employee",
  SHEET_ATTENDANCE: "Attendance sheet",
  
  // Định vị chỉ số mảng cột trong Trang "Employee" (Bắt đầu từ 0 = Cột A)
  EMP_COL_UID: 0,        // A — Mã nhân viên (NV01...)
  EMP_COL_NAME: 1,       // B — Họ tên
  EMP_COL_RFID: 2,       // C — RFID UID mã thẻ vật lý từ thiết bị
  EMP_COL_EMAIL: 3,      // D — Email hoặc phòng ban công tác
  EMP_COL_GENDER: 4,     // E — Trạng thái hoạt động (Active/Inactive)
  EMP_COL_PASSWORD: 5,   // F — SHA-256 hash chuỗi bảo mật mật khẩu
  
  // Định vị chỉ số mảng cột trong Trang "Attendance sheet"
  ATT_COL_DATE: 0,        // A — Ngày chấm công
  ATT_COL_UID: 1,         // B — Mã nhân viên hoặc UID thẻ quẹt
  ATT_COL_NAME: 2,        // C — Họ và tên nhân viên
  ATT_COL_SHIFT_START: 3, // D — Giờ vào ca quy chuẩn (Mặc định 08:00)
  ATT_COL_TIME_IN: 4,     // E — Thời gian Check-in thực tế
  ATT_COL_STATUS: 5,      // F — Phân loại trạng thái đi làm (ON_TIME/LATE)
  ATT_COL_TIME_OUT: 6,    // G — Thời gian Check-out thực tế
  ATT_COL_OVERALL: 7,     // H — Tổng chu kỳ làm việc (Định dạng chuỗi)
  
  // Thiết lập ca mặc định
  DEFAULT_SHIFT_START: "08:00",
  
  // Định chuẩn khu vực địa lý Việt Nam
  TIMEZONE: "Asia/Ho_Chi_Minh",
  LOCALE: "vi-VN"
};

// Hàm kết nối Spreadsheet thông qua ID tĩnh công khai
function getSpreadsheet() {
  return SpreadsheetApp.openById("1m-SfidtbPE_yFrQoRcxjsVnY52yZklRq9xEW3eH2uxk");
}

// Các hàm liên kết nhanh đến từng Tab dữ liệu
function getEmployeeSheet() {
  return getSpreadsheet().getSheetByName(CONFIG.SHEET_EMPLOYEE);
}

function getAttendanceSheet() {
  return getSpreadsheet().getSheetByName(CONFIG.SHEET_ATTENDANCE);
}