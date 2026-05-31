/**
 * HELPERS - Các hàm hỗ trợ
 */

function calcStatus(timeIn, shiftStart) {
  try {
    if (!timeIn || !shiftStart) return "LATE";
    
    const parseToMin = function(val) {
      if (val instanceof Date) {
        return val.getHours() * 60 + val.getMinutes();
      }
      const s = val.toString().trim();
      const parts = s.split(":").map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
      }
      return 0;
    };

    const nowMinutes = parseToMin(timeIn);
    const shiftMinutes = parseToMin(shiftStart);

    // Grace period: ≤ 5 minutes late → ON_TIME (per PRD §5.1)
    if (nowMinutes <= shiftMinutes + 5)  return "ON_TIME";
    return "LATE";
  } catch (e) {
    console.error("calcStatus error:", e);
    return "LATE";
  }
}

function hashSHA256(text) {
  if (!text) return '';
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, 
    text, 
    Utilities.Charset.UTF_8
  );
  return digest.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

function respond(text) {
  return ContentService.createTextOutput(text)
    .setMimeType(ContentService.MimeType.TEXT);
}

function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getTodayString() {
  // Utilities.formatDate đảm bảo timezone VN và format YYYY-MM-DD nhất quán
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
}

function getCurrentTimeString() {
  // Sử dụng Utilities.formatDate với CONFIG.TIMEZONE để đảm bảo giờ hiển thị đúng múi giờ Việt Nam, bao gồm cả giây để test
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "HH:mm:ss");
}

/**
 * Tính tổng giờ làm việc giữa timeIn và timeOut dưới dạng số tiếng thập phân (để tính lương).
 * Input:  "08:05", "17:30"
 * Output: 9.42 (giờ)
 */
function calcOverall(timeIn, timeOut) {
  try {
    const parseTimeToSeconds = function(timeVal) {
      if (!timeVal) return 0;
      
      // Nếu timeVal là đối tượng Date (Google Sheets thường trả về Date cho kiểu Giờ)
      if (timeVal instanceof Date) {
        return timeVal.getHours() * 3600 + timeVal.getMinutes() * 60 + timeVal.getSeconds();
      }
      
      const s = timeVal.toString().trim();
      if (s === "") return 0;
      
      // Nếu là chuỗi ngày giờ đầy đủ dạng GMT/UTC
      if (s.includes(" ") && s.includes(":")) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        }
      }
      
      // Định dạng HH:MM hoặc HH:MM:SS
      const parts = s.split(":").map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const h = parts[0];
        const m = parts[1];
        const sec = parts[2] || 0;
        return h * 3600 + m * 60 + sec;
      }
      
      return 0;
    };

    const inSec = parseTimeToSeconds(timeIn);
    const outSec = parseTimeToSeconds(timeOut);

    if (isNaN(inSec) || isNaN(outSec)) {
      return "0 giây";
    }

    let diffSeconds = outSec - inSec;

    // Xử lý trường hợp checkout qua ngày (ví dụ ca đêm)
    if (diffSeconds < 0) diffSeconds += 24 * 3600;

    // Làm tròn số giây
    diffSeconds = Math.round(diffSeconds);

    const h = Math.floor(diffSeconds / 3600);
    const m = Math.floor((diffSeconds % 3600) / 60);
    const sec = diffSeconds % 60;

    const parts = [];
    if (h > 0) parts.push(h + " giờ");
    if (m > 0) parts.push(m + " phút");
    if (sec > 0 || parts.length === 0) parts.push(sec + " giây");

    return parts.join(" ");
  } catch (e) {
    console.error("calcOverall error:", e);
    return "0 giây";
  }
}

/**
 * Chạy hàm này MỘT LẦN duy nhất trong Apps Script để tự động sửa toàn bộ các dòng bị lỗi #NUM!
 * và chuyển đổi chúng sang định dạng "X giờ Y phút" chuẩn xác.
 */
function fixExistingAttendance() {
  const ss = getSpreadsheet();
  const attSheet = ss.getSheetByName(CONFIG.SHEET_ATTENDANCE);
  if (!attSheet) {
    console.log("Không tìm thấy sheet Attendance!");
    return;
  }

  const allData = attSheet.getDataRange().getValues();
  let fixedCount = 0;

  for (let i = 1; i < allData.length; i++) {
    const timeIn = allData[i][CONFIG.ATT_COL_TIME_IN];
    const timeOut = allData[i][CONFIG.ATT_COL_TIME_OUT];
    const currentOverall = allData[i][CONFIG.ATT_COL_OVERALL];

    // Chỉ sửa nếu dòng đó có giờ vào, có giờ ra
    if (timeIn && timeOut) {
      const fixedOverall = calcOverall(timeIn, timeOut);
      attSheet.getRange(i + 1, CONFIG.ATT_COL_OVERALL + 1).setValue(fixedOverall);
      fixedCount++;
    }
  }

  console.log("✅ Đã sửa thành công " + fixedCount + " bản ghi chấm công lỗi!");
}

/**
 * Chạy hàm này MỘT LẦN duy nhất trong Apps Script để:
 * 1. Xóa bỏ trình đơn thả xuống (Data Validation) bị nhầm ở cột TimeIn (Cột E).
 * 2. Tạo trình đơn thả xuống chuẩn ở cột Status (Cột F) với 2 lựa chọn là "ON_TIME" và "LATE".
 */
function fixSpreadsheetValidation() {
  const ss = getSpreadsheet();
  const attSheet = ss.getSheetByName(CONFIG.SHEET_ATTENDANCE);
  if (!attSheet) {
    console.log("Không tìm thấy sheet Attendance!");
    return;
  }

  // 1. Xóa validation ở cột TimeIn (Cột E / Cột 5) từ dòng 2 trở đi
  const lastRow = attSheet.getLastRow();
  if (lastRow >= 2) {
    const timeInRange = attSheet.getRange(2, CONFIG.ATT_COL_TIME_IN + 1, lastRow - 1);
    timeInRange.clearDataValidations();
    console.log("✅ Đã xóa trình đơn thả xuống bị nhầm ở cột TimeIn (Cột E)!");

    // 2. Tạo dropdown validation ở cột Status (Cột F / Cột 6) từ dòng 2 trở đi
    const statusRange = attSheet.getRange(2, CONFIG.ATT_COL_STATUS + 1, lastRow - 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["ON_TIME", "LATE"], true)
      .setAllowInvalid(false)
      .setHelpText("Vui lòng chọn trạng thái: ON_TIME hoặc LATE")
      .build();
    statusRange.setDataValidation(rule);
    console.log("✅ Đã tạo trình đơn thả xuống hợp lệ cho cột Status (Cột F) với các giá trị: ON_TIME, LATE!");
  } else {
    console.log("Sheet không có đủ dữ liệu dòng để cấu hình validation.");
  }
}