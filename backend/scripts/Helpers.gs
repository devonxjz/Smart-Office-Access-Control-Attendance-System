/**
 * HELPERS - Các hàm hỗ trợ
 */

function calcStatus(timeIn, shiftStart) {
  try {
    const [nowH, nowM]   = timeIn.split(":").map(Number);
    const [shiftH, shiftM] = shiftStart.split(":").map(Number);

    const nowMinutes   = nowH * 60 + nowM;
    const shiftMinutes = shiftH * 60 + shiftM;

    if (nowMinutes <= shiftMinutes)       return "Đúng giờ";
    if (nowMinutes <= shiftMinutes + 15)  return "Trễ nhẹ (<15p)";
    return "Trễ giờ";
  } catch (e) {
    console.error("calcStatus error:", e);
    return "Không xác định";
  }
}

function respond(text) {
  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.TEXT);
}

function getTodayString() {
  const now = new Date();
  return now.toLocaleDateString(CONFIG.LOCALE, { 
    timeZone: CONFIG.TIMEZONE 
  });
}

function getCurrentTimeString() {
  const now = new Date();
  return now.toLocaleTimeString(CONFIG.LOCALE, { 
    timeZone: CONFIG.TIMEZONE, 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}