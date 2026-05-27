/**
 * useQuantumSyncState — Cross-Device Quantum Apothecary Sync
 * SQI 2050 Akasha-Neural Archive: bridges localStorage (instant render)
 * ↔ Supabase user_quantum_sync (persistent, cross-device).
 * One realtime channel keeps all phones/tablets/computers in sync automatically.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ScanSnapshotPayload } from '@/features/quantum-apothecary/apothecarySqiUi';

// ── Keep using the same LS keys so offline fallback keeps working ──
const LS_LIBRARY_UNLOCKED = 'sqi_library_unlocked';
const LS_LAST_SCAN        = 'sqi_last_scan';
const LS_SCAN_SNAPSHOT    = 'sqi_scan_snapshot';
const LS_TOP33            = 'sqi_top33_matches';
const LS_TOP33_TS         = 'sqi_top33_ts';
const LS_PALM             = 'sh:palmScan';
const LS_REMEDIES         = 'sh:dailyRemedies';

function safeReadLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}

function safeWriteLS(key: string, value: unknown) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch { /* quota — ignore */ }
}

export interface DailyRemedy {
  id: string;
  mantra: string;
  mantraName: string;
  shadowVow: string;
  addedAt: string;
}

export interface PalmScanResult {
  scannedAt: string;
  heartLineLeak: boolean;
  vataPittaKapha: { vata: number; pitta: number; kapha: number };
  palmArchetype?: 'Spiritual Mastery' | 'Karmic Debt' | null;
  seed?: string;
}

interface QSState {
  libraryUnlocked: boolean;
  lastScanAt: number | null;
  scanSnapshot: ScanSnapshotPayload | null;
  top33Matches: unknown[] | null;
  top33MatchesTs: number | null;
  palmScan: PalmScanResult | null;
  dailyRemedies: DailyRemedy[];
  ready: boolean;
}

function buildInitialState(): QSState {
  const lastScanRaw = localStorage.getItem(LS_LAST_SCAN);
  const lastScanAt  = lastScanRaw ? (parseInt(lastScanRaw, 10) || null) : null;
  const top33TsRaw  = localStorage.getItem(LS_TOP33_TS);
  const top33MatchesTs = top33TsRaw ? (parseInt(top33TsRaw, 10) || null) : null;
  return {
    libraryUnlocked: localStorage.getItem(LS_LIBRARY_UNLOCKED) === '1',
    lastScanAt,
    scanSnapshot:   safeReadLS<ScanSnapshotPayload | null>(LS_SCAN_SNAPSHOT, null),
    top33Matches:   safeReadLS<unknown[] | null>(LS_TOP33, null),
    top33MatchesTs,
    palmScan:       safeReadLS<PalmScanResult | null>(LS_PALM, null),
    dailyRemedies:  safeReadLS<DailyRemedy[]>(LS_REMEDIES, []),
    ready: false,
  };
}

function applyRemoteRow(s: QSState, data: Record<string, unknown>): QSState {
  const next = { ...s };
  if (typeof data.library_unlocked === 'boolean') next.libraryUnlocked = data.library_unlocked;
  if (data.last_scan_at)       next.lastScanAt      = new Date(data.last_scan_at as string).getTime();
  if (data.scan_snapshot)      next.scanSnapshot    = data.scan_snapshot as ScanSnapshotPayload;
  if (Array.isArray(data.top33_matches)) next.top33Matches = data.top33_matches;
  if (data.top33_matches_ts)   next.top33MatchesTs  = new Date(data.top33_matches_ts as string).getTime();
  if (data.palm_scan)          next.palmScan        = data.palm_scan as PalmScanResult;
  if (Array.isArray(data.daily_remedies)) next.dailyRemedies = data.daily_remedies as DailyRemedy[];
  return next;
}

function writeStateToLS(s: Partial<QSState>) {
  if ('libraryUnlocked' in s) localStorage.setItem(LS_LIBRARY_UNLOCKED, s.libraryUnlocked ? '1' : '0');
  if ('lastScanAt'      in s) safeWriteLS(LS_LAST_SCAN,       s.lastScanAt ?? null);
  if ('scanSnapshot'    in s) safeWriteLS(LS_SCAN_SNAPSHOT,   s.scanSnapshot ?? null);
  if ('top33Matches'    in s) safeWriteLS(LS_TOP33,           s.top33Matches ?? null);
  if ('top33MatchesTs'  in s) safeWriteLS(LS_TOP33_TS,        s.top33MatchesTs ?? null);
  if ('palmScan'        in s) safeWriteLS(LS_PALM,            s.palmScan ?? null);
  if ('dailyRemedies'   in s) safeWriteLS(LS_REMEDIES,        s.dailyRemedies ?? []);
}

