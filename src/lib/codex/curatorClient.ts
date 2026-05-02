/**
 * Curator client — wraps the akasha-codex-curator edge function and surfaces
 * a clear toast so the user always knows what happened to a transmission:
 *
 *   • Saved to <Codex> → "<Chapter title>" (new or merged)
 *   • Excluded: <reason>
 *   • Save failed — with a one-tap retry
 *
 * Used by every SQI surface (QuantumApothecary, AdminQuantumApothecary2045,
 * PasteTransmissionPanel, etc.) so behaviour stays consistent.
 */
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type CodexType = 'akasha' | 'portrait';

interface CuratorPayload {
  source_type?: 'apothecary' | 'manual_paste' | 'file_upload' | 'voice_memo' | 'backfill';
  raw_content: string;
  user_prompt?: string;
  source_chat_id?: string | null;
  routing_override?: 'auto' | 'force_akasha' | 'force_portrait';
  student_id?: string;
}

interface CuratorItemResult {
  ok: boolean;
  error?: string;
  excluded?: boolean;
  reason?: string;
  transmissionIds?: string[];
  chapterIds?: string[];
  classification?: {
    target?: string;
    chapter_subject?: string;
    topic_primary?: string;
    reasoning?: string;
  };
}

interface CuratorEnvelope {
  results?: CuratorItemResult[];
}

const CODEX_LABEL: Record<string, string> = {
  akasha: 'Akashic Codex',
  portrait: 'Living Portrait',
};

async function lookupChapter(chapterId: string): Promise<{ title: string; codex_type: CodexType } | null> {
  try {
    const { data } = await supabase
      .from('codex_chapters')
      .select('title, codex_type')
      .eq('id', chapterId)
      .maybeSingle();
    if (!data) return null;
    return { title: data.title as string, codex_type: data.codex_type as CodexType };
  } catch {
    return null;
  }
}

async function lookupStudentName(studentId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('codex_students')
      .select('display_name')
      .eq('id', studentId)
      .maybeSingle();
    return (data?.display_name as string) ?? null;
  } catch {
    return null;
  }
}

export interface CurateOptions {
  /** Suppress all toasts (e.g. background backfill). */
  silent?: boolean;
}

/**
 * Send a transmission to the curator and surface a toast describing the outcome.
 * Returns the raw curator results so callers can react further.
 */
export async function curateTransmission(
  payload: CuratorPayload,
  options: CurateOptions = {},
): Promise<CuratorItemResult[] | null> {
  const { silent = false } = options;
  const toastId = silent ? undefined : toast.loading('Saving to your Codex…');

  const doInvoke = () =>
    supabase.functions.invoke<CuratorEnvelope>('akasha-codex-curator', { body: payload });

  try {
    const { data, error } = await doInvoke();
    if (error) throw error;

    const results = data?.results ?? [];
    if (!results.length) {
      if (!silent && toastId !== undefined) {
        toast.error('Codex save failed — empty response', {
          id: toastId,
          action: { label: 'Retry', onClick: () => void curateTransmission(payload, options) },
        });
      }
      return results;
    }

    if (silent || toastId === undefined) return results;

    const r = results[0];

    if (!r.ok) {
      toast.error(`Codex save failed${r.error ? `: ${r.error}` : ''}`, {
        id: toastId,
        action: { label: 'Retry', onClick: () => void curateTransmission(payload, options) },
      });
      return results;
    }

    if (r.excluded) {
      toast.message('Skipped Codex (excluded)', {
        id: toastId,
        description: r.reason || 'Classifier marked this transmission as low-signal or non-teaching.',
      });
      return results;
    }

    // Saved — resolve chapter titles for a clear confirmation.
    const chapterIds = r.chapterIds ?? [];
    if (!chapterIds.length) {
      toast.success('Saved to your Codex', { id: toastId });
      return results;
    }

    if (payload.student_id) {
      const studentName = await lookupStudentName(payload.student_id);
      const chapter = await lookupChapter(chapterIds[0]);
      toast.success(
        studentName ? `Saved to ${studentName}'s Book` : 'Saved to Student Codex',
        {
          id: toastId,
          description: chapter ? `Chapter: ${chapter.title}` : undefined,
        },
      );
      return results;
    }

    const chapters = await Promise.all(chapterIds.map((id) => lookupChapter(id)));
    const lines = chapters
      .filter((c): c is { title: string; codex_type: CodexType } => !!c)
      .map((c) => `${CODEX_LABEL[c.codex_type] ?? c.codex_type} → ${c.title}`);

    if (lines.length === 0) {
      toast.success('Saved to your Codex', { id: toastId });
    } else if (lines.length === 1) {
      toast.success('Saved to your Codex', { id: toastId, description: lines[0] });
    } else {
      toast.success('Saved to your Codex (split)', {
        id: toastId,
        description: lines.join('\n'),
      });
    }
    return results;
  } catch (err) {
    console.error('[codex] curator invocation failed:', err);
    if (!silent && toastId !== undefined) {
      toast.error('Codex save failed', {
        id: toastId,
        description: err instanceof Error ? err.message : String(err),
        action: { label: 'Retry', onClick: () => void curateTransmission(payload, options) },
      });
    }
    return null;
  }
}
