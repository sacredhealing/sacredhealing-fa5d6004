// Voice-only biofield scan — spectral + amplitude features from the microphone.
// No camera, no rPPG, no FaceMesh.
// Timing uses wall-clock (Date.now) so background tabs / timer throttling cannot
// burst-complete or leave the countdown stuck; completion runs at most once.
import { useState, useRef, useCallback, useEffect, type MouseEvent } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const SCAN_SECONDS = 22;

export interface VoiceBiofieldPriorityArea {
  name: string;
  score: number;
}

export interface VoiceBiofieldStrength {
  name: string;
}

export interface VoiceBiofieldResult {
  overallCoherence: number;
  nadiReading: string;
  dominantDosha: string;
  priorityAreas: VoiceBiofieldPriorityArea[];
  topStrengths: VoiceBiofieldStrength[];
  emotionalField: string;
  organField: string;
}

interface VoiceBiofieldScannerProps {
  userName?: string;
  jyotishContext?: {
    mahadasha?: string;
    nakshatra?: string;
    primaryDosha?: string;
  };
  onScanComplete?: (result: VoiceBiofieldResult) => void;
  /** Wall-clock scan capture duration (default 22). Quantum Apothecary passes 10. */
  scanDurationSeconds?: number;
  /** Optional radial countdown ring during scanning */
  showProgressRing?: boolean;
  /** When set and Date.now() < disableUntilMs, idle state shows cooldown instead of CTA */
  disableUntilMs?: number | null;
}

function analyzeVoiceBuffer(samples: {
  rmsSeries: number[];
  centroidSeries: number[];
  zcrSeries: number[];
}): VoiceBiofieldResult {
  const { rmsSeries, centroidSeries, zcrSeries } = samples;
  const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const std = (arr: number[], m: number) =>
    arr.length ? Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length) : 0;

  const rmsMean = mean(rmsSeries);
  const rmsStd = std(rmsSeries, rmsMean);
  const centMean = mean(centroidSeries);
  const centStd = std(centroidSeries, centMean);
  const zcrMean = mean(zcrSeries);

  const stability = Math.max(0, Math.min(1, 1 - Math.min(1, rmsStd * 4)));
  const tonalStability = Math.max(0, Math.min(1, 1 - Math.min(1, centStd / 1200)));
  const calmness = Math.max(0, Math.min(1, 1 - Math.min(1, zcrMean * 2)));

  const heat = Math.max(0, Math.min(1, (centMean - 800) / 2500 + rmsStd * 2));

  let dominantDosha = 'Balanced (Tri-doshic voice)';
  if (heat > 0.55 && centStd > 180) dominantDosha = 'Pitta-leaning (bright / reactive spectrum)';
  else if (rmsStd > 0.12 || centStd > 220) dominantDosha = 'Vata-leaning (mobile / variable spectrum)';
  else if (stability > 0.65 && calmness > 0.55 && heat < 0.42) dominantDosha = 'Kapha-leaning (steady / grounded spectrum)';

  let nadiReading = 'Sushumna — voice field balanced';
  if (dominantDosha.startsWith('Pitta')) nadiReading = 'Pingala — solar / expressive vocal load';
  else if (dominantDosha.startsWith('Vata')) nadiReading = 'Ida — lunar / variable vocal channel';
  else if (dominantDosha.startsWith('Kapha')) nadiReading = 'Sushumna — deep, steady vocal carrier';
  if (rmsStd > 0.18 && tonalStability < 0.35) nadiReading = 'Blocked / scattered — voice field needs grounding';

  const area = (name: string, score: number): VoiceBiofieldPriorityArea => ({ name, score });

  const priorityAreas: VoiceBiofieldPriorityArea[] = [
    area('Vocal stability & tremor band', Math.round(stability * 100)),
    area('Spectral brightness (agni proxy)', Math.round((1 - heat * 0.5) * 100)),
    area('Breath–phrase coherence', Math.round(tonalStability * 100)),
    area('Nervous edge (ZCR)', Math.round(calmness * 100)),
  ].sort((a, b) => a.score - b.score);

  const byStrength = [...priorityAreas].sort((a, b) => b.score - a.score);
  const strengths: VoiceBiofieldStrength[] = [
    { name: byStrength[0]?.name || 'Resonance' },
    { name: byStrength[1]?.name || 'Tonal clarity' },
    { name: byStrength[2]?.name || 'Expressive bandwidth' },
  ];

  const overallCoherence = Math.round(
    Math.max(0, Math.min(100, (stability * 0.35 + tonalStability * 0.35 + calmness * 0.3) * 100)),
  );

  let emotionalField = 'Neutral–reflective vocal mood';
  if (heat > 0.5) emotionalField = 'Warm / activated emotional brightness';
  else if (rmsStd > 0.14) emotionalField = 'Agitated / mobile emotional edge';
  else if (stability > 0.7) emotionalField = 'Calm, contained emotional baseline';

  let organField = 'General tissue tone — no organ alarm from voice envelope';
  if (dominantDosha.startsWith('Pitta')) organField = 'Liver / blood heat pattern — cool and steady the metabolic fire';
  else if (dominantDosha.startsWith('Vata')) organField = 'Colon / nerve sheath — warm oil, rhythm, and grounding';
  else if (dominantDosha.startsWith('Kapha')) organField = 'Lung / lymph flow — light movement and warming spices';

  return {
    overallCoherence,
    nadiReading,
    dominantDosha,
    priorityAreas,
    topStrengths: strengths,
    emotionalField,
    organField,
  };
}

