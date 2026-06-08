import { useAttendance } from './useAttendance';
import { useMemo } from 'react';
import { 
  groupCheckInsByHour, 
  getTodayPunctualitySummary, 
  getLast7DaysBreakdown, 
  getDoorStatuses 
} from '../lib/chart-transforms';

export function useChartData() {
  const { records, loading, error } = useAttendance();
  
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  const hourlyData = useMemo(() => groupCheckInsByHour(records, today), [records, today]);
  const punctualityData = useMemo(() => getTodayPunctualitySummary(records, today), [records, today]);
  const weeklyData = useMemo(() => getLast7DaysBreakdown(records, today), [records, today]);
  
  // Door statuses are based on latest scans
  const doorData = useMemo(() => getDoorStatuses(records), [records]);
  
  return {
    hourlyData,
    punctualityData,
    weeklyData,
    doorData,
    loading,
    error
  };
}
