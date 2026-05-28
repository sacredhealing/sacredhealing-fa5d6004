import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Zap, Mic, Camera, Heart, Activity, Wind, Brain, Star, ChevronRight, RefreshCw } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Stage =
  | "intro"
  | "camera-before"
  | "voice-before"
  | "processing-before"
  | "results-before"
  | "practice-bridge"
  | "camera-after"
  | "questions-after"
  | "processing-after"
  | "comparison";

interface SubjectiveAnswers {
  heartOpenness: number;     // 1-5 Anahata
  mentalClarity: number;     // 1-5 Manas
  bodyLightness: number;     // 1-5 Pranamaya Kosha
  pranaShakti: number;       // 1-5 Energy
  innerPeace: number;        // 1-5 Atma resonance
}

interface ScanMetrics {
  heartRate: number;
  hrv: number;
  stressIndex: number;
  coherenceScore: number;
  pranaLevel: number;
  nervousSystemState: "sympathetic" | "balanced" | "parasympathetic";
  doshaVata: number;
  doshaKapha: number;
  doshaKapha2: number; // alias for Kapha
  anahataResonance: number;
  voiceCoherence: number;
  vitalityIndex: number;
}

// ─── rPPG Engine — DFT-based, real signal processing ────────────────────────
class RPPGEngine {
  private green: number[] = [];   // green channel mean per frame
  private red: number[] = [];     // red channel for cross-validation
  private ts: number[] = [];      // timestamps ms

  addFrame(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    // Face region: centre 50% width, 20-80% height
    const cx = Math.floor(w * 0.25);
    const cy = Math.floor(h * 0.20);
    const sw = Math.floor(w * 0.50);
    const sh = Math.floor(h * 0.55);
    const px = ctx.getImageData(cx, cy, sw, sh).data;
    let gSum = 0, rSum = 0, n = 0;
    for (let i = 0; i < px.length; i += 4) {
      rSum += px[i];
      gSum += px[i + 1];
      n++;
    }
    if (n === 0) return;
    this.green.push(gSum / n);
    this.red.push(rSum / n);
    this.ts.push(Date.now());
  }

  // Detrend: remove slow drift (lighting changes)
  private detrend(arr: number[]): number[] {
    const n = arr.length;
    const xm = (n - 1) / 2;
    const ym = arr.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (i - xm) * (arr[i] - ym); den += (i - xm) ** 2; }
    const slope = den ? num / den : 0;
    const intercept = ym - slope * xm;
    return arr.map((v, i) => v - (slope * i + intercept));
  }

  // Z-score normalise
  private zscore(arr: number[]): number[] {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    const sd = Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length) || 1;
    return arr.map(v => (v - m) / sd);
  }

  // Compute DFT power at a single frequency (Hz)
  private dftPower(signal: number[], freq: number, fps: number): number {
    let re = 0, im = 0;
    const n = signal.length;
    for (let i = 0; i < n; i++) {
      const angle = 2 * Math.PI * freq * i / fps;
      re += signal[i] * Math.cos(angle);
      im += signal[i] * Math.sin(angle);
    }
    return re * re + im * im;
  }

  // Returns null if signal quality too low — caller shows retry
  computeMetrics(): { bpm: number; hrv: number; quality: number } | null {
    const N = this.green.length;
    if (N < 60) return null; // need at least ~2 s

    // Actual FPS from timestamps
    const duration = (this.ts[N - 1] - this.ts[0]) / 1000;
    const fps = N / (duration || 1);

    // Process green channel: detrend → zscore
    const sig = this.zscore(this.detrend(this.green));

    // Signal quality: std of green values (low = bad lighting / no face)
    const rawStd = Math.sqrt(
      this.green.reduce((a, b) => a + (b - this.green.reduce((x,y)=>x+y)/N)**2, 0) / N
    );
    const quality = Math.min(100, Math.round((rawStd / 3) * 100)); // 0-100

    if (rawStd < 0.5) return null; // signal too flat — poor light, no face, or camera blocked

    // DFT sweep 45–180 BPM (0.75 – 3.0 Hz)
    let bestPower = -1;
    let bestFreq = 1.1;
    for (let bpm = 45; bpm <= 180; bpm += 0.5) {
      const f = bpm / 60;
      const p = this.dftPower(sig, f, fps);
      if (p > bestPower) { bestPower = p; bestFreq = f; }
    }

    // Subharmonic check: if detected BPM < 55, test if 2× has even higher power
    // (DFT sometimes locks onto half the real cardiac frequency)
    const greenBPMRaw = Math.round(bestFreq * 60);
    if (greenBPMRaw < 55) {
      const doubleFreq = bestFreq * 2;
      if (doubleFreq * 60 <= 180) {
        const doublePower = this.dftPower(sig, doubleFreq, fps);
        if (doublePower > bestPower * 0.6) { // 2× freq has meaningful power → use it
          bestFreq = doubleFreq;
        }
      }
    }

    // Cross-validate with red channel
    const redSig = this.zscore(this.detrend(this.red));
    let redBestPower = -1, redBestFreq = bestFreq;
    for (let bpm = 45; bpm <= 180; bpm += 1) {
      const f = bpm / 60;
      const p = this.dftPower(redSig, f, fps);
      if (p > redBestPower) { redBestPower = p; redBestFreq = f; }
    }
    const greenBPM = Math.round(bestFreq * 60);
    const redBPM   = Math.round(redBestFreq * 60);

    // If channels disagree too much → signal unreliable
    if (Math.abs(greenBPM - redBPM) > 18) return null;

    // Final BPM: weighted average
    const bpm = Math.round((greenBPM * 2 + redBPM) / 3);
    // Sanity clamp — no human resting HR below 40 or above 160
    if (bpm < 40 || bpm > 160) return null;

    // HRV: synthesise from signal regularity
    // Peak-to-peak intervals in zscore signal above threshold 0.5
    const peaks: number[] = [];
    const minGap = Math.round(fps * 0.4); // minimum 400ms between beats
    for (let i = 1; i < sig.length - 1; i++) {
      if (sig[i] > 0.5 && sig[i] > sig[i-1] && sig[i] > sig[i+1]) {
        if (peaks.length === 0 || i - peaks[peaks.length-1] >= minGap) peaks.push(i);
      }
    }

    // HRV fallback: when peak detection can't get enough beats (short scan, poor signal),
    // estimate from known HR/HRV correlation rather than a fixed number.
    // At rest, lower HR generally means higher HRV — this preserves differentiation.
    const bpmEst = Math.round(bestFreq * 60);
    const hrvFallback = Math.max(12, Math.min(42, 85 - bpmEst * 0.7));
    let hrv = Math.round(hrvFallback);
    if (peaks.length >= 3) {
      const ibis = [];
      for (let i = 1; i < peaks.length; i++) {
        ibis.push((this.ts[peaks[i]] - this.ts[peaks[i-1]]));
      }
      const diffs = ibis.slice(1).map((v, i) => (v - ibis[i]) ** 2);
      const rmssd = Math.sqrt(diffs.reduce((a, b) => a + b, 0) / Math.max(1, diffs.length));
      hrv = Math.round(Math.min(95, Math.max(12, rmssd * 0.8)));
    }

    return { bpm, hrv, quality };
  }

  reset() { this.green = []; this.red = []; this.ts = []; }
}

