import type { AttendanceRecord } from '../infrastructure/google-sheets.client';
import { useAppData } from '../contexts/app-data-context';

export interface UseAttendanceResult {
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
}



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
    // Thay thế ngày lịch sử 1899 bằng năm hiện đại (2026) để tránh lỗi lệch múi giờ LMT lịch sử (+07:06:30 ở Sài Gòn năm 1899)
    const normalizedStr = s.replace(/^\d{4}-\d{2}-\d{2}/, '2026-01-01');
    const d = new Date(normalizedStr);
    if (!isNaN(d.getTime())) {
      try {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        const parts = formatter.formatToParts(d);
        const h = parts.find(p => p.type === 'hour')?.value || '00';
        const m = parts.find(p => p.type === 'minute')?.value || '00';
        const sec = parts.find(p => p.type === 'second')?.value || '00';
        
        const secNum = parseInt(sec, 10);
        if (secNum > 0) {
          return `${h}:${m}:${sec}`;
        }
        return `${h}:${m}`;
      } catch (e) {
        // Fallback to UTC if timezone formatting fails
        const h = String(d.getUTCHours()).padStart(2, '0');
        const m = String(d.getUTCMinutes()).padStart(2, '0');
        const sec = d.getUTCSeconds();
        if (sec > 0) {
          return `${h}:${m}:${String(sec).padStart(2, '0')}`;
        }
        return `${h}:${m}`;
      }
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
  let dateVal = '';
  if (raw['Date'] != null) {
    const rawDateStr = String(raw['Date']);
    if (rawDateStr.includes('T')) {
      dateVal = rawDateStr.split('T')[0];
    } else {
      dateVal = rawDateStr.trim();
    }
  } else if (raw['date'] != null) {
    dateVal = String(raw['date']).trim();
  }

  return {
    date: dateVal,
    uid: String(raw['UID'] ?? ''),
    name: String(raw['name'] ?? raw['Name'] ?? ''),
    shiftStart: parseSheetTime(raw['shift_start'] ?? raw['ShiftStart']),
    timeIn: parseSheetTime(raw['time_access'] ?? raw['TimeIn'] ?? raw['timeIn']),
    status: String(raw['status'] ?? raw['Status'] ?? ''),
    timeOut: parseSheetTime(raw['time_out'] ?? raw['TimeOut'] ?? raw['timeOut']),
    workingTime: String(raw['workingTime'] ?? raw['overall'] ?? raw['WorkingTime'] ?? raw['Note'] ?? raw['overallTime'] ?? ''),
    overall: String(raw['overall'] ?? raw['workingTime'] ?? raw['WorkingTime'] ?? raw['Note'] ?? raw['overallTime'] ?? ''),
  };
}

export function useAttendance(): UseAttendanceResult {
  const { data: rawRows, loading, error } = useAppData('attendance');
  
  const records = rawRows ? rawRows.map(toAttendanceRecord).reverse() : [];
  
  return { records, loading, error };
}
