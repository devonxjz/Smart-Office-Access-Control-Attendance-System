import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { AppDataProvider, useAppData, AppDataContext } from './app-data-context';

// Mock the singleton sheetsClient
vi.mock('../infrastructure/google-sheets.client', () => ({
  sheetsClient: {
    read: vi.fn(() => Promise.resolve([{ id: 1, name: 'John Doe' }])),
  },
}));

describe('AppDataProvider and useAppData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides loading state initially and then data after fetch', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppDataProvider>{children}</AppDataProvider>
    );

    const { result } = renderHook(() => useAppData('employees'), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([{ id: 1, name: 'John Doe' }]);
    expect(result.current.error).toBe(null);
    expect(result.current.refreshing).toBe(false);
  });

  it('sets initialLoadComplete to true after initial fetch', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppDataProvider>{children}</AppDataProvider>
    );

    const { result } = renderHook(() => {
      const context = useContext(AppDataContext);
      if (!context) throw new Error('Context not found');
      return context.state.initialLoadComplete;
    }, { wrapper });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('returns refreshing flag alongside loading', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppDataProvider>{children}</AppDataProvider>
    );

    const { result } = renderHook(() => useAppData('employees'), { wrapper });

    // After initial load completes, both loading and refreshing should be false
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.refreshing).toBe(false);
    expect(result.current.data).toEqual([{ id: 1, name: 'John Doe' }]);
    expect(result.current.lastFetched).toBeTypeOf('number');
  });

  it('polls data every 60 seconds', async () => {
    vi.useFakeTimers();
    const { sheetsClient } = await import('../infrastructure/google-sheets.client');
    const mockRead = vi.mocked(sheetsClient.read);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AppDataProvider>{children}</AppDataProvider>
    );

    renderHook(() => useAppData('employees'), { wrapper });

    await vi.advanceTimersByTimeAsync(0);

    // Initial fetch (3 calls: employees, attendance, settings)
    expect(mockRead).toHaveBeenCalledTimes(3);

    // Fast forward 60 seconds
    await vi.advanceTimersByTimeAsync(60000);

    // Initial load: 3 calls (employees, attendance, settings)
    // 15-second attendance timer runs 4 times: 4 calls
    // 60-second employees/settings timer runs once: 2 calls
    // Total = 3 + 4 + 2 = 9 calls
    expect(mockRead).toHaveBeenCalledTimes(9);

    vi.useRealTimers();
  });
});
