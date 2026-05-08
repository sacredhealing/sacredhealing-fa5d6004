import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass, Heart, Loader2, Lock, MapPin, Radio, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { computeScalarVector, useVirtualPilgrimage } from '@/hooks/useVirtualPilgrimage';

/** Grounded sites + scalar anchor Hz (Temple registry aligned). Galactic rows use symbolic lat/lng for vector math only. */
const PILGRIMAGE_SITES = [
  { id: 'giza', name: 'Great Pyramid', lat: 29.9792, lng: 31.1342, hz: 432 },
  { id: 'arunachala', name: 'Arunachala', lat: 12.2253, lng: 79.0747, hz: 528 },
  { id: 'babaji', name: "Babaji's Cave", lat: 29.8543, lng: 79.5432, hz: 852 },
  { id: 'machu_picchu', name: 'Machu Picchu', lat: -13.1631, lng: -72.545, hz: 396 },
  { id: 'lourdes', name: 'Lourdes Grotto', lat: 43.0961, lng: -0.0456, hz: 528 },
  { id: 'mansarovar', name: 'Lake Mansarovar', lat: 30.6667, lng: 81.4667, hz: 639 },
  { id: 'zimbabwe', name: 'Great Zimbabwe', lat: -20.2667, lng: 30.9333, hz: 417 },
  { id: 'shasta', name: 'Mount Shasta', lat: 41.4092, lng: -122.1949, hz: 963 },
  { id: 'luxor', name: 'Luxor Temples', lat: 25.6872, lng: 32.6396, hz: 528 },
  { id: 'uluru', name: 'Uluru', lat: -25.3444, lng: 131.0369, hz: 432 },
  { id: 'kailash_13x', name: 'Mount Kailash', lat: 31.0675, lng: 81.3119, hz: 7.83 },
  { id: 'glastonbury', name: 'Glastonbury Tor', lat: 51.1479, lng: -2.7156, hz: 594 },
  { id: 'sedona', name: 'Sedona Vortex', lat: 34.8697, lng: -111.7609, hz: 741 },
  { id: 'titicaca', name: 'Lake Titicaca', lat: -15.9254, lng: -69.3354, hz: 528 },
  { id: 'amritsar', name: 'Golden Temple', lat: 31.62, lng: 74.8765, hz: 528 },
  { id: 'mauritius', name: 'Miracle Room', lat: -20.3484, lng: 57.5522, hz: 888 },
  { id: 'shirdi', name: 'Shirdi Sai Samadhi', lat: 19.7656, lng: 74.4774, hz: 639 },
  { id: 'vrindavan_krsna', name: 'Ancient Vrindavan', lat: 27.5745, lng: 77.6963, hz: 528 },
  { id: 'ayodhya_rama', name: 'Ancient Ayodhya', lat: 26.7922, lng: 82.1998, hz: 528 },
  { id: 'lemuria', name: 'Lemuria (Mu)', lat: -15, lng: -150, hz: 432 },
  { id: 'atlantis', name: 'Atlantis', lat: 35, lng: -28, hz: 528 },
  { id: 'pleiades', name: 'Pleiades', lat: 24.117, lng: -15.35, hz: 963 },
  { id: 'sirius', name: 'Sirius', lat: -16.7161, lng: -96.5667, hz: 936 },
  { id: 'arcturus', name: 'Arcturus', lat: 19.1824, lng: -109.0853, hz: 852 },
  { id: 'lyra', name: 'Lyra / Vega', lat: 38.7837, lng: -77.1167, hz: 528 },
] as const;

function useBinauralSession(carrierHz: number, beatHz: number, enabled: boolean, volumePct: number) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || carrierHz <= 0 || beatHz <= 0) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = Math.min(0.15, (volumePct / 100) * 0.12);

    const merger = ctx.createChannelMerger(2);

    const left = ctx.createOscillator();
    const right = ctx.createOscillator();
    left.type = 'sine';
    right.type = 'sine';
    left.frequency.value = carrierHz;
    right.frequency.value = carrierHz + beatHz;

    left.connect(merger, 0, 0);
    right.connect(merger, 0, 1);
    merger.connect(master);
    master.connect(ctx.destination);

    void ctx.resume();
    left.start();
    right.start();

    return () => {
      left.stop();
      right.stop();
      void ctx.close();
      ctxRef.current = null;
    };
  }, [carrierHz, beatHz, enabled, volumePct]);
}