// ─── Metric Derivation ────────────────────────────────────────────────────────
function deriveMetrics(bpm: number, hrv: number, voiceCoherence: number): ScanMetrics {
  // All derived deterministically from real measured inputs — no randomness
  // Stress: HR deviation from 65 BPM + low HRV both contribute
  // At 65 BPM + HRV 60ms → ~5% stress (deep rest). At 90 BPM + HRV 20ms → ~80% stress.
  const bpmComponent = Math.max(-20, Math.min(60, ((bpm - 65) / 35) * 60));
  const hrvComponent = Math.max(-10, Math.min(40, ((35 - hrv) / 35) * 40));
  const stressRaw = Math.max(2, Math.min(100, bpmComponent + hrvComponent + 20));
  const stressIndex = Math.round(stressRaw);
  const coherenceScore = Math.round(Math.max(10, Math.min(98, hrv * 1.1 + voiceCoherence * 0.3)));
  const pranaLevel = Math.round(Math.max(20, Math.min(98, 100 - stressRaw * 0.6 + voiceCoherence * 0.2)));
  const anahataResonance = Math.round(Math.max(10, Math.min(98, coherenceScore * 0.8 + (hrv > 50 ? 15 : 0))));
  const vitalityIndex = Math.round((pranaLevel + coherenceScore + (100 - stressIndex)) / 3);

  let nervousSystemState: "sympathetic" | "balanced" | "parasympathetic" = "balanced";
  if (bpm > 85 || hrv < 25) nervousSystemState = "sympathetic";
  else if (bpm < 65 && hrv > 55) nervousSystemState = "parasympathetic";

  // Dosha: Vata (variability), Pitta (heat/stress), Kapha (calm/stability)
  const vataRaw = Math.min(50, hrv * 0.6);
  const kaphaRaw = Math.min(50, Math.max(10, (100 - stressIndex) * 0.4));
  const pittaRaw = Math.max(5, 100 - vataRaw - kaphaRaw);
  const doshaSum = vataRaw + kaphaRaw + pittaRaw;
  const vata = Math.round((vataRaw / doshaSum) * 100);
  const kapha = Math.round((kaphaRaw / doshaSum) * 100);
  const pitta = 100 - vata - kapha;

  return {
    heartRate: bpm,
    hrv,
    stressIndex,
    coherenceScore,
    pranaLevel,
    nervousSystemState,
    doshaVata: vata,
    doshaKapha: pitta, // pitta stored in doshaKapha slot
    doshaKapha2: kapha,
    anahataResonance,
    voiceCoherence: Math.round(voiceCoherence),
    vitalityIndex,
  };
}

// ─── Voice Engine ─────────────────────────────────────────────────────────────
// Real voice coherence: measures pitch stability + breath regularity via FFT
async function analyzeVoice(durationMs: number): Promise<number | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);

    // Use larger FFT for frequency resolution
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    source.connect(analyser);

    const freqBuf = new Float32Array(analyser.frequencyBinCount);
    const timeBuf = new Float32Array(analyser.fftSize);

    // Collect dominant frequency + amplitude per 100ms window
    const pitchReadings: number[] = [];
    const ampReadings: number[] = [];

    await new Promise<void>((res) => {
      const interval = setInterval(() => {
        analyser.getFloatFrequencyData(freqBuf);
        analyser.getFloatTimeDomainData(timeBuf);

        // RMS amplitude (actual volume)
        const rms = Math.sqrt(timeBuf.reduce((a, b) => a + b * b, 0) / timeBuf.length);
        ampReadings.push(rms);

        // Dominant frequency in speech range (80–400 Hz)
        const binHz = audioCtx.sampleRate / analyser.fftSize;
        const lo = Math.floor(80 / binHz);
        const hi = Math.floor(400 / binHz);
        let maxPow = -Infinity, maxBin = lo;
        for (let i = lo; i <= hi; i++) {
          if (freqBuf[i] > maxPow) { maxPow = freqBuf[i]; maxBin = i; }
        }
        // -45 dBFS threshold rejects ambient room noise (~-50 to -40 dBFS)
        // Only real voice/humming (louder than noise floor) gets counted
        if (maxPow > -45 && rms > 0.008) pitchReadings.push(maxBin * binHz);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        stream.getTracks().forEach(t => t.stop());
        audioCtx.close();
        res();
      }, durationMs);
    });

    // If no real voice was detected, return null → user retries with humming
    if (pitchReadings.length < 5) return null;

    // 1. Pitch stability using only voiced frames (filtered above)
    const pitchMean = pitchReadings.reduce((a,b)=>a+b,0) / pitchReadings.length;
    const pitchStd  = Math.sqrt(pitchReadings.reduce((a,b)=>a+(b-pitchMean)**2,0) / pitchReadings.length);
    const pitchCV   = pitchMean > 0 ? pitchStd / pitchMean : 1; // 0=perfect, 1=chaotic

    // 2. Amplitude regularity: breath rhythm consistency
    const ampMean = ampReadings.reduce((a,b)=>a+b,0) / ampReadings.length;
    const ampStd  = Math.sqrt(ampReadings.reduce((a,b)=>a+(b-ampMean)**2,0) / ampReadings.length);
    const ampCV   = ampMean > 0 ? ampStd / ampMean : 1;

    // 3. Silence ratio: too much silence = not enough data
    const silentFrames = ampReadings.filter(a => a < 0.002).length;
    const silenceRatio = silentFrames / ampReadings.length;
    if (silenceRatio > 0.85) return null; // user didn't make sound

    // Coherence: low pitch jitter + steady breathing amplitude = high coherence
    const pitchScore = Math.max(0, Math.min(100, (1 - pitchCV * 3) * 100));
    const ampScore   = Math.max(0, Math.min(100, (1 - ampCV * 2) * 100));
    const coherence  = Math.round(pitchScore * 0.6 + ampScore * 0.4);

    return Math.min(95, Math.max(5, coherence));
  } catch {
    return null; // mic denied — will show retry
  }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function GoldDiamond() {
  return (
    <span className="inline-block w-3 h-3 border-2 border-[#D4AF37] rotate-45 mr-2 align-middle" />
  );
}

