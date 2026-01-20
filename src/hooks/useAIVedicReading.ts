import { useState, useCallback, useRef } from 'react';
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateReading = useCallback(async (user: UserProfile, timeOffset: number = 0) => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      console.log('Generating Vedic reading for:', user.name, 'timeOffset:', timeOffset);
      
      const { data, error: fnError } = await supabase.functions.invoke('generate-vedic-reading', {
        body: { user, timeOffset },
      });

      console.log('Vedic reading response:', { data, fnError });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Validate that we got actual reading data
      if (!data || !data.todayInfluence) {
        throw new Error('Invalid reading data received');
      }

      setReading(data as VedicReading);
    } catch (err) {
      // Don't log abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
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