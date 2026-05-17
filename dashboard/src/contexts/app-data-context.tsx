import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import type { ReactNode } from 'react';
import { sheetsClient } from '../infrastructure/google-sheets.client';

export type DataKey = 'employees' | 'attendance' | 'settings';

type SheetRow = Record<string, unknown>;

interface CacheItem {
  data: SheetRow[];
  loading: boolean;
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

const initialCacheItem = { data: [], loading: true, error: null, lastFetched: null };

const initialState: AppDataState = {
  employees: { ...initialCacheItem },
  attendance: { ...initialCacheItem },
  settings: { ...initialCacheItem },
  initialLoadComplete: false,
};

function appDataReducer(state: AppDataState, action: Action): AppDataState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, [action.key]: { ...state[action.key], loading: true, error: null } };
    case 'FETCH_SUCCESS':
      return { 
        ...state, 
        [action.key]: { data: action.data, loading: false, error: null, lastFetched: Date.now() } 
      };
    case 'FETCH_ERROR':
      return { ...state, [action.key]: { ...state[action.key], loading: false, error: action.error } };
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

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appDataReducer, initialState);

  const refetch = useCallback(async (key: DataKey) => {
    dispatch({ type: 'FETCH_START', key });
    try {
      const sheetName = key === 'employees' ? 'Employee' : key === 'attendance' ? 'Attendance sheet' : 'Settings';
      const data = await sheetsClient.read(sheetName);
      dispatch({ type: 'FETCH_SUCCESS', key, data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch data';
      dispatch({ type: 'FETCH_ERROR', key, error: message });
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([
        refetch('employees'),
        refetch('attendance'),
        refetch('settings')
      ]);
      dispatch({ type: 'INITIAL_LOAD_COMPLETE' });
    };
    
    fetchAll();

    const timer = setInterval(() => {
      if (!document.hidden) {
        refetch('employees');
        refetch('attendance');
        refetch('settings');
      }
    }, 60000);

    const onVisibilityChange = () => {
      if (!document.hidden) {
        refetch('employees');
        refetch('attendance');
        refetch('settings');
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

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

  // Stale-while-revalidate logic
  useEffect(() => {
    if (cacheItem.lastFetched && (Date.now() - cacheItem.lastFetched > 60000) && !cacheItem.loading) {
      refetch(key);
    }
  }, [cacheItem.lastFetched, cacheItem.loading, key, refetch]);
  
  return {
    data: cacheItem.data,
    loading: cacheItem.loading,
    error: cacheItem.error,
    refetch: () => refetch(key),
  };
}
