import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prefetchAll, getCache, setCache, clearCache } from './dataCache';

describe('dataCache Utility', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
    // Stub VITE_GAS_URL to prevent prefetchAll from throwing early base URL undefined errors
    vi.stubEnv('VITE_GAS_URL', 'http://mock-gas-url');
  });

  it('manually sets and gets cache entries', () => {
    const mockEmployee = {
      'Mã NV': 'NV01',
      'Họ tên': 'Alice',
      'RFID UID': '123',
      'Phòng ban': 'IT',
      'Trạng thái': 'Active' as const,
    };
    setCache('employee', [mockEmployee]);
    expect(getCache('employee')).toEqual([mockEmployee]);
  });

  it('clears the cache successfully', () => {
    setCache('employee', []);
    clearCache();
    expect(getCache('employee')).toBeUndefined();
  });

  it('prefetchAll fetches and caches all routes in parallel', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      let mockData = {};
      if (url.includes('sheet=home')) {
        mockData = {
          stats: { totalEmployees: 1, activeToday: 1, pendingRequests: 0, systemStatus: 'online' },
          recentActivities: [],
        };
      }
      if (url.includes('sheet=employee')) {
        mockData = [{
          'Mã NV': 'NV01',
          'Họ tên': 'Alice',
          'RFID UID': '123',
          'Phòng ban': 'IT',
          'Trạng thái': 'Active',
        }];
      }
      if (url.includes('sheet=log')) {
        mockData = [{ date: '2026-05-17', uid: '123', name: 'Alice', shiftStart: '08:00', timeIn: '08:00', status: 'OnTime', timeOut: '' }];
      }
      if (url.includes('sheet=config')) {
        mockData = { shiftStart: '08:00', shiftEnd: '17:00', allowLateMinutes: 15, adminEmail: 'admin@office.io' };
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockData }),
      });
    });

    vi.stubGlobal('fetch', mockFetch);

    await prefetchAll();

    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(getCache('home')).toBeDefined();
    expect(getCache('employee')?.[0]?.['Họ tên']).toBe('Alice');
    expect(getCache('log')?.[0]?.status).toBe('OnTime');
    expect(getCache('config')?.adminEmail).toBe('admin@office.io');
  });

  it('prefetchAll skips fetching if cache is already populated and valid', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} }),
    });
    vi.stubGlobal('fetch', mockFetch);

    setCache('home', {
      stats: { totalEmployees: 10, activeToday: 5, pendingRequests: 1, systemStatus: 'online' },
      recentActivities: [],
    });
    setCache('employee', []);
    setCache('log', []);
    setCache('config', { shiftStart: '08:00', shiftEnd: '17:00', allowLateMinutes: 15, adminEmail: '' });

    await prefetchAll();

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
