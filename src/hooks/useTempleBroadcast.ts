import { useEffect, useRef } from 'react';

/**
 * useTempleBroadcast
 * ------------------
 * Generates an inaudible/near-inaudible carrier tuned to the active sacred site,
 * and keeps it alive when the screen is off / app is backgrounded by also playing
 * a silent looping HTMLAudioElement (the only reliable way to keep Web Audio
 * running in background on iOS / mobile Safari / PWA).
 *
 * The user perceives only the visual transformation — the carrier is set very low
 * (default 0.3% gain). The intention here is *coherence*, not loudness.
 *
 * Stops automatically when `active` becomes false or the component unmounts.
 */

// Site → carrier frequency map (Hz). 7.83 = Schumann resonance.
const SITE_FREQUENCY: Record<string, number> = {
  giza: 432,
  babaji: 7.83,
  arunachala: 136.1,        // OM frequency
  samadhi: 7.83,
  machu_picchu: 528,        // Solar / DNA repair
  lourdes: 396,
  mansarovar: 417,
  zimbabwe: 285,
  shasta: 741,
  luxor: 528,
  uluru: 174,
  kailash_13x: 7.83,         // Schumann — the canonical "Kailash radiates at 7.83Hz" claim
  glastonbury: 639,
  sedona: 852,
  titicaca: 528,
  amritsar: 432,
  mauritius: 963,
  shirdi: 396,
  vrindavan_krsna: 639,
  ayodhya_rama: 528,
  lemuria: 174,
  atlantis: 444,
  pleiades: 963,
  sirius: 852,
  arcturus: 741,
  lyra: 432,
};

const SILENT_LOOP_DATA_URI =
  // 0.5s of silent WAV @ 8kHz mono — enough to keep mobile audio session alive on loop
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAESsAAACABAAZGF0YQAAAAA=';

interface Options {
  /** When true, broadcast is on. */
  active: boolean;
  /** Sacred site id. */
  siteId: string;
  /** 0–100 user-set intensity (we map this to a tiny gain). */
  intensity: number;
}

export function useTempleBroadcast({ active, siteId, intensity }: Options): void {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const silentRef = useRef<HTMLAudioElement | null>(null);

  // Start / stop based on `active`
  useEffect(() => {
    if (!active) {
      stop();
      return;
    }
    void start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // React to site / intensity changes while active (no restart, just retune)
  useEffect(() => {
    if (!active) return;
    const osc = oscRef.current;
    const gain = gainRef.current;
    if (osc && gain && ctxRef.current) {
      const target = SITE_FREQUENCY[siteId] ?? 432;
      try {
        osc.frequency.setTargetAtTime(target, ctxRef.current.currentTime, 0.4);
        gain.gain.setTargetAtTime(intensityToGain(intensity), ctxRef.current.currentTime, 0.4);
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, intensity, active]);

  async function start() {
    if (typeof window === 'undefined') return;
    try {
      // 1. Silent looping HTMLAudioElement keeps the OS audio session alive in background.
      if (!silentRef.current) {
        const a = new Audio(SILENT_LOOP_DATA_URI);
        a.loop = true;
        a.volume = 0.001;
        a.setAttribute('playsinline', 'true');
        a.preload = 'auto';
        silentRef.current = a;
      }
      try {
        await silentRef.current.play();
      } catch {
        /* user-gesture not yet provided; the browser will block until next interaction */
      }

      // 2. Web Audio carrier
      const Ctx = window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new Ctx();
      }
      if (ctxRef.current.state === 'suspended') {
        try { await ctxRef.current.resume(); } catch { /* ignore */ }
      }
      const ctx = ctxRef.current;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = SITE_FREQUENCY[siteId] ?? 432;
      gain.gain.value = intensityToGain(intensity);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    } catch {
      /* ignore */
    }
  }

  function stop() {
    try { oscRef.current?.stop(); } catch { /* ignore */ }
    try { oscRef.current?.disconnect(); } catch { /* ignore */ }
    try { gainRef.current?.disconnect(); } catch { /* ignore */ }
    oscRef.current = null;
    gainRef.current = null;
    if (silentRef.current) {
      try { silentRef.current.pause(); } catch { /* ignore */ }
      silentRef.current.src = '';
      silentRef.current = null;
    }
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      try { void ctxRef.current.close(); } catch { /* ignore */ }
    }
    ctxRef.current = null;
  }
}

function intensityToGain(intensity: number): number {
  // 0–100 → 0 – 0.005 (extremely subtle; Kailash 13X / Mauritius at full intensity ~ 0.5%)
  const clamped = Math.max(0, Math.min(100, intensity));
  return (clamped / 100) * 0.005;
}
