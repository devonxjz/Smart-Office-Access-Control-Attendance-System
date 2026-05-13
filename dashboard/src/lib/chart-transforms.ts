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
    const timeStr = r.timeIn || r.check_in_time || '';
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
    const status = (r.status || r.Status || '').toUpperCase();
    if (status.includes('TRỄ') || status === 'LATE') summary.late++;
    else if (status.includes('VẮNG') || status === 'ABSENT') summary.absent++;
    else summary.on_time++; // Default to on_time
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
      const status = (r.status || r.Status || '').toUpperCase();
      if (status.includes('TRỄ') || status === 'LATE') dayBucket.late++;
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
}

export function getDoorStatuses(): DoorStatus[] {
  // Mock data as per PRD
  return Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    label: `Cửa ${i + 1}`,
    status: i === 7 ? 'error' : i === 6 ? 'offline' : 'online' // 1 error, 1 offline, 6 online
  }));
}
