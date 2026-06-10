import { useAttendance } from './useAttendance';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  groupCheckInsByHour, 
  getTodayPunctualitySummary, 
  getLast7DaysBreakdown, 
  getDoorStatuses 
} from '../lib/chart-transforms';
import { sheetsClient } from '../infrastructure/google-sheets.client';

export function useChartData() {
  const { records, loading, error } = useAttendance();
  const [manualLightState, setManualLightState] = useState<'ON' | 'OFF' | 'AUTO'>('AUTO');
  
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  
  useEffect(() => {
    let active = true;
    const loadLight = async () => {
      try {
        const res = await sheetsClient.getLightStatus();
        if (active && res && res.state) {
          setManualLightState(res.state);
        }
      } catch {
        // Fallback silently
      }
    };
    loadLight();
    return () => { active = false; };
  }, []);

  const toggleLight = useCallback(async () => {
    const nextStateMap: Record<'ON' | 'OFF' | 'AUTO', 'ON' | 'OFF' | 'AUTO'> = {
      'AUTO': 'ON',
      'ON': 'OFF',
      'OFF': 'AUTO'
    };
    const nextState = nextStateMap[manualLightState];
    setManualLightState(nextState);
    try {
      await sheetsClient.setLightStatus(nextState);
    } catch {
      setManualLightState(manualLightState);
    }
  }, [manualLightState]);
  
  const hourlyData = useMemo(() => groupCheckInsByHour(records, today), [records, today]);
  const punctualityData = useMemo(() => getTodayPunctualitySummary(records, today), [records, today]);
  const weeklyData = useMemo(() => getLast7DaysBreakdown(records, today), [records, today]);
  
  // Door statuses are based on latest scans
  const doorData = useMemo(() => getDoorStatuses(records, manualLightState), [records, manualLightState]);
  
  return {
    hourlyData,
    punctualityData,
    weeklyData,
    doorData,
    manualLightState,
    toggleLight,
    loading,
    error
  };
}
