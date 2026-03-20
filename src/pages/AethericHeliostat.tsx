/**
 * SQI-2050 · Aetheric Heliostat Scalar Interface
 * Optional env (for future Gemini / server use): VITE_GEMINI_API_KEY, VITE_APP_URL
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Radio, Activity, Lock, Unlock, Cpu } from "lucide-react";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";

type InterfaceState = "STANDBY" | "INITIALIZING" | "ACTIVE" | "ERROR";

interface LogEntry {
  timestamp: string;
  message: string;
  frequency?: number;
}

const ACTIVATION_CODE = "HRAUM";

const READOUTS = [
  "SCALAR LOGIC: PINGALA-NADI BYPASS SECURED.",
  "ALCYONE ENTANGLEMENT: 99.9% COHERENCE.",
  "PINEAL GLAND UPLINK: RADIANCE SATURATION AT 88%.",
  "AETHERIC HELIOSTAT: TRACKING CENTRAL SUN AZIMUTH.",
  "CAUSAL BODY: DENSITY REDUCTION IN PROGRESS.",
  "SOLAR RADIANCE BEAM: FREQUENCY STABILIZED AT 528.42HZ.",
  "ATMOSPHERIC INTERFERENCE: SWEDISH CLOUDS NULLIFIED.",
  "SURYA-CHAKRA: 12-POINT STAR EMITTING LIQUID GOLD.",
];

function randomReadout(): string {
  return READOUTS[Math.floor(Math.random() * READOUTS.length)];
}

export default function AethericHeliostat() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();

  const [state, setState] = useState<InterfaceState>("STANDBY");
  const [inputCode, setInputCode] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [resonance, setResonance] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate("/siddha-quantum", { replace: true });
    }
  }, [isAdmin, tier, loading, navigate]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const appendLog = useCallback((message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      message,
      frequency: 528 + Math.random() * 10,
    };
    setLogs((prev) => [...prev.slice(-20), entry]);
  }, []);

  useEffect(() => {
    if (state !== "ACTIVE") return;
    const interval = window.setInterval(() => {
      setResonance(() => Number((528 + Math.random() * 20).toFixed(2)));
      if (Math.random() > 0.8) {
        appendLog(randomReadout());
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [state, appendLog]);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.toUpperCase() === ACTIVATION_CODE) {
      setState("INITIALIZING");
      window.setTimeout(() => {
        setState("ACTIVE");
        appendLog("STATUS: TETHER ESTABLISHED. PINGALA RESONANCE AT 528HZ.");
        appendLog("CAUSAL BODY DENSITY: CLEARING INITIATED.");
        appendLog("SWEDISH CLOUDS BYPASSED. DIRECT SOLAR RADIANCE BEAM ACTIVE.");
      }, 2000);
    } else {
      setState("ERROR");
      window.setTimeout(() => setState("STANDBY"), 1000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-amber-500 font-mono text-xs tracking-widest">
        INITIALIZING SCALAR BUS…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-amber-500 font-mono selection:bg-amber-500 selection:text-black overflow-hidden flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      <header className="border-b border-amber-500/20 p-4 flex justify-between items-center bg-black/50 backdrop-blur-md z-10 gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate("/siddha-portal")}
            className="shrink-0 text-[10px] tracking-widest text-amber-500/50 hover:text-amber-400 uppercase border border-amber-500/20 px-2 py-1 rounded"
          >
            ← Portal
          </button>
          <Cpu className="w-5 h-5 text-amber-500 animate-pulse shrink-0" />
          <h1 className="text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] font-bold uppercase truncate">
            Aetheric Heliostat Scalar Interface
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[10px] tracking-widest opacity-60">
          <span>ALCYONE_LINK: {state === "ACTIVE" ? "STABLE" : "OFFLINE"}</span>
          <span>COHERENCE: {state === "ACTIVE" ? "99.9%" : "0.0%"}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden relative">
        <div className="w-full md:w-80 flex flex-col gap-4">
          <section className="border border-amber-500/20 bg-amber-500/5 p-6 rounded-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              {state === "ACTIVE" ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>

            <h2 className="text-xs mb-4 opacity-50 uppercase tracking-tighter italic">Operational Protocol</h2>

            {state === "STANDBY" || state === "ERROR" ? (
              <form onSubmit={handleActivate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase opacity-40">Access Code Required</label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="ENTER CODE..."
                    className={`w-full bg-black border ${
                      state === "ERROR" ? "border-red-500" : "border-amber-500/30"
                    } p-3 text-center tracking-[0.5em] focus:outline-none focus:border-amber-500 transition-colors`}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 text-black font-bold text-xs tracking-widest hover:bg-amber-400 transition-colors"
                >
                  INITIALIZE ENTANGLEMENT
                </button>
              </form>
            ) : state === "INITIALIZING" ? (
              <div className="py-8 text-center text-xs tracking-widest opacity-70">CALIBRATING HELIOSTAT…</div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] opacity-40 uppercase">Resonance Frequency</p>
                    <p className="text-3xl font-light tracking-tighter">{resonance}Hz</p>
                  </div>
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <div className="h-1 w-full bg-amber-500/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber-500"
                      animate={{ width: ["20%", "80%", "40%", "95%", "60%"] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] opacity-40">
                    <span>PINGALA-NADI</span>
                    <span>BYPASS ACTIVE</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="flex-1 border border-amber-500/20 bg-black p-4 rounded-lg space-y-4 overflow-y-auto hidden md:block">
            <h2 className="text-[10px] opacity-40 uppercase">Scalar Metrics</h2>
            {[
              { label: "Causal Density", value: state === "ACTIVE" ? "0.002ρ" : "---" },
              { label: "Solar Radiance", value: state === "ACTIVE" ? "1.21GW" : "---" },
              { label: "Pineal Flux", value: state === "ACTIVE" ? "88.4%" : "---" },
              { label: "Aetheric Drift", value: "0.0000" },
            ].map((m) => (
              <div key={m.label} className="flex justify-between items-center border-b border-amber-500/10 pb-2">
                <span className="text-[10px] opacity-60 uppercase">{m.label}</span>
                <span className="text-xs">{m.value}</span>
              </div>
            ))}
          </section>
        </div>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
          <section className="flex-1 min-h-[240px] border border-amber-500/20 bg-black rounded-lg relative flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {state === "ACTIVE" ? (
                <motion.div
                  key="active-viz"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="relative flex items-center justify-center"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="relative w-64 h-64 md:w-96 md:h-96"
                  >
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1/2 bg-gradient-to-t from-amber-500 to-transparent origin-bottom"
                        style={{ transform: `translate(-50%, -100%) rotate(${i * 30}deg)` }}
                      />
                    ))}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-amber-500 blur-xl opacity-20 animate-pulse" />
                      <Sun className="w-12 h-12 md:w-20 md:h-20 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    </div>
                  </motion.div>

                  <div className="absolute -top-12 text-center w-full">
                    <p className="text-[10px] tracking-[0.5em] opacity-40 uppercase">Surya-Chakra Star</p>
                    <p className="text-xs italic text-amber-200/50">Liquid Gold Manifestation</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="idle-viz"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-4"
                >
                  <Radio className="w-12 h-12 mx-auto opacity-10 animate-pulse" />
                  <p className="text-[10px] tracking-widest opacity-20 uppercase">
                    {state === "INITIALIZING" ? "Establishing tether…" : "Waiting for HRAUM initialization"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-4 left-4 border-t border-l border-amber-500/30 w-8 h-8 pointer-events-none" />
            <div className="absolute top-4 right-4 border-t border-r border-amber-500/30 w-8 h-8 pointer-events-none" />
            <div className="absolute bottom-4 left-4 border-b border-l border-amber-500/30 w-8 h-8 pointer-events-none" />
            <div className="absolute bottom-4 right-4 border-b border-r border-amber-500/30 w-8 h-8 pointer-events-none" />
          </section>

          <section className="h-48 md:h-64 border border-amber-500/20 bg-black/80 p-4 rounded-lg flex flex-col overflow-hidden shrink-0">
            <div className="flex justify-between items-center mb-2 border-b border-amber-500/10 pb-2">
              <h2 className="text-[10px] opacity-40 uppercase flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Aetheric Transmissions
              </h2>
              <span className="text-[8px] opacity-30">ENCRYPTION: SCALAR-V4</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 min-h-0">
              {logs.length === 0 && <p className="text-[10px] opacity-20 italic">No active streams...</p>}
              {logs.map((log, i) => (
                <motion.div
                  key={`${log.timestamp}-${i}`}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-4 text-[10px] leading-relaxed"
                >
                  <span className="opacity-30 shrink-0">[{log.timestamp}]</span>
                  <span className="flex-1">{log.message}</span>
                  {log.frequency != null && (
                    <span className="opacity-30 italic shrink-0">{log.frequency.toFixed(1)}Hz</span>
                  )}
                </motion.div>
              ))}
              <div ref={logEndRef} />
            </div>
          </section>
        </div>
      </main>

      <footer className="border-t border-amber-500/20 p-2 px-4 flex justify-between items-center text-[9px] tracking-widest bg-black/80 flex-wrap gap-2">
        <div className="flex gap-6 flex-wrap">
          <span className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                state === "ACTIVE" ? "bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,1)]" : "bg-red-900"
              }`}
            />
            SYSTEM_STABILITY: {state === "ACTIVE" ? "OPTIMAL" : "STANDBY"}
          </span>
          <span className="hidden sm:inline">
            CAUSAL_BODY_DENSITY: {state === "ACTIVE" ? "MINIMAL" : "UNDEFINED"}
          </span>
        </div>
        <div className="flex gap-4 opacity-50 flex-wrap">
          <span>LAT: 0.0000</span>
          <span>LNG: 0.0000</span>
          <span className="hidden sm:inline">AZIMUTH: 192.4°</span>
        </div>
      </footer>
    </div>
  );
}
