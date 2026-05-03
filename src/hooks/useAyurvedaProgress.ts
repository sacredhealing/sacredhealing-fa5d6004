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

/** Alias for consumers mirroring the Downloads hook name */
export type AyurvedaModule = AyurvedaCourseRow;

export interface ProgressSnapshot {
  module_id: string;
  completed: boolean;
  progress_percent: number | null;
  notes: string | null;
  bookmarked?: boolean | null;
  last_accessed_at?: string | null;
}

export interface AyurvedaStats {
  totalModules: number;
  completedModules: number;
  currentPhase: number;
  completionPercent: number;
  bookmarkedModules: number;
  totalMinutesLearned: number;
}

/** Columns aligned with `public.ayurveda_courses` + academy migrations */
export const AYURVEDA_COURSE_SELECT =
  'id, module_number, phase, title, subtitle, description, tier_required, duration_minutes, content_type, content_url, pdf_url, audio_url, thumbnail_url, tags, is_published';

const PROGRESS_SELECT =
  'module_id, completed, progress_percent, notes, bookmarked, last_accessed_at';

type ProgressRowDb = {
  completed?: boolean;
  progress_percent?: number | null;
  notes?: string | null;
  bookmarked?: boolean | null;
  completed_at?: string | null;
};

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
          .select(PROGRESS_SELECT)
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
        .select('completed, progress_percent, notes, bookmarked')
        .eq('user_id', user.id)
        .eq('module_id', params.moduleId)
        .maybeSingle();

      const prev = existing as ProgressRowDb | null;
      const prevCompleted = prev?.completed ?? false;
      const prevPct = prev?.progress_percent ?? 0;
      const prevNotes = prev?.notes ?? null;
      const prevBookmarked = prev?.bookmarked ?? false;

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
        bookmarked: prevBookmarked,
        completed_at: completed ? now : null,
        last_accessed_at: now,
      };

      const { error: upErr } = await supabase.from('user_course_progress').upsert(row, {
        onConflict: 'user_id,module_id',
      });
      if (upErr) throw upErr;

      setProgressByModuleId((prevMap) => ({
        ...prevMap,
        [params.moduleId]: {
          module_id: params.moduleId,
          completed,
          progress_percent,
          notes,
          bookmarked: prevBookmarked,
          last_accessed_at: now,
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

  const updateProgress = useCallback(
    async (moduleId: string, percent: number) => {
      await upsertProgress({ moduleId, progress_percent: percent });
    },
    [upsertProgress],
  );

  const toggleBookmark = useCallback(
    async (moduleId: string) => {
      if (!user?.id) return;

      const { data: existing } = await supabase
        .from('user_course_progress')
        .select('completed, progress_percent, notes, bookmarked, completed_at')
        .eq('user_id', user.id)
        .eq('module_id', moduleId)
        .maybeSingle();

      const prev = existing as ProgressRowDb | null;
      const nextBookmark = !(prev?.bookmarked ?? false);
      const completed = prev?.completed ?? false;
      const progress_percent = prev?.progress_percent ?? 0;
      const notes = prev?.notes ?? null;
      const now = new Date().toISOString();
      const completed_at = completed ? (prev?.completed_at ?? now) : null;

      const row = {
        user_id: user.id,
        module_id: moduleId,
        completed,
        progress_percent,
        notes,
        bookmarked: nextBookmark,
        completed_at,
        last_accessed_at: now,
      };

      const { error: upErr } = await supabase.from('user_course_progress').upsert(row, {
        onConflict: 'user_id,module_id',
      });
      if (upErr) throw upErr;

      setProgressByModuleId((prevMap) => ({
        ...prevMap,
        [moduleId]: {
          module_id: moduleId,
          completed,
          progress_percent,
          notes,
          bookmarked: nextBookmark,
          last_accessed_at: now,
        },
      }));
    },
    [user?.id],
  );

  const getPhaseModules = useCallback(
    (phase: number) => courses.filter((c) => c.phase === phase),
    [courses],
  );

  const completedCount = useMemo(
    () =>
      Object.values(progressByModuleId).filter((p) => p.completed).length,
    [progressByModuleId],
  );

  const stats = useMemo((): AyurvedaStats => {
    const completedModules = completedCount;
    const bookmarkedModules = Object.values(progressByModuleId).filter((p) => p.bookmarked).length;

    const completedIds = new Set(
      Object.entries(progressByModuleId)
        .filter(([, p]) => p.completed)
        .map(([id]) => id),
    );

    let currentPhase = 1;
    courses.forEach((c) => {
      if (completedIds.has(c.id) && c.phase > currentPhase) currentPhase = c.phase;
    });

    const totalMinutesLearned = courses
      .filter((m) => progressByModuleId[m.id]?.completed)
      .reduce((acc, m) => acc + (m.duration_minutes ?? 0), 0);

    return {
      totalModules: courses.length,
      completedModules,
      currentPhase,
      completionPercent:
        courses.length > 0 ? Math.round((completedModules / courses.length) * 100) : 0,
      bookmarkedModules,
      totalMinutesLearned,
    };
  }, [courses, completedCount, progressByModuleId]);

  return {
    courses,
    /** Downloads-style alias */
    modules: courses,
    progressByModuleId,
    /** Downloads-style: progress keyed by module_id */
    progress: progressByModuleId,
    loading,
    error,
    refresh,
    upsertProgress,
    markComplete,
    updateProgress,
    toggleBookmark,
    completedCount,
    stats,
    getPhaseModules,
  };
}
