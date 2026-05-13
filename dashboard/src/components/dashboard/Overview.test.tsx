import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Overview } from './Overview';
import * as useSheetsDataModule from '../../hooks/useSheetsData';

vi.mock('../../hooks/useSheetsData');

// Today in ISO format matching the hook's expected data format
const TODAY = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

const mockEmployees = [
  { UID: 'NV01' }, { UID: 'NV02' }, { UID: 'NV03' },
];

const mockAttendance = [
  { Date: TODAY, UID: 'NV01', Status: 'Đúng giờ' },
  { Date: TODAY, UID: 'NV02', Status: 'Trễ nhẹ (<15p)' },
  { Date: '2026-05-09', UID: 'NV03', Status: 'Đúng giờ' }, // ngày cũ → không đếm
];

describe('Overview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows total employee count', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData')
      .mockImplementationOnce(() => ({ data: mockEmployees, loading: false, error: null }))  // Employee
      .mockImplementationOnce(() => ({ data: mockAttendance, loading: false, error: null })) // Attendance
      .mockImplementationOnce(() => ({ data: mockAttendance, loading: false, error: null })); // Chart Data

    render(<Overview />);
    expect(screen.getByTestId('stat-employees')).toHaveTextContent('3');
  });

  it('counts only today\'s check-ins', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData')
      .mockImplementationOnce(() => ({ data: mockEmployees, loading: false, error: null }))
      .mockImplementationOnce(() => ({ data: mockAttendance, loading: false, error: null }))
      .mockImplementationOnce(() => ({ data: mockAttendance, loading: false, error: null }));

    render(<Overview />);
    // Only 2 records match TODAY, the 3rd is yesterday
    expect(screen.getByTestId('stat-checkins')).toHaveTextContent('2');
  });

  it('shows 0 with fallback text when no check-ins today', () => {
    vi.spyOn(useSheetsDataModule, 'useSheetsData')
      .mockImplementationOnce(() => ({ data: mockEmployees, loading: false, error: null }))
      .mockImplementationOnce(() => ({ data: [], loading: false, error: null }))
      .mockImplementationOnce(() => ({ data: [], loading: false, error: null }));

    render(<Overview />);
    expect(screen.getByTestId('stat-checkins')).toHaveTextContent('0');
    expect(screen.getByText(/chưa có ai check-in hôm nay/i)).toBeInTheDocument();
  });
});
