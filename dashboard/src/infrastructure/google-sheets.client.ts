export interface AttendanceRecord {
  date: string;
  uid: string;
  name: string;
  shiftStart: string;
  timeIn: string;
  status: string;
  timeOut: string;
}

export class GoogleSheetsClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async read(sheetName: string): Promise<any[]> {
    const url = `${this.baseUrl}?action=read&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Unknown error from server');
    }
    return result.data;
  }

  async getAttendance(date?: string): Promise<AttendanceRecord[]> {
    let url = `${this.baseUrl}?action=getAttendance`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Unknown error from server');
    }
    return result.data as AttendanceRecord[];
  }

  async authenticate(email: string, hashedPassword: string): Promise<any> {
    const url = `${this.baseUrl}?action=login&email=${encodeURIComponent(email)}&hashedPassword=${encodeURIComponent(hashedPassword)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Invalid credentials');
    }
    return result.data;
  }

  async createEmployee(employeeData: any): Promise<any> {
    const url = `${this.baseUrl}?action=createEmployee`;
    // Note: Google Apps Script needs followRedirects or no-cors sometimes, but we assume standard POST
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(employeeData)
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Failed to create employee');
    }
    return result.data;
  }

  async updateEmployee(empId: string, employeeData: any): Promise<any> {
    const url = `${this.baseUrl}?action=updateEmployee&empId=${encodeURIComponent(empId)}`;
    const response = await fetch(url, {
      method: 'POST', // Using POST since Apps Script handles POST well
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(employeeData)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to update employee');
    return result.data;
  }

  async updatePassword(empId: string, newPasswordPlain: string): Promise<any> {
    const url = `${this.baseUrl}?action=updatePassword&empId=${encodeURIComponent(empId)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ password: newPasswordPlain })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to update password');
    return result.data;
  }

  async deactivateEmployee(empId: string): Promise<any> {
    const url = `${this.baseUrl}?action=deactivateEmployee&empId=${encodeURIComponent(empId)}`;
    const response = await fetch(url, {
      method: 'POST'
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to deactivate employee');
    return result.data;
  }
}

