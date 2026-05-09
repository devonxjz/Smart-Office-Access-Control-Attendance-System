/**
 * CODE.GS - File chính xử lý yêu cầu từ ESP32
 */

function doGet(e) {
  try {
    const uid = e.parameter.uid?.toString().toUpperCase().trim();
    
    if (!uid) {
      return respond("ERROR: No UID");
    }

    const employeeSheet = getEmployeeSheet();
    const attSheet = getAttendanceSheet();
    
    const today = getTodayString();
    const timeNow = getCurrentTimeString();

    // === 1. Tra cứu nhân viên trong Sheet "Employee" ===
    const empData = employeeSheet.getDataRange().getValues();
    let employeeName = null;
    let shiftStart = CONFIG.DEFAULT_SHIFT_START;

    for (let i = 1; i < empData.length; i++) {
      if (empData[i][CONFIG.EMP_COL_UID].toString().toUpperCase().trim() === uid) {
        employeeName = empData[i][CONFIG.EMP_COL_NAME];
        // Nếu sau này có cột shift_start trong Employee thì lấy ở đây
        break;
      }
    }

    if (!employeeName) {
      // Ghi log truy cập bị từ chối
      attSheet.appendRow([uid, "Unknown", "", timeNow, "DENIED", "", ""]);
      return respond("DENIED");
    }

    // === 2. Kiểm tra đã có bản ghi chấm công hôm nay chưa ===
    const attData = attSheet.getDataRange().getValues();
    let existingRow = -1;

    for (let i = 1; i < attData.length; i++) {
      if (attData[i][CONFIG.ATT_COL_UID] === uid && 
          attData[i][CONFIG.ATT_COL_NAME] === employeeName) {
        
        // Kiểm tra ngày hôm nay (cần thêm cột Date nếu muốn chính xác hơn)
        existingRow = i + 1;
        break;
      }
    }

    if (existingRow === -1) {
      // === CHECK IN ===
      const status = calcStatus(timeNow, shiftStart);
      
      attSheet.appendRow([
        uid,
        employeeName,
        shiftStart,
        timeNow,           // time_acces
        status,            // status
        "",                // time_out
        ""                 // overall
      ]);
      
      return respond(`GRANTED|CHECKIN|${employeeName}|${status}`);

    } else {
      // === CHECK OUT ===
      attSheet.getRange(existingRow, CONFIG.ATT_COL_TIME_OUT + 1).setValue(timeNow);
      
      return respond(`GRANTED|CHECKOUT|${employeeName}|${timeNow}`);
    }

  } catch (err) {
    console.error("doGet Error:", err);
    return respond("ERROR: " + err.message);
  }
}

// ====================== TEST FUNCTION ======================
function testDoGet() {
  const testEvent = {
    parameter: { uid: "NV01" }   // Thay bằng UID thật để test
  };
  const result = doGet(testEvent);
  console.log(result.getContent());
}