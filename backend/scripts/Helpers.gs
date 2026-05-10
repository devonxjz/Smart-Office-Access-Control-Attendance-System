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
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}