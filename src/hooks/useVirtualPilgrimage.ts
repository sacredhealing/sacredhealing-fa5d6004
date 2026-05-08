/**
 * Virtual Pilgrimage — home GPS, scalar vector, Supabase persistence.
 * Railway: scalar-pulse-worker pulses `virtual_pilgrimage_activations` hourly.
 *
 * Handles:
 * 1. GPS → localStorage + `profiles.pilgrimage_home_*` (filtered by `user_id`, not `id`)
 * 2. `computeScalarVector` from home ↔ site coordinates + site Hz
 * 3. `activateSite` → inserts active row; clears any prior active row for this user first
 * 4. Loads active pilgrimage on mount so UI restores after reload / device off
 * 5. `releaseLock`, `updateStrength`, `markPracticeComplete` (+ local `practiceLog` state)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HomeCoords {
  lat: number;
  lng: number;
  label?: string;
}

export interface ScalarVector {
  carrierHz: number;
  binauralHz: number;
  bearingDeg: number;
  distanceKm: number;
  schumannHz: number;
  bearingDir: string;
}

export interface PilgrimageActivation {
  id: string;
  siteId: string;
  siteName: string;
  home: HomeCoords;
  scalar: ScalarVector;
  strength: number;
  daysActive: number;
  pulseCount: number;
  lastPulseAt: string | null;
  activatedAt: string;
  isActive: boolean;
  practiceLog: string[];
}

const SCHUMANN = [7.83, 14.3, 20.8, 27.3, 33.8];
const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

function greatCircle(la1: number, lo1: number, la2: number, lo2: number): number {
  const R = 6371;
  const r = Math.PI / 180;
  const a =
    Math.sin(((la2 - la1) * r) / 2) ** 2 +
    Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(la1: number, lo1: number, la2: number, lo2: number): number {
  const r = Math.PI / 180;
  const dL = (lo2 - lo1) * r;
  const y = Math.sin(dL) * Math.cos(la2 * r);
  const x =
    Math.cos(la1 * r) * Math.sin(la2 * r) -
    Math.sin(la1 * r) * Math.cos(la2 * r) * Math.cos(dL);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function computeScalarVector(
  home: HomeCoords,
  siteLat: number,
  siteLng: number,
  siteHz: number,
): ScalarVector {
  const dist = greatCircle(home.lat, home.lng, siteLat, siteLng);
  const bear = bearing(home.lat, home.lng, siteLat, siteLng);
  const distMod = (dist % 1000) / 1000;
  const carrier = siteHz > 0 ? siteHz + distMod * 7.83 : 7.83;
  const binaural = +(4 + (bear / 360) * 36).toFixed(2);
  const schumann = SCHUMANN.reduce((a, b) =>
    Math.abs(b - carrier) < Math.abs(a - carrier) ? b : a,
  );
  return {
    carrierHz: +carrier.toFixed(3),
    binauralHz: binaural,
    bearingDeg: Math.round(bear),
    distanceKm: Math.round(dist),
    schumannHz: schumann,
    bearingDir: DIRS[Math.round(bear / 45) % 8],
  };
}

function parsePracticeLog(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

export function useVirtualPilgrimage() {
  const { user } = useAuth();
  const [home, setHome] = useState<HomeCoords | null>(null);
  const [activation, setActivation] = useState<PilgrimageActivation | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('pilgrimage_home_lat, pilgrimage_home_lng, pilgrimage_home_label')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cancelled && profile?.pilgrimage_home_lat != null && profile?.pilgrimage_home_lng != null) {
          setHome({
            lat: Number(profile.pilgrimage_home_lat),
            lng: Number(profile.pilgrimage_home_lng),
            label: profile.pilgrimage_home_label || undefined,
          });
        }
      }

      const savedLat = parseFloat(localStorage.getItem('sqi_home_lat') || '');
      const savedLng = parseFloat(localStorage.getItem('sqi_home_lng') || '');
      if (!cancelled && !Number.isNaN(savedLat) && !Number.isNaN(savedLng)) {
        setHome((prev) => prev || { lat: savedLat, lng: savedLng });
      }

      if (user) {
        const { data } = await supabase
          .from('virtual_pilgrimage_activations')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!cancelled && data) {
          const bear = Number(data.bearing_deg);
          setActivation({
            id: data.id,
            siteId: data.site_id,
            siteName: data.site_name,
            home: { lat: data.home_lat, lng: data.home_lng, label: data.home_label ?? undefined },
            scalar: {
              carrierHz: data.carrier_hz,
              binauralHz: data.binaural_hz,
              bearingDeg: bear,
              distanceKm: data.distance_km,
              schumannHz: data.schumann_lock_hz,
              bearingDir: DIRS[Math.round(bear / 45) % 8],
            },
            strength: data.strength ?? 20,
            daysActive: data.days_active ?? 0,
            pulseCount: data.pulse_count ?? 0,
            lastPulseAt: data.last_pulse_at,
            activatedAt: data.activated_at,
            isActive: data.is_active,
            practiceLog: parsePracticeLog(data.practice_log),
          });
        }
      }

      if (!cancelled) setLoading(false);
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const detectHome = useCallback(async (): Promise<HomeCoords | null> => {
    setGpsLoading(true);
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setGpsLoading(false);
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords: HomeCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            label: `${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°`,
          };
          try {
            localStorage.setItem('sqi_home_lat', String(coords.lat));
            localStorage.setItem('sqi_home_lng', String(coords.lng));
          } catch {
            /* ignore */
          }
          if (user) {
            await supabase
              .from('profiles')
              .update({
                pilgrimage_home_lat: coords.lat,
                pilgrimage_home_lng: coords.lng,
                pilgrimage_home_label: coords.label,
              })
              .eq('user_id', user.id);
          }
          setHome(coords);
          setGpsLoading(false);
          resolve(coords);
        },
        () => {
          setGpsLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }, [user]);

  const activateSite = useCallback(
    async (params: {
      siteId: string;
      siteName: string;
      siteLat: number;
      siteLng: number;
      siteHz: number;
      strength?: number;
    }) => {
      if (!home || !user) throw new Error('No home or user');
      const scalar = computeScalarVector(home, params.siteLat, params.siteLng, params.siteHz);

      await supabase
        .from('virtual_pilgrimage_activations')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      const { data, error } = await supabase
        .from('virtual_pilgrimage_activations')
        .insert({
          user_id: user.id,
          site_id: params.siteId,
          site_name: params.siteName,
          home_lat: home.lat,
          home_lng: home.lng,
          home_label: home.label,
          carrier_hz: scalar.carrierHz,
          binaural_hz: scalar.binauralHz,
          bearing_deg: scalar.bearingDeg,
          distance_km: scalar.distanceKm,
          schumann_lock_hz: scalar.schumannHz,
          strength: params.strength ?? 20,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setActivation({
        id: data.id,
        siteId: data.site_id,
        siteName: data.site_name,
        home,
        scalar,
        strength: data.strength,
        daysActive: 0,
        pulseCount: 0,
        lastPulseAt: null,
        activatedAt: data.activated_at,
        isActive: true,
        practiceLog: [],
      });
      return data;
    },
    [home, user],
  );

  const updateStrength = useCallback(async (strength: number) => {
    if (!activation?.id) return;
    await supabase.from('virtual_pilgrimage_activations').update({ strength }).eq('id', activation.id);
    setActivation((prev) => (prev ? { ...prev, strength } : null));
  }, [activation]);

  const markPracticeComplete = useCallback(async () => {
    if (!activation?.id) return;
    const today = new Date().toISOString().split('T')[0];
    if (activation.practiceLog.includes(today)) return;
    const log = [...activation.practiceLog, today];
    await supabase.from('virtual_pilgrimage_activations').update({ practice_log: log }).eq('id', activation.id);
    setActivation((prev) => (prev ? { ...prev, practiceLog: log } : null));
  }, [activation]);

  const releaseLock = useCallback(async () => {
    if (!activation?.id) return;
    await supabase
      .from('virtual_pilgrimage_activations')
      .update({
        is_active: false,
        released_early: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', activation.id);
    setActivation(null);
  }, [activation]);

  return {
    home,
    activation,
    loading,
    gpsLoading,
    detectHome,
    activateSite,
    updateStrength,
    markPracticeComplete,
    releaseLock,
  };
}
