export type CacheKey = 'home' | 'employee' | 'log' | 'config';

// 1. Data Contracts (Structured Types)
export interface HomeData {
  stats: {
    totalEmployees: number;
    activeToday: number;
    pendingRequests: number;
    systemStatus: 'online' | 'offline';
  };
  recentActivities: Array<{
    id: string;
    timestamp: string;
    description: string;
  }>;
}

export interface EmployeeData {
  'Mã NV': string;
  'Họ tên': string;
  'RFID UID': string;
  'Phòng ban': string;
  'Trạng thái': 'Active' | 'Inactive';
}

export interface LogData {
  date: string;
  uid: string;
  name: string;
  shiftStart: string;
  timeIn: string;
  status: string;
  timeOut: string;
}

export interface ConfigData {
  shiftStart: string;
  shiftEnd: string;
  allowLateMinutes: number;
  adminEmail: string;
}

// Map interface for strict TypeScript check
export interface CacheDataMap {
  home: HomeData;
  employee: EmployeeData[];
  log: LogData[];
  config: ConfigData;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<CacheKey, CacheEntry<any>>();

// Cache TTL (Time-To-Live) threshold: 5 minutes (300,000 ms)
const CACHE_TTL_MS = 5 * 60 * 1000;

const BASE_URL = import.meta.env.VITE_GAS_URL;

const ROUTES: Record<CacheKey, string> = {
  home: `${BASE_URL}?action=read&sheet=home`,
  employee: `${BASE_URL}?action=read&sheet=employee`,
  log: `${BASE_URL}?action=read&sheet=log`,
  config: `${BASE_URL}?action=read&sheet=config`,
};

// Toggleable logger for development environment warning output
const warnLog = import.meta.env.DEV ? console.warn : () => { };

/**
 * Prefetch all routes in parallel using Promise.allSettled.
 * Only fetches keys that are either missing from cache or have expired.
 */
export async function prefetchAll(): Promise<void> {
  if (!BASE_URL) {
    throw new Error('[dataCache] VITE_GAS_URL is not defined in environment variables');
  }

  const now = Date.now();

  // Filter entries to only fetch keys that are missing or expired
  const entries = (Object.entries(ROUTES) as [CacheKey, string][]).filter(([key]) => {
    const entry = cache.get(key);
    return !entry || now - entry.timestamp >= CACHE_TTL_MS;
  });

  if (entries.length === 0) return; // All cache keys are valid, skip

  // Cleanup marks to prevent duplicate warnings in browser
  try {
    performance.clearMarks('prefetch-start');
    performance.clearMarks('prefetch-end');
  } catch (e) {
    // Fallback for environments lacking standard performance methods
  }

  performance.mark('prefetch-start');

  interface AppsScriptResponse<T> {
    success: boolean;
    data: T;
    message?: string;
  }

  const results = await Promise.allSettled(
    entries.map(([key, url]) =>
      fetch(url)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json() as Promise<AppsScriptResponse<any>>;
        })
        .then((json) => {
          if (!json.success) {
            throw new Error(json.message || 'Apps Script API returned success: false');
          }
          return { key, data: json.data };
        })
    )
  );

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { key, data } = result.value;
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });
    } else {
      warnLog('Failed to prefetch route:', result.reason);
    }
  });

  performance.mark('prefetch-end');
  try {
    performance.measure('prefetch-duration', 'prefetch-start', 'prefetch-end');
  } catch (e) {
    // Fallback for environments lacking standard performance methods
  }
}

/**
 * Retrieve cached data for a specific route. Returns undefined if missing or expired.
 * @param key The cache key
 * @returns The typed cached data or undefined
 */
export function getCache<K extends CacheKey>(key: K): CacheDataMap[K] | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;

  // TTL validation check
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(key); // Evict expired entry
    return undefined;
  }

  return entry.data as CacheDataMap[K];
}

/**
 * Manually set cache data for a route.
 * @param key The cache key
 * @param data The data to cache
 */
export function setCache<K extends CacheKey>(key: K, data: CacheDataMap[K]): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear the cache completely.
 */
export function clearCache(): void {
  cache.clear();
}
