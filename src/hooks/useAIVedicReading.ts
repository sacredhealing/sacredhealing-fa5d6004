import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VedicReading, UserProfile } from '@/lib/vedicTypes';
import { sanitizeVedicReading } from '@/lib/sanitizeVedicReading';

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCacheKey(user: UserProfile, timeOffset: number, timezone: string, userId?: string | null) {
  const uid = userId ?? 'anon';
  return `sh:vedic:reading:${uid}:${user.name}:${user.birthDate}:${user.birthTime}:${user.birthPlace}:${user.plan}:2:${timeOffset}:${timezone}`;
}

function loadFromCache(key: string): VedicReading | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { reading, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    const sanitized = sanitizeVedicReading(reading);
    if (!sanitized) {
      localStorage.removeItem(key);
      return null;
    }
    return sanitized;
  } catch {
    return null;
  }
}

function saveToCache(key: string, reading: VedicReading) {
  try {
    localStorage.setItem(key, JSON.stringify({ reading, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

interface UseAIVedicReadingResult {
  reading: VedicReading | null;
  isLoading: boolean;
  error: string | null;
  generateReading: (
    user: UserProfile,
    timeOffset?: number,
    timezone?: string,
    userId?: string | null,
    options?: { forceRefresh?: boolean }
  ) => Promise<void>;
}

export function useAIVedicReading(): UseAIVedicReadingResult {
  const [reading, setReading] = useState<VedicReading | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateReading = useCallback(
    async (
      user: UserProfile,
      timeOffset: number = 0,
      timezone: string = 'Europe/Stockholm',
      userId?: string | null,
      options?: { forceRefresh?: boolean }
    ) => {
      const cacheKey = getCacheKey(user, timeOffset, timezone, userId);

      // Check cache first – skip API call if fresh data exists (cache is per-user)
      if (!options?.forceRefresh) {
        const cached = loadFromCache(cacheKey);
        if (cached) {
          setReading(cached);
          setError(null);
          return;
        }
      } else {
        // Cache-bust: force fresh read on demand
        try {
          localStorage.removeItem(cacheKey);
        } catch { /* ignore */ }
      }

      // Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        console.log('Generating Vedic reading for:', user.name, 'timeOffset:', timeOffset, 'timezone:', timezone);
        
        const { data, error: fnError } = await supabase.functions.invoke('generate-vedic-reading', {
          body: { user, timeOffset, timezone, userId },
        });

      console.log('Vedic reading response:', { data, fnError });

      if (fnError) {
        const errorMessage = fnError.message || 'Failed to generate reading';
        // Transient edge runtime degradation — retry once after short delay
        const isTransient =
          errorMessage.includes('503') ||
          errorMessage.includes('SERVICE_DEGRADED') ||
          errorMessage.includes('temporarily unavailable') ||
          errorMessage.includes('non-2xx');

        if (isTransient) {
          console.warn('Vedic reading transient error, retrying once...', errorMessage);
          await new Promise(r => setTimeout(r, 1500));
          const retry = await supabase.functions.invoke('generate-vedic-reading', {
            body: { user, timeOffset, timezone, userId },
          });
          if (!retry.error && retry.data && !retry.data.error) {
            const retryReading = sanitizeVedicReading(retry.data);
            if (retryReading) {
              saveToCache(cacheKey, retryReading);
              setReading(retryReading);
              return;
            }
          }
          // Still failing — set soft error, don't crash UI
          setError('Cosmic transmission temporarily unavailable. Please try again in a moment.');
          return;
        }

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

      const vedicReading = sanitizeVedicReading(data);
      if (!vedicReading) {
        throw new Error('Invalid reading data received');
      }
      saveToCache(cacheKey, vedicReading);
      setReading(vedicReading);
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
    },
    []
  );

  return {
    reading,
    isLoading,
    error,
    generateReading,
  };
}