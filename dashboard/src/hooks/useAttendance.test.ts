import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppData } from '../contexts/app-data-context';
import { useAttendance } from './useAttendance';

vi.mock('../contexts/app-data-context');

describe('useAttendance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading state', () => {
    (useAppData as any).mockReturnValue({ data: [], loading: true, refreshing: false, error: null });
    const { result } = renderHook(() => useAttendance());
    expect(result.current.loading).toBe(true);
    expect(result.current.records).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('transforms raw sheet rows into AttendanceRecord', async () => {
    const rawRows = [
      { UID: 'NV01', name: 'Trần Lê Thái', shift_start: '1899-12-30T01:00:00.000Z', time_access: '1899-12-30T00:55:00.000Z', status: 'Đúng giờ', time_out: '1899-12-30T10:05:00.000Z', overall: '' },
    ];
    (useAppData as any).mockReturnValue({ data: rawRows, loading: false, refreshing: false, error: null });

    const { result } = renderHook(() => useAttendance());

    expect(result.current.records).toEqual([
      { date: '', uid: 'NV01', name: 'Trần Lê Thái', shiftStart: '08:00', timeIn: '07:55', status: 'Đúng giờ', timeOut: '17:05', workingTime: '', overall: '' },
    ]);
  });

  it('sets error on fetch failure', async () => {
    (useAppData as any).mockReturnValue({ data: [], loading: false, refreshing: false, error: 'Đang mất kết nối...' });

    const { result } = renderHook(() => useAttendance());

    expect(result.current.error).toBe('Đang mất kết nối...');
    expect(result.current.records).toEqual([]);
  });

  it('handles plain HH:MM times without transformation', async () => {
    const rawRows = [
      { UID: 'NV02', name: 'Test', shift_start: '08:00', time_access: '07:58', status: 'ON_TIME', time_out: '17:00', overall: '' },
    ];
    (useAppData as any).mockReturnValue({ data: rawRows, loading: false, refreshing: false, error: null });

    const { result } = renderHook(() => useAttendance());

    expect(result.current.records[0].shiftStart).toBe('08:00');
    expect(result.current.records[0].timeIn).toBe('07:58');
  });
});
