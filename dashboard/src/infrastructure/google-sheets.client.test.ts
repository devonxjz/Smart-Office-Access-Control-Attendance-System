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
});
