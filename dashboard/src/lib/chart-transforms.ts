export interface AttendanceRecord {
  uid: string;
  name: string;
  shift_start: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  date: string; // ISO or VN date
}

export interface HourlyBucket {
  hour: string;
  count: number;
}

export function groupCheckInsByHour(records: any[], targetDate: string): HourlyBucket[] {
  const buckets = Array.from({ length: 13 }, (_, i) => ({
    hour: `${(i + 7).toString().padStart(2, '0')}:00`,
    count: 0
  }));

  const todayRecords = records.filter(r => r.Date === targetDate || r.date === targetDate);
  
  todayRecords.forEach(r => {
    const timeStr = r.TimeIn || r.timeIn || r.check_in_time || '';
    if (!timeStr) return;
    
    // timeStr format: "HH:mm" or ISO
    let hourMatch = timeStr.match(/^(\d{2}):/);
    if (hourMatch) {
      const hour = parseInt(hourMatch[1], 10);
      if (hour >= 7 && hour <= 19) {
        buckets[hour - 7].count += 1;
      }
    }
  });

  return buckets;
}

export interface PunctualitySummary {
  on_time: number;
  late: number;
  absent: number;
  total: number;
  on_time_rate: number;
}

export function getTodayPunctualitySummary(records: any[], targetDate: string): PunctualitySummary {
  const todayRecords = records.filter(r => r.Date === targetDate || r.date === targetDate);
  
  const summary = { on_time: 0, late: 0, absent: 0, total: todayRecords.length, on_time_rate: 0 };
  
  todayRecords.forEach(r => {
    const status = (r.Status || r.status || '').toUpperCase();
    if (status === 'LATE' || status.includes('TRỄ')) summary.late++;
    else if (status.includes('VẮNG') || status === 'ABSENT') summary.absent++;
    else summary.on_time++; // ON_TIME or any unrecognized → on_time
  });
  
  if (summary.total > 0) {
    summary.on_time_rate = Math.round((summary.on_time / summary.total) * 100);
  }
  
  return summary;
}

export interface DailyBreakdown {
  date: string;
  label: string;
  on_time: number;
  late: number;
  absent: number;
  isToday: boolean;
}

export function getLast7DaysBreakdown(records: any[], targetDateStr: string): DailyBreakdown[] {
  const targetDate = new Date(targetDateStr);
  if (isNaN(targetDate.getTime())) return [];
  
  const result: DailyBreakdown[] = [];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(targetDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const isToday = i === 0;
    
    const dayLabel = `${dayNames[d.getDay()]} · ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    
    result.push({
      date: dateStr,
      label: dayLabel,
      on_time: 0,
      late: 0,
      absent: 0,
      isToday
    });
  }
  
  records.forEach(r => {
    const recDate = r.Date || r.date;
    const dayBucket = result.find(b => b.date === recDate);
    if (dayBucket) {
      const status = (r.Status || r.status || '').toUpperCase();
      if (status === 'LATE' || status.includes('TRỄ')) dayBucket.late++;
      else if (status.includes('VẮNG') || status === 'ABSENT') dayBucket.absent++;
      else dayBucket.on_time++;
    }
  });
  
  return result;
}

export interface DoorStatus {
  id: number;
  label: string;
  status: 'online' | 'offline' | 'error';
  type?: 'door' | 'light' | 'socket';
}

export function getDoorStatuses(records?: any[], manualLightState?: 'ON' | 'OFF' | 'AUTO'): DoorStatus[] {
  let isDoor1Open = false;
  let insideCount = 0;

  if (records && records.length > 0) {
    const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const nowStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
    const nowInVN = new Date(nowStr);
    const nowTime = nowInVN.getTime();

    // 30 seconds open duration
    const OPEN_WINDOW_MS = 30000;

    for (const r of records) {
      const recDate = r.date ?? r.Date ?? '';
      if (recDate !== todayStr) continue;

      const timeInStr = r.timeIn ?? r.TimeIn ?? '';
      const timeOutStr = r.timeOut ?? r.TimeOut ?? '';

      if (timeInStr) {
        const timeInMs = parseVNTime(todayStr, timeInStr);
        if (timeInMs > 0 && nowTime - timeInMs >= 0 && nowTime - timeInMs < OPEN_WINDOW_MS) {
          isDoor1Open = true;
        }
      }
      if (timeOutStr) {
        const timeOutMs = parseVNTime(todayStr, timeOutStr);
        if (timeOutMs > 0 && nowTime - timeOutMs >= 0 && nowTime - timeOutMs < OPEN_WINDOW_MS) {
          isDoor1Open = true;
        }
      }
    }

    // Calculate room occupancy: check today's records.
    // If checkIn is present, but checkOut is empty/whitespace, they are inside.
    const todayRecords = records.filter(r => {
      const recDate = r.date ?? r.Date ?? '';
      return recDate === todayStr;
    });

    const insideEmployees = todayRecords.filter(r => {
      const timeInVal = r.timeIn ?? r.TimeIn ?? r.time_access ?? '';
      const timeOutVal = r.timeOut ?? r.TimeOut ?? r.time_out ?? '';
      return timeInVal && (!timeOutVal || timeOutVal.trim() === '');
    });
    insideCount = insideEmployees.length;
  }

  // If records is empty (demo mode default), assume the light is ON (Bật)
  let isLightOn = (records && records.length > 0) ? (insideCount > 0) : true;
  if (manualLightState === 'ON') {
    isLightOn = true;
  } else if (manualLightState === 'OFF') {
    isLightOn = false;
  }

  return [
    {
      id: 1,
      label: 'Cửa chính',
      status: isDoor1Open ? 'online' : 'offline',
      type: 'door'
    },
    {
      id: 2,
      label: 'Cửa phụ',
      status: 'offline',
      type: 'door'
    },
    {
      id: 3,
      label: 'Đèn dây tóc',
      status: isLightOn ? 'online' : 'offline',
      type: 'light'
    },
    {
      id: 4,
      label: 'Ổ cắm nguồn',
      status: isLightOn ? 'online' : 'offline',
      type: 'socket'
    }
  ];
}

function parseVNTime(dateStr: string, timeStr: string): number {
  if (!dateStr || !timeStr) return 0;
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const timeParts = timeStr.split(':').map(Number);
    const hours = timeParts[0] || 0;
    const minutes = timeParts[1] || 0;
    const seconds = timeParts[2] || 0;
    return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
  } catch (e) {
    return 0;
  }
}
