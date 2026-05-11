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
}

