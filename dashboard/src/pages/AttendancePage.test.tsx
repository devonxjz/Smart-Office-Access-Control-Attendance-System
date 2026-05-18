import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendancePage } from './AttendancePage';
import * as useAttendanceModule from '../hooks/useAttendance';

vi.mock('../hooks/useAttendance');

const mockRecords = [
  { date: '', uid: 'NV01', name: 'Trần Lê Thái', shiftStart: '08:00', timeIn: '07:55', status: 'Đúng giờ',  timeOut: '17:30' },
  { date: '', uid: 'NV03', name: 'Nhân viên 3',  shiftStart: '08:00', timeIn: '08:20', status: 'Trễ',       timeOut: '' },
];

describe('AttendancePage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading while fetching', () => {
    vi.spyOn(useAttendanceModule, 'useAttendance').mockReturnValue({
      records: [], loading: true, error: null,
    });
    render(<AttendancePage />);
    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('renders one row per record', () => {
    vi.spyOn(useAttendanceModule, 'useAttendance').mockReturnValue({
      records: mockRecords, loading: false, error: null,
    });
    const { container } = render(<AttendancePage />);
    expect(screen.getByText('NV01')).toBeInTheDocument();
    
    const tbody = container.querySelector('tbody');
    const rows = tbody?.querySelectorAll('tr');
    expect(rows).toHaveLength(2);
  });

  it('shows empty state when data is empty', () => {
    vi.spyOn(useAttendanceModule, 'useAttendance').mockReturnValue({
      records: [], loading: false, error: null,
    });
    render(<AttendancePage />);
    expect(screen.getByText(/không tìm thấy dữ liệu/i)).toBeInTheDocument();
  });

  it('shows "Đang mất kết nối..." on error', () => {
    vi.spyOn(useAttendanceModule, 'useAttendance').mockReturnValue({
      records: [], loading: false, error: 'Network timeout',
    });
    render(<AttendancePage />);
    expect(screen.getByText(/đang mất kết nối/i)).toBeInTheDocument();
  });

  it('displays – for missing timeOut field', () => {
    vi.spyOn(useAttendanceModule, 'useAttendance').mockReturnValue({
      records: [{ date: '', uid: 'NV03', name: 'Test', shiftStart: '08:00', timeIn: '08:10', status: 'Trễ', timeOut: '' }],
      loading: false,
      error: null,
    });
    render(<AttendancePage />);
    expect(screen.getByText('–')).toBeInTheDocument();
  });
});
