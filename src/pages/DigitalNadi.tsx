// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Heart, Wind, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { BreathingGuide } from "@/components/digital-nadi/BreathingGuide";
import { MeditationPlayer } from "@/components/digital-nadi/MeditationPlayer";

// rPPG ENGINE — Remote Photoplethysmography Signal Processing
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
    const dt =
      this.timestamps.length > 1
        ? (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) /
          (this.timestamps.length - 1)
        : 33.33;
    const fs = 1000 / dt;
    const windowLow = Math.max(2, Math.round(fs / 0.7));
    const windowHigh = Math.max(2, Math.round(fs / 3.5));
    const filtered = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sumLow = 0,
        countLow = 0;
      for (let j = Math.max(0, i - windowLow); j <= Math.min(n - 1, i + windowLow); j++) {
        sumLow += signal[j];
        countLow++;
      }
      filtered[i] = signal[i] - sumLow / countLow;
    }
    const smoothed = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0,
        count = 0;
      for (let j = Math.max(0, i - windowHigh); j <= Math.min(n - 1, i + windowHigh); j++) {
        sum += filtered[j];
        count++;
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
    let bestLag = 0,
      bestCorr = -Infinity;
    const minLag = Math.round(fs / 3.5);
    const maxLag = Math.round(fs / 0.7);
    const mean = signal.reduce((a, b) => a + b, 0) / n;
    const centered = signal.map((s) => s - mean);
    for (let lag = minLag; lag <= Math.min(maxLag, n - 1); lag++) {
      let corr = 0,
        count = 0;
      for (let i = 0; i < n - lag; i++) {
        corr += centered[i] * centered[i + lag];
        count++;
      }
      corr /= count;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
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

// RECOMMENDATION ENGINE
function getRecommendation(bpm, hrv) {
  const stressBpm = Math.max(0, Math.min(1, (bpm - 55) / 60));
  const stressHrv = hrv !== null ? Math.max(0, Math.min(1, 1 - (hrv - 10) / 80)) : 0.5;
  const stress = stressBpm * 0.5 + stressHrv * 0.5;

  let dosha = "Balanced";
  if (bpm > 85 && (hrv === null || hrv < 40)) dosha = "Pitta";
  else if (bpm < 65 && hrv !== null && hrv > 60) dosha = "Kapha";
  else if (hrv !== null && hrv > 50) dosha = "Vāta";

  const sections = [
    {
      id: "music",
      title: "Healing Music",
      sanskrit: "संगीत चिकित्सा",
      icon: "♪",
      color: "#FF6B4A",
      priority: 0,
      reason: "",
      recommendation: "",
    },
    {
      id: "mantra",
      title: "Mantra Chanting",
      sanskrit: "मन्त्र जप",
      icon: "ॐ",
      color: "#FFB84A",
      priority: 0,
      reason: "",
      recommendation: "",
    },
    {
      id: "meditation",
      title: "Guided Meditation",
      sanskrit: "ध्यान",
      icon: "◎",
      color: "#B084FF",
      priority: 0,
      reason: "",
      recommendation: "",
    },
    {
      id: "soundbath",
      title: "Sound Bath",
      sanskrit: "नाद स्नान",
      icon: "∿",
      color: "#5AE4A8",
      priority: 0,
      reason: "",
      recommendation: "",
    },
  ];

  if (stress > 0.65) {
    sections[3].priority = 4;
    sections[3].reason = "Your nervous system needs deep restoration";
    sections[3].recommendation = "Tibetan Singing Bowls — 432Hz Binaural";
    sections[0].priority = 3;
    sections[0].reason = "Slow ragas to bring down elevated heart rate";
    sections[0].recommendation = "Raga Yaman — evening calming raga";
    sections[2].priority = 2;
    sections[2].reason = "Yoga Nidra for full body-mind reset";
    sections[2].recommendation = "30-min Yoga Nidra body scan";
    sections[1].priority = 1;
    sections[1].reason = "Cooling mantras to pacify inner fire";
    sections[1].recommendation = "Om Shanti — peace invocation, 108 repetitions";
  } else if (stress > 0.35) {
    sections[2].priority = 4;
    sections[2].reason = "Mindfulness to dissolve building tension";
    sections[2].recommendation = "15-min breath-awareness meditation";
    sections[1].priority = 3;
    sections[1].reason = "Rhythmic chanting to regulate your breath";
    sections[1].recommendation = "Gayatri Mantra — 21 repetitions";
    sections[0].priority = 2;
    sections[0].reason = "Balancing frequencies to stabilize mood";
    sections[0].recommendation = "Raga Bhairav — morning grounding raga";
    sections[3].priority = 1;
    sections[3].reason = "Crystal bowls for subtle energy alignment";
    sections[3].recommendation = "Crystal Bowl Chakra Sweep — 20 min";
  } else {
    sections[1].priority = 4;
    sections[1].reason = "Your calm state is perfect for deep practice";
    sections[1].recommendation = "So Hum — breath-synchronized mantra";
    sections[2].priority = 3;
    sections[2].reason = "Deepen this stillness with witness meditation";
    sections[2].recommendation = "Vipassana — 20-min insight observation";
    sections[3].priority = 2;
    sections[3].reason = "Amplify this peace with harmonic resonance";
    sections[3].recommendation = "Gong Bath — full spectrum overtones";
    sections[0].priority = 1;
    sections[0].reason = "Ambient soundscapes to sustain the flow";
    sections[0].recommendation = "Raga Darbari — contemplative night raga";
  }

  if (dosha === "Pitta") {
    const m = sections.find((s) => s.id === "music");
    m.recommendation = "Raga Malkauns — cooling moonlight raga";
    m.reason = "Pitta-pacifying frequencies to cool inner fire";
  } else if (dosha === "Vāta") {
    const sb = sections.find((s) => s.id === "soundbath");
    sb.recommendation = "Didgeridoo Drone — deep grounding vibration";
    sb.reason = "Root-chakra tones to anchor scattered Vāta energy";
  } else if (dosha === "Kapha") {
    const mt = sections.find((s) => s.id === "mantra");
    mt.recommendation = "Agni Mantra — Ram Ram — fire activation";
    mt.reason = "Energizing vibration to awaken sluggish Kapha";
  }

  sections.sort((a, b) => b.priority - a.priority);
  return { sections, stress: Math.round(stress * 100), dosha };
}

// MAIN APP — DIGITAL NĀḌĪ (inner, ungated)
type TabType = "sensor" | "breathing" | "meditation";
function DigitalNadiInner() {
  const [activeTab, setActiveTab] = useState<TabType>("sensor");
  const [page, setPage] = useState("scan");
  const [phase, setPhase] = useState("idle");
  const [bpm, setBpm] = useState(null);
  const [hrv, setHrv] = useState(null);
  const [signal, setSignal] = useState([]);
  const [quality, setQuality] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(new RPPGEngine());
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const timerRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    engineRef.current.reset();
  }, []);

  const startScan = useCallback(async () => {
    setCameraError(null);
    setPhase("initializing");
    setBpm(null);
    setHrv(null);
    setSignal([]);
    setQuality(0);
    setElapsed(0);
    engineRef.current.reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      canvas.width = 320;
      canvas.height = 240;
      setPhase("scanning");

      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);

      const processFrame = () => {
        if (!streamRef.current) return;
        ctx.drawImage(video, 0, 0, 320, 240);
        const img = ctx.getImageData(100, 40, 120, 60);
        const d = img.data;
        let rS = 0,
          gS = 0,
          bS = 0;
        const px = 120 * 60;
        for (let i = 0; i < d.length; i += 4) {
          rS += d[i];
          gS += d[i + 1];
          bS += d[i + 2];
        }
        const engine = engineRef.current;
        engine.addSample(rS / px, gS / px, bS / px, performance.now());
        setQuality(engine.getSignalQuality());
        const currentBpm = engine.computeFFTBPM();
        if (currentBpm) {
          setBpm(currentBpm);
          setPhase("reading");
          setHrv(engine.computeHRV());
        }
        setSignal([...engine.getFilteredSignal()]);
        animRef.current = requestAnimationFrame(processFrame);
      };
      animRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      setCameraError(err.message || "Camera access denied");
      setPhase("idle");
    }
  }, []);

  const finishScan = useCallback(() => {
    stopCamera();
    setPage("results");
  }, [stopCamera]);

  const handleRescan = useCallback(() => {
    setPage("scan");
    setPhase("idle");
    setBpm(null);
    setHrv(null);
    setSignal([]);
    setQuality(0);
    setElapsed(0);
  }, []);

  const handleNavigateSection = useCallback((section) => {
    setActiveSection(section);
    setPage("section");
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const recommendation = bpm ? getRecommendation(bpm, hrv) : null;

  // ─── Bottom Nav (Sensor | Breath | Mantra) ───
  const navStyle = {
    position: "fixed" as const,
    bottom: 32,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 9999,
    background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
  };
  const navBtn = (tab: TabType, label: string, Icon: React.ComponentType<{ size?: number }>) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 24px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.3s",
        ...(activeTab === tab
          ? { background: "#FF6B4A", color: "#fff" }
          : { background: "transparent", color: "rgba(255,255,255,0.4)" }),
      }}
    >
      <Icon size={18} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
  const BottomNav = () => (
    <nav style={navStyle}>
      {navBtn("sensor", "Sensor", Heart)}
      {navBtn("breathing", "Breath", Wind)}
      {navBtn("meditation", "Mantra", Sparkles)}
    </nav>
  );

  // ─── BREATHING TAB ───
  if (activeTab === "breathing") {
    return (
      <div style={{ fontFamily: "'Cormorant Garamond', serif", background: "#050505", color: "#fff", minHeight: "100vh", paddingBottom: 120 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>Pranayama</p>
          <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "0.12em", margin: "0 0 6px" }}>Breath is the bridge</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", marginBottom: 32 }}>between body and spirit.</p>
          <BreathingGuide bpm={bpm} />
          <button
            onClick={() => setActiveTab("meditation")}
            style={{ marginTop: 24, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", background: "none", border: "none", cursor: "pointer" }}
          >
            Skip to Meditation →
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── MEDITATION TAB ───
  if (activeTab === "meditation") {
    return (
      <div style={{ fontFamily: "'Cormorant Garamond', serif", background: "#050505", color: "#fff", minHeight: "100vh", paddingBottom: 120 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>Mantra & Dhyana</p>
          <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "0.12em", margin: "0 0 6px", textAlign: "center" }}>Resonating with peace</h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", marginBottom: 32, textAlign: "center" }}>The frequency of stillness.</p>
          <MeditationPlayer bpm={bpm} hrv={hrv} />
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── SENSOR TAB (scan / results / section) ───
  // Waveform mini-canvas ───
  const WaveformCanvas = ({ data, width = 280, height = 60 }) => {
    const ref = useRef(null);
    useEffect(() => {
      const c = ref.current;
      if (!c || !data.length) return;
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      const step = Math.max(1, Math.floor(data.length / width));
      const mid = height / 2;
      ctx.strokeStyle = "#5AE4A8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < width; i++) {
        const idx = Math.min(i * step, data.length - 1);
        const y = mid - (data[idx] || 0) * 12;
        i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y);
      }
      ctx.stroke();
    }, [data, width, height]);
    return <canvas ref={ref} width={width} height={height} style={{ display: "block", margin: "0 auto" }} />;
  };

  // ─── SCAN PAGE ───
  if (page === "scan") {
    return (
      <div style={{ fontFamily: "'Cormorant Garamond', serif", background: "#050505", color: "#fff", minHeight: "100vh" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>
        <video ref={videoRef} style={{ display: "none" }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
          {/* Header */}
          <p style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 8 }}>
            रक्त नाडी परीक्षा
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "0.12em", margin: "0 0 6px" }}>
            DIGITAL NĀḌĪ
          </h1>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em" }}>
            Remote Photoplethysmography
          </p>

          {/* Status */}
          <div style={{ margin: "48px 0 32px" }}>
            {phase === "idle" && (
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
                Position your face within camera view.<br />
                Ensure even, natural lighting — avoid direct sunlight.
              </p>
            )}
            {phase === "initializing" && (
              <p style={{ fontSize: 14, color: "#FFB84A" }}>Initializing camera…</p>
            )}
            {(phase === "scanning" || phase === "reading") && (
              <div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", marginBottom: 16 }}>
                  {phase === "scanning" ? "ACQUIRING SIGNAL" : "READING PULSE"}　·　{formatTime(elapsed)}
                </p>

                {/* Signal quality bar */}
                <div style={{ margin: "0 auto 20px", width: 200, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                  <div style={{
                    width: `${quality * 100}%`,
                    height: "100%",
                    borderRadius: 2,
                    background: quality > 0.5 ? "#5AE4A8" : "#FF6B4A",
                    transition: "width 0.3s",
                  }} />
                </div>

                {/* Waveform */}
                <WaveformCanvas data={signal} />

                {/* BPM display */}
                {bpm && (
                  <div style={{ marginTop: 24 }}>
                    <span style={{ fontSize: 56, fontWeight: 300, letterSpacing: "0.05em" }}>{bpm}</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>BPM</span>
                    {hrv !== null && (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
                        HRV {hrv} ms
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            {cameraError && (
              <p style={{ fontSize: 13, color: "#FF6B4A", marginTop: 12 }}>{cameraError}</p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {phase === "idle" && (
                <button
                  onClick={startScan}
                  style={{
                    padding: "14px 36px",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff",
                    fontSize: 13,
                    letterSpacing: "0.2em",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  Begin Scan
                </button>
              )}
              {(phase === "scanning" || phase === "reading") && (
                <>
                  <button
                    onClick={() => { stopCamera(); setPhase("idle"); }}
                    style={{
                      padding: "12px 28px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 12,
                      letterSpacing: "0.15em",
                      cursor: "pointer",
                      textTransform: "uppercase",
                    }}
                  >
                    Cancel
                  </button>
                  {bpm && (
                    <button
                      onClick={finishScan}
                      style={{
                        padding: "12px 28px",
                        background: "rgba(90,228,168,0.12)",
                        border: "1px solid rgba(90,228,168,0.3)",
                        color: "#5AE4A8",
                        fontSize: 12,
                        letterSpacing: "0.15em",
                        cursor: "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      View Results
                    </button>
                  )}
                </>
              )}
            </div>
            {bpm && (
              <button
                onClick={() => setActiveTab("breathing")}
                style={{
                  padding: "12px 28px",
                  background: "rgba(255,107,74,0.15)",
                  border: "1px solid rgba(255,107,74,0.35)",
                  color: "#FF6B4A",
                  fontSize: 12,
                  letterSpacing: "0.15em",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                Begin Breathing →
              </button>
            )}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── RESULTS PAGE ───
  if (page === "results" && recommendation) {
    return (
      <div style={{ fontFamily: "'Cormorant Garamond', serif", background: "#050505", color: "#fff", minHeight: "100vh" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px" }}>
          {/* Vitals Summary */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.35em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginBottom: 12 }}>
              Nāḍī Reading Complete
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 42, fontWeight: 300 }}>{bpm}</span>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>BPM</p>
              </div>
              {hrv !== null && (
                <div>
                  <span style={{ fontSize: 42, fontWeight: 300 }}>{hrv}</span>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>HRV ms</p>
                </div>
              )}
              <div>
                <span style={{ fontSize: 42, fontWeight: 300 }}>{recommendation.stress}%</span>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em" }}>STRESS</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              Dominant Dosha: <span style={{ color: "#FFB84A" }}>{recommendation.dosha}</span>
            </p>
          </div>

          {/* Recommendation Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {recommendation.sections.map((sec, i) => (
              <button
                key={sec.id}
                onClick={() => handleNavigateSection(sec)}
                style={{
                  textAlign: "left",
                  padding: "20px 24px",
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${sec.color}22`,
                  borderRadius: 2,
                  cursor: "pointer",
                  color: "#fff",
                  width: "100%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, color: sec.color }}>{sec.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: "0.08em" }}>{sec.title}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>#{i + 1}</span>
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5, margin: "0 0 4px" }}>
                  {sec.reason}
                </p>
                <p style={{ fontSize: 11, color: sec.color, opacity: 0.8 }}>
                  → {sec.recommendation}
                </p>
              </button>
            ))}
          </div>

          {/* Re-scan button */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button
              onClick={handleRescan}
              style={{
                padding: "12px 32px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                fontSize: 12,
                letterSpacing: "0.15em",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              Re-scan
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // ─── SECTION DETAIL PAGE ───
  if (page === "section" && activeSection) {
    return (
      <div style={{ fontFamily: "'Cormorant Garamond', serif", background: "#050505", color: "#fff", minHeight: "100vh" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>
        <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
          <button
            onClick={() => setPage("results")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              letterSpacing: "0.15em",
              cursor: "pointer",
              marginBottom: 32,
              textTransform: "uppercase",
            }}
          >
            ← Back to Results
          </button>

          <span style={{ fontSize: 48, display: "block", marginBottom: 16, color: activeSection.color }}>
            {activeSection.icon}
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: "0.1em", margin: "0 0 4px" }}>
            {activeSection.title}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>
            {activeSection.sanskrit}
          </p>

          <div style={{
            padding: "24px",
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${activeSection.color}22`,
            borderRadius: 2,
            textAlign: "left",
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 12 }}>
              {activeSection.reason}
            </p>
            <p style={{ fontSize: 14, color: activeSection.color, fontWeight: 500 }}>
              {activeSection.recommendation}
            </p>
          </div>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", lineHeight: 1.7, maxWidth: 320, margin: "0 auto" }}>
            This recommendation was generated from your live biometric reading. For best results, practice during the time of day aligned with your dominant dosha rhythm.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Fallback
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', serif", background: "#050505", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');`}</style>
      <video ref={videoRef} style={{ display: "none" }} playsInline muted />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Loading…</p>
    </div>
  );
}

// Export with membership/admin gating
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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.digitalNadi)) {
    return <Navigate to="/siddha-quantum" replace />;
  }

  return <DigitalNadiInner />;
}

