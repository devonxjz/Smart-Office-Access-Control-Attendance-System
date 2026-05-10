import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttendanceLogs } from './AttendanceLogs';
import * as useSheetsDataModule from '../../hooks/useSheetsData';

vi.mock('../../hooks/useSheetsData');

const mockRecords = [
  { Date: '2026-05-10', UID: 'NV01', Name: 'Trần Lê Thái', ShiftStart: '08:00', TimeIn: '07:55', Status: 'Đúng giờ', TimeOut: '17:30', Note: '' },
  { Date: '2026-05-10', UID: 'NV03', Name: 'Nhân viên 3',  ShiftStart: '08:00', TimeIn: '08:20', Status: 'Trễ nhẹ (<15p)', TimeOut: '', Note: '' },
];

describe('AttendanceLogs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading while fetching', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: [], loading: true, error: null,
    });
    render(<AttendanceLogs />);
    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('renders one row per record', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: mockRecords, loading: false, error: null,
    });
    render(<AttendanceLogs />);
    expect(screen.getByText('NV01')).toBeInTheDocument();
    expect(screen.getByText('Đúng giờ')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(3); // 1 header + 2 data
  });

  it('shows empty state when data is empty', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: [], loading: false, error: null,
    });
    render(<AttendanceLogs />);
    expect(screen.getByText(/chưa có dữ liệu chấm công/i)).toBeInTheDocument();
  });

  it('shows error message', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData').mockReturnValue({
      data: [], loading: false, error: 'Sheet not found',
    });
    render(<AttendanceLogs />);
    expect(screen.getByText(/sheet not found/i)).toBeInTheDocument();
  });
});
