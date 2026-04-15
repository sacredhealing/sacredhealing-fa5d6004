/**
 * useSQIFieldContext
 * ═══════════════════════════════════════════════════════════════
 * Unified SQI field context hook.
 * Reads all live user field data from:
 *   - nadi_scan_results   (biometric rPPG scan)
 *   - ayurveda_profiles   (Prakriti + doshas)
 *   - photonic_sessions   (active light code protocol)
 *   - temple_home_sessions (anchored sacred site)
 *
 * Compiles everything into a single `compiledContext` string that
 * can be prepended to jyotishContext before any SQI message.
 * Also exposes an `updateNadi()` fn to save a new scan to DB.
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// ── Types ────────────────────────────────────────────────────────

export interface SQINadiField {
  activatedNadi: string;
  heartRate: number;
  hrvRmssd: number;
  respiratoryRate: number;
  vagalTone: string;
  pranaCoherence: number;
  autonomicBalance: string;
  scannedAt: string;
}

export interface SQIAyurvedaField {
  prakriti: string;
  vataPct?: number;
  pittaPct?: number;
  kaphaPct?: number;
  agniStrength?: string;
  ojaLevel?: string;
  imbalances?: string[];
}

export interface SQIPhotonicField {
  activeProtocol: string;
  lightCodeActive: boolean;
  frequency: number;
  cellularTarget: string;
}

export interface SQITempleField {
  activeSite: string;
  siteEssence: string;
  intensity: number;
  crystalGridActive: boolean;
  anchoredSince: string;
}

export interface SQIFieldContextResult {
  loading: boolean;
  nadi: SQINadiField | null;
  ayurveda: SQIAyurvedaField | null;
  photonic: SQIPhotonicField | null;
  temple: SQITempleField | null;
  compiledContext: string;
  updateNadi: (data: SQINadiField) => Promise<void>;
  refresh: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────

export function useSQIFieldContext(): SQIFieldContextResult {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nadi, setNadi] = useState<SQINadiField | null>(null);
  const [ayurveda, setAyurveda] = useState<SQIAyurvedaField | null>(null);
  const [photonic, setPhotonic] = useState<SQIPhotonicField | null>(null);
  const [temple, setTemple] = useState<SQITempleField | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    (async () => {
      // Run all 4 queries in parallel — gracefully degrade if table doesn't exist yet
      const [nadiRes, ayurRes, photoRes, templeRes] = await Promise.allSettled([
        (supabase as any)
          .from('nadi_scan_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('ayurveda_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        (supabase as any)
          .from('photonic_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('light_code_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        (supabase as any)
          .from('temple_home_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('anchored_since', { ascending: false })
          .limit(1)
          .single(),
      ]);

      if (cancelled) return;

      // Nadi
      if (nadiRes.status === 'fulfilled' && nadiRes.value.data) {
        const d = nadiRes.value.data as any;
        setNadi({
          activatedNadi: d.activated_nadi,
          heartRate: d.heart_rate,
          hrvRmssd: d.hrv_rmssd,
          respiratoryRate: d.respiratory_rate,
          vagalTone: d.vagal_tone,
          pranaCoherence: d.prana_coherence,
          autonomicBalance: d.autonomic_balance,
          scannedAt: d.created_at,
        });
      } else {
        setNadi(null);
      }

      // Ayurveda
      if (ayurRes.status === 'fulfilled' && ayurRes.value.data) {
        const d = ayurRes.value.data as any;
        setAyurveda({
          prakriti: d.prakriti,
          vataPct: d.vata_percent,
          pittaPct: d.pitta_percent,
          kaphaPct: d.kapha_percent,
          agniStrength: d.agni_strength,
          ojaLevel: d.oja_level,
          imbalances: d.imbalances ?? [],
        });
      } else {
        setAyurveda(null);
      }

      // Photonic
      if (photoRes.status === 'fulfilled' && photoRes.value.data) {
        const d = photoRes.value.data as any;
        setPhotonic({
          activeProtocol: d.active_protocol,
          lightCodeActive: d.light_code_active,
          frequency: d.frequency,
          cellularTarget: d.cellular_target,
        });
      } else {
        setPhotonic(null);
      }

      // Temple
      if (templeRes.status === 'fulfilled' && templeRes.value.data) {
        const d = templeRes.value.data as any;
        setTemple({
          activeSite: d.active_site,
          siteEssence: d.site_essence,
          intensity: d.intensity ?? 50,
          crystalGridActive: d.crystal_grid_active ?? false,
          anchoredSince: d.anchored_since,
        });
      } else {
        setTemple(null);
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [user?.id, tick]);

  // ── Save new nadi scan to DB ──────────────────────────────────
  const updateNadi = useCallback(async (data: SQINadiField) => {
    if (!user?.id) return;
    try {
      await (supabase as any).from('nadi_scan_results').insert({
        user_id: user.id,
        activated_nadi: data.activatedNadi,
        heart_rate: data.heartRate,
        hrv_rmssd: data.hrvRmssd,
        respiratory_rate: data.respiratoryRate,
        vagal_tone: data.vagalTone,
        prana_coherence: data.pranaCoherence,
        autonomic_balance: data.autonomicBalance,
        created_at: data.scannedAt,
      });
      // Update local state immediately
      setNadi(data);
    } catch (e) {
      // Table may not exist yet — silently skip
      console.warn('[useSQIFieldContext] nadi_scan_results insert failed (migration pending?):', e);
    }
  }, [user?.id]);

  // ── Compile context string ────────────────────────────────────
  const compiledContext = buildCompiledContext({ nadi, ayurveda, photonic, temple });

  return { loading, nadi, ayurveda, photonic, temple, compiledContext, updateNadi, refresh };
}

// ── Context compiler ──────────────────────────────────────────────

function buildCompiledContext({
  nadi, ayurveda, photonic, temple,
}: {
  nadi: SQINadiField | null;
  ayurveda: SQIAyurvedaField | null;
  photonic: SQIPhotonicField | null;
  temple: SQITempleField | null;
}): string {
  const parts: string[] = [];

  if (nadi) {
    const scannedDate = nadi.scannedAt
      ? new Date(nadi.scannedAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      : 'recently';
    parts.push(
      `[BIOMETRIC NADI FIELD — latest rPPG snapshot ${scannedDate}]`,
      `Active Nadi: ${nadi.activatedNadi}`,
      `Prana coherence index: ${nadi.pranaCoherence} (field metric; not a literal nadi census)`,
      `Heart Rate: ${nadi.heartRate} BPM`,
      `HRV RMSSD: ${nadi.hrvRmssd} ms`,
      `Vagal Tone: ${nadi.vagalTone}`,
      `Autonomic State: ${nadi.autonomicBalance}`,
      `Respiratory Rate: ${nadi.respiratoryRate} RPM`,
    );
  }

  if (ayurveda) {
    parts.push(
      `[AYURVEDA PRAKRITI — assessed]`,
      `Prakriti: ${ayurveda.prakriti}`,
      ...(ayurveda.vataPct != null ? [`Vata: ${ayurveda.vataPct}% · Pitta: ${ayurveda.pittaPct ?? 0}% · Kapha: ${ayurveda.kaphaPct ?? 0}%`] : []),
      ...(ayurveda.agniStrength ? [`Agni Strength: ${ayurveda.agniStrength}`] : []),
      ...(ayurveda.ojaLevel ? [`Oja Level: ${ayurveda.ojaLevel}`] : []),
      ...(ayurveda.imbalances?.length ? [`Current Imbalances: ${ayurveda.imbalances.join(', ')}`] : []),
    );
  }

  if (photonic?.lightCodeActive) {
    parts.push(
      `[PHOTONIC SESSION ACTIVE]`,
      `Protocol: ${photonic.activeProtocol}`,
      `Frequency: ${photonic.frequency} Hz`,
      `Cellular Target: ${photonic.cellularTarget}`,
    );
  }

  if (temple?.activeSite) {
    parts.push(
      `[TEMPLE FIELD ACTIVE]`,
      `Anchored Site: ${temple.activeSite}`,
      `Site Essence: ${temple.siteEssence}`,
      `Field Intensity: ${temple.intensity}%`,
      ...(temple.crystalGridActive ? ['Crystal Grid: Active'] : []),
    );
  }

  return parts.join('\n');
}
