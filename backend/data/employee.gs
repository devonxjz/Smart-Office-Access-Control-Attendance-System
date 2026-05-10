function add50Employees() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // Số lượng nhân viên cần thêm
  var numToAdd = 50; 
  
  // Lấy dòng cuối cùng có dữ liệu
  var lastRow = sheet.getLastRow();
  var lastUid = "";
  
  // Kiểm tra xem đã có dữ liệu ở cột A chưa (bỏ qua dòng tiêu đề)
  if (lastRow > 1) {
    lastUid = sheet.getRange(lastRow, 1).getValue().toString();
  } else {
    lastUid = "NV00"; // Mặc định nếu sheet chỉ mới có header
  }
  
  // Tách phần tiền tố ("NV") và phần số ("01")
  var prefix = lastUid.replace(/[0-9]/g, ''); // Lấy chữ
  var currentNumberStr = lastUid.replace(/[^0-9]/g, ''); // Lấy số
  var currentNumber = parseInt(currentNumberStr, 10);
  
  if (isNaN(currentNumber)) {
    currentNumber = 0;
  }
  
  // Độ dài của phần số để format cho đúng (VD: "01" có độ dài 2)
  var numLength = currentNumberStr.length > 0 ? currentNumberStr.length : 2;
  
  var newData = [];
  
  for (var i = 1; i <= numToAdd; i++) {
    var nextNumber = currentNumber + i;
    
    // Thêm các số 0 ở đầu cho đúng format (VD: 02, 03... 51)
    var paddedNumber = nextNumber.toString();
    while (paddedNumber.length < numLength) {
      paddedNumber = "0" + paddedNumber;
    }
    
    var newUid = prefix + paddedNumber;
    
    // Tạo dữ liệu mẫu (Dummy data) cho các cột còn lại
    var newName = "Nhân viên " + nextNumber;
    var newPhone = "090" + Math.floor(1000000 + Math.random() * 9000000); // Tạo số điện thoại ngẫu nhiên
    var newEmail = "nv" + paddedNumber + "@gmail.com";
    var newGender = (Math.random() > 0.5) ? "Nam" : "Nữ"; // Random giới tính
    
    // Đẩy mảng dữ liệu của 1 dòng vào mảng tổng
    newData.push([newUid, newName, newPhone, newEmail, newGender]);
  }
  
  // Ghi toàn bộ dữ liệu mới xuống sheet cùng 1 lúc để tối ưu hiệu suất
  sheet.getRange(lastRow + 1, 1, numToAdd, 5).setValues(newData);
}