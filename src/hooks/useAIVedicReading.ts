import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VedicReading, UserProfile } from '@/lib/vedicTypes';

interface UseAIVedicReadingResult {
  reading: VedicReading | null;
  isLoading: boolean;
  error: string | null;
  generateReading: (user: UserProfile, timeOffset?: number, timezone?: string) => Promise<void>;
}

export function useAIVedicReading(): UseAIVedicReadingResult {
  const [reading, setReading] = useState<VedicReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateReading = useCallback(async (user: UserProfile, timeOffset: number = 0, timezone: string = 'Europe/Stockholm') => {
    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      console.log('Generating Vedic reading for:', user.name, 'timeOffset:', timeOffset, 'timezone:', timezone);
      
      const { data, error: fnError } = await supabase.functions.invoke('generate-vedic-reading', {
        body: { user, timeOffset, timezone },
      });

      console.log('Vedic reading response:', { data, fnError });

      if (fnError) {
        // Check for specific error types
        const errorMessage = fnError.message || 'Failed to generate reading';
        if (errorMessage.includes('402') || errorMessage.includes('Usage limit')) {
          throw new Error('AI usage limit reached. Please try again later or contact support.');
        }
        if (errorMessage.includes('429') || errorMessage.includes('Rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
        throw new Error(errorMessage);
      }

      if (data?.error) {
        // Handle specific error messages from edge function
        if (data.error.includes('Usage limit') || data.error.includes('credits')) {
          throw new Error('AI usage limit reached. Please try again later or contact support.');
        }
        if (data.error.includes('Rate limit')) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        }
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