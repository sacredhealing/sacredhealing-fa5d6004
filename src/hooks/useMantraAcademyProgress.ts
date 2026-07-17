import { useCallback, useEffect, useMemo, useState } from 'react';
import { describeError } from '@/lib/describeError';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface MantraCourseRow {
  id: string;
  module_number: number;
  module_key: string;
  title: string;
  subtitle: string | null;
  tier_required: string | null;
  is_published: boolean | null;
}

export interface MantraLessonProgress {
  lesson_id: string;
  module_id: string;
  completed: boolean;
  notes: string | null;
}

const COURSE_SELECT = 'id, module_number, module_key, title, subtitle, tier_required, is_published';
const LESSON_SELECT = 'lesson_id, module_id, completed, notes';

export function useMantraAcademyProgress(enabled = true) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<MantraCourseRow[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<string, MantraLessonProgress>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const { data: courseRows, error: cErr } = await supabase
        .from('mantra_academy_courses')
        .select(COURSE_SELECT)
        .order('module_number', { ascending: true });
      if (cErr) throw cErr;
      setCourses((courseRows || []) as MantraCourseRow[]);

      if (user?.id) {
        const { data: lessonRows, error: lErr } = await supabase
          .from('user_mantra_academy_lesson_progress')
          .select(LESSON_SELECT)
          .eq('user_id', user.id);
        if (lErr) throw lErr;
        const map: Record<string, MantraLessonProgress> = {};
        (lessonRows || []).forEach((row: MantraLessonProgress) => {
          map[row.lesson_id] = row;
        });
        setLessonProgress(map);
      } else {
        setLessonProgress({});
      }
    } catch (e: unknown) {
      setError(describeError(e));
      setCourses([]);
      setLessonProgress({});
    } finally {
      setLoading(false);
    }
  }, [enabled, user?.id]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  const toggleLessonComplete = useCallback(
    async (moduleId: string, lessonId: string) => {
      if (!user?.id) throw new Error('AUTH_REQUIRED');
      const prev = lessonProgress[lessonId];
      const nextCompleted = !(prev?.completed ?? false);
      const now = new Date().toISOString();
      const { error: upErr } = await supabase.from('user_mantra_academy_lesson_progress').upsert(
        { user_id: user.id, module_id: moduleId, lesson_id: lessonId, completed: nextCompleted, completed_at: nextCompleted ? now : null, updated_at: now },
        { onConflict: 'user_id,lesson_id' },
      );
      if (upErr) throw upErr;
      setLessonProgress((m) => ({ ...m, [lessonId]: { lesson_id: lessonId, module_id: moduleId, completed: nextCompleted, notes: prev?.notes ?? null } }));
    },
    [user?.id, lessonProgress],
  );

  const moduleCompletionByModuleId = useMemo(() => {
    const byModule: Record<string, { done: number }> = {};
    Object.values(lessonProgress).forEach((lp) => {
      if (!lp.completed) return;
      if (!byModule[lp.module_id]) byModule[lp.module_id] = { done: 0 };
      byModule[lp.module_id].done += 1;
    });
    return byModule;
  }, [lessonProgress]);

  const totalLessonsCompleted = useMemo(
    () => Object.values(lessonProgress).filter((l) => l.completed).length,
    [lessonProgress],
  );

  return { courses, lessonProgress, loading, error, refresh, toggleLessonComplete, moduleCompletionByModuleId, totalLessonsCompleted };
}
