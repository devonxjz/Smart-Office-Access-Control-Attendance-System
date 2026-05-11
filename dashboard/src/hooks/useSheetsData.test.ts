import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleSheetsClient } from '../infrastructure/google-sheets.client';
import { useSheetsData } from './useSheetsData';

describe('useSheetsData', () => {
  let mockRead: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRead = vi.spyOn(GoogleSheetsClient.prototype, 'read');
  });

  it('starts in loading state', () => {
    mockRead.mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(() => useSheetsData('Employee'));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('returns data on successful fetch', async () => {
    const employees = [{ UID: 'NV01', Tên: 'Trần Lê Thái' }];
    mockRead.mockResolvedValue(employees);

    const { result } = renderHook(() => useSheetsData('Employee'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(employees);
    expect(result.current.error).toBeNull();
    expect(mockRead).toHaveBeenCalledWith('Employee');
  });

  it('sets error when fetch fails', async () => {
    mockRead.mockRejectedValue(new Error('Không thể kết nối máy chủ'));

    const { result } = renderHook(() => useSheetsData('Employee'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Không thể kết nối máy chủ');
    expect(result.current.data).toEqual([]);
  });
});
