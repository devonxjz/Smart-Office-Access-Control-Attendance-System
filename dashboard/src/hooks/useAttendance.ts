import { useState, useEffect, useRef } from 'react';
import { GoogleSheetsClient } from '../infrastructure/google-sheets.client';
import type { AttendanceRecord } from '../infrastructure/google-sheets.client';

export interface UseAttendanceResult {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
}

const POLL_INTERVAL_MS = 2000;
const SHEET_NAME = 'Attendance sheet';

/**
 * Parse an ISO time value from Google Sheets (e.g. "1899-12-30T01:17:56.000Z")
 * into a readable "HH:MM" string. Returns the original value if it's already
 * a plain string like "08:00" or empty.
 */
function parseSheetTime(raw: unknown): string {
  if (raw == null || raw === '') return '';
  const s = String(raw);
  // Already in HH:MM or HH:MM:SS format
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s;
  // ISO date string from Sheets serial time
  if (s.includes('T')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  }
  return s;
}

/**
 * Transform a raw row from the "Attendance sheet" (read via generic ?action=read)
 * into the normalised AttendanceRecord shape.
 *
 * Real sheet headers: UID, name, shift_start, time_access, status, time_out, overall
 */
function toAttendanceRecord(raw: Record<string, unknown>): AttendanceRecord {
  return {
    date: '',  // Sheet has no Date column
    uid: String(raw['UID'] ?? ''),
    name: String(raw['name'] ?? raw['Name'] ?? ''),
    shiftStart: parseSheetTime(raw['shift_start'] ?? raw['ShiftStart']),
    timeIn: parseSheetTime(raw['time_access'] ?? raw['TimeIn'] ?? raw['timeIn']),
    status: String(raw['status'] ?? raw['Status'] ?? ''),
    timeOut: parseSheetTime(raw['time_out'] ?? raw['TimeOut'] ?? raw['timeOut']),
  };
}

export function useAttendance(): UseAttendanceResult {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const gasUrl = import.meta.env.VITE_GAS_URL || '';
    const client = new GoogleSheetsClient(gasUrl);

    const fetchData = async () => {
      // Skip poll when tab is in background
      if (document.hidden) return;
      try {
        const rawRows = await client.read(SHEET_NAME);
        if (isMounted.current) {
          setRecords(rawRows.map(toAttendanceRecord));
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted.current) {
          setError((err as Error).message);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchData();
    const timer = setInterval(fetchData, POLL_INTERVAL_MS);

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, []);

  return { records, loading, error };
}