function SacredGeometryField({
  bearingDeg,
  carrierHz,
}: {
  bearingDeg: number;
  carrierHz: number;
}) {
  const rings = useMemo(() => [1, 2, 3, 4, 5, 6], []);
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(92vw,380px)]">
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.14)_0%,transparent_62%)]"
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [1, 1.04, 1] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <svg viewBox="0 0 220 220" className="relative z-[1] h-full w-full drop-shadow-[0_0_24px_rgba(212,175,55,0.25)]">
        <defs>
          <linearGradient id="vpGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.95} />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.12} />
          </linearGradient>
        </defs>
        <motion.g
          style={{ transformOrigin: '110px 110px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
        >
          {rings.map((i) => (
            <circle
              key={i}
              cx={110}
              cy={110}
              r={18 + i * 13}
              fill="none"
              stroke="url(#vpGold)"
              strokeWidth={0.45}
              opacity={0.35 + i * 0.07}
            />
          ))}
        </motion.g>
        <motion.g
          style={{ transformOrigin: '110px 110px' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 95 + (carrierHz % 17), repeat: Infinity, ease: 'linear' }}
        >
          {[0, 60, 120].map((rot) => (
            <polygon
              key={rot}
              points="110,36 156,168 64,168"
              fill="none"
              stroke="rgba(212,175,55,0.35)"
              strokeWidth={0.5}
              transform={`rotate(${rot + bearingDeg * 0.02} 110 110)`}
            />
          ))}
        </motion.g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-[52%] w-[52%] rounded-full border border-[#D4AF37]/25 bg-[radial-gradient(circle,rgba(255,182,193,0.07)_0%,transparent_70%)]"
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.95, 0.5] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export default function VirtualPilgrimage() {
  const { user } = useAuth();
  const {
    home,
    activation,
    loading,
    gpsLoading,
    detectHome,
    activateSite,
    updateStrength,
    markPracticeComplete,
    releaseLock,
  } = useVirtualPilgrimage();

  const [audioOn, setAudioOn] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  useBinauralSession(
    activation?.scalar.carrierHz ?? 0,
    activation?.scalar.binauralHz ?? 4,
    audioOn && !!activation,
    sliderStrength,
  );

  const handleSealHome = async () => {
    const c = await detectHome();
    if (!c) toast.error('GPS unavailable — allow location or try again.');
    else toast.success('Home anchor sealed.');
  };

  const handleActivate = async (site: (typeof PILGRIMAGE_SITES)[number]) => {
    if (!home || !user) return;
    setActivatingId(site.id);
    try {
      await activateSite({
        siteId: site.id,
        siteName: site.name,
        siteLat: site.lat,
        siteLng: site.lng,
        siteHz: site.hz,
      });
      toast.success(`⟁ Locked — ${site.name}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Activation failed');
    } finally {
      setActivatingId(null);
    }
  };

  const strengthCommit = useCallback(
    (v: number) => {
      void updateStrength(v);
    },
    [updateStrength],
  );

  const [sliderStrength, setSliderStrength] = useState(activation?.strength ?? 20);
  useEffect(() => {
    if (activation?.strength != null) setSliderStrength(activation.strength);
  }, [activation?.strength]);

  const previewScalar = useMemo(() => {
    if (!home) return null;
    return computeScalarVector(home, PILGRIMAGE_SITES[0].lat, PILGRIMAGE_SITES[0].lng, PILGRIMAGE_SITES[0].hz);
  }, [home]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-[#050505] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" aria-hidden />
        <p className="text-sm text-white/50">Opening pilgrimage field…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#050505] px-4 py-16 text-center text-white">
        <Sparkles className="mx-auto mb-4 h-10 w-10 text-[#D4AF37]" aria-hidden />
        <h1 className="text-xl font-black uppercase tracking-[0.2em] text-[#D4AF37]/90">Virtual Pilgrimage</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
          Sign in to seal your home GPS, lock a sacred site, and keep the scalar bridge alive on the server — even when your device is off.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-flex rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/15 px-8 py-3 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-4">
          <Link to="/temple-home" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]/80 transition hover:text-[#D4AF37]">
            <ArrowLeft size={16} aria-hidden />
            Temple
          </Link>
          <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#D4AF37]/60">Virtual Pilgrimage</span>
          <span className="w-14" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pt-6">
        {/* ── State A: GPS home ── */}
        {!home && (
          <section className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 text-center">
            <Compass className="mx-auto mb-4 h-12 w-12 text-[#D4AF37]" aria-hidden />
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-[#D4AF37]">Seal home GPS</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Your latitude & longitude become the anchor for bearing, distance, carrier Hz, and Schumann lock. Stored on your profile and device.
            </p>
            <button
              type="button"
              disabled={gpsLoading}
              onClick={() => void handleSealHome()}
              className="mt-6 w-full rounded-full bg-[#D4AF37]/20 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#D4AF37] ring-1 ring-[#D4AF37]/40 transition hover:bg-[#D4AF37]/30 disabled:opacity-40"
            >
              {gpsLoading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Locating…
                </span>
              ) : (
                'Detect my location'
              )}
            </button>
          </section>
        )}

        {/* ── State B: Pick site ── */}
        {home && !activation && (
          <section>
            <div className="mb-4 rounded-[22px] border border-[#D4AF37]/25 bg-[#D4AF37]/[0.06] px-4 py-3">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]/70">Home anchor</p>
                  <p className="truncate text-sm text-white/85">{home.label ?? `${home.lat.toFixed(4)}°, ${home.lng.toFixed(4)}°`}</p>
                  {previewScalar && (
                    <p className="mt-1 text-[10px] text-white/35">
                      Sample vector (Giza ref): {previewScalar.bearingDir} · {previewScalar.distanceKm} km · carrier {previewScalar.carrierHz} Hz
                    </p>
                  )}
                </div>
              </div>
              <button type="button" className="mt-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]/50 hover:text-[#D4AF37]" onClick={() => void handleSealHome()}>
                Re-detect GPS
              </button>
            </div>

            <h2 className="mb-3 text-[11px] font-black uppercase tracking-[0.25em] text-white/40">Choose sacred lock</h2>
            <div className="grid max-h-[52vh] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:max-h-none">
              {PILGRIMAGE_SITES.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  disabled={activatingId !== null}
                  onClick={() => void handleActivate(site)}
                  className="flex items-center justify-between rounded-[18px] border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-left transition hover:border-[#D4AF37]/35 hover:bg-[#D4AF37]/[0.05] disabled:opacity-50"
                >
                  <span className="font-bold text-white/90">{site.name}</span>
                  <span className="text-[10px] tabular-nums text-[#D4AF37]/60">{site.hz} Hz</span>
                  {activatingId === site.id && <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" aria-hidden />}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── State C: Locked active ── */}
        {home && activation && (
          <section className="space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
                <Lock size={12} aria-hidden />
                Field locked
              </div>
              <h2 className="text-xl font-black text-white/95">{activation.siteName}</h2>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">
                Day {Math.min(activation.daysActive, 40)} / 40 · Pulse {activation.pulseCount}
              </p>
            </div>

            <SacredGeometryField bearingDeg={activation.scalar.bearingDeg} carrierHz={activation.scalar.carrierHz} />

            {/* Scalar wave readout */}
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]/65">Scalar bridge</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/35">Carrier</p>
                  <p className="font-mono text-[#D4AF37]">{activation.scalar.carrierHz} Hz</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/35">Binaural beat</p>
                  <p className="font-mono text-[#D4AF37]">{activation.scalar.binauralHz} Hz</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/35">Bearing</p>
                  <p className="font-mono text-white/85">
                    {activation.scalar.bearingDeg}° {activation.scalar.bearingDir}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/35">Schumann lock</p>
                  <p className="font-mono text-white/85">{activation.scalar.schumannHz} Hz</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] uppercase tracking-wider text-white/35">Great-circle distance</p>
                  <p className="font-mono text-white/85">{activation.scalar.distanceKm} km</p>
                </div>
              </div>

              {/* Animated scalar ribbon */}
              <motion.div
                className="mt-4 h-12 overflow-hidden rounded-xl border border-[#D4AF37]/15 bg-[linear-gradient(90deg,transparent,rgba(212,175,55,0.15),transparent)]"
                aria-hidden
              >
                <motion.div
                  className="h-full w-[200%] bg-[repeating-linear-gradient(90deg,rgba(212,175,55,0.35)_0px,rgba(212,175,55,0.35)_2px,transparent_2px,transparent_14px)]"
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ duration: 12 / Math.max(activation.scalar.carrierHz / 111, 0.25), repeat: Infinity, ease: 'linear' }}
                />
              </motion.div>
            </div>

            {/* Prema pulse strip */}
            <div className="relative overflow-hidden rounded-[22px] border border-pink-300/10 bg-gradient-to-r from-pink-500/[0.07] via-[#D4AF37]/[0.08] to-pink-500/[0.07] px-4 py-4">
              <motion.div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,182,193,0.12)_0%,transparent_65%)]"
                animate={{ opacity: [0.25, 0.85, 0.25], scale: [1, 1.15, 1] }}
                transition={{ duration: 4.2, repeat: Infinity }}
              />
              <div className="relative flex items-center gap-3">
                <Heart className="h-8 w-8 shrink-0 text-pink-300/80" aria-hidden />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-200/70">Prema pulse</p>
                  <p className="text-xs leading-snug text-white/55">
                    Heart-coherence carrier threading your home anchor ↔ sacred lock. Server pulses hourly via Railway.
                  </p>
                </div>
              </div>
            </div>

            {/* Strength + audio */}
            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.02] p-5">
              <label htmlFor="vp-strength" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Transmission strength
              </label>
              <input
                id="vp-strength"
                type="range"
                min={5}
                max={100}
                step={1}
                value={sliderStrength}
                className="mt-3 w-full accent-[#D4AF37]"
                onChange={(e) => setSliderStrength(Number(e.target.value))}
                onPointerUp={(e) => strengthCommit(Number(e.currentTarget.value))}
                onKeyUp={(e) => strengthCommit(Number((e.currentTarget as HTMLInputElement).value))}
              />
              <div className="mt-1 flex justify-between text-[10px] tabular-nums text-white/35">
                <span>5%</span>
                <span className="text-[#D4AF37]">{sliderStrength}%</span>
                <span>100%</span>
              </div>

              <button
                type="button"
                onClick={() => setAudioOn((v) => !v)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.08] py-3 text-[11px] font-black uppercase tracking-[0.15em] text-white/70 transition hover:border-[#D4AF37]/35 hover:text-[#D4AF37]"
              >
                {audioOn ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
                {audioOn ? 'Stop binaural carrier' : 'Play binaural scalar (headphones)'}
              </button>
              <p className="mt-2 text-center text-[9px] text-white/30">
                Stereo headphones recommended · carrier {activation.scalar.carrierHz.toFixed(2)} Hz · beat {activation.scalar.binauralHz} Hz
              </p>
            </div>

            {/* Telemetry */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-white/40">
              <span className="inline-flex items-center gap-1">
                <Radio size={14} className="text-[#D4AF37]/60" aria-hidden />
                Last pulse: {activation.lastPulseAt ? new Date(activation.lastPulseAt).toLocaleString() : 'pending worker'}
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="flex-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-[#D4AF37]"
                onClick={() => void markPracticeComplete()}
              >
                Mark practice today
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-white/[0.1] py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white/45"
                onClick={() => {
                  if (!window.confirm('Release this pilgrimage lock early? The server row will close.')) return;
                  void releaseLock();
                  toast.message('Lock released');
                }}
              >
                Release lock
              </button>
            </div>

            <p className="text-center text-[10px] leading-relaxed text-white/30">
              Locked coordinates persist in Supabase. Railway cron bumps pulses every hour so the field stays registered while devices sleep.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
