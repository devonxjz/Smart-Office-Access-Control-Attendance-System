export class GoogleSheetsClient {
  constructor(private baseUrl: string) {}

  async read(sheetName: string): Promise<any[]> {
    const url = `${this.baseUrl}?action=read&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Unknown error from server');
    }
    return result.data;
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

