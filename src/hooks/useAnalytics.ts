import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConversionFunnel {
  totalUsers: number;
  freeUsers: number;
  trialUsers: number;
  paidUsers: number;
  freeToTrialRate: string | number;
  trialToPaidRate: string | number;
  overallConversion: string | number;
}

interface RetentionData {
  cohortSize: number;
  retained: number;
  rate: string | number;
}

interface Retention {
  d1: RetentionData;
  d7: RetentionData;
  d30: RetentionData;
}

interface MeditationActivity {
  id: string;
  title: string;
  count: number;
}

interface PathActivity {
  name: string;
  count: number;
}

interface ArpuByTier {
  slug: string;
  name: string;
  arpu: string | number;
  totalRevenue: string;
  userCount: number;
}

interface ChurnUpgrade {
  churned30d: number;
  upgraded30d: number;
  churnRate: string | number;
  upgradeRate: string | number;
}

interface DauTimeline {
  date: string;
  count: number;
}

interface Summary {
  totalUsers: number;
  paidUsers: number;
  totalMeditations: number;
  totalMantras: number;
  totalRevenue: string;
  overallArpu: string | number;
}

interface AnalyticsData {
  success: boolean;
  generatedAt: string;
  summary: Summary;
  conversionFunnel: ConversionFunnel;
  retention: Retention;
  topMeditations: MeditationActivity[];
  topPaths: PathActivity[];
  arpuByTier: ArpuByTier[];
  churnUpgrade: ChurnUpgrade;
  dauTimeline: DauTimeline[];
}

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fetchError } = await supabase.functions.invoke('fetch-analytics');

      if (fetchError) {
        throw fetchError;
      }

      if (result?.success) {
        setData(result as AnalyticsData);
      } else {
        throw new Error(result?.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics,
  };
};
