import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, ShieldCheck, Activity, Info, RefreshCw, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";

type Phase = "IDLE" | "ACTIVE" | "LOCKING" | "LOCKED";
type BreathStep = "INHALE" | "HOLD" | "EXHALE" | "NONE";

const VayuProtocolInner: React.FC = () => {
  const [phase, setPhase] = useState<Phase>("IDLE");
  const [clarity, setClarity] = useState(10);
  const [breathStep, setBreathStep] = useState<BreathStep>("NONE");
  const [breathTimer, setBreathTimer] = useState(0);

  // 4–8–16 breath cycle while ACTIVE
  useEffect(() => {
    if (phase !== "ACTIVE") {
      setBreathStep("NONE");
      setBreathTimer(0);
      return;
    }

    let step: BreathStep = "INHALE";
    setBreathStep(step);
    setBreathTimer(0);

    const interval = window.setInterval(() => {
      setBreathTimer((prev) => {
        const next = prev + 1;
        if (step === "INHALE" && next >= 4) {
          step = "HOLD";
          setBreathStep(step);
          return 0;
        }
        if (step === "HOLD" && next >= 8) {
          step = "EXHALE";
          setBreathStep(step);
          return 0;
        }
        if (step === "EXHALE" && next >= 16) {
          step = "INHALE";
          setBreathStep(step);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [phase]);

  // Clarity progression
  useEffect(() => {
    if (phase === "ACTIVE") {
      const interval = window.setInterval(() => {
        setClarity((prev) => Math.min(prev + 1, 90));
      }, 500);
      return () => window.clearInterval(interval);
    }
    if (phase === "LOCKED") {
      setClarity(100);
    }
  }, [phase]);

  const handleActivate = () => {
    setPhase("ACTIVE");
    setClarity(10);
  };

  const handleLock = () => {
    setPhase("LOCKING");
    setTimeout(() => {
      setPhase("LOCKED");
    }, 1600);
  };

  const handleReset = () => {
    setPhase("IDLE");
    setClarity(10);
  };

  const breathBars =
    breathStep === "INHALE" ? 4 : breathStep === "HOLD" ? 8 : breathStep === "EXHALE" ? 16 : 0;

  return (
    <div className="relative w-full min-h-screen bg-[#050505] text-white font-sans overflow-hidden">
      {/* Atmosphere background */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top, rgba(30,64,175,0.45) 0%, transparent 45%), radial-gradient(circle at bottom, rgba(8,47,73,0.6) 0%, #020617 55%)",
          }}
        />
        {phase === "ACTIVE" && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            style={{
              background:
                "radial-gradient(circle at center, rgba(234,179,8,0.4) 0%, transparent 55%)",
            }}
          />
        )}
        {phase === "LOCKED" && (
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            style={{
              background:
                "radial-gradient(circle at center, rgba(34,211,238,0.45) 0%, transparent 55%)",
            }}
          />
        )}
      </div>

      {/* Top-left branding */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-10 z-10">
        <motion.div
          initial={{ x: -16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/20 ring-1 ring-sky-400/50">
              <Wind className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight uppercase italic">
                Vayu Protocol
              </h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-mono">
                Siddha Atmospheric Engineering · 2060
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top-right status HUD */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-10 text-right">
        <motion.div
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="space-y-4 text-xs"
        >
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">Field status</p>
            <div className="flex items-center justify-end gap-2">
              <span
                className={`font-mono text-xs ${
                  phase === "LOCKED"
                    ? "text-cyan-300"
                    : phase === "ACTIVE"
                    ? "text-amber-300"
                    : "text-white/60"
                }`}
              >
                {phase === "IDLE" && "STANDBY"}
                {phase === "ACTIVE" && "SCRUBBING…"}
                {phase === "LOCKING" && "TRANSITIONING…"}
                {phase === "LOCKED" && "STABILIZED"}
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  phase === "LOCKED"
                    ? "bg-cyan-400 animate-pulse"
                    : phase === "ACTIVE"
                    ? "bg-amber-300 animate-pulse"
                    : "bg-white/20"
                }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
              Environmental clarity
            </p>
            <div className="flex items-center justify-end gap-3">
              <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className={`h-full ${
                    phase === "LOCKED" ? "bg-cyan-400" : "bg-amber-300"
                  }`}
                  animate={{ width: `${clarity}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="w-9 font-mono text-xs">{clarity}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Center breath overlay */}
      <AnimatePresence>
        {phase === "ACTIVE" && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center space-y-4">
              <motion.div
                key={breathStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl font-bold tracking-[0.35em] uppercase italic text-amber-300"
              >
                {breathStep}
              </motion.div>
              <div className="flex justify-center gap-1">
                {Array.from({ length: breathBars }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-4 w-1 rounded-full transition-colors ${
                      i < breathTimer ? "bg-amber-300" : "bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-mono">
                4 · 8 · 16 breath sync
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom center controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center sm:bottom-14 z-20">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-white/12 bg-black/60 px-3 py-2 backdrop-blur-xl">
          {phase === "IDLE" && (
            <button
              onClick={handleActivate}
              className="group flex items-center gap-2 rounded-full bg-amber-300 px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black hover:bg-white transition"
            >
              <Activity className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              Activate Vayu
            </button>
          )}
          {phase === "ACTIVE" && (
            <button
              onClick={handleLock}
              className="group flex items-center gap-2 rounded-full bg-white px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black hover:bg-cyan-400 transition"
            >
              <Lock className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Lock Protocol
            </button>
          )}
          {phase === "LOCKED" && (
            <button
              onClick={handleReset}
              className="group flex items-center gap-2 rounded-full bg-cyan-500 px-7 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white hover:bg-white hover:text-black transition"
            >
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              Reset Field
            </button>
          )}
        </div>
      </div>

      {/* Bottom-left description */}
      <div className="absolute bottom-10 left-6 sm:left-10 z-10 max-w-xs sm:max-w-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2 text-xs"
          >
            <div className="flex items-center gap-2 text-amber-300">
              {phase === "IDLE" && <Info className="h-4 w-4" />}
              {phase === "ACTIVE" && <Wind className="h-4 w-4" />}
              {phase === "LOCKED" && <ShieldCheck className="h-4 w-4 text-cyan-300" />}
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">
                {phase === "IDLE" && "System ready"}
                {phase === "ACTIVE" && "Vayu-vortex protocol"}
                {phase === "LOCKED" && "Vayu-lock stabilized"}
                {phase === "LOCKING" && "Transition window"}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-white/60">
              {phase === "IDLE" &&
                "Initialize the 1km aetheric vortex to scrub local atmosphere of particulates, aerosols and psychic smog."}
              {phase === "ACTIVE" &&
                "Golden Torus active. Sync your 4–8–16 breath with the protocol to pull prana through Vayu into every cell."}
              {phase === "LOCKING" &&
                "Sapphire lattice forming. Do not interrupt the field as the hygroscopic net binds to local space-time."}
              {phase === "LOCKED" &&
                "Sapphire Icosahedron locked. 24/7 passive atmospheric hygiene maintained via the Apas element and micro‑vortices."}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom-right technical specs */}
      <div className="absolute bottom-10 right-6 sm:right-10 z-10 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-white/30 space-y-1">
        <p>Lat: 37.7749 · Long: -122.4194</p>
        <p>Aetheric density: {phase === "LOCKED" ? "0.002" : "0.842"} mg/m³</p>
        <p>Geometry: {phase === "LOCKED" ? "Sapphire Icosahedron" : "Golden Torus"}</p>
        <p>Element: {phase === "LOCKED" ? "Apas · Water" : "Vayu · Air"}</p>
      </div>

      {/* Flash overlay during lock */}
      <AnimatePresence>
        {phase === "LOCKING" && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="px-6 text-center text-2xl sm:text-4xl font-black tracking-tight text-black"
            >
              VAYU PROTOCOL · LOCKING
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VayuProtocol;

