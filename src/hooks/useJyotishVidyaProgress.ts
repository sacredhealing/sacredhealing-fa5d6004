import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as unknown as { from: (t: string) => any };
import { useAuth } from '@/hooks/useAuth';

export interface JyotishModuleRow {
  id: number;
  tier_required: string;
  title: string;
  subtitle: string;
  description: string | null;
  content_url: string | null;
  pdf_url: string | null;
  audio_url: string | null;
  topics: unknown;
  duration_minutes: number | null;
  sort_order: number;
  is_published?: boolean | null;
}

export interface JyotishProgressSnapshot {
  module_id: number;
  completion_percentage: number;
  status: string;
  notes: string | null;
  last_accessed_at: string | null;
  completed_at: string | null;
}

export interface JyotishVidyaStats {
  totalModules: number;
  completedModules: number;
  completionPercent: number;
  totalMinutesLearned: number;
}

export const JYOTISH_MODULE_SELECT =
  'id, tier_required, title, subtitle, description, content_url, pdf_url, audio_url, topics, duration_minutes, sort_order, is_published';

const PROGRESS_SELECT =
  'module_id, completion_percentage, status, notes, last_accessed_at, completed_at';

const PROGRESS_EXISTING_SELECT = 'completion_percentage, status, notes, completed_at';

type ProgressRowDb = {
  completion_percentage?: number;
  status?: string;
  notes?: string | null;
  completed_at?: string | null;
};

function isCompletedRow(row: JyotishProgressSnapshot | ProgressRowDb | null | undefined): boolean {
  if (!row) return false;
  const pct = row.completion_percentage ?? 0;
  const st = (row as JyotishProgressSnapshot).status ?? '';
  return st === 'completed' || pct >= 100;
}

export function useJyotishVidyaProgress(enabled = true) {
  const { user } = useAuth();
  const [modules, setModules] = useState<JyotishModuleRow[]>([]);
  const [progressByModuleId, setProgressByModuleId] = useState<Record<number, JyotishProgressSnapshot>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data: modRows, error: mErr } = await supabase
        .from('jyotish_modules')
        .select(JYOTISH_MODULE_SELECT)
        .order('sort_order', { ascending: true });
      if (mErr) throw mErr;
      setModules((modRows || []) as JyotishModuleRow[]);

      if (user?.id) {
        const { data: progRows, error: pErr } = await supabase
          .from('jyotish_progress')
          .select(PROGRESS_SELECT)
          .eq('user_id', user.id);
        if (pErr) throw pErr;
        const map: Record<number, JyotishProgressSnapshot> = {};
        (progRows || []).forEach((row: JyotishProgressSnapshot) => {
          map[row.module_id] = row;
        });
        setProgressByModuleId(map);
      } else {
        setProgressByModuleId({});
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setModules([]);
      setProgressByModuleId({});
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
  }, [enabled, refresh]);

  const upsertProgress = useCallback(
    async (params: {
      moduleId: number;
      completion_percentage?: number;
      completed?: boolean;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');

      const { data: existing } = await supabase
        .from('jyotish_progress')
        .select(PROGRESS_EXISTING_SELECT)
        .eq('user_id', user.id)
        .eq('module_id', params.moduleId)
        .maybeSingle();

      const prev = existing as ProgressRowDb | null;
      const prevPct = prev?.completion_percentage ?? 0;
      const prevNotes = prev?.notes ?? null;
      const prevStatus = prev?.status ?? 'in_progress';

      let completion_percentage = prevPct;
      if (params.completed === true) completion_percentage = 100;
      else if (params.completion_percentage !== undefined) {
        completion_percentage = Math.min(100, Math.max(0, params.completion_percentage));
      }

      const notes = params.notes !== undefined ? params.notes : prevNotes;
      let status = prevStatus;
      if (completion_percentage >= 100 || params.completed === true) status = 'completed';

      const now = new Date().toISOString();
      const completed_at =
        status === 'completed' ? (prev?.completed_at ?? now) : null;

      const row = {
        user_id: user.id,
        module_id: params.moduleId,
        completion_percentage,
        status,
        notes,
        last_accessed_at: now,
        completed_at,
      };

      const { error: upErr } = await supabase.from('jyotish_progress').upsert(row, {
        onConflict: 'user_id,module_id',
      });
      if (upErr) throw upErr;

      setProgressByModuleId((prevMap) => ({
        ...prevMap,
        [params.moduleId]: {
          module_id: params.moduleId,
          completion_percentage,
          status,
          notes,
          last_accessed_at: now,
          completed_at,
        },
      }));
    },
    [user?.id],
  );

  const markComplete = useCallback(
    async (moduleId: number) => {
      await upsertProgress({ moduleId, completed: true, completion_percentage: 100 });
    },
    [upsertProgress],
  );

  const touchAccess = useCallback(
    async (moduleId: number) => {
      if (!user?.id) return;
      await upsertProgress({ moduleId });
    },
    [user?.id, upsertProgress],
  );

  const completedCount = useMemo(
    () => Object.values(progressByModuleId).filter((p) => isCompletedRow(p)).length,
    [progressByModuleId],
  );

  const stats = useMemo((): JyotishVidyaStats => {
    const completedModules = completedCount;
    const totalMinutesLearned = modules
      .filter((m) => isCompletedRow(progressByModuleId[m.id]))
      .reduce((acc, m) => acc + (m.duration_minutes ?? 0), 0);

    return {
      totalModules: modules.length,
      completedModules,
      completionPercent:
        modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0,
      totalMinutesLearned,
    };
  }, [modules, completedCount, progressByModuleId]);

  return {
    modules,
    progressByModuleId,
    loading,
    error,
    refresh,
    upsertProgress,
    markComplete,
    touchAccess,
    completedCount,
    stats,
  };
}
