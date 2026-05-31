/**
 * HELPERS - Các hàm hỗ trợ
 */

function calcStatus(timeIn, shiftStart) {
  try {
    const [nowH, nowM]     = timeIn.split(":").map(Number);
    const [shiftH, shiftM] = shiftStart.split(":").map(Number);

    const nowMinutes   = nowH * 60 + nowM;
    const shiftMinutes = shiftH * 60 + shiftM;

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
  // Sử dụng Utilities.formatDate với CONFIG.TIMEZONE để đảm bảo giờ hiển thị đúng múi giờ Việt Nam
  return Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "HH:mm");
}