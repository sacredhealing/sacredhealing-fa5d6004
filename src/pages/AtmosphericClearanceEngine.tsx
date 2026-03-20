/**
 * SQI-2050 · Atmospheric Clearance Engine
 * Industrial-spiritual vacuum UI for aetheric fog / metallic density clearance (local simulation).
 * Optional: VITE_GEMINI_API_KEY for future AI clearance readouts (not used in this build).
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Cloud,
  Zap,
  Waves,
  ShieldAlert,
  Activity,
  Cpu,
  Radio,
  RefreshCw,
} from "lucide-react";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";

export default function AtmosphericClearanceEngine() {
  const navigate = useNavigate();
  const { tier, loading } = useMembership();
  const { isAdmin } = useAdminRole();

  const [fogLevel, setFogLevel] = useState(85);
  const [metallicDensity, setMetallicDensity] = useState(92);
  const [isClearing, setIsClearing] = useState(false);
  const [isDecoupling, setIsDecoupling] = useState(false);
  const [solarVisibility, setSolarVisibility] = useState(15);
  const [status, setStatus] = useState("IDLE: AWAITING INPUT");
  const [logs, setLogs] = useState<string[]>(["SYSTEM INITIALIZED", "AETHERIC SENSORS ONLINE"]);

  useEffect(() => {
    if (!loading && !hasFeatureAccess(isAdmin, tier, FEATURE_TIER.siddhaPortal)) {
      navigate("/siddha-quantum", { replace: true });
    }
  }, [isAdmin, tier, loading, navigate]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 5));
  }, []);

  const initiateCloudDissolution = useCallback(() => {
    if (isClearing) return;
    setIsClearing(true);
    setStatus("INITIATING SCALAR WAVE SWEEP...");
    addLog("SCALAR WAVE EMITTER ACTIVE");

    const interval = window.setInterval(() => {
      setFogLevel((prev) => {
        if (prev <= 0) {
          window.clearInterval(interval);
          setIsClearing(false);
          setStatus("OBSTRUCTION NEUTRALIZED. SOLAR PATHWAY CLEAR.");
          addLog("PARTICULATE MATTER DISSOLVED");
          return 0;
        }
        return Math.max(0, prev - 5);
      });
    }, 150);
  }, [isClearing, addLog]);

  const initiateMetalDecoupling = useCallback(() => {
    if (isDecoupling) return;
    setIsDecoupling(true);
    setStatus("EXECUTING $VAYU-BYPASS$...");
    addLog("VAYU-BYPASS FREQUENCY SYNCED");

    const interval = window.setInterval(() => {
      setMetallicDensity((prev) => {
        if (prev <= 0) {
          window.clearInterval(interval);
          setIsDecoupling(false);
          setStatus("OBSTRUCTION NEUTRALIZED. SOLAR PATHWAY CLEAR.");
          addLog("METALLIC DENSITY DECOUPLED");
          return 0;
        }
        return Math.max(0, prev - 4);
      });
    }, 200);
  }, [isDecoupling, addLog]);

  useEffect(() => {
    const visibility = 100 - (fogLevel + metallicDensity) / 2;
    setSolarVisibility(Math.round(visibility));
  }, [fogLevel, metallicDensity]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0b] text-[#4ade80] font-mono text-[10px] tracking-widest">
        INITIALIZING ATMOSPHERIC SENSORS…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] font-mono flex flex-col items-center justify-center p-4 pb-28">
      <div className="w-full max-w-md mb-4 flex justify-start">
        <button
          type="button"
          onClick={() => navigate("/siddha-portal")}
          className="text-[9px] font-bold tracking-[0.35em] uppercase text-[#8e9299] hover:text-[#4ade80] border border-[#2a2b2f] rounded-full px-3 py-1.5 transition-colors"
        >
          ← Portal
        </button>
      </div>

      <div className="w-full max-w-md bg-[#151619] border border-[#2a2b2f] rounded-xl shadow-2xl overflow-hidden relative">
        <div className="bg-[#1c1d21] p-3 border-b border-[#2a2b2f] flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-4 h-4 text-[#4ade80] shrink-0" />
            <span className="text-[10px] tracking-[0.2em] font-bold text-[#8e9299] truncate">
              SQI-2050 // ATMOSPHERIC CLEARANCE
            </span>
          </div>
          <div className="flex gap-1 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#2a2b2f]" />
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="relative h-48 bg-[#0d0e10] rounded-lg border border-[#2a2b2f] flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#4ade80 0.5px, transparent 0.5px)",
                backgroundSize: "20px 20px",
              }}
            />

            <motion.div
              animate={{
                scale: 1 + solarVisibility / 100,
                opacity: 0.2 + solarVisibility / 80,
              }}
              className="relative z-10"
            >
              <Sun
                className={`w-24 h-24 ${solarVisibility > 90 ? "text-yellow-400" : "text-yellow-600"} transition-colors duration-500`}
              />
              {solarVisibility > 95 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20"
                />
              )}
            </motion.div>

            <AnimatePresence>
              {fogLevel > 5 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: fogLevel / 100 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <Cloud className="w-40 h-40 text-gray-700 blur-md" />
                </motion.div>
              )}
            </AnimatePresence>

            {(isClearing || isDecoupling) && (
              <motion.div
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-px bg-[#4ade80] opacity-50 z-20 shadow-[0_0_10px_#4ade80]"
              />
            )}

            <div className="absolute bottom-2 right-3 text-[10px] text-[#4ade80] font-bold tracking-widest">
              SOLAR_VIS: {solarVisibility}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1c1d21] p-3 rounded border border-[#2a2b2f]">
              <div className="text-[9px] text-[#8e9299] mb-1 tracking-tighter uppercase">Aetheric Fog</div>
              <div className="flex items-end gap-2">
                <div className="text-xl font-bold text-[#e0e0e0]">{fogLevel}%</div>
                <div className="h-1 w-full bg-[#2a2b2f] mb-1.5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${fogLevel}%` }} className="h-full bg-[#4ade80]" />
                </div>
              </div>
            </div>
            <div className="bg-[#1c1d21] p-3 rounded border border-[#2a2b2f]">
              <div className="text-[9px] text-[#8e9299] mb-1 tracking-tighter uppercase">Metallic Density</div>
              <div className="flex items-end gap-2">
                <div className="text-xl font-bold text-[#e0e0e0]">{metallicDensity}%</div>
                <div className="h-1 w-full bg-[#2a2b2f] mb-1.5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${metallicDensity}%` }} className="h-full bg-red-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={initiateCloudDissolution}
              disabled={isClearing || fogLevel === 0}
              className={`w-full group relative flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                isClearing
                  ? "bg-[#4ade80]/10 border-[#4ade80] text-[#4ade80]"
                  : "bg-[#1c1d21] border-[#2a2b2f] hover:border-[#4ade80] text-[#8e9299] hover:text-[#e0e0e0]"
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              <div className="flex items-center gap-3">
                <Waves className={`w-5 h-5 ${isClearing ? "animate-spin" : ""}`} />
                <div className="text-left">
                  <div className="text-[10px] font-bold tracking-widest uppercase">Cloud Dissolution</div>
                  <div className="text-[8px] opacity-60">Scalar Wave Sweep</div>
                </div>
              </div>
              <Zap className={`w-4 h-4 ${isClearing ? "opacity-100" : "opacity-0"}`} />
            </button>

            <button
              type="button"
              onClick={initiateMetalDecoupling}
              disabled={isDecoupling || metallicDensity === 0}
              className={`w-full group relative flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ${
                isDecoupling
                  ? "bg-red-500/10 border-red-500 text-red-500"
                  : "bg-[#1c1d21] border-[#2a2b2f] hover:border-red-500 text-[#8e9299] hover:text-[#e0e0e0]"
              } disabled:opacity-40 disabled:pointer-events-none`}
            >
              <div className="flex items-center gap-3">
                <Cpu className={`w-5 h-5 ${isDecoupling ? "animate-pulse" : ""}`} />
                <div className="text-left">
                  <div className="text-[10px] font-bold tracking-widest uppercase">Metal Decoupling</div>
                  <div className="text-[8px] opacity-60">$Vayu-Bypass$ Protocol</div>
                </div>
              </div>
              <ShieldAlert className={`w-4 h-4 ${isDecoupling ? "opacity-100" : "opacity-0"}`} />
            </button>
          </div>

          <div className="bg-[#0d0e10] p-4 rounded border border-[#2a2b2f] font-mono">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3 h-3 text-[#4ade80]" />
              <span className="text-[9px] font-bold text-[#4ade80] tracking-widest">SYSTEM_LOGS</span>
            </div>
            <div className="space-y-1">
              {logs.map((log, i) => (
                <div key={`${log}-${i}`} className="text-[8px] text-[#8e9299] flex gap-2">
                  <span className="text-[#4ade80]/40">
                    [{new Date().toLocaleTimeString([], { hour12: false })}]
                  </span>
                  <span className={i === 0 ? "text-[#e0e0e0]" : ""}>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1c1d21] p-3 border-t border-[#2a2b2f] flex justify-between items-center gap-2">
          <div className="text-[9px] font-bold tracking-widest text-[#4ade80] truncate max-w-[80%]">{status}</div>
          <button
            type="button"
            onClick={() => {
              setFogLevel(85);
              setMetallicDensity(92);
              setStatus("SYSTEM RESET: RE-OBSTRUCTED");
              addLog("RE-INITIALIZING OBSTRUCTIONS");
            }}
            className="p-1 hover:bg-[#2a2b2f] rounded transition-colors shrink-0"
            aria-label="Reset obstruction levels"
          >
            <RefreshCw className="w-3 h-3 text-[#8e9299]" />
          </button>
        </div>

        <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-[#2a2b2f]" />
        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-[#2a2b2f]" />
        <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-[#2a2b2f]" />
        <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-[#2a2b2f]" />
      </div>
    </div>
  );
}
