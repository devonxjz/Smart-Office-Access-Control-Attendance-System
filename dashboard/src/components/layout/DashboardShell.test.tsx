import { render, screen } from '@testing-library/react';
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

describe('DashboardShell', () => {
  it('renders the sidebar and children', () => {
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
});
