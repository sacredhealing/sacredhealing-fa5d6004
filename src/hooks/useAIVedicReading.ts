import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VedicReading, UserProfile } from '@/lib/vedicTypes';

interface UseAIVedicReadingResult {
  reading: VedicReading | null;
  isLoading: boolean;
  error: string | null;
  generateReading: (user: UserProfile, timeOffset?: number) => Promise<void>;
}

export function useAIVedicReading(): UseAIVedicReadingResult {
  const [reading, setReading] = useState<VedicReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReading = useCallback(async (user: UserProfile, timeOffset: number = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-vedic-reading', {
        body: { user, timeOffset },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setReading(data as VedicReading);
    } catch (err) {
      console.error('Failed to generate Vedic reading:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate reading');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    reading,
    isLoading,
    error,
    generateReading,
  };
}