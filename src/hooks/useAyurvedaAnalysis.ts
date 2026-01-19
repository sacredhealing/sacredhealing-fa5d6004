import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AyurvedaUserProfile, DoshaProfile } from '@/lib/ayurvedaTypes';

interface UseAyurvedaAnalysisResult {
  doshaProfile: DoshaProfile | null;
  dailyGuidance: string;
  isLoading: boolean;
  isLoadingGuidance: boolean;
  error: string | null;
  analyzeDosha: (profile: AyurvedaUserProfile) => Promise<void>;
  getDailyGuidance: (profile: AyurvedaUserProfile) => Promise<void>;
  reset: () => void;
}

export function useAyurvedaAnalysis(): UseAyurvedaAnalysisResult {
  const [doshaProfile, setDoshaProfile] = useState<DoshaProfile | null>(null);
  const [dailyGuidance, setDailyGuidance] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeDosha = useCallback(async (profile: AyurvedaUserProfile) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-dosha', {
        body: { profile, action: 'analyze' },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setDoshaProfile(data as DoshaProfile);
    } catch (err) {
      console.error('Failed to analyze dosha:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze dosha');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDailyGuidance = useCallback(async (profile: AyurvedaUserProfile) => {
    setIsLoadingGuidance(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-dosha', {
        body: { profile, action: 'daily-guidance' },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      setDailyGuidance(data?.guidance || 'May your path be clear and your heart light.');
    } catch (err) {
      console.error('Failed to get daily guidance:', err);
      setDailyGuidance('May your inner light guide you through this day.');
    } finally {
      setIsLoadingGuidance(false);
    }
  }, []);

  const reset = useCallback(() => {
    setDoshaProfile(null);
    setDailyGuidance('');
    setError(null);
  }, []);

  return {
    doshaProfile,
    dailyGuidance,
    isLoading,
    isLoadingGuidance,
    error,
    analyzeDosha,
    getDailyGuidance,
    reset,
  };
}