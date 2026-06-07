import { createContext, useContext, useEffect, useReducer, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { sheetsClient } from '../infrastructure/google-sheets.client';

export type DataKey = 'employees' | 'attendance' | 'settings';

type SheetRow = Record<string, unknown>;

interface CacheItem {
  data: SheetRow[];
  /** True only during the first fetch when no cached data exists */
  loading: boolean;
  /** True during background refreshes when cached data is already available */
  refreshing: boolean;
  error: string | null;
  lastFetched: number | null;
}

interface AppDataState {
  employees: CacheItem;
  attendance: CacheItem;
  settings: CacheItem;
  initialLoadComplete: boolean;
}

type Action =
  | { type: 'FETCH_START'; key: DataKey }
  | { type: 'FETCH_SUCCESS'; key: DataKey; data: SheetRow[] }
  | { type: 'FETCH_ERROR'; key: DataKey; error: string }
  | { type: 'INITIAL_LOAD_COMPLETE' };

const createInitialCacheItem = (): CacheItem => ({
  data: [],
  loading: true,
  refreshing: false,
  error: null,
  lastFetched: null,
});

const initialState: AppDataState = {
  employees: createInitialCacheItem(),
  attendance: createInitialCacheItem(),
  settings: createInitialCacheItem(),
  initialLoadComplete: false,
};

function appDataReducer(state: AppDataState, action: Action): AppDataState {
  switch (action.type) {
    case 'FETCH_START': {
      const current = state[action.key];
      const hasCachedData = current.data.length > 0;
      return {
        ...state,
        [action.key]: {
          ...current,
          // Only show full loading spinner when there's no cached data
          loading: !hasCachedData,
          // Background refresh indicator when cached data exists
          refreshing: hasCachedData,
          error: null,
        },
      };
    }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        [action.key]: {
          data: action.data,
          loading: false,
          refreshing: false,
          error: null,
          lastFetched: Date.now(),
        },
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        [action.key]: {
          ...state[action.key],
          loading: false,
          refreshing: false,
          error: action.error,
        },
      };
    case 'INITIAL_LOAD_COMPLETE':
      return { ...state, initialLoadComplete: true };
    default:
      return state;
  }
}

interface AppDataContextValue {
  state: AppDataState;
  refetch: (key: DataKey) => Promise<void>;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);

const SHEET_NAME_MAP: Record<DataKey, string> = {
  employees: 'Employee',
  attendance: 'Attendance sheet',
  settings: 'Settings',
};

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appDataReducer, initialState);
  const isMounted = useRef(true);

  const refetch = useCallback(async (key: DataKey) => {
    dispatch({ type: 'FETCH_START', key });
    try {
      const data = await sheetsClient.read(SHEET_NAME_MAP[key]);
      if (isMounted.current) {
        dispatch({ type: 'FETCH_SUCCESS', key, data });
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        const message = error instanceof Error ? error.message : 'Failed to fetch data';
        dispatch({ type: 'FETCH_ERROR', key, error: message });
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const fetchAll = async () => {
      await Promise.all([
        refetch('employees'),
        refetch('attendance'),
        refetch('settings'),
      ]);
      if (isMounted.current) {
        dispatch({ type: 'INITIAL_LOAD_COMPLETE' });
      }
    };

    fetchAll();

    // Poll attendance more frequently (real-time card swipes)
    const attendanceTimer = setInterval(() => {
      if (!document.hidden) {
        refetch('attendance');
      }
    }, 15_000);

    // Poll employees and settings less frequently
    const otherTimer = setInterval(() => {
      if (!document.hidden) {
        refetch('employees');
        refetch('settings');
      }
    }, 60_000);

    // Refetch stale data when user returns to the tab
    const onVisibilityChange = () => {
      if (!document.hidden) {
        refetch('employees');
        refetch('attendance');
        refetch('settings');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      isMounted.current = false;
      clearInterval(attendanceTimer);
      clearInterval(otherTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refetch]);

  return (
    <AppDataContext.Provider value={{ state, refetch }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(key: DataKey) {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');

  const cacheItem = context.state[key];
  const { refetch } = context;

  return {
    data: cacheItem.data,
    loading: cacheItem.loading,
    refreshing: cacheItem.refreshing,
    error: cacheItem.error,
    lastFetched: cacheItem.lastFetched,
    refetch: () => refetch(key),
  };
}
