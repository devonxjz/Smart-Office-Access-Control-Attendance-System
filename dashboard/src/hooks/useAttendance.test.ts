import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleSheetsClient } from '../infrastructure/google-sheets.client';
import { useAttendance } from './useAttendance';

describe('useAttendance', () => {
  let mockRead: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRead = vi.spyOn(GoogleSheetsClient.prototype, 'read');
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in loading state', () => {
    mockRead.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useAttendance());
    expect(result.current.loading).toBe(true);
    expect(result.current.records).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('transforms raw sheet rows into AttendanceRecord', async () => {
    const rawRows = [
      { UID: 'NV01', name: 'Trần Lê Thái', shift_start: '1899-12-30T01:00:00.000Z', time_access: '1899-12-30T00:55:00.000Z', status: 'Đúng giờ', time_out: '1899-12-30T10:05:00.000Z', overall: '' },
    ];
    mockRead.mockResolvedValue(rawRows);

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.records).toEqual([
      { date: '', uid: 'NV01', name: 'Trần Lê Thái', shiftStart: '01:00', timeIn: '00:55', status: 'Đúng giờ', timeOut: '10:05' },
    ]);
    expect(mockRead).toHaveBeenCalledWith('Attendance sheet');
  });

  it('sets error on fetch failure', async () => {
    mockRead.mockRejectedValue(new Error('Đang mất kết nối...'));

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Đang mất kết nối...');
    expect(result.current.records).toEqual([]);
  });

  it('polls every 2 seconds', async () => {
    vi.useFakeTimers();
    mockRead.mockResolvedValue([]);

    renderHook(() => useAttendance());

    await act(async () => { await Promise.resolve(); });
    expect(mockRead).toHaveBeenCalledTimes(1);

    await act(async () => { vi.advanceTimersByTime(2000); });
    await act(async () => { await Promise.resolve(); });
    expect(mockRead).toHaveBeenCalledTimes(2);
  });

  it('skips fetch when tab is hidden', async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true });
    mockRead.mockResolvedValue([]);

    renderHook(() => useAttendance());

    await act(async () => { vi.advanceTimersByTime(6000); });
    await act(async () => { await Promise.resolve(); });

    expect(mockRead).not.toHaveBeenCalled();
  });

  it('handles plain HH:MM times without transformation', async () => {
    const rawRows = [
      { UID: 'NV02', name: 'Test', shift_start: '08:00', time_access: '07:58', status: 'ON_TIME', time_out: '17:00', overall: '' },
    ];
    mockRead.mockResolvedValue(rawRows);

    const { result } = renderHook(() => useAttendance());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.records[0].shiftStart).toBe('08:00');
    expect(result.current.records[0].timeIn).toBe('07:58');
  });
});