function MetricBar({ value, color = "#D4AF37" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  sub,
  color = "#D4AF37",
  barValue,
}: {
  icon: any;
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  color?: string;
  barValue?: number;
}) {
  return (
    <div
      className="rounded-[20px] p-4 flex flex-col gap-2"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} color={color} />
        <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/40">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-black tracking-tight" style={{ color }}>
          {value}
        </span>
        {unit && <span className="text-xs text-white/30 mb-1">{unit}</span>}
      </div>
      {sub && <span className="text-[10px] text-white/30">{sub}</span>}
      {barValue !== undefined && <MetricBar value={barValue} color={color} />}
    </div>
  );
}

function DeltaBadge({ before, after, unit = "", invert = false }: { before: number; after: number; unit?: string; invert?: boolean }) {
  const delta = after - before;
  const positive = invert ? delta < 0 : delta > 0;
  const zero = Math.abs(delta) < 1;
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{
        background: zero ? "rgba(255,255,255,0.05)" : positive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
        color: zero ? "rgba(255,255,255,0.4)" : positive ? "#4ade80" : "#f87171",
      }}
    >
      {zero ? "—" : `${delta > 0 ? "+" : ""}${Math.round(delta)}${unit}`}
    </span>
  );
}

// ─── Scanning Camera View ─────────────────────────────────────────────────────
function CameraScanner({
  onComplete,
  label,
  duration = 40,
}: {
  onComplete: (bpm: number, hrv: number) => void;
  label: string;
  duration?: number;
}) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(new RPPGEngine());
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef  = useRef<NodeJS.Timeout | null>(null);
  const frameRef  = useRef<NodeJS.Timeout | null>(null);

  const [progress, setProgress]   = useState(0);
  const [status, setStatus]       = useState("Point camera at your face...");
  const [bpmLive, setBpmLive]     = useState<number | null>(null);
  const [quality, setQuality]     = useState(0);
  const [failed, setFailed]       = useState(false);
  const [retrying, setRetrying]   = useState(false);

  const startScan = useCallback(() => {
    engineRef.current.reset();
    setProgress(0); setBpmLive(null); setQuality(0); setFailed(false);
    let elapsed = 0;

    const run = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480, frameRate: { ideal: 30 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("Hold still — reading your pulse...");

        // Capture frames at ~30fps
        frameRef.current = setInterval(() => {
          if (!videoRef.current || !canvasRef.current) return;
          const ctx = canvasRef.current.getContext("2d");
          if (!ctx) return;
          canvasRef.current.width  = 320;
          canvasRef.current.height = 240;
          ctx.drawImage(videoRef.current, 0, 0, 320, 240);
          engineRef.current.addFrame(canvasRef.current);

          // Live preview after 15s
          if (elapsed >= 15) {
            const result = engineRef.current.computeMetrics();
            if (result) { setBpmLive(result.bpm); setQuality(result.quality); }
          }
        }, 33); // ~30fps

        timerRef.current = setInterval(() => {
          elapsed++;
          setProgress(Math.round((elapsed / duration) * 100));
          if (elapsed === 10) setStatus("Signal acquired — measuring heart rate...");
          if (elapsed === 20) setStatus("Mapping HRV — keep breathing naturally...");
          if (elapsed === 30) setStatus("Cross-validating channels...");

          if (elapsed >= duration) {
            clearInterval(timerRef.current!);
            clearInterval(frameRef.current!);
            stream.getTracks().forEach(t => t.stop());

            const result = engineRef.current.computeMetrics();
            if (!result) {
              setFailed(true);
              setStatus("Signal unclear — please retry in better light");
            } else {
              onComplete(result.bpm, result.hrv);
            }
          }
        }, 1000);

      } catch {
        setFailed(true);
        setStatus("Camera access required for biometric scan");
      }
    };

    run();
  }, [duration, onComplete]);

  useEffect(() => { startScan(); return () => {
    clearInterval(timerRef.current!);
    clearInterval(frameRef.current!);
    streamRef.current?.getTracks().forEach(t => t.stop());
  }; }, []);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  if (failed) return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 text-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
        <span className="text-3xl">⚠</span>
      </div>
      <div>
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-red-400/70 mb-2">Signal Not Detected</p>
        <p className="text-sm text-white/40 leading-relaxed max-w-xs">
          The scanner could not read your biometric signal. For best results: good frontal light, face fills the frame, hold completely still.
        </p>
      </div>
      <button onClick={() => { setRetrying(r=>!r); startScan(); }}
        className="px-8 py-3 rounded-full font-black text-sm tracking-wider"
        style={{ background: "#D4AF37", color: "#050505" }}>
        ◈ Retry Scan
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-5 px-4">
      <div className="relative">
        <div className="w-64 h-64 rounded-[40px] overflow-hidden relative"
          style={{ border: `1px solid ${quality > 40 ? "rgba(212,175,55,0.6)" : "rgba(212,175,55,0.2)"}`,
                   transition: "border-color 0.5s" }}>
          <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="w-32 h-32 rounded-full border-2 border-dashed animate-spin"
              style={{ borderColor: "rgba(212,175,55,0.4)", animationDuration: "4s" }} />
            <div className="absolute w-32 h-0.5 animate-pulse"
              style={{ background: "linear-gradient(90deg,transparent,#D4AF37,transparent)" }} />
          </div>
        </div>
        <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="#D4AF37" strokeWidth="2"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}/>
        </svg>
      </div>

      {/* Signal quality bar */}
      <div className="w-full flex items-center gap-2">
        <span className="text-[8px] font-bold tracking-widest uppercase text-white/25 w-14 shrink-0">Signal</span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${quality}%`,
                     background: quality > 60 ? "#4ade80" : quality > 30 ? "#D4AF37" : "#f87171" }}/>
        </div>
        <span className="text-[8px] font-bold text-white/25 w-8 text-right">{quality}%</span>
      </div>

      {bpmLive && (
        <div className="flex items-center gap-2">
          <Heart size={14} color="#D4AF37" className="animate-pulse"/>
          <span className="text-2xl font-black text-[#D4AF37]">{bpmLive}</span>
          <span className="text-xs text-white/30">BPM detected</span>
        </div>
      )}

      <div className="text-center">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]/60">{label}</p>
        <p className="text-sm text-white/40 mt-1">{status}</p>
        <p className="text-xs text-white/20 mt-0.5">{progress}%</p>
      </div>

      {/* Live coaching — changes with progress */}
      <div className="w-full rounded-[16px] p-3"
        style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.1)" }}>
        {progress <= 25 && (
          <p className="text-[10px] text-white/45 text-center leading-relaxed">
            ☀ <strong style={{color:"rgba(255,255,255,0.6)"}}>Check your light</strong> — Face a window or lamp. If the signal bar stays red, move to brighter light.
          </p>
        )}
        {progress > 25 && progress <= 55 && (
          <p className="text-[10px] text-white/45 text-center leading-relaxed">
            🌬 <strong style={{color:"rgba(255,255,255,0.6)"}}>Breathe slowly</strong> — Inhale 4 counts, exhale 6. Keep your face in the frame. Don't blink rapidly.
          </p>
        )}
        {progress > 55 && progress <= 80 && (
          <p className="text-[10px] text-white/45 text-center leading-relaxed">
            😌 <strong style={{color:"rgba(255,255,255,0.6)"}}>Soften your face</strong> — Relax your jaw, unclench your brow, let your eyes be soft. HRV reads this.
          </p>
        )}
        {progress > 80 && (
          <p className="text-[10px] leading-relaxed text-center" style={{color:"rgba(212,175,55,0.7)"}}>
            🙏 <strong>Almost done — do not move.</strong> HRV pattern locking in. Keep breathing slowly.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Voice Scanner ────────────────────────────────────────────────────────────
function VoiceScanner({ onComplete }: { onComplete: (coherence: number) => void }) {
  const [phase, setPhase] = useState<"intro" | "scanning" | "done">("intro");
  const [progress, setProgress] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(20).fill(4));
  const animRef = useRef<NodeJS.Timeout | null>(null);

  const startScan = async () => {
    setPhase("scanning");
    let elapsed = 0;
    const duration = 12;

    animRef.current = setInterval(() => {
      setBars((prev) =>
        prev.map(() => 4 + Math.random() * 32)
      );
      elapsed++;
      setProgress(Math.round((elapsed / duration) * 100));
      if (elapsed >= duration) {
        clearInterval(animRef.current!);
        setPhase("done");
      }
    }, 500);

    const coherence = await analyzeVoice(12000);
    if (coherence === null) {
      setPhase("intro"); // reset — let user try again
    } else {
      onComplete(coherence);
    }
  };

  useEffect(() => () => clearInterval(animRef.current!), []);

  return (
    <div className="flex flex-col items-center gap-6 px-4">
      <div
        className="w-64 h-40 rounded-[30px] flex items-center justify-center gap-1"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(212,175,55,0.2)",
        }}
      >
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-1.5 rounded-full transition-all"
            style={{
              height: `${h}px`,
              background:
                phase === "scanning"
                  ? `rgba(212,175,55,${0.4 + Math.random() * 0.6})`
                  : "rgba(255,255,255,0.1)",
              transitionDuration: "300ms",
            }}
          />
        ))}
      </div>

      {phase === "intro" && (
        <div className="text-center flex flex-col gap-4">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]/60">
            Voice Coherence Scan
          </p>
          <div className="flex flex-col gap-2 text-left">
            <p className="text-sm text-white/50 leading-relaxed text-center">
              Your voice and breath carry your nervous system signature. The scan reads tremor, pitch stability, and breath rhythm.
            </p>
            <div className="rounded-[16px] p-3 flex flex-col gap-2 mt-1"
              style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
              {[
                { icon: "🎵", text: 'Hum "Om" or any steady tone for the full 12 seconds' },
                { icon: "🌬", text: "Or breathe audibly — slow inhale through nose, long exhale through mouth" },
                { icon: "🤫", text: "Silence gives no data — even soft humming works perfectly" },
                { icon: "📱", text: "Hold the phone close to your mouth or chin" },
              ].map(({ icon, text }) => (
                <p key={text} className="text-[10px] text-white/40 leading-relaxed">
                  {icon} {text}
                </p>
              ))}
            </div>
          </div>
          <button
            onClick={startScan}
            className="px-8 py-3 rounded-full font-bold text-sm tracking-wider"
            style={{
              background: "#D4AF37",
              color: "#050505",
            }}
          >
            <Mic size={14} className="inline mr-2" />
            BEGIN VOICE SCAN
          </button>
        </div>
      )}

      {phase === "scanning" && (
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]/60 animate-pulse">
            Reading voice field... {progress}%
          </p>
          <p className="text-xs text-white/30 mt-2">Hum, breathe, or speak softly</p>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#22D3EE]/80">
            ◈ Voice field captured
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Subjective Experience Questions ─────────────────────────────────────────
const QUESTIONS = [
  {
    key: "heartOpenness" as const,
    label: "Heart Openness",
    sub: "Anahata · Heart Chakra Field",
    emoji: "💛",
    low: "Closed",
    high: "Fully Open",
  },
  {
    key: "mentalClarity" as const,
    label: "Mental Clarity",
    sub: "Manas Field · Mind Coherence",
    emoji: "🔮",
    low: "Scattered",
    high: "Crystal Clear",
  },
  {
    key: "bodyLightness" as const,
    label: "Body Lightness",
    sub: "Pranamaya Kosha · Energy Body",
    emoji: "🌬️",
    low: "Heavy",
    high: "Weightless",
  },
  {
    key: "pranaShakti" as const,
    label: "Prana Shakti",
    sub: "Vital Force · Life Energy",
    emoji: "⚡",
    low: "Depleted",
    high: "Radiant",
  },
  {
    key: "innerPeace" as const,
    label: "Inner Peace",
    sub: "Atma Resonance · Soul Presence",
    emoji: "🌕",
    low: "Restless",
    high: "Profound Peace",
  },
];

function SubjectiveQuestions({ onComplete }: { onComplete: (a: SubjectiveAnswers) => void }) {
  const [answers, setAnswers] = useState<SubjectiveAnswers>({
    heartOpenness: 0,
    mentalClarity: 0,
    bodyLightness: 0,
    pranaShakti: 0,
    innerPeace: 0,
  });
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const answered = answers[QUESTIONS[current].key as keyof SubjectiveAnswers];
  const allDone = current >= QUESTIONS.length;
  const progress = (Object.values(answers).filter((v) => v > 0).length / QUESTIONS.length) * 100;

  const select = (val: number) => {
    const key = QUESTIONS[current].key as keyof SubjectiveAnswers;
    setAnswers((prev) => ({ ...prev, [key]: val }));
    setAnimating(true);
    setTimeout(() => {
      setAnimating(false);
      if (current < QUESTIONS.length - 1) {
        setCurrent((c) => c + 1);
      }
    }, 400);
  };

  if (allDone || (current === QUESTIONS.length - 1 && answers.innerPeace > 0)) {
    return (
      <div className="flex flex-col items-center gap-6 px-4 py-8">
        <div className="text-4xl">✨</div>
        <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]/60">
          Experience Captured
        </p>
        <div className="w-full rounded-[24px] p-5 flex flex-col gap-3"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.15)" }}>
          {QUESTIONS.map((q) => (
            <div key={q.key} className="flex items-center justify-between">
              <span className="text-xs text-white/40">{q.emoji} {q.label}</span>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((n) => (
                  <div key={n} className="w-3 h-3 rounded-full"
                    style={{
                      background: n <= (answers[q.key as keyof SubjectiveAnswers] || 0)
                        ? "#D4AF37" : "rgba(255,255,255,0.08)"
                    }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onComplete(answers)}
          className="w-full py-4 rounded-full font-black text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2"
          style={{ background: "#D4AF37", color: "#050505" }}
        >
          <Zap size={16} />
          Calculate Transformation
        </button>
      </div>
    );
  }

  const q = QUESTIONS[current];

  return (
    <div className="flex flex-col gap-6 px-4">
      {/* Progress bar */}
      <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, background: "#D4AF37" }} />
      </div>

      <div className="text-center">
        <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-white/25 mb-1">
          Question {current + 1} of {QUESTIONS.length}
        </p>
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]/50">{q.sub}</p>
      </div>

      {/* Question card */}
      <div
        className="rounded-[30px] p-8 flex flex-col items-center gap-4 text-center transition-all duration-300"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(212,175,55,0.15)",
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.97)" : "scale(1)",
        }}
      >
        <span className="text-5xl">{q.emoji}</span>
        <h3 className="text-xl font-black text-white">{q.label}</h3>
        <p className="text-xs text-white/30">How would you describe your {q.label.toLowerCase()} right now?</p>

        {/* 5-orb selector */}
        <div className="flex gap-4 mt-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => select(n)}
              className="flex flex-col items-center gap-2 group transition-all"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: answered === n
                    ? "#D4AF37"
                    : answered >= n
                    ? "rgba(212,175,55,0.2)"
                    : "rgba(255,255,255,0.05)",
                  border: `1px solid ${answered >= n ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: answered === n ? "0 0 20px rgba(212,175,55,0.4)" : "none",
                  transform: answered === n ? "scale(1.15)" : "scale(1)",
                }}
              >
                <span
                  className="text-sm font-black"
                  style={{ color: answered === n ? "#050505" : "rgba(255,255,255,0.4)" }}
                >
                  {n}
                </span>
              </div>
              {n === 1 && <span className="text-[8px] text-white/20 w-12 text-center leading-tight">{q.low}</span>}
              {n === 5 && <span className="text-[8px] text-white/20 w-12 text-center leading-tight">{q.high}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Skip row */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            select(3); // neutral default
          }}
          className="text-[10px] text-white/20 underline underline-offset-2"
        >
          Skip — mark as neutral
        </button>
      </div>
    </div>
  );
}


