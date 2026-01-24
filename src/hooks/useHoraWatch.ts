import { useState, useEffect, useCallback, useRef } from 'react';
import {
  calculateCurrentHora,
  getCoordinatesFromTimezone,
  formatRemainingTime,
  type HoraCalculation,
} from '@/lib/horaCalculator';

interface UseHoraWatchOptions {
  timezone: string;
  latitude?: number;
  longitude?: number;
  timeOffset?: number; // Minutes offset for time-travel feature
}

interface HoraWatchState {
  calculation: HoraCalculation | null;
  remainingTimeStr: string;
  remainingMs: number;
  isLoading: boolean;
  lastUpdated: Date | null;
}

/**
 * Custom hook for Hora Watch with:
 * - Accurate sunrise/sunset-based calculations
 * - Real-time countdown timer
 * - State persistence to prevent reload flicker
 * - Auto-refresh at Hora boundaries
 */
export function useHoraWatch(options: UseHoraWatchOptions): HoraWatchState & {
  recalculate: () => void;
} {
  const { timezone, latitude, longitude, timeOffset = 0 } = options;
  
  const [state, setState] = useState<HoraWatchState>({
    calculation: null,
    remainingTimeStr: '--:--',
    remainingMs: 0,
    isLoading: true,
    lastUpdated: null,
  });
  
  // Cache the last calculation to prevent flicker on reload
  const calculationRef = useRef<HoraCalculation | null>(null);
  const horaEndTimeRef = useRef<number>(0);
  
  // Get coordinates from timezone or use provided ones
  const coords = latitude && longitude 
    ? { latitude, longitude }
    : getCoordinatesFromTimezone(timezone);
  
  // Calculate timezone offset in minutes
  const getTimezoneOffset = useCallback(() => {
    try {
      const now = new Date();
      const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      return (tzDate.getTime() - utcDate.getTime()) / 60000;
    } catch {
      return 0;
    }
  }, [timezone]);
  
  // Main calculation function
  const recalculate = useCallback(() => {
    const timezoneOffsetMinutes = getTimezoneOffset();
    
    // Apply time offset for time-travel feature
    const targetTime = new Date(Date.now() + timeOffset * 60000);
    
    const calculation = calculateCurrentHora(
      targetTime,
      coords.latitude,
      coords.longitude,
      timezoneOffsetMinutes
    );
    
    calculationRef.current = calculation;
    horaEndTimeRef.current = calculation.currentHora.endTime.getTime();
    
    setState({
      calculation,
      remainingTimeStr: formatRemainingTime(calculation.remainingMs),
      remainingMs: calculation.remainingMs,
      isLoading: false,
      lastUpdated: new Date(),
    });
    
    console.log('[HoraWatch] Calculated:', {
      planet: calculation.currentHora.planet,
      start: calculation.currentHora.startTimeStr,
      end: calculation.currentHora.endTimeStr,
      dayRuler: calculation.dayRuler,
      isDay: calculation.currentHora.isDay,
      duration: `${calculation.currentHora.durationMinutes} min`,
    });
  }, [coords.latitude, coords.longitude, getTimezoneOffset, timeOffset]);
  
  // Initial calculation
  useEffect(() => {
    recalculate();
  }, [recalculate]);
  
  // Countdown timer - updates every second
  useEffect(() => {
    if (!calculationRef.current) return;
    
    const intervalId = setInterval(() => {
      const now = Date.now() + (timeOffset * 60000);
      const endTime = horaEndTimeRef.current;
      const remaining = endTime - now;
      
      if (remaining <= 0) {
        // Hora has ended - recalculate
        console.log('[HoraWatch] Hora boundary crossed - recalculating');
        recalculate();
      } else {
        // Update countdown display
        setState(prev => ({
          ...prev,
          remainingTimeStr: formatRemainingTime(remaining),
          remainingMs: remaining,
        }));
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [recalculate, timeOffset]);
  
  // State locking: Check if current time still falls within cached Hora
  // This prevents recalculation on reload if we're still in the same Hora
  useEffect(() => {
    if (!calculationRef.current) return;
    
    const now = Date.now() + (timeOffset * 60000);
    const startTime = calculationRef.current.currentHora.startTime.getTime();
    const endTime = calculationRef.current.currentHora.endTime.getTime();
    
    if (now >= startTime && now < endTime) {
      // Still in same Hora - no need to recalculate, just update remaining time
      const remaining = endTime - now;
      setState(prev => ({
        ...prev,
        remainingTimeStr: formatRemainingTime(remaining),
        remainingMs: remaining,
        isLoading: false,
      }));
    } else {
      // Time has moved outside current Hora - recalculate
      recalculate();
    }
  }, [timeOffset, recalculate]);
  
  return {
    ...state,
    recalculate,
  };
}