type SupabaseRow = {
  library_unlocked?: boolean;
  last_scan_at?: string | null;
  scan_snapshot?: unknown;
  top33_matches?: unknown;
  top33_matches_ts?: string | null;
  palm_scan?: unknown;
  daily_remedies?: unknown;
};

function stateToRow(patch: Partial<QSState>): SupabaseRow {
  const row: SupabaseRow = {};
  if ('libraryUnlocked' in patch) row.library_unlocked = patch.libraryUnlocked;
  if ('lastScanAt'      in patch) row.last_scan_at     = patch.lastScanAt ? new Date(patch.lastScanAt).toISOString() : null;
  if ('scanSnapshot'    in patch) row.scan_snapshot    = patch.scanSnapshot;
  if ('top33Matches'    in patch) row.top33_matches    = patch.top33Matches;
  if ('top33MatchesTs'  in patch) row.top33_matches_ts = patch.top33MatchesTs ? new Date(patch.top33MatchesTs).toISOString() : null;
  if ('palmScan'        in patch) row.palm_scan        = patch.palmScan;
  if ('dailyRemedies'   in patch) row.daily_remedies   = patch.dailyRemedies;
  return row;
}

export function useQuantumSyncState() {
  const { user } = useAuth();
  const [state, setState] = useState<QSState>(buildInitialState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounced Supabase write ──
  const persistPatch = useCallback((patch: Partial<QSState>, uid: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const row = { user_id: uid, updated_at: new Date().toISOString(), ...stateToRow(patch) };
      await supabase.from('user_quantum_sync').upsert(row, { onConflict: 'user_id' });
    }, 700);
  }, []);

  // ── Load from Supabase on mount ──
  useEffect(() => {
    if (!user?.id) { setState(s => ({ ...s, ready: true })); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('user_quantum_sync')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          const next = applyRemoteRow({ ...buildInitialState(), ready: true }, data as Record<string, unknown>);
          writeStateToLS(next);
          setState(next);
        } else {
          setState(s => ({ ...s, ready: true }));
        }
      } catch {
        setState(s => ({ ...s, ready: true }));
      }
    })();
  }, [user?.id]);

  // ── Realtime subscription ──
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`qs-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_quantum_sync', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const data = (payload.new || {}) as Record<string, unknown>;
          setState(s => {
            const next = applyRemoteRow(s, data);
            writeStateToLS(next);
            return next;
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  // ── Typed setters ──
  const setLibraryUnlocked = useCallback((v: boolean) => {
    localStorage.setItem(LS_LIBRARY_UNLOCKED, v ? '1' : '0');
    setState(s => ({ ...s, libraryUnlocked: v }));
    if (user?.id) persistPatch({ libraryUnlocked: v }, user.id);
  }, [user?.id, persistPatch]);

  const setLastScanAt = useCallback((v: number) => {
    localStorage.setItem(LS_LAST_SCAN, String(v));
    setState(s => ({ ...s, lastScanAt: v }));
    if (user?.id) persistPatch({ lastScanAt: v }, user.id);
  }, [user?.id, persistPatch]);

  const setScanSnapshot = useCallback((v: ScanSnapshotPayload | null) => {
    safeWriteLS(LS_SCAN_SNAPSHOT, v);
    setState(s => ({ ...s, scanSnapshot: v }));
    if (user?.id) persistPatch({ scanSnapshot: v }, user.id);
  }, [user?.id, persistPatch]);

  const setTop33Matches = useCallback((matches: unknown[], ts: number) => {
    safeWriteLS(LS_TOP33, matches);
    localStorage.setItem(LS_TOP33_TS, String(ts));
    setState(s => ({ ...s, top33Matches: matches, top33MatchesTs: ts }));
    if (user?.id) persistPatch({ top33Matches: matches, top33MatchesTs: ts }, user.id);
  }, [user?.id, persistPatch]);

  const setPalmScan = useCallback((v: PalmScanResult | null) => {
    safeWriteLS(LS_PALM, v);
    setState(s => ({ ...s, palmScan: v }));
    if (user?.id) persistPatch({ palmScan: v }, user.id);
  }, [user?.id, persistPatch]);

  const addDailyRemedy = useCallback((remedy: Omit<DailyRemedy, 'id' | 'addedAt'>) => {
    setState(s => {
      if (s.dailyRemedies.find(r => r.mantra === remedy.mantra && r.mantraName === remedy.mantraName)) return s;
      const entry: DailyRemedy = {
        ...remedy,
        id: `remedy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        addedAt: new Date().toISOString(),
      };
      const next = [...s.dailyRemedies, entry];
      safeWriteLS(LS_REMEDIES, next);
      if (user?.id) persistPatch({ dailyRemedies: next }, user.id);
      return { ...s, dailyRemedies: next };
    });
  }, [user?.id, persistPatch]);

  return { ...state, setLibraryUnlocked, setLastScanAt, setScanSnapshot, setTop33Matches, setPalmScan, addDailyRemedy };
}