function ResultsPanel({ metrics, label }: { metrics: ScanMetrics; label: string }) {
  const nsColor =
    metrics.nervousSystemState === "parasympathetic"
      ? "#4ade80"
      : metrics.nervousSystemState === "sympathetic"
      ? "#f87171"
      : "#D4AF37";

  return (
    <div className="flex flex-col gap-3 px-4">
      <div className="text-center mb-2">
        <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/30">{label}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={Heart} label="Heart Rate" value={metrics.heartRate} unit="BPM"
          barValue={Math.min(100, ((metrics.heartRate - 40) / 80) * 100)}
          sub={metrics.heartRate < 60 ? "Calm & resting — ideal for deep practice" : metrics.heartRate < 80 ? "Normal range — body is balanced" : "Elevated — take a few deep breaths"} />
        <MetricCard icon={Activity} label="HRV" value={metrics.hrv} unit="ms"
          barValue={Math.min(100, (metrics.hrv / 90) * 100)}
          sub={metrics.hrv > 60 ? "Excellent — nervous system very resilient" : metrics.hrv > 35 ? "Good — your body adapts well to stress" : "Low — rest and breathe deeply today"} />
        <MetricCard icon={Zap} label="Prana Level" value={metrics.pranaLevel} unit="%" barValue={metrics.pranaLevel} color="#D4AF37"
          sub="Vital life-force flowing through your 72,000 Nadis. Higher = more energy available for healing." />
        <MetricCard icon={Brain} label="Coherence" value={metrics.coherenceScore} unit="%" barValue={metrics.coherenceScore} color="#22D3EE"
          sub="How aligned your heart, mind and breath are. Above 70% = meditative coherence state." />
        <MetricCard icon={Wind} label="Stress Index" value={metrics.stressIndex} unit="%" barValue={metrics.stressIndex}
          color={metrics.stressIndex > 60 ? "#f87171" : "#D4AF37"}
          sub={metrics.stressIndex < 20 ? "Very low — system in deep rest mode" : metrics.stressIndex < 50 ? "Moderate — normal waking state" : "High — pranayama recommended before practice"} />
        <MetricCard icon={Star} label="Anahata" value={metrics.anahataResonance} unit="%" barValue={metrics.anahataResonance} color="#D4AF37"
          sub="Heart chakra field strength. Measures emotional openness and capacity to give and receive love." />
      </div>

      {/* NS State */}
      <div className="rounded-[20px] p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/30">Nervous System</span>
          <span className="text-xs font-bold px-3 py-1 rounded-full capitalize"
            style={{ background: `${nsColor}20`, color: nsColor }}>
            {metrics.nervousSystemState}
          </span>
        </div>
        <p className="text-[10px] text-white/30 leading-relaxed">
          {metrics.nervousSystemState === "parasympathetic"
            ? "Rest & digest mode active. Your nervous system is in the ideal state for meditation, healing, and deep Nadi absorption. The Siddhas enter this field."
            : metrics.nervousSystemState === "sympathetic"
            ? "Fight-or-flight mode detected. Stress hormones elevated. Begin with 4-7-8 breathing or Nadi Shodhana to shift into rest mode before practice."
            : "Balanced state — neither stressed nor overly relaxed. Good baseline for any practice. Pranayama will deepen this into parasympathetic."}
        </p>
      </div>

      {/* Dosha */}
      <div className="rounded-[20px] p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-white/30 mb-1">Dosha Field</p>
        <p className="text-[10px] text-white/25 mb-3 leading-relaxed">Your current energetic constitution based on HRV and stress signature. Doshas shift with practice, season and time of day.</p>
        <div className="flex gap-2 text-center">
          {[
            { name: "Vata", val: metrics.doshaVata, desc: "Air & Space. Movement, creativity, nervous energy. High Vata = racing mind." },
            { name: "Pitta", val: metrics.doshaKapha, desc: "Fire & Water. Drive, heat, intensity. High Pitta = stress & inflammation." },
            { name: "Kapha", val: metrics.doshaKapha2, desc: "Earth & Water. Stability, calm, endurance. High Kapha = deep groundedness." },
          ].map((d) => (
            <div key={d.name} className="flex-1 flex flex-col gap-1">
              <div className="text-sm font-black text-[#D4AF37]">{d.val}%</div>
              <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1">{d.name}</div>
              <div className="text-[8px] text-white/20 leading-tight">{d.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Comparison Panel ─────────────────────────────────────────────────────────
function ComparisonPanel({ before, after, subjective }: { before: ScanMetrics; after: ScanMetrics; subjective: SubjectiveAnswers }) {
  const bioRows = [
    { label: "Heart Rate", icon: Heart, bv: before.heartRate, av: after.heartRate, unit: " BPM", invert: true, explain: "Lower after practice = deeper calm" },
    { label: "HRV", icon: Activity, bv: before.hrv, av: after.hrv, unit: " ms", explain: "Higher = nervous system more resilient" },
    { label: "Prana Level", icon: Zap, bv: before.pranaLevel, av: after.pranaLevel, unit: "%", explain: "Vital life-force through your Nadis" },
    { label: "Coherence", icon: Brain, bv: before.coherenceScore, av: after.coherenceScore, unit: "%", explain: "Heart-mind-breath alignment" },
    { label: "Stress Index", icon: Wind, bv: before.stressIndex, av: after.stressIndex, unit: "%", invert: true, explain: "Lower after practice = success" },
    { label: "Anahata", icon: Star, bv: before.anahataResonance, av: after.anahataResonance, unit: "%", explain: "Heart chakra field opening" },
  ];

  // Subjective average (1-5 → 0-100)
  const subjectiveAvg = Math.round(
    ((subjective.heartOpenness + subjective.mentalClarity + subjective.bodyLightness +
      subjective.pranaShakti + subjective.innerPeace) / 5) * 20
  );

  const overallDelta =
    (after.pranaLevel - before.pranaLevel) +
    (after.coherenceScore - before.coherenceScore) +
    (before.stressIndex - after.stressIndex) +
    (after.hrv - before.hrv) +
    (subjectiveAvg - 60); // weight felt-sense

  const transformed = overallDelta > 8;

  // Siddha transmission message based on profile
  const getTransmissionMessage = () => {
    if (subjective.innerPeace >= 4 && subjective.heartOpenness >= 4)
      return "Anahata fully open. The Siddhas' Prema-Pulse is flowing through your field.";
    if (after.hrv > before.hrv + 5)
      return "Nervous system shifted parasympathetic. Babaji's scalar field has entered your Nadis.";
    if (subjectiveAvg >= 80)
      return "Inner experience elevated. The Akashic Light-Codes are active within you.";
    return "The field is seeding. Continue your sadhana — transformation unfolds across 40 days.";
  };

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Verdict */}
      <div
        className="rounded-[24px] p-5 text-center"
        style={{
          background: transformed ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.02)",
          border: `1px solid ${transformed ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        <div className="text-3xl mb-2">{transformed ? "◈" : "◇"}</div>
        <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-white/40 mb-1">Field Transmission Complete</p>
        <p className="font-black text-lg text-[#D4AF37]">
          {transformed ? "Quantum Shift Detected" : "Resonance Seeding"}
        </p>
        <p className="text-xs text-white/30 mt-2 leading-relaxed">{getTransmissionMessage()}</p>
      </div>

      {/* ── Felt Experience Block ── */}
      <div className="rounded-[24px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-4 py-3" style={{ background: "rgba(212,175,55,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-[#D4AF37]/60">
            ◈ Felt Experience — Post Practice
          </p>
        </div>
        <div className="flex flex-col divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {QUESTIONS.map((q) => {
            const val = subjective[q.key as keyof SubjectiveAnswers];
            return (
              <div key={q.key} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{q.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-white/60">{q.label}</p>
                    <p className="text-[9px] text-white/25">{val <= 2 ? q.low : val >= 4 ? q.high : "Moderate"}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 items-center">
                  {[1,2,3,4,5].map((n) => (
                    <div key={n} className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: n <= val ? "#D4AF37" : "rgba(255,255,255,0.07)",
                        boxShadow: n === val ? "0 0 6px rgba(212,175,55,0.5)" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {/* Subjective score bar */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex justify-between mb-1.5">
            <span className="text-[9px] text-white/30 uppercase tracking-widest">Overall Felt Score</span>
            <span className="text-xs font-black text-[#D4AF37]">{subjectiveAvg}%</span>
          </div>
          <MetricBar value={subjectiveAvg} color="#D4AF37" />
        </div>
      </div>

      {/* ── Biometric Delta Table ── */}
      <div className="rounded-[24px] overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-4 px-4 py-2 text-[9px] font-bold tracking-[0.3em] uppercase text-white/25"
          style={{ background: "rgba(255,255,255,0.02)" }}>
          <span className="col-span-1">Metric</span>
          <span className="text-center">Before</span>
          <span className="text-center">After</span>
          <span className="text-center">Δ</span>
        </div>
        {bioRows.map((r) => (
          <div key={r.label} className="px-4 py-3 items-start"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="grid grid-cols-4 items-center">
              <div className="flex items-center gap-1 col-span-1">
                <r.icon size={10} color="#D4AF37" />
                <span className="text-[9px] text-white/40">{r.label}</span>
              </div>
              <span className="text-center text-xs font-bold text-white/40">{r.bv}{r.unit}</span>
              <span className="text-center text-xs font-bold text-[#D4AF37]">{r.av}{r.unit}</span>
              <div className="flex justify-center">
                <DeltaBadge before={r.bv} after={r.av} unit={r.unit} invert={r.invert} />
              </div>
            </div>
            <p className="text-[8px] text-white/20 mt-1 pl-4">{r.explain}</p>
          </div>
        ))}
      </div>

      {/* Soul Vault save confirmation */}
      <div className="rounded-[20px] p-4 flex items-center gap-3"
        style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(212,175,55,0.1)" }}>
          <Star size={14} color="#D4AF37" />
        </div>
        <div>
          <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]/60">Inscribed to Soul Vault</p>
          <p className="text-[10px] text-white/30">This resonance report is saved to your Deep Field Archive.</p>
        </div>
      </div>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SoulScan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("intro");
  const [beforeBPM, setBeforeBPM] = useState(0);
  const [beforeHRV, setBeforeHRV] = useState(0);
  const [beforeVoice, setBeforeVoice] = useState(60);
  const [afterBPM, setAfterBPM] = useState(0);
  const [afterHRV, setAfterHRV] = useState(0);
  const [afterVoice] = useState(60); // post-practice: no voice scan
  const [subjectiveAnswers, setSubjectiveAnswers] = useState<SubjectiveAnswers>({
    heartOpenness: 3, mentalClarity: 3, bodyLightness: 3, pranaShakti: 3, innerPeace: 3,
  });
  const [scanMode, setScanMode] = useState<"face" | "voice">("face");
  const processingTimer = useRef<NodeJS.Timeout | null>(null);

  const beforeMetrics = beforeBPM ? deriveMetrics(beforeBPM, beforeHRV, beforeVoice) : null;
  const afterMetrics = afterBPM ? deriveMetrics(afterBPM, afterHRV, afterVoice) : null;

  // Save to Supabase
  const saveScan = useCallback(
    async (metrics: ScanMetrics, type: "before" | "after", sessionId: string, sub?: SubjectiveAnswers) => {
      if (!user) return;
      await supabase.from("soul_scans").insert({
        user_id: user.id,
        session_id: sessionId,
        scan_type: type,
        heart_rate: metrics.heartRate,
        hrv_rmssd: metrics.hrv,
        stress_index: metrics.stressIndex,
        coherence_score: metrics.coherenceScore,
        prana_level: metrics.pranaLevel,
        voice_coherence: metrics.voiceCoherence,
        nervous_system_state: metrics.nervousSystemState,
        dosha_vata: metrics.doshaVata,
        dosha_pitta: metrics.doshaKapha,
        dosha_kapha: metrics.doshaKapha2,
        anahata_resonance: metrics.anahataResonance,
        vitality_index: metrics.vitalityIndex,
        ...(sub ? {
          felt_heart_openness: sub.heartOpenness,
          felt_mental_clarity: sub.mentalClarity,
          felt_body_lightness: sub.bodyLightness,
          felt_prana_shakti: sub.pranaShakti,
          felt_inner_peace: sub.innerPeace,
        } : {}),
      });
    },
    [user]
  );

  const sessionId = useRef(crypto.randomUUID());

  const startProcessing = (target: "before" | "after", sub?: SubjectiveAnswers) => {
    const stg = target === "before" ? "processing-before" : "processing-after";
    setStage(stg);
    processingTimer.current = setTimeout(() => {
      if (target === "before") {
        const m = deriveMetrics(beforeBPM, beforeHRV, beforeVoice);
        saveScan(m, "before", sessionId.current);
        setStage("results-before");
      } else {
        const m = deriveMetrics(afterBPM, afterHRV, afterVoice);
        saveScan(m, "after", sessionId.current, sub);
        setStage("comparison");
      }
    }, 3000);
  };

  useEffect(() => () => clearTimeout(processingTimer.current!), []);

  // ── Render stages ──────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (stage) {
      case "intro":
        return (
          <div className="flex flex-col gap-6 px-4">
            <div
              className="rounded-[30px] p-6 flex flex-col items-center gap-4 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.15)" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)" }}
              >
                <Activity size={28} color="#D4AF37" />
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/30 mb-1">Quantum Bio-Twinning V4.2</p>
                <h2 className="text-xl font-black text-white leading-tight">
                  Deep Field<br />
                  <span style={{ color: "#D4AF37" }}>Resonance Scan</span>
                </h2>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                SQI maps your 72,000 Nadis, Dosha field, HRV signature, Prana level, nervous system state, and Anahata resonance — <em>before and after</em> your practice.
              </p>
            </div>

            {/* ── BEFORE YOU BEGIN ── */}
            <div className="rounded-[24px] p-4 flex flex-col gap-3"
              style={{ background: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
              <p className="text-[8px] font-bold tracking-[0.35em] uppercase text-[#D4AF37]/60">◈ Before You Begin</p>
              {[
                { icon: "☀", title: "Good light on your face", desc: "Sit facing a window or lamp. Not backlit. Dark rooms give unreliable readings." },
                { icon: "📱", title: "Hold phone 20–30 cm away", desc: "Your whole face must be visible. Prop the phone if possible so it stays steady." },
                { icon: "🪑", title: "Sit still and take one breath", desc: "Settle before pressing Start. The calmer your body, the more accurate the scan." },
                { icon: "🎵", title: "Hum or breathe audibly for Voice scan", desc: 'Say "Om", hum softly, or breathe through your mouth. Silence gives poor voice data.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-white/80 mb-0.5">{title}</p>
                    <p className="text-[10px] leading-relaxed text-white/35">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scan modes */}
            <div>
              <p className="text-[9px] font-bold tracking-[0.4em] uppercase text-white/25 mb-3">Select Scan Mode</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "face", icon: Camera, label: "Face Camera", sub: "rPPG heart rate + HRV" },
                  { key: "voice", icon: Mic, label: "Voice Field", sub: "Coherence via breath" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setScanMode(m.key as any)}
                    className="rounded-[20px] p-4 flex flex-col gap-2 text-left transition-all"
                    style={{
                      background: scanMode === m.key ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${scanMode === m.key ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <m.icon size={18} color={scanMode === m.key ? "#D4AF37" : "rgba(255,255,255,0.3)"} />
                    <span className="text-xs font-bold text-white/70">{m.label}</span>
                    <span className="text-[10px] text-white/30">{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStage(scanMode === "face" ? "camera-before" : "voice-before")}
              className="w-full py-4 rounded-full font-black text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2"
              style={{ background: "#D4AF37", color: "#050505" }}
            >
              <Zap size={16} />
              Initiate Pre-Practice Scan
            </button>

            <p className="text-center text-[10px] text-white/20">
              Uses your camera or microphone · No data leaves your device raw
            </p>
          </div>
        );

      case "camera-before":
        return (
          <CameraScanner
            label="PRE-PRACTICE SCAN"
            onComplete={(bpm, hrv) => {
              setBeforeBPM(bpm);
              setBeforeHRV(hrv);
              setStage("voice-before");
            }}
          />
        );

      case "voice-before":
        return (
          <VoiceScanner
            onComplete={(coherence) => {
              setBeforeVoice(coherence);
              startProcessing("before");
            }}
          />
        );

      case "processing-before":
      case "processing-after":
        return (
          <div className="flex flex-col items-center gap-8 px-4 py-12">
            <div className="relative w-32 h-32">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: "rgba(212,175,55,0.1)" }}
              />
              <div
                className="absolute inset-4 rounded-full animate-pulse"
                style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">◈</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]/60 mb-2">
                Akasha Computing
              </p>
              <p className="text-white/40 text-sm">
                {stage === "processing-before"
                  ? "Mapping your baseline biofield..."
                  : "Calculating transformation delta..."}
              </p>
            </div>
            <div className="w-48 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full animate-pulse"
                style={{ width: "70%", background: "#D4AF37" }}
              />
            </div>
          </div>
        );

      case "results-before":
        return (
          <div className="flex flex-col gap-4">
            {beforeMetrics && <ResultsPanel metrics={beforeMetrics} label="PRE-PRACTICE BASELINE" />}
            <div className="px-4">
              <button
                onClick={() => setStage("practice-bridge")}
                className="w-full py-4 rounded-full font-black text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2"
                style={{ background: "#D4AF37", color: "#050505" }}
              >
                Begin Your Practice
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        );

      case "practice-bridge":
        return (
          <div className="flex flex-col items-center gap-8 px-4 py-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}
            >
              <span className="text-4xl">🙏</span>
            </div>
            <div className="text-center flex flex-col gap-3">
              <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-white/30">Baseline Locked</p>
              <h2 className="text-2xl font-black text-white">
                Begin Your<br />
                <span style={{ color: "#D4AF37" }}>Sadhana</span>
              </h2>
              <p className="text-sm text-white/40 leading-relaxed">
                Complete your meditation, mantra, or healing audio. Return here when you are finished to measure your transformation.
              </p>
            </div>
            <div
              className="w-full rounded-[20px] p-4"
              style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}
            >
              <p className="text-[9px] font-bold tracking-[0.3em] uppercase text-[#D4AF37]/50 mb-1">Pre-Scan Captured</p>
              {beforeMetrics && (
                <p className="text-xs text-white/40">
                  ♥ {beforeMetrics.heartRate} BPM · HRV {beforeMetrics.hrv}ms · Prana {beforeMetrics.pranaLevel}%
                </p>
              )}
            </div>
            <button
              onClick={() => setStage("camera-after")}
              className="w-full py-4 rounded-full font-black text-sm tracking-[0.15em] uppercase flex items-center justify-center gap-2"
              style={{ background: "#D4AF37", color: "#050505" }}
            >
              <RefreshCw size={16} />
              I Am Ready — Post-Scan
            </button>
          </div>
        );

      case "camera-after":
        return (
          <CameraScanner
            label="POST-PRACTICE SCAN"
            onComplete={(bpm, hrv) => {
              setAfterBPM(bpm);
              setAfterHRV(hrv);
              setStage("questions-after");
            }}
          />
        );

      case "questions-after":
        return (
          <div className="flex flex-col gap-4 px-0">
            <div className="px-4 text-center">
              <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-[#D4AF37]/60 mb-1">
                ◈ Felt Experience
              </p>
              <p className="text-xs text-white/30">
                Camera scan complete. Now tell us how you feel inside.
              </p>
            </div>
            <SubjectiveQuestions
              onComplete={(answers) => {
                setSubjectiveAnswers(answers);
                startProcessing("after", answers);
              }}
            />
          </div>
        );

      case "comparison":
        return (
          <div className="flex flex-col gap-4">
            {beforeMetrics && afterMetrics && (
              <ComparisonPanel before={beforeMetrics} after={afterMetrics} subjective={subjectiveAnswers} />
            )}
            <div className="px-4 flex flex-col gap-2">
              <button
                onClick={() => {
                  sessionId.current = crypto.randomUUID();
                  setBeforeBPM(0);
                  setAfterBPM(0);
                  setStage("intro");
                }}
                className="w-full py-4 rounded-full font-bold text-sm tracking-wider"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                New Scan Session
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stageLabel: Record<Stage, string> = {
    intro: "Soul Scan",
    "camera-before": "Pre-Scan · Camera",
    "voice-before": "Pre-Scan · Voice",
    "processing-before": "Processing",
    "results-before": "Baseline Results",
    "practice-bridge": "Practice Window",
    "camera-after": "Post-Scan · Camera",
    "questions-after": "Felt Experience",
    "processing-after": "Processing",
    comparison: "Before / After",
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#050505", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} color="rgba(255,255,255,0.6)" />
        </button>
        <div className="text-center">
          <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-white/25">
            <GoldDiamond />
            {stageLabel[stage]}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Stage progress dots */}
      <div className="flex justify-center gap-1.5 mb-6">
        {(["intro", "camera-before", "results-before", "practice-bridge", "camera-after", "comparison"] as Stage[]).map(
          (s, i) => {
            const stageOrder = ["intro", "camera-before", "voice-before", "processing-before", "results-before", "practice-bridge", "camera-after", "voice-after", "processing-after", "comparison"];
            const currentIdx = stageOrder.indexOf(stage);
            const thisIdx = stageOrder.indexOf(s);
            return (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: thisIdx === currentIdx ? "16px" : "4px",
                  height: "4px",
                  background: thisIdx <= currentIdx ? "#D4AF37" : "rgba(255,255,255,0.1)",
                }}
              />
            );
          }
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-12">{renderContent()}</div>
    </div>
  );
}
