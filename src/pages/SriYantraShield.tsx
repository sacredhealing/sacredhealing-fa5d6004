import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Shield,
  ShieldCheck,
  MapPin,
  Loader2,
  AlertTriangle,
  Info,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { SriYantra } from "@/components/sri-yantra/SriYantra";
import { ShieldHUD } from "@/components/sri-yantra/ShieldHUD";
import { INITIAL_DATA, ACTIVE_DATA } from "@/components/sri-yantra/types";
import type { ShieldData } from "@/components/sri-yantra/types";
import { useSriYantraAccess } from "@/hooks/useSriYantraAccess";
import SriYantraLanding from "@/pages/SriYantraLanding";
import i18n from "@/i18n/setup";

const SHIELD_CORE = {
  mantras: ["OM_RAM_RAMAYA_NAMAHA", "MAHA_MRITYUNJAYA"],
  minerals: "SHUNGITE_ORGONITE_HYBRID",
  persistence: "AKASHA_FIXED",
} as const;

const SHIELD_STORAGE_KEY = "sri_yantra_shield_active_v1";

async function getOneTimeLocation(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 3000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 3000 }
    );
  });
}

function stopAllLocationServices() {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
}

async function deployStationaryShield(
  setLocation: (loc: { lat: number; lng: number } | null) => void,
  setData: (data: ShieldData) => void,
  addLog: (msg: string) => void,
  setIsActive: (value: boolean) => void
) {
  addLog(i18n.t("sriYantraShield.log.deployInit"));
  const initialAnchor = await getOneTimeLocation();

  if (initialAnchor) {
    setLocation(initialAnchor);
    addLog(
      i18n.t("sriYantraShield.log.anchorCoords", {
        lat: initialAnchor.lat.toFixed(4),
        lng: initialAnchor.lng.toFixed(4),
      })
    );
  } else {
    addLog(i18n.t("sriYantraShield.log.anchorAnonymous"));
  }

  stopAllLocationServices();
  addLog(i18n.t("sriYantraShield.log.locationReleased"));

  addLog(i18n.t("sriYantraShield.log.bhupura"));
  addLog(i18n.t("sriYantraShield.log.shell"));

  addLog(
    i18n.t("sriYantraShield.log.broadcast", {
      mantras: SHIELD_CORE.mantras.join(" + "),
      minerals: SHIELD_CORE.minerals,
    })
  );

  setIsActive(true);
  setData(ACTIVE_DATA);

  addLog(i18n.t("sriYantraShield.log.fieldLocked"));

  return {
    status: "FIELD_LOCKED_PERMANENTLY",
    gps_status: "OFF",
    protection: "ACTIVE_24_7",
  } as const;
}

async function boostShieldCoherence(
  multiplier: number,
  setData: (data: ShieldData) => void,
  addLog: (msg: string) => void
) {
  addLog(
    i18n.t("sriYantraShield.log.boostCoherence", {
      multiplier: multiplier.toFixed(1),
    })
  );
  setData({
    emf: "0.1mG_SUPER_COHERENT",
    pathogenLoad: "ZERO_FIELD_MEASURABLE",
    fearIndex: "UNITY_CONSCIOUSNESS_WINDOW",
  });

  // After 60s, gently return to the regular ACTIVE_DATA HUD
  setTimeout(() => {
    addLog(i18n.t("sriYantraShield.log.verificationComplete"));
    setData(ACTIVE_DATA);
  }, 60000);
}

async function openQuantumCameraHUD(addLog: (msg: string) => void) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    addLog(i18n.t("sriYantraShield.log.cameraUnavailable"));
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((track) => track.stop());
    addLog(i18n.t("sriYantraShield.log.cameraHandshake"));
  } catch {
    addLog(i18n.t("sriYantraShield.log.cameraDeclined"));
  }
}

async function runProofProtocol(
  setData: (data: ShieldData) => void,
  addLog: (msg: string) => void
) {
  await boostShieldCoherence(2.0, setData, addLog);

  await openQuantumCameraHUD(addLog);

  addLog(i18n.t("sriYantraShield.log.proofActive"));

  addLog(
    i18n.t("sriYantraShield.log.verificationBlood", {
      desc: i18n.t("sriYantraShield.verification.blood_analysis"),
    })
  );
  addLog(
    i18n.t("sriYantraShield.log.verificationEmf", {
      desc: i18n.t("sriYantraShield.verification.emf_meter_sync"),
    })
  );
  addLog(
    i18n.t("sriYantraShield.log.verificationWater", {
      desc: i18n.t("sriYantraShield.verification.water_structuring"),
    })
  );
}

