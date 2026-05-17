import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sheetsClient } from '../infrastructure/google-sheets.client';
import { useSheetsData } from './useSheetsData';

vi.mock('../infrastructure/google-sheets.client', () => ({
  sheetsClient: {
    read: vi.fn(),
  },
}));

describe('useSheetsData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading state', () => {
    vi.mocked(sheetsClient.read).mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useSheetsData('Employee'));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns data on successful fetch', async () => {
    const employees = [{ UID: 'NV01', Tên: 'Trần Lê Thái' }];
    vi.mocked(sheetsClient.read).mockResolvedValue(employees as Record<string, unknown>[]);

    const { result } = renderHook(() => useSheetsData('Employee'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(employees);
    expect(result.current.error).toBeNull();
    expect(sheetsClient.read).toHaveBeenCalledWith('Employee');
  });

  it('sets error when fetch fails', async () => {
    vi.mocked(sheetsClient.read).mockRejectedValue(new Error('Không thể kết nối máy chủ'));

    const { result } = renderHook(() => useSheetsData('Employee'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Không thể kết nối máy chủ');
    expect(result.current.data).toEqual([]);
  });
});
