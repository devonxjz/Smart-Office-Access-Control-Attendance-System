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

/**
 * Tính tổng giờ làm việc giữa timeIn và timeOut.
 * Input:  "08:05", "17:30"
 * Output: "9h 25m"
 */
function calcOverall(timeIn, timeOut) {
  try {
    const [inH, inM]   = timeIn.split(":").map(Number);
    const [outH, outM] = timeOut.split(":").map(Number);

    let diffMinutes = (outH * 60 + outM) - (inH * 60 + inM);

    // Xử lý trường hợp checkout qua ngày (ví dụ ca đêm)
    if (diffMinutes < 0) diffMinutes += 24 * 60;

    const hours   = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    return `${hours}h ${minutes}m`;
  } catch (e) {
    console.error("calcOverall error:", e);
    return "—";
  }
}