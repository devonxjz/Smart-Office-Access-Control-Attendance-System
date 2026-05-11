import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleSheetsClient } from './google-sheets.client';

describe('GoogleSheetsClient', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  it('reads data successfully', async () => {
    // Arrange
    const mockData = [{ id: '1', status: 'OK' }];
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockData })
    });
    
    const client = new GoogleSheetsClient('https://mock-gas-url.com');

    // Act
    const result = await client.read('attendance');

    // Assert
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://mock-gas-url.com?action=read&sheet=attendance'
    );
    expect(result).toEqual(mockData);
  });

  it('throws normalized error on success: false', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, message: 'Sheet not found' })
    });
    
    const client = new GoogleSheetsClient('https://mock-gas-url.com');

    await expect(client.read('attendance')).rejects.toThrow('Sheet not found');
  });

  describe('authenticate', () => {
    it('authenticates successfully and returns user data', async () => {
      const mockUser = { name: 'Admin', role: 'admin', email: 'admin@test.com' };
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUser })
      });
      
      const client = new GoogleSheetsClient('https://mock-gas-url.com');
      const result = await client.authenticate('admin@test.com', 'hashed-password');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://mock-gas-url.com?action=login&email=admin%40test.com&hashedPassword=hashed-password'
      );
      expect(result).toEqual(mockUser);
    });

    it('throws error on invalid credentials', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, message: 'Invalid credentials' })
      });
      
      const client = new GoogleSheetsClient('https://mock-gas-url.com');
      
      await expect(client.authenticate('admin@test.com', 'wrong-hash')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('getAttendance', () => {
    it('calls getAttendance endpoint with given date', async () => {
      const mockData = [{ date: '2026-05-11', uid: 'NV01', name: 'Trần Lê Thái', shiftStart: '08:00', timeIn: '07:55', status: 'ON_TIME', timeOut: '17:00' }];
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });

      const client = new GoogleSheetsClient('https://mock-gas-url.com');
      const result = await client.getAttendance('2026-05-11');

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://mock-gas-url.com?action=getAttendance&date=2026-05-11'
      );
      expect(result).toEqual(mockData);
    });

    it('calls getAttendance endpoint without date when not provided', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });

      const client = new GoogleSheetsClient('https://mock-gas-url.com');
      await client.getAttendance();

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://mock-gas-url.com?action=getAttendance'
      );
    });

    it('throws error when getAttendance returns success: false', async () => {
      (globalThis.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, message: 'Sheet error' }),
      });

      const client = new GoogleSheetsClient('https://mock-gas-url.com');
      await expect(client.getAttendance()).rejects.toThrow('Sheet error');
    });
  });
});
