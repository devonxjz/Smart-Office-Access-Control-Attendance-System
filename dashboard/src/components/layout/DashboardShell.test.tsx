import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardShell } from './DashboardShell';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../../contexts/app-context', () => ({
  useApp: () => ({
    t: (key: string) => key,
    theme: 'light',
    setTheme: vi.fn(),
    lang: 'en',
    setLang: vi.fn()
  })
}));


const mockRecords = vi.hoisted(() => ({
  records: [] as any[],
  loading: false,
  refreshing: false,
  error: null,
  refetch: vi.fn(),
}));

vi.mock('../../hooks/useAttendance', () => ({
  useAttendance: () => mockRecords,
}));

describe('DashboardShell', () => {
  it('renders the sidebar and children', () => {
    mockRecords.records = [];
    render(
      <MemoryRouter>
        <DashboardShell>
          <div data-testid="dashboard-content">Test Content</div>
        </DashboardShell>
      </MemoryRouter>
    );

    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByText('SmartOffice')).toBeInTheDocument();
  });

  it('generates an alert notification when there are 3 consecutive failed scans', async () => {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    mockRecords.records = [
      { uid: 'UNKNOWN1', name: 'Unknown', timeIn: '10:00:00', status: 'DENIED', date: todayStr },
      { uid: 'UNKNOWN2', name: 'Unknown', timeIn: '10:01:00', status: 'DENIED', date: todayStr },
      { uid: 'UNKNOWN3', name: 'Unknown', timeIn: '10:02:00', status: 'DENIED', date: todayStr },
    ].reverse(); // useAttendance reverses records

    const { container } = render(
      <MemoryRouter>
        <DashboardShell>
          <div data-testid="dashboard-content">Test Content</div>
        </DashboardShell>
      </MemoryRouter>
    );

    const bellIcon = container.querySelector('.lucide-bell');
    const bellBtn = bellIcon?.closest('button');
    fireEvent.click(bellBtn!);

    expect(screen.getByText('overview.notif.failed_three_times')).toBeInTheDocument();
  });

  it('does not generate alert if there are fewer than 3 consecutive failed scans', () => {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    mockRecords.records = [
      { uid: 'UNKNOWN1', name: 'Unknown', timeIn: '10:00:00', status: 'DENIED', date: todayStr },
      { uid: 'UNKNOWN2', name: 'Unknown', timeIn: '10:01:00', status: 'DENIED', date: todayStr },
    ].reverse();

    const { container } = render(
      <MemoryRouter>
        <DashboardShell>
          <div data-testid="dashboard-content">Test Content</div>
        </DashboardShell>
      </MemoryRouter>
    );

    const bellIcon = container.querySelector('.lucide-bell');
    const bellBtn = bellIcon?.closest('button');
    fireEvent.click(bellBtn!);

    expect(screen.queryByText('overview.notif.failed_three_times')).not.toBeInTheDocument();
  });

  it('does not generate alert if failed scans are interrupted by a successful scan', () => {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    mockRecords.records = [
      { uid: 'UNKNOWN1', name: 'Unknown', timeIn: '10:00:00', status: 'DENIED', date: todayStr },
      { uid: 'UNKNOWN2', name: 'Unknown', timeIn: '10:01:00', status: 'DENIED', date: todayStr },
      { uid: 'NV01', name: 'Trần Lê Thái', timeIn: '10:02:00', status: 'ON_TIME', date: todayStr },
      { uid: 'UNKNOWN3', name: 'Unknown', timeIn: '10:03:00', status: 'DENIED', date: todayStr },
    ].reverse();

    const { container } = render(
      <MemoryRouter>
        <DashboardShell>
          <div data-testid="dashboard-content">Test Content</div>
        </DashboardShell>
      </MemoryRouter>
    );

    const bellIcon = container.querySelector('.lucide-bell');
    const bellBtn = bellIcon?.closest('button');
    fireEvent.click(bellBtn!);

    expect(screen.queryByText('overview.notif.failed_three_times')).not.toBeInTheDocument();
  });
});

