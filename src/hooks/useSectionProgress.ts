import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SectionProgressRow {
  completed: boolean;
  notes: string | null;
}

/**
 * Per-section completion + notes for a single module's lesson accordion.
 * Separate from module-level progress -- this tracks each accordion card
 * (section_id) independently, so marking one section complete or writing
 * a note on it doesn't touch any other section.
 *
 * Generalized across academies via `tableName` -- each academy gets its
 * own section-progress table (e.g. user_kayakalpa_section_progress) with
 * the identical shape, so this one hook covers all of them instead of a
 * copy-pasted hook per academy.
 */
export function useSectionProgress(
  moduleId: string | undefined,
  tableName: string = 'user_lesson_section_progress',
) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record<string, SectionProgressRow>>({});
  const [loading, setLoading] = useState(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!moduleId || !user?.id) {
        setRows({});
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await (supabase.from(tableName as never) as any)
        .select('section_id, completed, notes')
        .eq('user_id', user.id)
        .eq('module_id', moduleId);
      if (!cancelled) {
        if (!error && data) {
          const next: Record<string, SectionProgressRow> = {};
          for (const r of data as { section_id: string; completed: boolean; notes: string | null }[]) {
            next[r.section_id] = { completed: r.completed, notes: r.notes };
          }
          setRows(next);
        }
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [moduleId, user?.id, tableName]);

  const upsertSection = useCallback(
    async (sectionId: string, patch: Partial<SectionProgressRow>) => {
      if (!moduleId || !user?.id) throw new Error('AUTH_REQUIRED');
      const prev = rows[sectionId] ?? { completed: false, notes: null };
      const merged = { ...prev, ...patch };
      const { error } = await (supabase.from(tableName as never) as any).upsert(
        {
          user_id: user.id,
          module_id: moduleId,
          section_id: sectionId,
          completed: merged.completed,
          notes: merged.notes,
          completed_at: merged.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id,section_id' },
      );
      if (error) throw error;
      setRows((r) => ({ ...r, [sectionId]: merged }));
    },
    [moduleId, user?.id, rows, tableName],
  );

  const toggleSectionComplete = useCallback(
    (sectionId: string) => {
      const isDone = rows[sectionId]?.completed ?? false;
      return upsertSection(sectionId, { completed: !isDone });
    },
    [rows, upsertSection],
  );

  /** Debounced note save -- same 700ms pattern as the module-level notes autosave. */
  const setSectionNotes = useCallback(
    (sectionId: string, notes: string, onSaved?: (ok: boolean) => void) => {
      setRows((r) => ({ ...r, [sectionId]: { completed: r[sectionId]?.completed ?? false, notes } }));
      if (saveTimers.current[sectionId]) clearTimeout(saveTimers.current[sectionId]);
      saveTimers.current[sectionId] = setTimeout(() => {
        void upsertSection(sectionId, { notes })
          .then(() => onSaved?.(true))
          .catch(() => onSaved?.(false));
      }, 700);
    },
    [upsertSection],
  );

  return { rows, loading, toggleSectionComplete, setSectionNotes, upsertSection };
}
