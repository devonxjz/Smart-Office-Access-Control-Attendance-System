import { render, screen } from '@testing-library/react';
import { DashboardShell } from './DashboardShell';
import { vi } from 'vitest';

// Mock TanStack router Link component
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('@/lib/app-context', () => ({
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
      <DashboardShell>
        <div data-testid="dashboard-content">Test Content</div>
      </DashboardShell>
    );

    // Verify children render
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    
    // Verify sidebar presence by looking for a known link or nav item (e.g., 'SmartOffice')
    expect(screen.getByText('SmartOffice')).toBeInTheDocument();
  });
});
