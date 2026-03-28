import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { hasFeatureAccess, FEATURE_TIER } from "@/lib/tierAccess";
import { useTranslation } from "@/hooks/useTranslation";

// ═══════════════════════════════════════════════════════════════
//  VAYU PROTOCOL — SQI-2050 SCALAR REBUILD
//  Siddha Atmospheric Engineering // 2060
//  Bhakti-Algorithm v4.8.16 — Prema-Pulse Active
// ═══════════════════════════════════════════════════════════════

type Phase = "standby" | "scrubbing" | "stabilized";
type BreathStage = "inhale" | "hold" | "exhale";

const BREATH_DURATIONS = { inhale: 4000, hold: 8000, exhale: 16000 };

const PHASE_CONFIG = {
  standby: {
    geometry: "torus" as const,
    color: 0xf5a800,
    emissive: 0x7a4800,
    statusColor: "#888",
    aethericDensity: "0.842",
  },
  scrubbing: {
    geometry: "torus" as const,
    color: 0xf5c842,
    emissive: 0x8a5f00,
    statusColor: "#f5a800",
    aethericDensity: "0.842",
  },
  stabilized: {
    geometry: "icosahedron" as const,
    color: 0x2244ff,
    emissive: 0x0a1a88,
    statusColor: "#00e5ff",
    aethericDensity: "0.002",
  },
} as const;

