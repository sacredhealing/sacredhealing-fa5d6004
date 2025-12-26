import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SHCPrice {
  priceUsd: number;
  priceEur: number;
  cached: boolean;
  timestamp: number;
  fallback?: boolean;
}

export const useSHCPrice = () => {
  const [price, setPrice] = useState<SHCPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('fetch-shc-price');

      if (fnError) throw fnError;

      setPrice(data);
    } catch (err) {
      console.error('Error fetching SHC price:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
      // Set fallback price
      setPrice({
        priceUsd: 0.00001,
        priceEur: 0.0000092,
        cached: false,
        timestamp: Date.now(),
        fallback: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    // Refresh price every 60 seconds
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  const convertShcToEur = useCallback((shcAmount: number): number => {
    if (!price) return 0;
    return shcAmount * price.priceEur;
  }, [price]);

  const convertEurToShc = useCallback((eurAmount: number): number => {
    if (!price || price.priceEur === 0) return 0;
    return eurAmount / price.priceEur;
  }, [price]);

  const formatEur = useCallback((amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  }, []);

  return {
    price,
    isLoading,
    error,
    refetch: fetchPrice,
    convertShcToEur,
    convertEurToShc,
    formatEur,
  };
};
