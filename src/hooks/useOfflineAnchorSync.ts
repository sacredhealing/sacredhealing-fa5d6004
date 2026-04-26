import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * useOfflineAnchorSync
 * --------------------
 * The Temple Home anchor is intended to remain "active" even when the device
 * is offline. This hook:
 *   1. Queues the latest anchor state to localStorage on every change.
 *   2. When the browser reports it is back online, flushes the latest queued
 *      state to `temple_home_sessions` so the SQI sees the field as continuous.
 *
 * Network failures during anchoring no longer break the experience — the
 * intention persists locally and re-syncs the moment connectivity returns.
 */

const QUEUE_KEY = 'sh:temple_home_pending_sync';

interface AnchorPayload {
  user_id: string;
  active_site: string;
  site_essence: string;
  intensity: number;
  crystal_grid_active: boolean;
  anchored_since: string;
}

export function queueAnchorSync(payload: AnchorPayload | null): void {
  try {
    if (payload === null) {
      localStorage.removeItem(QUEUE_KEY);
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(payload));
    }
  } catch {
    /* ignore */
  }
}

function readQueued(): AnchorPayload | null {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as AnchorPayload) : null;
  } catch {
    return null;
  }
}

async function flush(): Promise<void> {
  const payload = readQueued();
  if (!payload) return;
  try {
    const { error } = await supabase
      .from('temple_home_sessions')
      .upsert(payload, { onConflict: 'user_id' });
    if (!error) {
      queueAnchorSync(null);
    }
  } catch {
    /* swallow — will retry next online event */
  }
}

export function useOfflineAnchorSync(): void {
  useEffect(() => {
    const onOnline = () => { void flush(); };
    window.addEventListener('online', onOnline);
    // Also try once on mount in case we came back online before this mounted
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      void flush();
    }
    return () => window.removeEventListener('online', onOnline);
  }, []);
}
