/**
 * Codex self-healing sweeper.
 *
 * Every assistant SQI reply gets a `needs_codex_sync: true` flag when persisted
 * to `sqi_sessions.messages`. Normally the live curator call clears that flag
 * immediately. If the live call is lost (tab closed mid-stream, network blip,
 * onDone callback throws, page unmount race), the flag survives — and the next
 * time the user opens the app this sweeper finds it, replays the transmission
 * through the curator silently, and clears the flag on success.
 *
 * This guarantees that no SQI reply that lives in `sqi_sessions` can be missing
 * from the Codex.
 */
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
import { curateTransmission } from '@/lib/codex/curatorClient';
import type { Message } from '@/features/quantum-apothecary/types';

// Generated DB types choke on the deeply-nested codex tables (TS2589).
const supabase = supabaseTyped as any;

interface SqiSessionRow {
  id: string;
  messages: Message[];
  updated_at: string;
}

/** How far back we look for unsynced messages on each sweep. */
const LOOKBACK_DAYS = 14;
/** Cap how many sessions we touch per sweep so we never block boot. */
const MAX_SESSIONS_PER_SWEEP = 30;
/** Cap how many transmissions we replay per sweep so we don't hammer the curator. */
const MAX_REPLAYS_PER_SWEEP = 12;

/** sessionStorage key used to dedupe sweeps within a single tab session. */
const SWEEP_INFLIGHT_KEY = '__codex_sweep_inflight__';

let inflight: Promise<number> | null = null;

/**
 * Replay every assistant message in recent SQI sessions that is still flagged
 * `needs_codex_sync = true`. Resolves with the count of transmissions replayed.
 *
 * Safe to call repeatedly: a single sweep is shared across concurrent callers,
 * and a successful curator response clears the flag so the message is never
 * processed twice.
 */
export async function syncPendingTransmissions(userId: string | null | undefined): Promise<number> {
  if (!userId) return 0;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('sqi_sessions')
        .select('id, messages, updated_at')
        .eq('user_id', userId)
        .gte('updated_at', since)
        .order('updated_at', { ascending: false })
        .limit(MAX_SESSIONS_PER_SWEEP);
      if (error) {
        console.warn('[codex-sync] failed to load sessions:', error);
        return 0;
      }

      const sessions = (data ?? []) as SqiSessionRow[];
      let replays = 0;

      for (const session of sessions) {
        if (replays >= MAX_REPLAYS_PER_SWEEP) break;
        if (!Array.isArray(session.messages)) continue;

        const messages = session.messages;
        let mutated = false;

        for (let i = 0; i < messages.length; i++) {
          if (replays >= MAX_REPLAYS_PER_SWEEP) break;
          const m = messages[i];
          if (!m || m.role !== 'model') continue;
          if (!m.needs_codex_sync) continue;
          const text = (m.text ?? '').trim();
          if (text.length < 20) {
            // Too short — clear flag so we don't keep retrying.
            messages[i] = { ...m, needs_codex_sync: false };
            mutated = true;
            continue;
          }

          // Find the most recent prior user message — that's the prompt that produced this reply.
          let userPrompt: string | undefined;
          for (let j = i - 1; j >= 0; j--) {
            const prev = messages[j];
            if (prev?.role === 'user' && (prev.text ?? '').trim()) {
              userPrompt = prev.text;
              break;
            }
          }

          const studentId = m.codex_student_id ?? undefined;
          const results = await curateTransmission(
            {
              source_type: 'apothecary',
              raw_content: text,
              user_prompt: userPrompt,
              source_chat_id: session.id,
              ...(studentId ? { student_id: studentId } : {}),
            },
            { silent: true },
          );

          replays++;

          // Only clear the flag on a definitive curator response (ok or excluded).
          // Network failures / null results leave the flag set so a later sweep retries.
          const r = results?.[0];
          if (r && (r.ok || r.excluded)) {
            messages[i] = { ...m, needs_codex_sync: false };
            mutated = true;
          }
        }

        if (mutated) {
          const { error: upErr } = await supabase
            .from('sqi_sessions')
            .update({ messages })
            .eq('id', session.id);
          if (upErr) console.warn('[codex-sync] failed to clear flags on session', session.id, upErr);
        }
      }

      if (replays > 0) {
        console.info(`[codex-sync] backfilled ${replays} transmission(s) from ${sessions.length} session(s).`);
      }
      return replays;
    } catch (err) {
      console.warn('[codex-sync] sweep failed:', err);
      return 0;
    } finally {
      // Allow another sweep on the next mount / boot.
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Convenience wrapper: throttles to once per tab-session-load to avoid
 * re-running on every component remount within the same SPA navigation.
 */
export async function syncPendingTransmissionsOnce(userId: string | null | undefined): Promise<void> {
  if (!userId) return;
  try {
    const flagKey = `${SWEEP_INFLIGHT_KEY}:${userId}`;
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, String(Date.now()));
  } catch {
    // sessionStorage unavailable (private mode etc.) — fall through and just sweep.
  }
  await syncPendingTransmissions(userId);
}
