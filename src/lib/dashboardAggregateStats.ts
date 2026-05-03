import { supabase } from '@/integrations/supabase/client';

export interface DashboardAggregateStats {
  total_profiles: number;
  active_this_month: number;
  total_shc_distributed: number;
}

/** Uses SECURITY DEFINER RPC so totals reflect full tables (RLS-safe KPI path). */
export async function fetchPublicAggregateDashboardStats(): Promise<DashboardAggregateStats | null> {
  type RpcClient = {
    rpc: (
      fn: string,
      params?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string; code?: string } | null }>;
  };
  const { data, error } = await (supabase as unknown as RpcClient).rpc('public_aggregate_dashboard_stats');
  if (error || data == null || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  return {
    total_profiles: Number(d.total_profiles) || 0,
    active_this_month: Number(d.active_this_month) || 0,
    total_shc_distributed: Number(d.total_shc_distributed) || 0,
  };
}
