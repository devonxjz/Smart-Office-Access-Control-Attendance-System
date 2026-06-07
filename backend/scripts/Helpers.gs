/**
 * HELPERS - Các hàm xử lý nghiệp vụ phụ trợ hệ thống
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

    // Luật Grace period: Đi trễ dưới hoặc bằng 5 phút vẫn tính Đúng giờ (ON_TIME)
    if (nowMinutes <= shiftMinutes + 5) return "ON_TIME";
    return "LATE";
  } catch (e) {
    console.error("calcStatus error:", e);
    return "LATE";
  }
}

// Hàm mã hóa chuỗi văn bản sang định dạng bảo mật SHA-256
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
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "yyyy-MM-dd");
}

function getCurrentTimeString() {
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "HH:mm:ss");
}

// Thuật toán tính toán khoảng thời gian làm việc giữa 2 mốc thời gian
function calcOverall(timeIn, timeOut) {
  try {
    const parseTimeToSeconds = function(timeVal) {
      if (!timeVal) return 0;
      if (timeVal instanceof Date) {
        return timeVal.getHours() * 3600 + timeVal.getMinutes() * 60 + timeVal.getSeconds();
      }
      
      const s = timeVal.toString().trim();
      if (s === "") return 0;
      
      if (s.includes(" ") && s.includes(":")) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) {
          return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
        }
      }
      
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

    if (isNaN(inSec) || isNaN(outSec)) return "0 giây";

    let diffSeconds = outSec - inSec;
    if (diffSeconds < 0) diffSeconds += 24 * 3600; // Hỗ trợ ca làm xuyên đêm
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

// Đoạn mã dọn dẹp lỗi định dạng #NUM! lịch sử (Chạy một lần nếu cần thiết)
function fixExistingAttendance() {
  const ss = getSpreadsheet();
  const attSheet = ss.getSheetByName(CONFIG.SHEET_ATTENDANCE);
  if (!attSheet) return;

  const allData = attSheet.getDataRange().getValues();
  let fixedCount = 0;

  for (let i = 1; i < allData.length; i++) {
    const timeIn = allData[i][CONFIG.ATT_COL_TIME_IN];
    const timeOut = allData[i][CONFIG.ATT_COL_TIME_OUT];
    if (timeIn && timeOut) {
      const fixedOverall = calcOverall(timeIn, timeOut);
      attSheet.getRange(i + 1, CONFIG.ATT_COL_OVERALL + 1).setValue(fixedOverall);
      fixedCount++;
    }
  }
  console.log("✅ Đã sửa thành công " + fixedCount + " bản ghi chấm công lỗi!");
}

// Hàm cấu hình tự động Dropdown menu cho cột trạng thái trong Sheets
function fixSpreadsheetValidation() {
  const ss = getSpreadsheet();
  const attSheet = ss.getSheetByName(CONFIG.SHEET_ATTENDANCE);
  if (!attSheet) return;

  const lastRow = attSheet.getLastRow();
  if (lastRow >= 2) {
    const timeInRange = attSheet.getRange(2, CONFIG.ATT_COL_TIME_IN + 1, lastRow - 1);
    timeInRange.clearDataValidations();
    
    const statusRange = attSheet.getRange(2, CONFIG.ATT_COL_STATUS + 1, lastRow - 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(["ON_TIME", "LATE"], true)
      .setAllowInvalid(false)
      .build();
    statusRange.setDataValidation(rule);
    console.log("✅ Đồng bộ cấu hình Validation Sheets thành công!");
  }
}