export default function VoiceBiofieldScanner({
  userName: _userName = 'Seeker',
  jyotishContext,
  onScanComplete,
  scanDurationSeconds,
  showProgressRing = false,
  disableUntilMs = null,
}: VoiceBiofieldScannerProps) {
  const { t } = useTranslation();
  const scanDur = scanDurationSeconds ?? SCAN_SECONDS;
  const scanDurRef = useRef(scanDur);
  scanDurRef.current = scanDur;
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(scanDur);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastResult, setLastResult] = useState<VoiceBiofieldResult | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const scanStartMsRef = useRef(0);
  const completionSentRef = useRef(false);
  const samplesRef = useRef<{ rmsSeries: number[]; centroidSeries: number[]; zcrSeries: number[] }>({
    rmsSeries: [],
    centroidSeries: [],
    zcrSeries: [],
  });

  const cleanup = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const [, cooldownBump] = useState(0);
  useEffect(() => {
    if (disableUntilMs == null || Date.now() >= disableUntilMs) return;
    const id = window.setInterval(() => cooldownBump((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, [disableUntilMs]);

  const cooldownActive = disableUntilMs != null && Date.now() < disableUntilMs;
  const cooldownRemainMs = cooldownActive ? Math.max(0, disableUntilMs - Date.now()) : 0;
  const cooldownHours = Math.floor(cooldownRemainMs / 3600000);
  const cooldownMins = Math.max(
    0,
    Math.ceil((cooldownRemainMs % 3600000) / 60000),
  );

  const tickAnalysis = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const fftSize = analyser.fftSize;
    const buf = new Float32Array(fftSize);
    const time = new Float32Array(fftSize);
    analyser.getFloatFrequencyData(buf);
    analyser.getFloatTimeDomainData(time);

    let rms = 0;
    let zcr = 0;
    let prev = 0;
    for (let i = 0; i < time.length; i++) {
      const v = time[i];
      rms += v * v;
      if (i > 0 && ((v >= 0 && prev < 0) || (v < 0 && prev >= 0))) zcr++;
      prev = v;
    }
    rms = Math.sqrt(rms / time.length);
    zcr /= time.length;

    const sr = audioCtxRef.current?.sampleRate || 44100;
    let maxDb = -Infinity;
    let maxBin = 0;
    for (let i = 2; i < buf.length; i++) {
      if (buf[i] > maxDb) {
        maxDb = buf[i];
        maxBin = i;
      }
    }
    const centroid = (maxBin * sr) / fftSize;

    samplesRef.current.rmsSeries.push(rms);
    samplesRef.current.centroidSeries.push(centroid);
    samplesRef.current.zcrSeries.push(zcr);
  }, []);

  const startScan = useCallback(
    async (e?: MouseEvent) => {
      e?.preventDefault();
      setErrorMsg('');
      completionSentRef.current = false;
      samplesRef.current = { rmsSeries: [], centroidSeries: [], zcrSeries: [] };
      setPhase('scanning');
      setSecondsLeft(scanDurRef.current);
      scanStartMsRef.current = Date.now();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1,
          },
          video: false,
        });
        streamRef.current = stream;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.65;
        source.connect(analyser);
        analyserRef.current = analyser;

        const loop = () => {
          tickAnalysis();
          rafRef.current = requestAnimationFrame(loop);
        };
        loop();

        timerRef.current = window.setInterval(() => {
          if (completionSentRef.current) return;

          const elapsedSec = (Date.now() - scanStartMsRef.current) / 1000;
          const dur = scanDurRef.current;
          const remaining = dur - elapsedSec;

          if (elapsedSec >= dur) {
            completionSentRef.current = true;
            if (timerRef.current != null) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            cleanup();

            // ── VOICE-ACTIVITY GATE ──
            // Verify real voice was captured. Silence/ambient noise must not
            // produce a "scan". Threshold tuned so quiet rooms fail but
            // a normal speaking voice (even soft) passes.
            const rms = samplesRef.current.rmsSeries;
            const VOICE_RMS_THRESHOLD = 0.012; // ~ -38 dBFS, well above ambient
            const MIN_VOICED_FRAMES = 8;       // need sustained voice, not a single click
            const voicedFrames = rms.filter((v) => v >= VOICE_RMS_THRESHOLD).length;
            const peakRms = rms.length ? Math.max(...rms) : 0;

            if (voicedFrames < MIN_VOICED_FRAMES || peakRms < VOICE_RMS_THRESHOLD * 1.5) {
              setErrorMsg(
                t('quantumApothecary.voiceBiofield.noVoiceDetected', {
                  defaultValue: 'No voice detected. Please speak clearly into the microphone and try again.',
                }),
              );
              setPhase('error');
              return;
            }

            const result = analyzeVoiceBuffer(samplesRef.current);
            setLastResult(result);
            setPhase('done');
            onScanComplete?.(result);
            return;
          }

          // Never flash "0s" — show 1 until the wall clock passes the window
          const display = Math.max(1, Math.ceil(remaining));
          setSecondsLeft(display);
        }, 400);
      } catch (err: unknown) {
        cleanup();
        const msg = err instanceof Error ? err.message : '';
        setErrorMsg(
          msg.includes('Permission') || msg.includes('NotAllowed')
            ? t('quantumApothecary.voiceBiofield.micRequired')
            : t('quantumApothecary.voiceBiofield.scanFailed'),
        );
        setPhase('error');
      }
    },
    [cleanup, onScanComplete, t, tickAnalysis],
  );

  const reset = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();
      cleanup();
      completionSentRef.current = false;
      setPhase('idle');
      setSecondsLeft(scanDurRef.current);
      setErrorMsg('');
    },
    [cleanup],
  );

  const newScan = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();
      setLastResult(null);
      setPhase('idle');
      setSecondsLeft(scanDurRef.current);
    },
    [],
  );

  return (
    <div
      className="w-full max-w-lg mx-auto select-none"
      onTouchMove={(ev) => ev.stopPropagation()}
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
    >
      <style>{`
        @keyframes vsMicPulse {
          0%,100%{ box-shadow:0 0 0 0 rgba(212,175,55,0.0),0 0 12px rgba(212,175,55,0.22); }
          50%    { box-shadow:0 0 0 10px rgba(212,175,55,0.0),0 0 22px rgba(212,175,55,0.45); }
        }
        @keyframes vsCooldownPulse {
          0%,100%{ opacity:0.7; } 50%{ opacity:1; }
        }
        @keyframes vsWaveBar {
          0%,100%{ transform:scaleY(0.4); } 50%{ transform:scaleY(1.0); }
        }
      `}</style>

      {/* ── IDLE ── */}
      {phase === 'idle' && (
        <div style={{ padding: '24px 20px 20px', textAlign: 'center' }}>
          {/* Dosha badge */}
          {jyotishContext?.primaryDosha && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:20, padding:'5px 14px', borderRadius:100, background:'rgba(212,175,55,0.07)', border:'1px solid rgba(212,175,55,0.18)' }}>
              <span style={{ fontSize:8, fontWeight:800, letterSpacing:'0.22em', textTransform:'uppercase', color:'rgba(212,175,55,0.7)' }}>
                {t('quantumApothecary.voiceBiofield.chartDosha', { dosha: jyotishContext.primaryDosha })}
              </span>
            </div>
          )}

          {/* Mic orb */}
          <div style={{ margin:'0 auto 20px', width:72, height:72, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(circle,rgba(212,175,55,0.16) 0%,rgba(212,175,55,0.04) 100%)', border:'1.5px solid rgba(212,175,55,0.35)', animation: cooldownActive ? 'none' : 'vsMicPulse 2.8s ease-in-out infinite' }}>
            <svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={cooldownActive ? 'rgba(212,175,55,0.35)' : '#D4AF37'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="11" rx="3"/>
              <path d="M5 10a7 7 0 0 0 14 0"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="8" y1="22" x2="16" y2="22"/>
            </svg>
          </div>

          {/* Cooldown timer */}
          {cooldownActive ? (
            <div style={{ marginBottom:20 }}>
              <p style={{ fontSize:11, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(34,211,238,0.55)', marginBottom:6, animation:'vsCooldownPulse 2s ease-in-out infinite' }}>
                FIELD COOLING
              </p>
              <p style={{ fontSize:22, fontWeight:900, color:'rgba(34,211,238,0.9)', letterSpacing:'-0.03em', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {cooldownHours}h {cooldownMins}m
              </p>
              <p style={{ fontSize:10, color:'rgba(255,255,255,0.28)', marginTop:4 }}>until next biofield scan</p>
            </div>
          ) : (
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.32)', marginBottom:20, letterSpacing:'0.08em', lineHeight:1.6 }}>
              {t('quantumApothecary.voiceBiofield.subtitle')}
            </p>
          )}

          {/* CTA button */}
          <button
            type="button"
            onClick={startScan}
            disabled={cooldownActive}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: 18,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              background: cooldownActive
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg,rgba(212,175,55,0.18) 0%,rgba(212,175,55,0.08) 100%)',
              border: cooldownActive
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(212,175,55,0.45)',
              color: cooldownActive ? 'rgba(255,255,255,0.25)' : '#D4AF37',
              cursor: cooldownActive ? 'not-allowed' : 'pointer',
              transition: 'all .3s',
              boxShadow: cooldownActive ? 'none' : '0 0 20px rgba(212,175,55,0.12)',
            }}
          >
            {cooldownActive ? '⟁ BIOFIELD COOLING' : `⟁ ${t('quantumApothecary.voiceBiofield.cta')}`}
          </button>
        </div>
      )}

      {/* ── SCANNING ── */}
      {phase === 'scanning' && (
        <div style={{ padding: '28px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.38em', color: 'rgba(34,211,238,.8)', marginBottom: 20, textTransform:'uppercase' }}>
            {t('quantumApothecary.voiceBiofield.scanning')}
          </p>
          {showProgressRing ? (
            <div style={{ margin: '0 auto 20px', width: 148, height: 148, position: 'relative' }}>
              <svg width={148} height={148} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={74} cy={74} r={58} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
                <circle
                  cx={74} cy={74} r={58} fill="none" stroke="#22D3EE" strokeWidth={6} strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 58}`}
                  strokeDashoffset={2 * Math.PI * 58 * (1 - Math.min(1,(scanDurRef.current - secondsLeft) / scanDurRef.current))}
                  style={{ filter: 'drop-shadow(0 0 12px rgba(34,211,238,0.7))', transition: 'stroke-dashoffset 0.35s linear' }}
                />
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none', gap:2 }}>
                <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,.92)', fontFamily: 'monospace', lineHeight:1 }}>
                  {secondsLeft}
                </span>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.2em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>sec</span>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 52, fontWeight: 900, color: 'rgba(255,255,255,.9)', fontFamily: 'monospace', marginBottom:20 }}>
              {secondsLeft}s
            </p>
          )}
          {/* Live wave bars */}
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:3, height:24, marginBottom:14 }}>
            {[1,1.6,0.7,2,0.9,1.4,0.6,1.8,1.1,1.5].map((h,i) => (
              <div key={i} style={{ width:3, height:`${h * 10}px`, borderRadius:2, background:'rgba(34,211,238,0.6)', animation:`vsWaveBar ${0.6 + i*0.12}s ease-in-out infinite`, animationDelay:`${i*0.08}s` }} />
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.38)', lineHeight: 1.6 }}>
            {t('quantumApothecary.voiceBiofield.hint')}
          </p>
        </div>
      )}

      {/* ── DONE ── */}
      {phase === 'done' && lastResult && (
        <div style={{ padding: '22px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.3em', color: 'rgba(34,211,238,.8)', marginBottom:12, textTransform:'uppercase' }}>
            {t('quantumApothecary.voiceBiofield.doneTitle')}
          </p>
          {/* Coherence ring */}
          <div style={{ position:'relative', width:100, height:100, margin:'0 auto 16px' }}>
            <svg width={100} height={100} style={{ transform:'rotate(-90deg)' }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth={5}/>
              <circle cx={50} cy={50} r={40} fill="none" stroke="#22D3EE" strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${2*Math.PI*40}`}
                strokeDashoffset={2*Math.PI*40*(1-lastResult.overallCoherence/100)}
                style={{ filter:'drop-shadow(0 0 8px rgba(34,211,238,0.6))' }}
              />
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontSize:22, fontWeight:900, color:'#22D3EE', lineHeight:1 }}>{lastResult.overallCoherence}</span>
              <span style={{ fontSize:8, fontWeight:700, color:'rgba(34,211,238,0.6)', letterSpacing:'0.15em', textTransform:'uppercase' }}>%</span>
            </div>
          </div>
          <p style={{ fontSize: 12, fontWeight:700, color: 'rgba(255,255,255,.8)', lineHeight: 1.5, marginBottom: 6 }}>
            {lastResult.nadiReading}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.42)', lineHeight: 1.5, marginBottom: 18 }}>
            {lastResult.dominantDosha}
          </p>
          <button type="button" onClick={newScan}
            style={{ width:'100%', padding:'13px', borderRadius:16, fontSize:10, fontWeight:800, letterSpacing:'.2em', textTransform:'uppercase', cursor:'pointer', background:'rgba(34,211,238,.07)', border:'1px solid rgba(34,211,238,.28)', color:'#22D3EE' }}>
            {t('quantumApothecary.voiceBiofield.scanAgain')}
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {phase === 'error' && (
        <div style={{ padding:'22px 20px', textAlign:'center' }}>
          <p style={{ fontSize: 12, color: 'rgba(255,100,100,.7)', marginBottom: 18, lineHeight:1.5 }}>{errorMsg}</p>
          <button type="button" onClick={reset}
            style={{ padding:'12px 24px', borderRadius:20, fontSize:10, fontWeight:800, letterSpacing:'.2em', textTransform:'uppercase', cursor:'pointer', background:'rgba(212,175,55,.08)', border:'1px solid rgba(212,175,55,.25)', color:'#D4AF37' }}>
            {t('quantumApothecary.voiceBiofield.back')}
          </button>
        </div>
      )}
    </div>
  );
}
