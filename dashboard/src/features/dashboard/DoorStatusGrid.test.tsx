import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DoorStatusGrid } from './DoorStatusGrid';
import { AppProvider } from '../../contexts/app-context';
import type { DoorStatus } from '../../lib/chart-transforms';

describe('DoorStatusGrid Component', () => {
  it('renders all doors, lights, and sockets in the grid', () => {
    const mockDoors: DoorStatus[] = [
      { id: 1, label: 'Cửa chính', status: 'online', type: 'door' },
      { id: 2, label: 'Cửa phụ', status: 'offline', type: 'door' },
      { id: 3, label: 'Đèn dây tóc', status: 'online', type: 'light' },
      { id: 4, label: 'Ổ cắm nguồn', status: 'online', type: 'socket' },
    ];

    render(
      <AppProvider>
        <DoorStatusGrid doors={mockDoors} />
      </AppProvider>
    );

    // Verify all titles are present
    expect(screen.getByText('Cửa chính')).toBeInTheDocument();
    expect(screen.getByText('Cửa phụ')).toBeInTheDocument();
    expect(screen.getByText('Đèn dây tóc')).toBeInTheDocument();
    expect(screen.getByText('Ổ cắm nguồn')).toBeInTheDocument();

    // Verify status labels
    // Door open -> "Mở" or "Open" (Vietnamese default is Mở)
    // Door closed -> "Đóng" or "Closed"
    // Light/Socket active -> "Bật" or "On"
    expect(screen.getByText('Mở')).toBeInTheDocument();
    expect(screen.getByText('Đóng')).toBeInTheDocument();
    expect(screen.getAllByText('Bật')).toHaveLength(2); // One for light, one for socket
  });

  it('applies amber styling to active light and cyan styling to active socket', () => {
    const mockDoors: DoorStatus[] = [
      { id: 1, label: 'Cửa chính', status: 'online', type: 'door' },
      { id: 2, label: 'Cửa phụ', status: 'offline', type: 'door' },
      { id: 3, label: 'Đèn dây tóc', status: 'online', type: 'light' },
      { id: 4, label: 'Ổ cắm nguồn', status: 'online', type: 'socket' },
    ];

    render(
      <AppProvider>
        <DoorStatusGrid doors={mockDoors} />
      </AppProvider>
    );

    // Check specific class styles or styling indicator
    // Active light should have text-amber-500 class or text color amber
    const lightText = screen.getByText('Đèn dây tóc');
    const lightContainer = lightText.closest('.rounded-xl');
    expect(lightContainer).toHaveClass('bg-amber-500/8');

    const socketText = screen.getByText('Ổ cắm nguồn');
    const socketContainer = socketText.closest('.rounded-xl');
    expect(socketContainer).toHaveClass('bg-cyan-500/8');
  });
});
