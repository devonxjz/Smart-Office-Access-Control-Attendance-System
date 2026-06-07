export interface AttendanceRecord {
  date: string;
  uid: string;
  name: string;
  shiftStart: string;
  timeIn: string;
  status: string;
  timeOut: string;
  workingTime?: string;
  overall?: string;
}

export interface EmployeeRecord {
  'Mã NV'?: string;
  'Họ tên'?: string;
  'RFID UID'?: string;
  'Phòng ban'?: string;
  'Trạng thái'?: string;
  [key: string]: string | undefined;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

class GoogleSheetsClient {
  private defaultUrl: string;

  constructor(defaultUrl: string) {
    this.defaultUrl = defaultUrl;
  }

  get baseUrl(): string {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const customUrl = localStorage.getItem('smartoffice:settings:serverUrl');
      if (customUrl) {
        return customUrl;
      }
    }
    return this.defaultUrl;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);
    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Unknown error from server');
    }
    return (result.data !== undefined ? result.data : result) as T;
  }

  async read(sheetName: string): Promise<Record<string, unknown>[]> {
    const url = `${this.baseUrl}?action=read&sheet=${encodeURIComponent(sheetName)}`;
    return this.request<Record<string, unknown>[]>(url);
  }

  async getAttendance(date?: string): Promise<AttendanceRecord[]> {
    let url = `${this.baseUrl}?action=getAttendance`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    return this.request<AttendanceRecord[]>(url);
  }

  async authenticate(email: string, hashedPassword: string): Promise<Record<string, unknown>> {
    const url = `${this.baseUrl}?action=login&email=${encodeURIComponent(email)}&hashedPassword=${encodeURIComponent(hashedPassword)}`;
    return this.request<Record<string, unknown>>(url);
  }

  async createEmployee(employeeData: Record<string, string>): Promise<unknown> {
    const url = `${this.baseUrl}?action=createEmployee`;
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(employeeData),
    });
  }

  async updateEmployee(empId: string, employeeData: Record<string, string>): Promise<unknown> {
    const url = `${this.baseUrl}?action=updateEmployee&empId=${encodeURIComponent(empId)}`;
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(employeeData),
    });
  }

  async updatePassword(empId: string, newPasswordPlain: string): Promise<unknown> {
    const url = `${this.baseUrl}?action=updatePassword&empId=${encodeURIComponent(empId)}`;
    return this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ password: newPasswordPlain }),
    });
  }

  async deactivateEmployee(empId: string): Promise<unknown> {
    const url = `${this.baseUrl}?action=deactivateEmployee&empId=${encodeURIComponent(empId)}`;
    return this.request(url, { method: 'POST' });
  }

  async seed(): Promise<{ success: boolean; message: string }> {
    const url = `${this.baseUrl}?action=seed`;
    return this.request<{ success: boolean; message: string }>(url);
  }
}

export const sheetsClient = new GoogleSheetsClient(import.meta.env.VITE_GAS_URL || '');