export default function SriYantraShield() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasAccess, loading: accessLoading, refetch: refetchAccess } = useSriYantraAccess();
  const [isActive, setIsActive] = useState(false);
  const [isProofRunning, setIsProofRunning] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [data, setData] = useState<ShieldData>(INITIAL_DATA);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
    if (searchParams.get("purchase") === "success") {
      setSearchParams({}, { replace: true });
      refetchAccess();
    }
  }, [searchParams, setSearchParams, refetchAccess]);

  // Restore shield state locally so it remains active if the user closes the app
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(SHIELD_STORAGE_KEY);
      if (stored === "true") {
        setIsActive(true);
        setData(ACTIVE_DATA);
        setLogs((prev) =>
          [i18n.t("sriYantraShield.shieldRestoredLog"), ...prev].slice(0, 5)
        );
      }
    } catch {
      // Ignore storage errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (accessLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        <p className="text-xs font-mono text-white/50">{t("sriYantraShield.loadingAccess")}</p>
      </div>
    );
  }

  if (!hasAccess) {
    return <SriYantraLanding />;
  }

  const handleActivate = async () => {
    if (isActive) {
      setIsActive(false);
      setData(INITIAL_DATA);
      addLog(t("sriYantraShield.deactivateLog"));
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(SHIELD_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
      return;
    }

    setIsActivating(true);
    try {
      await deployStationaryShield(setLocation, setData, addLog, setIsActive);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(SHIELD_STORAGE_KEY, "true");
        }
      } catch {
        // ignore
      }
    } catch {
      addLog(t("sriYantraShield.fluxErrorLog"));
    } finally {
      setIsActivating(false);
    }
  };

  const handleRunProof = async () => {
    if (!isActive || isProofRunning) return;
    setIsProofRunning(true);
    addLog(t("sriYantraShield.proofInitLog"));
    try {
      await runProofProtocol(setData, addLog);
    } catch {
      addLog(t("sriYantraShield.proofErrorLog"));
    } finally {
      setIsProofRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden relative">
      {/* Immersive Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] transition-colors duration-2000 ${isActive ? "bg-blue-900/20" : "bg-red-900/10"}`}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(#ffffff11 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 flex flex-col items-center min-h-screen">
        {/* Back to Explore */}
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => navigate("/explore")}
            className="p-2 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition flex items-center gap-2 text-white/80 hover:text-white text-sm font-mono"
          >
            <ArrowLeft size={18} />
            <span className="tracking-wider">{t("sriYantraShield.backLibrary")}</span>
          </button>
        </div>

        {/* Header */}
        <header className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div
              className={`p-2 rounded-lg border ${isActive ? "border-blue-500 bg-blue-500/10" : "border-red-500 bg-red-500/10"}`}
            >
              {isActive ? (
                <ShieldCheck className="text-blue-400" />
              ) : (
                <Shield className="text-red-400" />
              )}
            </div>
            <h1 className="text-2xl font-mono tracking-[0.3em] font-bold">
              {t("sriYantraShield.title")}
            </h1>
          </motion.div>
          <p className="text-xs font-mono opacity-40 tracking-widest uppercase">
            {t("sriYantraShield.subtitle")}
          </p>
        </header>

        {/* Central Visualization */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl relative">
          <div className="w-full aspect-square max-w-[400px] relative">
            <SriYantra isActive={isActive} />

            {/* HUD Overlays */}
            <AnimatePresence>
              {!isActive && !isActivating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="text-center bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-red-500/20 max-w-[280px]">
                    <AlertTriangle className="mx-auto mb-3 text-red-500" size={32} />
                    <h2 className="text-red-400 font-mono text-sm mb-2">
                      {t("sriYantraShield.fieldInstabilityTitle")}
                    </h2>
                    <p className="text-[10px] opacity-60 leading-relaxed">
                      {t("sriYantraShield.fieldInstabilityBody")}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Activation Button */}
          <div className="mt-12 mb-16 flex flex-col items-center gap-4">
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className={`group relative px-12 py-4 rounded-full font-mono text-sm tracking-[0.2em] transition-all duration-500 overflow-hidden ${
                isActive
                  ? "bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.4)]"
                  : "bg-transparent border border-white/20 hover:border-blue-500/50 text-white/80 hover:text-white"
              }`}
            >
              <span className="relative z-10 flex items-center gap-3">
                {isActivating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {t("sriYantraShield.btnTransmuting")}
                  </>
                ) : isActive ? (
                  t("sriYantraShield.btnShieldActive")
                ) : (
                  t("sriYantraShield.btnActivate")
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity" />
            </button>

            <button
              onClick={handleRunProof}
              disabled={!isActive || isProofRunning}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-violet-400/50 text-violet-200 hover:text-white hover:bg-violet-500/20 font-mono text-[11px] tracking-[0.18em] uppercase transition-colors"
            >
              {isProofRunning ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("sriYantraShield.proofRunning")}
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3" />
                  {t("sriYantraShield.proofCta")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* HUD Stats */}
        <ShieldHUD data={data} isActive={isActive} />

        {/* Footer / Logs */}
        <footer className="w-full max-w-4xl mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4 opacity-40">
              <Info size={14} />
              <span className="text-[10px] font-mono tracking-widest uppercase">
                {t("sriYantraShield.systemLogs")}
              </span>
            </div>
            <div className="space-y-2">
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-mono opacity-60 flex gap-3"
                >
                  <span className="text-blue-500/50">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </motion.div>
              ))}
              {logs.length === 0 && (
                <p className="text-[10px] font-mono opacity-20 italic">
                  {t("sriYantraShield.logsAwaiting")}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 opacity-40">
            <div className="flex items-center gap-2">
              <MapPin size={14} />
              <span className="text-[10px] font-mono uppercase tracking-widest">
                {location
                  ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                  : t("sriYantraShield.locating")}
              </span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest">
              {t("sriYantraShield.radiusLine")}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest">
              {t("sriYantraShield.protocolLine")}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
