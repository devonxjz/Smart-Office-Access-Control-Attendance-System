import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env var before importing module
vi.stubEnv('VITE_GAS_URL', 'https://mock-gas-url.com');

// Import after env is set
const { sheetsClient } = await import('./google-sheets.client');

describe('GoogleSheetsClient (singleton)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it('reads data successfully', async () => {
    const mockData = [{ id: '1', status: 'OK' }];
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ success: true, data: mockData })
    });

    const result = await sheetsClient.read('attendance');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://mock-gas-url.com?action=read&sheet=attendance',
      undefined
    );
    expect(result).toEqual(mockData);
  });

  it('throws normalized error on success: false', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ success: false, message: 'Sheet not found' })
    });

    await expect(sheetsClient.read('attendance')).rejects.toThrow('Sheet not found');
  });

  describe('authenticate', () => {
    it('authenticates successfully and returns user data', async () => {
      const mockUser = { name: 'Admin', role: 'admin', email: 'admin@test.com' };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockUser })
      });

      const result = await sheetsClient.authenticate('admin@test.com', 'hashed-password');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://mock-gas-url.com?action=login&email=admin%40test.com&hashedPassword=hashed-password',
        undefined
      );
      expect(result).toEqual(mockUser);
    });

    it('throws error on invalid credentials', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve({ success: false, message: 'Invalid credentials' })
      });

      await expect(sheetsClient.authenticate('admin@test.com', 'wrong-hash')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getAttendance', () => {
    it('calls getAttendance endpoint with given date', async () => {
      const mockData = [{ date: '2026-05-11', uid: 'NV01', name: 'Test', shiftStart: '08:00', timeIn: '07:55', status: 'ON_TIME', timeOut: '17:00' }];
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const result = await sheetsClient.getAttendance('2026-05-11');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://mock-gas-url.com?action=getAttendance&date=2026-05-11',
        undefined
      );
      expect(result).toEqual(mockData);
    });

    it('calls getAttendance endpoint without date when not provided', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      await sheetsClient.getAttendance();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://mock-gas-url.com?action=getAttendance',
        undefined
      );
    });

    it('throws error when getAttendance returns success: false', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve({ success: false, message: 'Sheet error' }),
      });

      await expect(sheetsClient.getAttendance()).rejects.toThrow('Sheet error');
    });
  });
});
