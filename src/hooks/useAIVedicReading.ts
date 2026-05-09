import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VedicReading, UserProfile } from '@/lib/vedicTypes';
import { sanitizeVedicReading } from '@/lib/sanitizeVedicReading';


const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours - cost optimisation


function getCacheKey(user: UserProfile, timeOffset: number, timezone: string, userId?: string | null) {
  const uid = userId ?? 'anon';
  return `sh:vedic:reading:${uid}:${user.birthDate}:${user.birthTime}:${user.birthPlace}:${user.plan}`;
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
