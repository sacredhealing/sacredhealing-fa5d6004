import { useCallback, useEffect, useState } from 'react';
import { describeError } from '@/lib/describeError';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface WaterModuleProgressRow {
  module_id: string;
  completed: boolean;
  last_accessed_at?: string | null;
}

const SELECT = 'module_id, completed, last_accessed_at';

export function useWaterAlchemyProgress(enabled = true) {
  const { user } = useAuth();
  const [progressByModuleId, setProgressByModuleId] = useState<Record<string, WaterModuleProgressRow>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !user?.id) {
      setProgressByModuleId({});
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fErr } = await supabase
        .from('user_water_alchemy_progress')
        .select(SELECT)
        .eq('user_id', user.id);
      if (fErr) throw fErr;
      const map: Record<string, WaterModuleProgressRow> = {};
      (data || []).forEach((row: WaterModuleProgressRow) => {
        map[row.module_id] = row;
      });
      setProgressByModuleId(map);
    } catch (e: unknown) {
      setError(describeError(e));
      setProgressByModuleId({});
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const markComplete = useCallback(
    async (moduleId: string) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_water_alchemy_progress').upsert(
        { user_id: user.id, module_id: moduleId, completed: true, completed_at: now, last_accessed_at: now },
        { onConflict: 'user_id,module_id' },
      );
      if (upErr) throw upErr;
      setProgressByModuleId((m) => ({ ...m, [moduleId]: { module_id: moduleId, completed: true, last_accessed_at: now } }));
    },
    [user?.id],
  );

  const touchAccessed = useCallback(
    async (moduleId: string) => {
      if (!user?.id) return;
      const prev = progressByModuleId[moduleId];
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_water_alchemy_progress').upsert(
        { user_id: user.id, module_id: moduleId, completed: prev?.completed ?? false, last_accessed_at: now },
        { onConflict: 'user_id,module_id' },
      );
      if (upErr) return;
      setProgressByModuleId((m) => ({ ...m, [moduleId]: { module_id: moduleId, completed: prev?.completed ?? false, last_accessed_at: now } }));
    },
    [user?.id, progressByModuleId],
  );

  const completedModuleIds = new Set(Object.values(progressByModuleId).filter((p) => p.completed).map((p) => p.module_id));

  return { progressByModuleId, completedModuleIds, loading, error, refresh, markComplete, touchAccessed };
}
