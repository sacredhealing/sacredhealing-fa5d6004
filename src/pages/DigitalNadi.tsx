// @ts-nocheck
/**
 * Digital Nāḍī — SQI-2050. Results: live <NadiRecommendations> (Supabase);
 * hardcoded Raga/sound-bath text cards removed. rPPG, tap fallback, gating unchanged.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Heart, Wind, Sparkles, Fingerprint, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";
import { BreathingGuide } from "@/components/digital-nadi/BreathingGuide";
import { MeditationPlayer } from "@/components/digital-nadi/MeditationPlayer";
import { NadiRecommendations } from "@/components/digital-nadi/NadiRecommendations";

// ─── SQI 2050 GLOBAL STYLES ───────────────────────────────────────────────────
const SQI_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

  :root {
    --siddha-gold: #D4AF37;
    --akasha-black: #050505;
    --glass-base: rgba(255,255,255,0.02);
    --glass-border: rgba(255,255,255,0.05);
    --vayu-cyan: #22D3EE;
    --coral: #FF6B4A;
    --amber: #FFB84A;
    --sage: #5AE4A8;
    --violet: #B084FF;
  }

  .sqi-page {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #050505;
    color: #fff;
    min-height: 100vh;
    /* App BottomNav + inner SQI pill + safe area — avoid clipped controls */
    padding-bottom: calc(10.5rem + env(safe-area-inset-bottom, 0px));
    position: relative;
    overflow-x: hidden;
  }

  .sqi-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 50% -10%, rgba(212,175,55,0.06) 0%, transparent 70%),
      radial-gradient(ellipse 40% 30% at 80% 80%, rgba(34,211,238,0.03) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .glass-card {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 40px;
  }

  .glass-card-sharp {
    background: rgba(255,255,255,0.02);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 16px;
  }

  .gold-glow {
    text-shadow: 0 0 20px rgba(212,175,55,0.4);
    color: #D4AF37;
  }

  .gold-border {
    border: 1px solid rgba(212,175,55,0.2);
    box-shadow: 0 0 20px rgba(212,175,55,0.05), inset 0 0 20px rgba(212,175,55,0.02);
  }

  .sqi-label {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 8px;
    letter-spacing: 0.5em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
  }

  .sqi-title {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 900;
    letter-spacing: -0.05em;
  }

  .sqi-body {
    font-weight: 400;
    line-height: 1.6;
    color: rgba(255,255,255,0.6);
  }

  .btn-gold {
    padding: 14px 36px;
    background: rgba(212,175,55,0.08);
    border: 1px solid rgba(212,175,55,0.3);
    border-radius: 9999px;
    color: #D4AF37;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 10px;
    letter-spacing: 0.4em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 20px rgba(212,175,55,0.05);
  }
  .btn-gold:hover {
    background: rgba(212,175,55,0.15);
    box-shadow: 0 0 30px rgba(212,175,55,0.15);
    border-color: rgba(212,175,55,0.5);
  }

  .btn-ghost {
    padding: 12px 28px;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 9999px;
    color: rgba(255,255,255,0.4);
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-ghost:hover {
    border-color: rgba(255,255,255,0.2);
    color: rgba(255,255,255,0.7);
  }

  .btn-cyan {
    padding: 12px 28px;
    background: rgba(34,211,238,0.08);
    border: 1px solid rgba(34,211,238,0.25);
    border-radius: 9999px;
    color: #22D3EE;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 800;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .btn-cyan:hover {
    background: rgba(34,211,238,0.14);
    box-shadow: 0 0 20px rgba(34,211,238,0.1);
  }

  /* Pulse ring animation for scan state */
  @keyframes sqi-pulse-ring {
    0% { transform: scale(0.92); opacity: 0.8; }
    50% { transform: scale(1.08); opacity: 0.3; }
    100% { transform: scale(0.92); opacity: 0.8; }
  }

  @keyframes sqi-orbit {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes sqi-orbit-rev {
    from { transform: rotate(0deg); }
    to { transform: rotate(-360deg); }
  }

  @keyframes sqi-fade-in {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes sqi-waveform {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  @keyframes tap-ripple {
    0% { transform: scale(0.8); opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .animate-fade-in {
    animation: sqi-fade-in 0.5s ease both;
  }

  .nadi-pulse-ring {
    animation: sqi-pulse-ring 3s ease-in-out infinite;
  }

  .nadi-orbit {
    animation: sqi-orbit 25s linear infinite;
  }

  .nadi-orbit-rev {
    animation: sqi-orbit-rev 18s linear infinite;
  }

  /* Nav — above AppLayout BottomNav (z-50), clear home-indicator safe area */
  .sqi-nav {
    position: fixed;
    bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    z-index: 60;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border-radius: 9999px;
    background: rgba(5,5,5,0.7);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,175,55,0.04);
  }

  .sqi-nav-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 11px 22px;
    border-radius: 9999px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.25s ease;
    border: none;
  }

  .sqi-nav-btn.active {
    background: rgba(212,175,55,0.12);
    color: #D4AF37;
    box-shadow: 0 0 16px rgba(212,175,55,0.1);
    border: 1px solid rgba(212,175,55,0.2);
  }

  .sqi-nav-btn.inactive {
    background: transparent;
    color: rgba(255,255,255,0.3);
    border: 1px solid transparent;
  }

  .sqi-nav-btn.inactive:hover {
    color: rgba(255,255,255,0.6);
  }

  /* Dosha badge */
  .dosha-badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 9999px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.3em;
    text-transform: uppercase;
  }

  /* Tap BPM button */
  .tap-zone {
    position: relative;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(212,175,55,0.05);
    border: 1px solid rgba(212,175,55,0.25);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
    overflow: hidden;
    margin: 0 auto;
  }
  .tap-zone:active {
    transform: scale(0.95);
    background: rgba(212,175,55,0.1);
  }
  .tap-zone .ripple {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(212,175,55,0.15);
    animation: tap-ripple 0.6s ease-out forwards;
    pointer-events: none;
  }

  /* Vital stats display */
  .vital-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .vital-number {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 300;
    font-size: 48px;
    letter-spacing: -0.04em;
    line-height: 1;
  }
`;

/** Wait until ref is attached (Strict Mode / paint timing). */
function waitForVideoRef(videoRef, maxMs = 5000) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      if (videoRef.current) {
        resolve(videoRef.current);
        return;
      }
      if (performance.now() - start >= maxMs) {
        resolve(null);
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });
}

// ─── rPPG ENGINE ──────────────────────────────────────────────────────────────
class RPPGEngine {
  constructor() {
    this.buffer = [];
    this.timestamps = [];
    this.bufferSize = 256;
    this.bpmHistory = [];
    this.signalQuality = 0;
  }
  addSample(r, g, b, timestamp) {
    const chrominance = 3 * g - 2 * r;
    this.buffer.push(chrominance);
    this.timestamps.push(timestamp);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
      this.timestamps.shift();
    }
  }
  getSignalQuality() {
    if (this.buffer.length < 64) return 0;
    const recent = this.buffer.slice(-64);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((a, b) => a + (b - mean) ** 2, 0) / recent.length;
    const std = Math.sqrt(variance);
    const snr = mean !== 0 ? Math.abs(mean) / (std + 0.001) : 0;
    this.signalQuality = Math.min(1, Math.max(0, 1 - snr * 0.3));
    return this.signalQuality;
  }
  bandpassFilter(signal) {
    if (signal.length < 32) return signal;
    const n = signal.length;
    const dt = this.timestamps.length > 1
      ? (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / (this.timestamps.length - 1)
      : 33.33;
    const fs = 1000 / dt;
    const windowLow = Math.max(2, Math.round(fs / 0.7));
    const windowHigh = Math.max(2, Math.round(fs / 3.5));
    const filtered = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sumLow = 0, countLow = 0;
      for (let j = Math.max(0, i - windowLow); j <= Math.min(n - 1, i + windowLow); j++) {
        sumLow += signal[j]; countLow++;
      }
      filtered[i] = signal[i] - sumLow / countLow;
    }
    const smoothed = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0, count = 0;
      for (let j = Math.max(0, i - windowHigh); j <= Math.min(n - 1, i + windowHigh); j++) {
        sum += filtered[j]; count++;
      }
      smoothed[i] = sum / count;
    }
    return smoothed;
  }
  computeFFTBPM() {
    if (this.buffer.length < 128) return null;
    const signal = this.bandpassFilter([...this.buffer]);
    const n = signal.length;
    const dt = (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / (n - 1);
    const fs = 1000 / dt;
    let bestLag = 0, bestCorr = -Infinity;
    const minLag = Math.round(fs / 3.5);
    const maxLag = Math.round(fs / 0.7);
    const mean = signal.reduce((a, b) => a + b, 0) / n;
    const centered = signal.map((s) => s - mean);
    for (let lag = minLag; lag <= Math.min(maxLag, n - 1); lag++) {
      let corr = 0, count = 0;
      for (let i = 0; i < n - lag; i++) { corr += centered[i] * centered[i + lag]; count++; }
      corr /= count;
      if (corr > bestCorr) { bestCorr = corr; bestLag = lag; }
    }
    if (bestLag === 0) return null;
    const bpm = (fs / bestLag) * 60;
    if (bpm >= 42 && bpm <= 180) {
      this.bpmHistory.push(bpm);
      if (this.bpmHistory.length > 10) this.bpmHistory.shift();
      return Math.round(this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length);
    }
    return null;
  }
  computeHRV() {
    if (this.bpmHistory.length < 5) return null;
    const rr = this.bpmHistory.map((b) => 60000 / b);
    const mean = rr.reduce((a, b) => a + b, 0) / rr.length;
    const variance = rr.reduce((a, b) => a + (b - mean) ** 2, 0) / rr.length;
    return Math.round(Math.sqrt(variance));
  }
  getFilteredSignal() {
    if (this.buffer.length < 32) return this.buffer;
    return this.bandpassFilter([...this.buffer]);
  }
  reset() {
    this.buffer = [];
    this.timestamps = [];
    this.bpmHistory = [];
    this.signalQuality = 0;
  }
}

// ─── Dosha + stress (feeds NadiRecommendations; static text cards removed) ───
function calcNadiReading(bpm, hrv) {
  const stressBpm = Math.max(0, Math.min(1, (bpm - 55) / 60));
  const stressHrv = hrv !== null ? Math.max(0, Math.min(1, 1 - (hrv - 10) / 80)) : 0.5;
  const stress = stressBpm * 0.5 + stressHrv * 0.5;
  let dosha = "Balanced";
  if (bpm > 85 && (hrv === null || hrv < 40)) dosha = "Pitta";
  else if (bpm < 65 && hrv !== null && hrv > 60) dosha = "Kapha";
  else if (hrv !== null && hrv > 50) dosha = "Vāta";
  return { dosha, stress: Math.round(stress * 100) };
}

// ─── TAP BPM ENGINE ───────────────────────────────────────────────────────────
// Used as camera fallback — user taps their pulse rhythm for 10 seconds
function useTapBPM() {
  const [tapBpm, setTapBpm] = useState(null);
  const [tapCount, setTapCount] = useState(0);
  const [tapPhase, setTapPhase] = useState("idle"); // idle | tapping | done
  const [tapElapsed, setTapElapsed] = useState(0);
  const [ripples, setRipples] = useState([]);
  const tapTimestamps = useRef([]);
  const timerRef = useRef(null);
  const TAP_DURATION = 10;

  const finalizeTaps = useCallback(() => {
    const ts = tapTimestamps.current;
    if (ts.length < 3) return;
    const intervals = [];
    for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i - 1]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);
    if (bpm >= 40 && bpm <= 200) setTapBpm(bpm);
  }, []);

  const startTapping = useCallback(() => {
    tapTimestamps.current = [];
    setTapCount(0);
    setTapBpm(null);
    setTapElapsed(0);
    setTapPhase("tapping");
    timerRef.current = setInterval(() => {
      setTapElapsed((t) => {
        if (t + 1 >= TAP_DURATION) {
          clearInterval(timerRef.current);
          finalizeTaps();
          setTapPhase("done");
          return TAP_DURATION;
        }
        return t + 1;
      });
    }, 1000);
  }, [finalizeTaps]);

  const recordTap = useCallback(() => {
    if (tapPhase !== "tapping") return;
    const now = performance.now();
    tapTimestamps.current.push(now);
    setTapCount(c => c + 1);
    // Add ripple
    const id = Date.now();
    setRipples(r => [...r, id]);
    setTimeout(() => setRipples(r => r.filter(x => x !== id)), 600);
    // Live BPM preview from last 3+ taps
    const ts = tapTimestamps.current;
    if (ts.length >= 3) {
      const intervals = [];
      for (let i = 1; i < ts.length; i++) intervals.push(ts[i] - ts[i-1]);
      const avgInterval = intervals.reduce((a,b)=>a+b,0)/intervals.length;
      const liveBpm = Math.round(60000 / avgInterval);
      if (liveBpm >= 40 && liveBpm <= 200) setTapBpm(liveBpm);
    }
  }, [tapPhase]);

  const resetTap = useCallback(() => {
    clearInterval(timerRef.current);
    tapTimestamps.current = [];
    setTapCount(0);
    setTapBpm(null);
    setTapElapsed(0);
    setTapPhase("idle");
    setRipples([]);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { tapBpm, tapCount, tapPhase, tapElapsed, ripples, startTapping, recordTap, resetTap, TAP_DURATION };
}

// ─── INNER APP ────────────────────────────────────────────────────────────────
type TabType = "sensor" | "breathing" | "meditation";

function DigitalNadiInner() {
  const [activeTab, setActiveTab] = useState<TabType>("sensor");
  const [page, setPage] = useState("scan");
  const [phase, setPhase] = useState("idle"); // idle | initializing | scanning | reading | manual | manualDone
  const [bpm, setBpm] = useState(null);
  const [hrv, setHrv] = useState(null);
  const [signal, setSignal] = useState([]);
  const [quality, setQuality] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [usedFallback, setUsedFallback] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(new RPPGEngine());
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const timerRef = useRef(null);
  const scanGenerationRef = useRef(0);

  const tapEngine = useTapBPM();

  const [showNavLabels, setShowNavLabels] = useState(true);
  useEffect(() => {
    const mq = () => setShowNavLabels(typeof window !== "undefined" && window.innerWidth > 400);
    mq();
    window.addEventListener("resize", mq);
    return () => window.removeEventListener("resize", mq);
  }, []);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    engineRef.current.reset();
  }, []);

  const bpmRef = useRef(null);
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const switchToTapMode = useCallback(() => {
    stopCamera();
    setUsedFallback(true);
    setPhase("manual");
    tapEngine.resetTap();
  }, [stopCamera, tapEngine]);

  /** Stuck in "initializing" (e.g. ref never ready, play() hang). */
  useEffect(() => {
    if (phase !== "initializing") return undefined;
    const id = window.setTimeout(() => {
      scanGenerationRef.current += 1;
      stopCamera();
      setPhase("idle");
      setCameraError("Scanner did not start in time. Try again — or use tap pulse when prompted.");
    }, 14000);
    return () => window.clearTimeout(id);
  }, [phase, stopCamera]);

  /** Camera rPPG often never locks BPM; auto-switch to tap pulse mode. */
  useEffect(() => {
    if (phase !== "scanning" && phase !== "reading") return undefined;
    const id = window.setTimeout(() => {
      if (bpmRef.current != null) return;
      stopCamera();
      setUsedFallback(true);
      setPhase("manual");
    }, 32000);
    return () => window.clearTimeout(id);
  }, [phase, stopCamera]);

  const startScan = useCallback(async () => {
    scanGenerationRef.current += 1;
    const gen = scanGenerationRef.current;
    setCameraError(null);
    setPhase("initializing");
    setBpm(null); setHrv(null); setSignal([]); setQuality(0); setElapsed(0);
    engineRef.current.reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
      });
      if (gen !== scanGenerationRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = await waitForVideoRef(videoRef, 5000);
      if (gen !== scanGenerationRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setUsedFallback(true);
        setPhase("manual");
        return;
      }
      video.setAttribute("playsinline", "true");
      video.playsInline = true;
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      if (gen !== scanGenerationRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        return;
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = 320; canvas.height = 240;
      setPhase("scanning");
      timerRef.current = setInterval(() => setElapsed(t => t + 1), 1000);

      const processFrame = () => {
        if (!streamRef.current) return;
        ctx.drawImage(video, 0, 0, 320, 240);
        const img = ctx.getImageData(100, 40, 120, 60);
        const d = img.data;
        let rS = 0, gS = 0, bS = 0;
        const px = 120 * 60;
        for (let i = 0; i < d.length; i += 4) { rS += d[i]; gS += d[i+1]; bS += d[i+2]; }
        const engine = engineRef.current;
        engine.addSample(rS/px, gS/px, bS/px, performance.now());
        setQuality(engine.getSignalQuality());
        const currentBpm = engine.computeFFTBPM();
        if (currentBpm) { setBpm(currentBpm); setPhase("reading"); setHrv(engine.computeHRV()); }
        setSignal([...engine.getFilteredSignal()]);
        animRef.current = requestAnimationFrame(processFrame);
      };
      animRef.current = requestAnimationFrame(processFrame);

    } catch (err) {
      // ─── CAMERA FALLBACK: Activate Manual Tap BPM ───────────────────────
      const isAccessError = err.name === 'NotAllowedError' || err.name === 'NotFoundError'
        || err.name === 'PermissionDeniedError' || err.message?.includes('device not found')
        || err.message?.includes('Permission denied');

      if (isAccessError) {
        setUsedFallback(true);
        setPhase("manual");
        setCameraError(null); // suppress raw error — show friendly UI instead
      } else {
        setCameraError(err.message || "Camera access denied");
        setPhase("idle");
      }
    }
  }, []);

  const acceptManualBpm = useCallback(() => {
    if (tapEngine.tapBpm) {
      setBpm(tapEngine.tapBpm);
      setHrv(null);
      setPhase("manualDone");
    }
  }, [tapEngine.tapBpm]);

  const finishScan = useCallback(() => { stopCamera(); setPage("results"); }, [stopCamera]);

  const handleRescan = useCallback(() => {
    setPage("scan"); setPhase("idle"); setBpm(null); setHrv(null);
    setSignal([]); setQuality(0); setElapsed(0); setUsedFallback(false);
    tapEngine.resetTap();
  }, [tapEngine]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  // ─── BOTTOM NAV ──────────────────────────────────────────────────────────
  const navBtn = (tab: TabType, label: string, Icon: React.ComponentType<{size?: number}>) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`sqi-nav-btn ${activeTab === tab ? 'active' : 'inactive'}`}
    >
      <Icon size={15} />
      <span style={{ display: showNavLabels ? "inline" : "none" }}>{label}</span>
    </button>
  );

  const BottomNav = () => (
    <nav className="sqi-nav">
      {navBtn("sensor", "Nāḍī", Heart)}
      {navBtn("breathing", "Prāṇa", Wind)}
      {navBtn("meditation", "Dhyāna", Sparkles)}
    </nav>
  );

  // ─── WAVEFORM CANVAS ─────────────────────────────────────────────────────
  const WaveformCanvas = ({ data, width = 280, height = 56 }) => {
    const ref = useRef(null);
    useEffect(() => {
      const c = ref.current;
      if (!c || !data.length) return;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      const step = Math.max(1, Math.floor(data.length / width));
      const mid = height / 2;
      // Gradient stroke
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, "rgba(212,175,55,0.2)");
      grad.addColorStop(0.5, "#22D3EE");
      grad.addColorStop(1, "rgba(212,175,55,0.2)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#22D3EE";
      ctx.beginPath();
      for (let i = 0; i < width; i++) {
        const idx = Math.min(i * step, data.length - 1);
        const y = mid - (data[idx] || 0) * 12;
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.stroke();
    }, [data, width, height]);
    return <canvas ref={ref} width={width} height={height} style={{ display: "block", margin: "0 auto", opacity: 0.85 }} />;
  };

  // ─── SCAN PAGE ───────────────────────────────────────────────────────────
  if (activeTab === "breathing") {
    return (
      <div className="sqi-page">
        <style>{SQI_STYLES}</style>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
          <p className="sqi-label" style={{ marginBottom: 10 }}>Prāṇāyāma · Vedic Light-Code</p>
          <h1 className="sqi-title" style={{ fontSize: 26, marginBottom: 6 }}>Breath is the bridge</h1>
          <p className="sqi-body" style={{ fontSize: 13, marginBottom: 36, letterSpacing: "0.1em" }}>between body and spirit.</p>
          <BreathingGuide bpm={bpm} />
          <button onClick={() => setActiveTab("meditation")} className="btn-ghost" style={{ marginTop: 28 }}>
            Continue to Dhyāna →
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (activeTab === "meditation") {
    return (
      <div className="sqi-page">
        <style>{SQI_STYLES}</style>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p className="sqi-label" style={{ marginBottom: 10 }}>Mantra · Dhyāna · Transmission</p>
            <h1 className="sqi-title" style={{ fontSize: 26, marginBottom: 6 }}>Resonating with peace</h1>
            <p className="sqi-body" style={{ fontSize: 13, letterSpacing: "0.1em" }}>The frequency of stillness.</p>
          </div>
          <MeditationPlayer bpm={bpm} hrv={hrv} />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── SENSOR TAB ──────────────────────────────────────────────────────────

  // SCAN PAGE
  if (page === "scan") {
    return (
      <div className="sqi-page">
        <style>{SQI_STYLES}</style>
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ maxWidth: 440, margin: "0 auto", padding: "56px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>

          {/* ── Header ── */}
          <p className="sqi-label" style={{ marginBottom: 12 }}>रक्त नाडी परीक्षा</p>
          <h1 className="sqi-title gold-glow" style={{ fontSize: 32, marginBottom: 8 }}>
            DIGITAL NĀḌĪ
          </h1>
          <p className="sqi-body" style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 48 }}>
            {phase === "manual" || phase === "manualDone"
              ? "Bhakti-Algorithm · Tap-Pulse Mode"
              : "Remote Photoplethysmography"}
          </p>

          {/* ── IDLE STATE ── */}
          {phase === "idle" && (
            <div className="animate-fade-in">
              {/* Orb visualization */}
              <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 40px" }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)",
                  border: "1px solid rgba(212,175,55,0.12)"
                }} className="nadi-pulse-ring" />
                <div style={{
                  position: "absolute", inset: 20, borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.08)"
                }} className="nadi-orbit" />
                <div style={{
                  position: "absolute", inset: 40, borderRadius: "50%",
                  border: "1px solid rgba(34,211,238,0.06)"
                }} className="nadi-orbit-rev" />
                <div style={{
                  position: "absolute", inset: "50%", transform: "translate(-50%,-50%)",
                  width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Heart size={24} color="#D4AF37" opacity={0.6} />
                </div>
              </div>

              <p className="sqi-body" style={{ fontSize: 13, lineHeight: 1.8, marginBottom: 32, maxWidth: 300, margin: "0 auto 32px" }}>
                Position your face within camera view.<br />
                Ensure even, natural lighting — avoid direct sunlight.
              </p>
              <button onClick={startScan} className="btn-gold">
                Begin Scan
              </button>
            </div>
          )}

          {/* ── INITIALIZING ── */}
          {phase === "initializing" && (
            <div className="animate-fade-in">
              <div style={{ position: "relative", width: 160, height: 160, margin: "0 auto 32px" }}>
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: "1px solid rgba(212,175,55,0.2)"
                }} className="nadi-orbit" />
                <div style={{
                  position: "absolute", inset: "50%", transform: "translate(-50%,-50%)",
                  color: "#D4AF37", fontSize: 13, fontWeight: 800, letterSpacing: "0.2em",
                  whiteSpace: "nowrap"
                }}>
                  INIT…
                </div>
              </div>
              <p style={{ color: "#D4AF37", fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase" }}>
                Calibrating Nāḍī Scanner
              </p>
              <button
                type="button"
                onClick={() => {
                  scanGenerationRef.current += 1;
                  stopCamera();
                  setPhase("idle");
                }}
                className="btn-ghost"
                style={{ marginTop: 24 }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* ── SCANNING / READING ── */}
          {(phase === "scanning" || phase === "reading") && (
            <div className="animate-fade-in">
              <p className="sqi-label" style={{ marginBottom: 16 }}>
                {phase === "scanning" ? "Acquiring Prema-Pulse" : "Reading Nāḍī"} · {formatTime(elapsed)}
              </p>

              {/* Signal quality bar */}
              <div style={{ margin: "0 auto 20px", width: 220, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                <div style={{
                  width: `${quality * 100}%`, height: "100%", borderRadius: 2,
                  background: quality > 0.5
                    ? "linear-gradient(90deg, #22D3EE, #5AE4A8)"
                    : "linear-gradient(90deg, #FF6B4A, #FFB84A)",
                  transition: "width 0.3s",
                  boxShadow: quality > 0.5 ? "0 0 8px rgba(34,211,238,0.4)" : "0 0 8px rgba(255,107,74,0.4)"
                }} />
              </div>

              {/* Waveform */}
              <div style={{ margin: "0 0 20px" }}>
                <WaveformCanvas data={signal} />
              </div>

              {/* BPM display */}
              {bpm && (
                <div style={{ marginBottom: 24 }}>
                  <div className="vital-number gold-glow">{bpm}</div>
                  <p className="sqi-label" style={{ color: "rgba(255,255,255,0.4)", marginTop: 4 }}>BPM</p>
                  {hrv !== null && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8, letterSpacing: "0.2em" }}>
                      HRV · {hrv} ms
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    scanGenerationRef.current += 1;
                    stopCamera();
                    setPhase("idle");
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                {bpm && (
                  <button type="button" onClick={finishScan} className="btn-cyan">
                    View Reading →
                  </button>
                )}
              </div>

              {!bpm && elapsed >= 8 && (
                <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 16, border: "1px solid rgba(212,175,55,0.15)", background: "rgba(255,255,255,0.02)" }}>
                  <p className="sqi-body" style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.6 }}>
                    Pulse lock still calibrating. Hold still, face the camera, and add soft front light — or use tap mode for an immediate reading.
                  </p>
                  <button type="button" onClick={switchToTapMode} className="btn-gold" style={{ width: "100%" }}>
                    Use tap pulse instead →
                  </button>
                </div>
              )}

              {bpm && (
                <button type="button" onClick={() => setActiveTab("breathing")} className="btn-ghost" style={{ marginTop: 12 }}>
                  Begin Prāṇāyāma →
                </button>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────
              ✦ MANUAL TAP-BPM FALLBACK (Camera unavailable / iframe blocked)
              Bhakti-Algorithm Mode — Finger Tap Pulse Detection
          ───────────────────────────────────────────────────────────────── */}
          {(phase === "manual" || phase === "manualDone") && (
            <div className="animate-fade-in">
              {/* Info banner */}
              <div className="glass-card-sharp" style={{
                padding: "14px 20px", marginBottom: 32,
                border: "1px solid rgba(212,175,55,0.12)",
                textAlign: "left", display: "flex", gap: 12, alignItems: "flex-start"
              }}>
                <Fingerprint size={18} color="#D4AF37" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.3em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 4 }}>
                    Bhakti-Algorithm Mode
                  </p>
                  <p className="sqi-body" style={{ fontSize: 12 }}>
                    Camera not available in this environment. Tap to the rhythm of your heartbeat for 10 seconds.
                  </p>
                </div>
              </div>

              {/* Tap zone */}
              {tapEngine.tapPhase === "idle" && phase === "manual" && (
                <div>
                  <div className="tap-zone" onClick={tapEngine.startTapping}>
                    <Fingerprint size={36} color="rgba(212,175,55,0.6)" />
                    <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.3em", color: "rgba(212,175,55,0.5)", textTransform: "uppercase", marginTop: 10 }}>
                      Tap to Begin
                    </p>
                  </div>
                  <p className="sqi-body" style={{ fontSize: 12, marginTop: 20 }}>
                    Tap 10× in the rhythm of your pulse
                  </p>
                </div>
              )}

              {tapEngine.tapPhase === "tapping" && (
                <div>
                  {/* Progress arc */}
                  <div style={{ position: "relative", marginBottom: 20 }}>
                    <div
                      className="tap-zone"
                      onClick={tapEngine.recordTap}
                      style={{
                        borderColor: "rgba(212,175,55,0.5)",
                        boxShadow: "0 0 30px rgba(212,175,55,0.1)"
                      }}
                    >
                      {tapEngine.ripples.map(id => (
                        <div key={id} className="ripple" />
                      ))}
                      <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", color: "rgba(212,175,55,0.4)", textTransform: "uppercase", marginBottom: 6 }}>
                        TAP YOUR PULSE
                      </p>
                      {tapEngine.tapBpm ? (
                        <>
                          <div className="vital-number gold-glow" style={{ fontSize: 36 }}>{tapEngine.tapBpm}</div>
                          <p className="sqi-label">BPM</p>
                        </>
                      ) : (
                        <p style={{ fontSize: 28, color: "rgba(212,175,55,0.5)", fontWeight: 300 }}>
                          {tapEngine.tapCount}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: 200, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, margin: "0 auto 8px" }}>
                    <div style={{
                      width: `${(tapEngine.tapElapsed / tapEngine.TAP_DURATION) * 100}%`,
                      height: "100%", background: "linear-gradient(90deg, #D4AF37, #22D3EE)",
                      borderRadius: 2, transition: "width 1s linear",
                      boxShadow: "0 0 8px rgba(212,175,55,0.3)"
                    }} />
                  </div>
                  <p className="sqi-label">{tapEngine.tapElapsed}s / {tapEngine.TAP_DURATION}s</p>
                </div>
              )}

              {(tapEngine.tapPhase === "done" || phase === "manualDone") && tapEngine.tapBpm && (
                <div>
                  <div style={{
                    padding: "28px 32px",
                    background: "rgba(212,175,55,0.04)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    borderRadius: 24, marginBottom: 24
                  }}>
                    <p className="sqi-label" style={{ marginBottom: 12 }}>Pulse Reading</p>
                    <div className="vital-number gold-glow" style={{ fontSize: 56 }}>{tapEngine.tapBpm}</div>
                    <p className="sqi-label" style={{ marginTop: 8, color: "rgba(255,255,255,0.4)" }}>BPM</p>
                  </div>

                  {phase !== "manualDone" ? (
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={tapEngine.resetTap} className="btn-ghost">
                        <RefreshCw size={12} style={{ marginRight: 6 }} /> Retry
                      </button>
                      <button onClick={acceptManualBpm} className="btn-gold">
                        Accept Reading →
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                      <button onClick={finishScan} className="btn-gold">
                        View Nāḍī Reading →
                      </button>
                      <button onClick={() => setActiveTab("breathing")} className="btn-ghost">
                        Begin Prāṇāyāma →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {tapEngine.tapPhase === "done" && !tapEngine.tapBpm && (
                <div>
                  <p className="sqi-body" style={{ fontSize: 13, marginBottom: 20 }}>
                    Not enough taps detected. Please try again.
                  </p>
                  <button onClick={tapEngine.resetTap} className="btn-ghost">↺ Retry</button>
                </div>
              )}
            </div>
          )}

          {/* Camera error (non-access errors only) */}
          {cameraError && (
            <div style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, background: "rgba(255,107,74,0.06)", border: "1px solid rgba(255,107,74,0.15)" }}>
              <p style={{ fontSize: 12, color: "#FF6B4A" }}>{cameraError}</p>
              <button onClick={() => { setCameraError(null); setPhase("idle"); }} className="btn-ghost" style={{ marginTop: 12 }}>
                Try Again
              </button>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    );
  }

  // ─── RESULTS PAGE — live Supabase recommendations only ─────────────────
  if (page === "results" && bpm) {
    const { dosha, stress } = calcNadiReading(bpm, hrv);
    const doshaColors = { Pitta: "#FF6B4A", Kapha: "#5AE4A8", Vāta: "#B084FF", Balanced: "#D4AF37" };
    const doshaColor = doshaColors[dosha] || "#D4AF37";

    return (
      <div className="sqi-page">
        <style>{SQI_STYLES}</style>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>

          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <p className="sqi-label" style={{ marginBottom: 12 }}>Nāḍī Reading Complete</p>

            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 20 }}>
              <div className="vital-stat">
                <span className="vital-number gold-glow">{bpm}</span>
                <p className="sqi-label" style={{ color: "rgba(255,255,255,0.4)" }}>BPM</p>
              </div>
              {hrv !== null && (
                <div style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
              )}
              {hrv !== null && (
                <div className="vital-stat">
                  <span className="vital-number" style={{ fontSize: 48, fontWeight: 300 }}>{hrv}</span>
                  <p className="sqi-label" style={{ color: "rgba(255,255,255,0.4)" }}>HRV ms</p>
                </div>
              )}
              <div style={{ width: 1, background: "rgba(255,255,255,0.06)", alignSelf: "stretch" }} />
              <div className="vital-stat">
                <span className="vital-number" style={{ fontSize: 48, fontWeight: 300 }}>{stress}%</span>
                <p className="sqi-label" style={{ color: "rgba(255,255,255,0.4)" }}>STRESS</p>
              </div>
            </div>

            <span className="dosha-badge" style={{
              background: `${doshaColor}14`,
              border: `1px solid ${doshaColor}33`,
              color: doshaColor,
              boxShadow: `0 0 16px ${doshaColor}15`
            }}>
              {dosha} Dosha
            </span>

            {usedFallback && (
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 12, letterSpacing: "0.15em" }}>
                * Reading via Bhakti-Algorithm tap mode
              </p>
            )}
          </div>

          <NadiRecommendations
            bpm={bpm}
            hrv={hrv}
            dosha={dosha}
            stress={stress}
          />

          <div style={{ textAlign: "center", marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={handleRescan} className="btn-ghost">
              <RefreshCw size={12} style={{ marginRight: 6 }} /> Re-scan
            </button>
            <button onClick={() => setActiveTab("breathing")} className="btn-gold">
              Begin Prāṇāyāma →
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    );
  }

  // Fallback
  return (
    <div className="sqi-page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{SQI_STYLES}</style>
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <p className="sqi-label">Loading Digital Nāḍī…</p>
    </div>
  );
}

// ─── EXPORT with membership/admin gating (UNCHANGED) ─────────────────────────
export default function DigitalNadi() {
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();

  if (authLoading || membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <span className="text-sm uppercase tracking-[0.3em] text-white/40">
          Loading Digital Nāḍī…
        </span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.digitalNadi)) return <Navigate to="/siddha-quantum" replace />;

  return <DigitalNadiInner />;
}
