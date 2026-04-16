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
}: VoiceBiofieldScannerProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done' | 'error'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(SCAN_SECONDS);
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
      setSecondsLeft(SCAN_SECONDS);
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
          const remaining = SCAN_SECONDS - elapsedSec;

          if (elapsedSec >= SCAN_SECONDS) {
            completionSentRef.current = true;
            if (timerRef.current != null) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            cleanup();
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
      setSecondsLeft(SCAN_SECONDS);
      setErrorMsg('');
    },
    [cleanup],
  );

  const newScan = useCallback(
    (e?: MouseEvent) => {
      e?.preventDefault();
      setLastResult(null);
      setPhase('idle');
      setSecondsLeft(SCAN_SECONDS);
    },
    [],
  );

  return (
    <div
      className="w-full max-w-lg mx-auto select-none"
      onTouchMove={(ev) => ev.stopPropagation()}
      style={{ touchAction: 'none', overscrollBehavior: 'contain' }}
    >
      {phase === 'idle' && (
        <div
          className="sqi-glass p-7 text-center"
          style={{
            background: 'rgba(255,255,255,.02)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 40,
          }}
        >
          <p
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.4em',
              color: 'rgba(212,175,55,.55)',
              marginBottom: 8,
              textTransform: 'uppercase',
            }}
          >
            {t('quantumApothecary.voiceBiofield.badge')}
          </p>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 900,
              letterSpacing: '-.04em',
              color: 'rgba(255,255,255,.95)',
              marginBottom: 4,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            {t('quantumApothecary.voiceBiofield.title')}
          </h2>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.18em',
              color: 'rgba(34,211,238,.65)',
              textTransform: 'uppercase',
              marginBottom: 24,
            }}
          >
            {t('quantumApothecary.voiceBiofield.subtitle')}
          </p>
          {jyotishContext?.primaryDosha && (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 16 }}>
              {t('quantumApothecary.voiceBiofield.chartDosha', { dosha: jyotishContext.primaryDosha })}
            </p>
          )}
          <button
            type="button"
            onClick={startScan}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '.15em',
              textTransform: 'uppercase',
              background: 'linear-gradient(135deg,rgba(34,211,238,.12),rgba(34,211,238,.04))',
              border: '1px solid rgba(34,211,238,.35)',
              color: '#22D3EE',
              cursor: 'pointer',
              transition: 'all .3s',
            }}
          >
            {t('quantumApothecary.voiceBiofield.cta')}
          </button>
        </div>
      )}

      {phase === 'scanning' && (
        <div
          className="sqi-glass p-8 text-center"
          style={{
            background: 'rgba(255,255,255,.02)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 40,
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.35em', color: 'rgba(34,211,238,.75)', marginBottom: 12 }}>
            {t('quantumApothecary.voiceBiofield.scanning')}
          </p>
          <p style={{ fontSize: 44, fontWeight: 900, color: 'rgba(255,255,255,.9)', fontFamily: 'monospace' }}>
            {secondsLeft}s
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 12, lineHeight: 1.6 }}>
            {t('quantumApothecary.voiceBiofield.hint')}
          </p>
        </div>
      )}

      {phase === 'done' && lastResult && (
        <div
          className="sqi-glass p-6 text-center"
          style={{
            background: 'rgba(255,255,255,.02)',
            border: '1px solid rgba(34,211,238,.25)',
            borderRadius: 40,
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.25em', color: 'rgba(34,211,238,.75)', marginBottom: 10 }}>
            {t('quantumApothecary.voiceBiofield.doneTitle')}
          </p>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#22D3EE', marginBottom: 6 }}>
            {t('quantumApothecary.voiceBiofield.coherenceLine', { n: lastResult.overallCoherence })}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', lineHeight: 1.5, marginBottom: 8 }}>
            {lastResult.nadiReading}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', lineHeight: 1.5, marginBottom: 16 }}>
            {lastResult.dominantDosha}
          </p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 14 }}>
            {t('quantumApothecary.voiceBiofield.doneHint')}
          </p>
          <button
            type="button"
            onClick={newScan}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              background: 'rgba(34,211,238,.08)',
              border: '1px solid rgba(34,211,238,.35)',
              color: '#22D3EE',
            }}
          >
            {t('quantumApothecary.voiceBiofield.scanAgain')}
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div
          className="sqi-glass p-6 text-center"
          style={{
            border: '1px solid rgba(239,68,68,.25)',
            borderRadius: 40,
            background: 'rgba(255,255,255,.02)',
          }}
        >
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 16 }}>{errorMsg}</p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 20px',
              borderRadius: 24,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              background: 'rgba(212,175,55,.08)',
              border: '1px solid rgba(212,175,55,.25)',
              color: '#D4AF37',
            }}
          >
            {t('quantumApothecary.voiceBiofield.back')}
          </button>
        </div>
      )}
    </div>
  );
}