function VayuProtocolInner() {
  const { t } = useTranslation();
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const rafRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  const [phase, setPhase] = useState<Phase>("standby");
  const [clarity, setClarity] = useState(10);
  const [breathStage, setBreathStage] = useState<BreathStage>("inhale");
  const [breathProgress, setBreathProgress] = useState(0);
  const breathTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breathStartRef = useRef<number>(0);
  const breathRafRef = useRef<number>(0);

  // ── THREE.JS INIT ──────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;

    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xf5a800, 4, 20);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 2, 15);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);

    const rimLight = new THREE.DirectionalLight(0xf5c842, 1.5);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // Star Particles
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 40;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.03,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);
    particlesRef.current = stars;

    // Torus (default)
    const torusGeo = new THREE.TorusGeometry(1.4, 0.55, 64, 128);
    const mat = new THREE.MeshPhongMaterial({
      color: 0xf5a800,
      emissive: 0x7a4800,
      shininess: 140,
      specular: 0xffe0a0,
    });
    const mesh = new THREE.Mesh(torusGeo, mat);
    scene.add(mesh);
    meshRef.current = mesh;

    // Animation loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const t = clockRef.current.getElapsedTime();

      if (meshRef.current) {
        meshRef.current.rotation.y += 0.006;
        meshRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
        meshRef.current.rotation.z = Math.cos(t * 0.2) * 0.08;
      }

      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0002;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
      const W2 = mountRef.current.clientWidth;
      const H2 = mountRef.current.clientHeight;
      cameraRef.current.aspect = W2 / H2;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(W2, H2);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ── GEOMETRY SWAP ON PHASE CHANGE ─────────────────────────
  useEffect(() => {
    if (!meshRef.current || !sceneRef.current) return;
    const cfg = PHASE_CONFIG[phase];

    // Dispose old geometry
    meshRef.current.geometry.dispose();

    // Swap geometry
    if (cfg.geometry === "icosahedron") {
      meshRef.current.geometry = new THREE.IcosahedronGeometry(1.6, 0);
    } else {
      meshRef.current.geometry = new THREE.TorusGeometry(1.4, 0.55, 64, 128);
    }

    // Swap material colors
    const mat = meshRef.current.material as THREE.MeshPhongMaterial;
    mat.color.setHex(cfg.color);
    mat.emissive.setHex(cfg.emissive);
    mat.needsUpdate = true;

    // Update lights color
    const scene = sceneRef.current;
    scene.traverse((obj) => {
      if (obj instanceof THREE.PointLight && obj.intensity === 4) {
        obj.color.setHex(cfg.color);
      }
    });
  }, [phase]);

  // ── BREATHING CYCLE (4-8-16) ───────────────────────────────
  const runBreathCycle = useCallback(() => {
    const stages: BreathStage[] = ["inhale", "hold", "exhale"];
    let stageIndex = 0;

    const nextStage = () => {
      const stage = stages[stageIndex % 3];
      setBreathStage(stage);
      breathStartRef.current = performance.now();
      const duration = BREATH_DURATIONS[stage];

      // Smooth progress bar
      const updateProgress = () => {
        const elapsed = performance.now() - breathStartRef.current;
        const pct = Math.min(elapsed / duration, 1);
        setBreathProgress(pct);
        if (pct < 1) {
          breathRafRef.current = requestAnimationFrame(updateProgress);
        }
      };
      updateProgress();

      breathTimerRef.current = setTimeout(() => {
        stageIndex++;
        nextStage();
      }, duration);
    };

    nextStage();
  }, []);

  const stopBreathCycle = useCallback(() => {
    if (breathTimerRef.current) clearTimeout(breathTimerRef.current);
    cancelAnimationFrame(breathRafRef.current);
    setBreathProgress(0);
  }, []);

  // ── CLARITY PROGRESS ──────────────────────────────────────
  useEffect(() => {
    if (phase === "scrubbing") {
      const interval = setInterval(() => {
        setClarity((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return Math.min(prev + 1, 100);
        });
      }, 400);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // ── HANDLERS ──────────────────────────────────────────────
  const handleActivate = () => {
    if (phase !== "standby") return;
    setPhase("scrubbing");
    setClarity(10);
    runBreathCycle();
  };

  const handleLock = () => {
    if (phase !== "scrubbing") return;
    stopBreathCycle();
    setPhase("stabilized");
    setClarity(100);
  };

  const handleReset = () => {
    stopBreathCycle();
    setPhase("standby");
    setClarity(10);
  };

  const cfg = PHASE_CONFIG[phase];

  // Torus tilted effect during scrubbing
  const meshTiltStyle =
    phase === "scrubbing"
      ? {
          transform: "perspective(800px) rotateX(55deg) rotateY(10deg)",
          transition: "transform 1.2s cubic-bezier(0.23,1,0.32,1)",
        }
      : {
          transform: "perspective(800px) rotateX(0deg) rotateY(0deg)",
          transition: "transform 1.2s cubic-bezier(0.23,1,0.32,1)",
        };

  const breathLabel = t(`vayuProtocol.breath.${breathStage}`);

  return (
    <div
      className="vayu-root"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "700px",
        background: "#070808",
        overflow: "hidden",
        fontFamily: "'Share Tech Mono', 'Courier New', monospace",
        color: "#fff",
      }}
    >
      {/* THREE.JS CANVAS MOUNT */}
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
        }}
      />

      {/* GRID OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          pointerEvents: "none",
        }}
      />

      {/* HORIZONTAL SCAN LINE */}
      {phase === "scrubbing" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(245,168,0,0.15) 10%, rgba(245,168,0,0.5) 50%, rgba(245,168,0,0.15) 90%, transparent 100%)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}
      {phase === "stabilized" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,229,255,0.15) 10%, rgba(0,229,255,0.4) 50%, rgba(0,229,255,0.15) 90%, transparent 100%)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}

      {/* TOP LEFT — LOGO */}
      <div style={{ position: "absolute", top: 20, left: 24, zIndex: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 4,
          }}
        >
          <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
            <path
              d="M0 3h20M0 8h14M0 13h18"
              stroke={phase === "stabilized" ? "#00e5ff" : "#f5a800"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontSize: 20,
              fontWeight: 900,
              letterSpacing: "0.15em",
              color: phase === "stabilized" ? "#00e5ff" : "#f5c842",
            }}
          >
            {t("vayuProtocol.brand")}
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "#888",
          }}
        >
          {t("vayuProtocol.tagline")}
        </div>
      </div>

      {/* TOP RIGHT — STATUS PANEL */}
      <div
        style={{
          position: "absolute",
          top: 20,
          right: 24,
          zIndex: 10,
          textAlign: "right",
        }}
      >
        <div
          style={{ fontSize: 10, letterSpacing: "0.2em", color: "#666", marginBottom: 4 }}
        >
          {t("vayuProtocol.fieldStatus")}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: cfg.statusColor,
            marginBottom: 16,
          }}
        >
          {t(`vayuProtocol.phase.${phase}.label`)}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: cfg.statusColor,
              boxShadow: `0 0 8px ${cfg.statusColor}`,
              animation: phase === "scrubbing" ? "pulse 1s infinite" : "none",
            }}
          />
        </div>

        <div
          style={{ fontSize: 10, letterSpacing: "0.2em", color: "#666", marginBottom: 6 }}
        >
          {t("vayuProtocol.environmentalClarity")}
        </div>
        <div
          style={{
            width: 200,
            height: 3,
            background: "#1a1a1a",
            marginBottom: 4,
            marginLeft: "auto",
          }}
        >
          <div
            style={{
              width: `${clarity}%`,
              height: "100%",
              background:
                phase === "stabilized"
                  ? "linear-gradient(90deg, #0055ff, #00e5ff)"
                  : "linear-gradient(90deg, #f5a800, #f5e800)",
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: phase === "stabilized" ? "#00e5ff" : "#f5c842",
          }}
        >
          {clarity}%
        </div>
      </div>

      {/* CENTER — 3D OBJECT WRAPPER (CSS tilt for scrubbing) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          ...meshTiltStyle,
        }}
      />

      {/* BREATH OVERLAY (during scrubbing) */}
      {phase === "scrubbing" && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 8,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              letterSpacing: "0.3em",
              color: "#f5c842",
              fontStyle: "italic",
              textShadow: "0 0 20px rgba(245,200,66,0.5)",
              marginBottom: 8,
            }}
          >
            {breathLabel}
          </div>
          {/* Breath timer bar */}
          <div
            style={{
              width: 120,
              height: 2,
              background: "rgba(245,168,0,0.2)",
              margin: "0 auto 8px",
            }}
          >
            <div
              style={{
                width: `${breathProgress * 100}%`,
                height: "100%",
                background: "#f5c842",
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.35em",
              color: "rgba(245,200,66,0.6)",
            }}
          >
            {t("vayuProtocol.breathingPattern")}
          </div>
        </div>
      )}

      {/* BOTTOM LEFT — STATUS MESSAGE */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          left: 24,
          zIndex: 10,
          maxWidth: 340,
        }}
      >
        {phase === "standby" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: "2px solid #f5a800",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{ width: 6, height: 6, borderRadius: "50%", background: "#f5a800" }}
                />
              </div>
              <span
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#f5c842" }}
              >
                {t("vayuProtocol.standbyPanel.title")}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#777", lineHeight: 1.5, margin: 0 }}>
              {t("vayuProtocol.standbyPanel.body")}
            </p>
          </>
        )}

        {phase === "scrubbing" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
                animation: "pulseFade 2s infinite",
              }}
            >
              <svg width="18" height="14" viewBox="0 0 20 16" fill="none">
                <path
                  d="M0 3h20M0 8h14M0 13h18"
                  stroke="#f5a800"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#f5c842" }}
              >
                {t("vayuProtocol.scrubbingPanel.title")}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.5, margin: 0 }}>
              {t("vayuProtocol.scrubbingPanel.body")}
            </p>
          </>
        )}

        {phase === "stabilized" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#00e5ff" strokeWidth="1.5" />
                <path d="M4 8l3 3 5-5" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", color: "#00e5ff" }}
              >
                {t("vayuProtocol.stabilizedPanel.title")}
              </span>
            </div>
            <p style={{ fontSize: 12, color: "#77aacc", lineHeight: 1.5, margin: 0 }}>
              {t("vayuProtocol.stabilizedPanel.body")}
            </p>
          </>
        )}
      </div>

      {/* CENTER BUTTON */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
        }}
      >
        {phase === "standby" && (
          <button
            onClick={handleActivate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 32px",
              background: "#f5a800",
              color: "#000",
              border: "none",
              borderRadius: 40,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.18em",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 0 24px rgba(245,168,0,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.boxShadow = "0 0 40px rgba(245,168,0,0.7)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.boxShadow = "0 0 24px rgba(245,168,0,0.4)")
            }
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1v6M5 3.5C2.5 4.8 1 7.2 1 10c0 3.9 3.1 7 7 7s7-3.1 7-7c0-2.8-1.5-5.2-4-6.5"
                stroke="#000"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            {t("vayuProtocol.btnActivate")}
          </button>
        )}

        {phase === "scrubbing" && (
          <button
            onClick={handleLock}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 32px",
              background: "#111",
              color: "#fff",
              border: "1.5px solid #444",
              borderRadius: 40,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.18em",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#f5a800";
              (e.currentTarget as HTMLElement).style.color = "#f5a800";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#444";
              (e.currentTarget as HTMLElement).style.color = "#fff";
            }}
          >
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <rect x="1" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M4 7V5a3 3 0 016 0v2"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {t("vayuProtocol.btnLock")}
          </button>
        )}

        {phase === "stabilized" && (
          <button
            onClick={handleReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 32px",
              background: "#00e5ff",
              color: "#000",
              border: "none",
              borderRadius: 40,
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: "0.18em",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 0 24px rgba(0,229,255,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 40px rgba(0,229,255,0.7)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.boxShadow =
                "0 0 24px rgba(0,229,255,0.4)")
            }
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M2 8a6 6 0 1110.4-4M2 8V4M2 8H6"
                stroke="#000"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            RESET FIELD
          </button>
        )}
      </div>

      {/* BOTTOM RIGHT — COORDS */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 24,
          zIndex: 10,
          textAlign: "right",
          fontSize: 9,
          color: "#555",
          letterSpacing: "0.1em",
          lineHeight: 1.8,
        }}
      >
        <div>{t("vayuProtocol.coordsLine")}</div>
        <div>
          {t("vayuProtocol.aethericDensity", { density: cfg.aethericDensity })}
        </div>
        <div>{t("vayuProtocol.geometryLine", { shape: t(`vayuProtocol.geometry.${cfg.geometry}`) })}</div>
        <div>{t("vayuProtocol.elementLine", { element: t(`vayuProtocol.phase.${phase}.element`) })}</div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes pulseFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default function VayuProtocol() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const { tier, loading: membershipLoading } = useMembership();
  const { isAdmin } = useAdminRole();

  if (authLoading || membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <span className="text-sm uppercase tracking-[0.3em] text-white/40">{t("vayuProtocol.loading")}</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.vayuProtocol)) {
    return <Navigate to="/siddha-quantum" replace />;
  }

  return <VayuProtocolInner />;
}

