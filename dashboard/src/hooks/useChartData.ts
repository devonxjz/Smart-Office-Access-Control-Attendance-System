import { useAppData } from '../contexts/app-data-context';
import { useMemo } from 'react';
import { 
  groupCheckInsByHour, 
  getTodayPunctualitySummary, 
  getLast7DaysBreakdown, 
  getDoorStatuses 
} from '../lib/chart-transforms';

export function useChartData() {
  const { data: records, loading, error } = useAppData('attendance');
  
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  const hourlyData = useMemo(() => groupCheckInsByHour(records, today), [records, today]);
  const punctualityData = useMemo(() => getTodayPunctualitySummary(records, today), [records, today]);
  const weeklyData = useMemo(() => getLast7DaysBreakdown(records, today), [records, today]);
  
  // Door statuses are mocked for now as per PRD
  const doorData = useMemo(() => getDoorStatuses(), []);
  
  return {
    hourlyData,
    punctualityData,
    weeklyData,
    doorData,
    loading,
    error
  };
}
