import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleSheetsClient } from './google-sheets.client';

describe('GoogleSheetsClient', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('reads data successfully', async () => {
    // Arrange
    const mockData = [{ id: '1', status: 'OK' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockData })
    });
    
    const client = new GoogleSheetsClient('https://mock-gas-url.com');

    // Act
    const result = await client.read('attendance');

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'https://mock-gas-url.com?action=read&sheet=attendance'
    );
    expect(result).toEqual(mockData);
  });

  it('throws normalized error on success: false', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: false, message: 'Sheet not found' })
    });
    
    const client = new GoogleSheetsClient('https://mock-gas-url.com');

    await expect(client.read('attendance')).rejects.toThrow('Sheet not found');
  });

  describe('authenticate', () => {
    it('authenticates successfully and returns user data', async () => {
      const mockUser = { name: 'Admin', role: 'admin', email: 'admin@test.com' };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUser })
      });
      
      const client = new GoogleSheetsClient('https://mock-gas-url.com');
      const result = await client.authenticate('admin@test.com', 'hashed-password');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://mock-gas-url.com?action=login&email=admin%40test.com&hashedPassword=hashed-password'
      );
      expect(result).toEqual(mockUser);
    });

    it('throws error on invalid credentials', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, message: 'Invalid credentials' })
      });
      
      const client = new GoogleSheetsClient('https://mock-gas-url.com');
      
      await expect(client.authenticate('admin@test.com', 'wrong-hash')).rejects.toThrow('Invalid credentials');
    });
  });
});
