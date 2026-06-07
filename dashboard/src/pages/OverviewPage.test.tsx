import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OverviewPage } from './OverviewPage';
import { useAppData } from '../contexts/app-data-context';
import { AppProvider } from '../contexts/app-context';

vi.mock('../contexts/app-data-context');

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

describe('OverviewPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows total employee count', () => {
    (useAppData as any).mockImplementation((key: string) => {
      if (key === 'employees') return { data: mockEmployees, loading: false, refreshing: false, error: null };
      if (key === 'attendance') return { data: mockAttendance, loading: false, refreshing: false, error: null };
      return { data: [], loading: false, refreshing: false, error: null };
    });

    render(
      <AppProvider>
        <OverviewPage />
      </AppProvider>
    );
    expect(screen.getByTestId('stat-employees')).toHaveTextContent('3');
  });

  it('counts only today\'s check-ins', () => {
    (useAppData as any).mockImplementation((key: string) => {
      if (key === 'employees') return { data: mockEmployees, loading: false, refreshing: false, error: null };
      if (key === 'attendance') return { data: mockAttendance, loading: false, refreshing: false, error: null };
      return { data: [], loading: false, refreshing: false, error: null };
    });

    render(
      <AppProvider>
        <OverviewPage />
      </AppProvider>
    );
    // Only 2 records match TODAY, the 3rd is yesterday
    expect(screen.getByTestId('stat-checkins')).toHaveTextContent('2');
  });

  it('shows 0 with fallback text when no check-ins today', () => {
    (useAppData as any).mockImplementation((key: string) => {
      if (key === 'employees') return { data: mockEmployees, loading: false, refreshing: false, error: null };
      if (key === 'attendance') return { data: [], loading: false, refreshing: false, error: null };
      return { data: [], loading: false, refreshing: false, error: null };
    });

    render(
      <AppProvider>
        <OverviewPage />
      </AppProvider>
    );
    expect(screen.getByTestId('stat-checkins')).toHaveTextContent('0');
    expect(screen.getByText(/chưa có ai check-in hôm nay/i)).toBeInTheDocument();
  });
});
