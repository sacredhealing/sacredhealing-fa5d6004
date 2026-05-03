import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AyurvedaCourseRow {
  id: string;
  module_number: number;
  phase: number;
  title: string;
  subtitle?: string | null;
  description: string | null;
  tier_required: string | null;
  duration_minutes: number | null;
  content_type: string | null;
  content_url: string | null;
  pdf_url?: string | null;
  audio_url?: string | null;
  thumbnail_url?: string | null;
  tags?: string[] | null;
  is_published?: boolean | null;
}

export interface ProgressSnapshot {
  module_id: string;
  completed: boolean;
  progress_percent: number | null;
  notes: string | null;
}

/** Columns aligned with `public.ayurveda_courses` + academy migrations */
export const AYURVEDA_COURSE_SELECT =
  'id, module_number, phase, title, subtitle, description, tier_required, duration_minutes, content_type, content_url, pdf_url, audio_url, thumbnail_url, tags, is_published';

export function useAyurvedaProgress(enabled = true) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<AyurvedaCourseRow[]>([]);
  const [progressByModuleId, setProgressByModuleId] = useState<Record<string, ProgressSnapshot>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data: courseRows, error: cErr } = await supabase
        .from('ayurveda_courses')
        .select(AYURVEDA_COURSE_SELECT)
        .order('module_number', { ascending: true });
      if (cErr) throw cErr;
      setCourses((courseRows || []) as AyurvedaCourseRow[]);

      if (user?.id) {
        const { data: progRows, error: pErr } = await supabase
          .from('user_course_progress')
          .select('module_id, completed, progress_percent, notes')
          .eq('user_id', user.id);
        if (pErr) throw pErr;
        const map: Record<string, ProgressSnapshot> = {};
        (progRows || []).forEach((row: ProgressSnapshot) => {
          map[row.module_id] = row;
        });
        setProgressByModuleId(map);
      } else {
        setProgressByModuleId({});
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setCourses([]);
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
      moduleId: string;
      progress_percent?: number;
      completed?: boolean;
      notes?: string | null;
    }) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');

      const { data: existing } = await supabase
        .from('user_course_progress')
        .select('completed, progress_percent, notes')
        .eq('user_id', user.id)
        .eq('module_id', params.moduleId)
        .maybeSingle();

      const prevCompleted = existing?.completed ?? false;
      const prevPct = existing?.progress_percent ?? 0;
      const prevNotes = existing?.notes ?? null;

      const completed =
        params.completed !== undefined ? params.completed : prevCompleted;
      const progress_percent = completed
        ? 100
        : params.progress_percent !== undefined
          ? Math.min(100, Math.max(0, params.progress_percent))
          : prevPct;
      const notes = params.notes !== undefined ? params.notes : prevNotes;

      const now = new Date().toISOString();
      const row = {
        user_id: user.id,
        module_id: params.moduleId,
        progress_percent,
        completed,
        notes,
        completed_at: completed ? now : null,
        last_accessed_at: now,
      };

      const { error: upErr } = await supabase.from('user_course_progress').upsert(row, {
        onConflict: 'user_id,module_id',
      });
      if (upErr) throw upErr;

      setProgressByModuleId((prev) => ({
        ...prev,
        [params.moduleId]: {
          module_id: params.moduleId,
          completed,
          progress_percent,
          notes,
        },
      }));
    },
    [user?.id],
  );

  const markComplete = useCallback(
    async (moduleId: string) => {
      await upsertProgress({ moduleId, completed: true, progress_percent: 100 });
    },
    [upsertProgress],
  );

  const completedCount = useMemo(
    () =>
      Object.values(progressByModuleId).filter((p) => p.completed).length,
    [progressByModuleId],
  );

  return {
    courses,
    progressByModuleId,
    loading,
    error,
    refresh,
    upsertProgress,
    markComplete,
    completedCount,
  };
}
