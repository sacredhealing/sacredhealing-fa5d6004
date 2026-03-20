import React, { useState, useEffect, useRef } from "react";
import { getTierRank } from "@/lib/tierAccess";

interface AkashicRevealProps {
  tier?: string | null;
  isPremium: boolean;
  discountedPrice: number;
  onStripeCheckout: () => void | Promise<void>;
  onCryptoClick: () => void;
  onAkashaInfinityClick?: () => void;
}

function getTierLabel(tier: string | undefined | null): string {
  const rank = getTierRank(tier);
  if (rank >= 2) return "Siddha Quantum members";
  if (rank >= 1) return "Prana Flow members";
  return "";
}

const PARTICLE_COUNT = 48;

const AkashicReveal = ({
  tier,
  isPremium,
  discountedPrice,
  onStripeCheckout,
  onCryptoClick,
  onAkashaInfinityClick,
}: AkashicRevealProps) => {
  const [showContent, setShowContent] = useState(false);
  const [phase, setPhase] = useState<"scanning" | "decoded" | "reveal">("scanning");
  const [scanLine, setScanLine] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const scanTimer = window.setTimeout(() => setPhase("decoded"), 1400);
    const revealTimer = window.setTimeout(() => {
      setPhase("reveal");
      setShowContent(true);
    }, 3000);
    return () => {
      clearTimeout(scanTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  useEffect(() => {
    if (phase !== "scanning") return;
    let v = 0;
    const id = window.setInterval(() => {
      v += 2;
      setScanLine(Math.min(v, 100));
      if (v >= 100) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      hue: number;
      pulse: number;
    }
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() > 0.7 ? 185 : 44,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.pulse += 0.02;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 44 ? `rgba(212,175,55,${a})` : `rgba(34,211,238,${a})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 44 ? `rgba(212,175,55,${a * 0.15})` : `rgba(34,211,238,${a * 0.12})`;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const SoulSigil = () => (
    <svg
      viewBox="0 0 200 200"
      className="mx-auto h-28 w-28"
      style={{ filter: "drop-shadow(0 0 12px rgba(212,175,55,0.55))" }}
    >
      <circle cx="100" cy="100" r="94" fill="none" stroke="#D4AF37" strokeWidth="0.6" strokeOpacity="0.4" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="#D4AF37" strokeWidth="0.3" strokeOpacity="0.25" />
      <polygon points="100,14 178,158 22,158" fill="none" stroke="#D4AF37" strokeWidth="0.8" strokeOpacity="0.7" />
      <polygon points="100,186 22,42 178,42" fill="none" stroke="#22D3EE" strokeWidth="0.8" strokeOpacity="0.55" />
      <polygon points="100,38 160,140 40,140" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.45" />
      <polygon points="100,162 160,60 40,60" fill="none" stroke="#22D3EE" strokeWidth="0.5" strokeOpacity="0.35" />
      <circle cx="100" cy="100" r="4" fill="#D4AF37" fillOpacity="0.9" />
      <circle cx="100" cy="100" r="10" fill="none" stroke="#D4AF37" strokeWidth="0.5" strokeOpacity="0.5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const x1 = 100 + 92 * Math.cos(angle);
        const y1 = 100 + 92 * Math.sin(angle);
        const x2 = 100 + 87 * Math.cos(angle);
        const y2 = 100 + 87 * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#D4AF37"
            strokeWidth="1"
            strokeOpacity="0.6"
          />
        );
      })}
    </svg>
  );

  const tierLabel = getTierLabel(tier);

  if (!showContent) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#050505]">
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 px-8">
          <div style={{ animation: "sqi-spin 12s linear infinite" }}>
            <SoulSigil />
          </div>

          <div className="space-y-3 text-center">
            {phase === "scanning" && (
              <>
                <p
                  style={{
                    fontFamily: "Courier New, monospace",
                    fontSize: "9px",
                    letterSpacing: "0.35em",
                    color: "#22D3EE",
                    textTransform: "uppercase",
                  }}
                >
                  ◈ AKASHA-NEURAL ARCHIVE — INITIALISING
                </p>
                <p
                  style={{
                    fontFamily: "Courier New, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.25em",
                    color: "rgba(212,175,55,0.7)",
                  }}
                >
                  SCANNING SOUL SIGNATURE... {scanLine}%
                </p>
                <div
                  style={{
                    width: "200px",
                    height: "1px",
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "4px",
                    margin: "0 auto",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${scanLine}%`,
                      background: "linear-gradient(90deg, #22D3EE, #D4AF37)",
                      borderRadius: "4px",
                      boxShadow: "0 0 8px rgba(212,175,55,0.6)",
                      transition: "width 0.03s linear",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "Courier New, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.2em",
                    color: "rgba(34,211,238,0.4)",
                    lineHeight: 2,
                  }}
                >
                  {["KETU AXIS: DETECTED", "SATURN DEBT: READING", "PAST-LIFE VEIL: DISSOLVING", "SOUL HOUSE: CALCULATING"].map(
                    (line, i) => (
                      <div
                        key={line}
                        style={{
                          opacity: scanLine > i * 25 ? 1 : 0,
                          transition: "opacity 0.4s",
                        }}
                      >
                        {line}
                      </div>
                    )
                  )}
                </div>
              </>
            )}
            {phase === "decoded" && (
              <p
                style={{
                  fontFamily: "Courier New, monospace",
                  fontSize: "11px",
                  letterSpacing: "0.4em",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                  animation: "sqi-pulse 0.5s ease-in-out",
                  textShadow: "0 0 20px rgba(212,175,55,0.8)",
                }}
              >
                ◈ AKASHIC SEAL — DECODED ◈
              </p>
            )}
          </div>
        </div>

        <style>{`
          @keyframes sqi-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes sqi-pulse {
            0% { opacity: 0; transform: scale(0.92); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  const cornerAccents: Array<{
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
  }> = [
    { top: 16, left: 16, borderTop: true, borderLeft: true },
    { top: 16, right: 16, borderTop: true, borderRight: true },
    { bottom: 16, left: 16, borderBottom: true, borderLeft: true },
    { bottom: 16, right: 16, borderBottom: true, borderRight: true },
  ];

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-10"
      style={{
        background: "#050505",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(212,175,55,0.05) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      <div
        className="relative w-full"
        style={{
          maxWidth: "420px",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "40px",
          padding: "48px 32px 40px",
          textAlign: "center",
          boxShadow:
            "0 0 0 1px rgba(212,175,55,0.08), 0 0 60px rgba(212,175,55,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
          animation: "sqi-fadein 0.8s ease-out",
        }}
      >
        {cornerAccents.map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              right: pos.right,
              bottom: pos.bottom,
              width: 18,
              height: 18,
              borderTop: pos.borderTop ? "1px solid rgba(212,175,55,0.4)" : "none",
              borderBottom: pos.borderBottom ? "1px solid rgba(212,175,55,0.4)" : "none",
              borderLeft: pos.borderLeft ? "1px solid rgba(212,175,55,0.4)" : "none",
              borderRight: pos.borderRight ? "1px solid rgba(212,175,55,0.4)" : "none",
              borderRadius: 2,
            }}
          />
        ))}

        <div style={{ marginBottom: 24 }}>
          <SoulSigil />
        </div>

        <p
          style={{
            fontFamily: "Courier New, monospace",
            fontSize: "8px",
            letterSpacing: "0.45em",
            color: "#22D3EE",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          ◈ AKASHA-NEURAL ARCHIVE
        </p>

        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1.85rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "#D4AF37",
            textShadow: "0 0 20px rgba(212,175,55,0.35)",
            textTransform: "uppercase",
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          Past Life
          <br />
          Soul Decoder
        </h1>

        <p
          style={{
            fontSize: "11px",
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
            marginBottom: 28,
            fontFamily: "Courier New, monospace",
          }}
        >
          Full Akashic Manuscript — 15 Pages
        </p>

        <div
          style={{
            background: "rgba(255,255,255,0.015)",
            border: "1px solid rgba(212,175,55,0.1)",
            borderRadius: 20,
            padding: "20px 24px",
            marginBottom: 28,
            textAlign: "left",
          }}
        >
          {[
            { icon: "◈", label: "Soul Origin Identification", sub: "Which realm your Atma descended from" },
            { icon: "◈", label: "Saturn Debt Revelation", sub: "Karmic wounds carried across lifetimes" },
            { icon: "◈", label: "Past Life Archetype", sub: "Your dominant soul incarnation pattern" },
            { icon: "◈", label: "Vedic Remedy Transmission", sub: "Mantra & ritual to dissolve the debt" },
            { icon: "◈", label: "Sovereign Future Timeline", sub: "Your highest-destiny activation path" },
          ].map((item, idx) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                marginBottom: idx < 4 ? 14 : 0,
                animation: `sqi-fadein ${0.8 + idx * 0.1}s ease-out`,
              }}
            >
              <span
                style={{
                  color: "#D4AF37",
                  fontSize: 12,
                  marginTop: 2,
                  flexShrink: 0,
                  textShadow: "0 0 8px rgba(212,175,55,0.5)",
                }}
              >
                {item.icon}
              </span>
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "rgba(255,255,255,0.85)",
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "0.04em",
                    lineHeight: 1.5,
                  }}
                >
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.12)" }} />
          <span
            style={{
              fontSize: "8px",
              letterSpacing: "0.3em",
              color: "rgba(212,175,55,0.5)",
              fontFamily: "Courier New, monospace",
            }}
          >
            INITIATE
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(212,175,55,0.12)" }} />
        </div>

        {isPremium && tierLabel && (
          <div
            style={{
              display: "inline-block",
              padding: "5px 16px",
              borderRadius: 100,
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.3)",
              color: "#D4AF37",
              fontSize: "10px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            ✦ {tierLabel} — 20% Discount Applied
          </div>
        )}

        {isPremium && (
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              textDecoration: "line-through",
              fontSize: "14px",
              marginBottom: 8,
              letterSpacing: "0.1em",
            }}
          >
            €49.00
          </p>
        )}

        <button
          type="button"
          onClick={onStripeCheckout}
          style={{
            width: "100%",
            padding: "18px 24px",
            background: "linear-gradient(135deg, #D4AF37 0%, #B8962E 50%, #D4AF37 100%)",
            backgroundSize: "200% 100%",
            color: "#050505",
            fontWeight: 900,
            fontSize: "12px",
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            border: "none",
            borderRadius: 100,
            cursor: "pointer",
            marginBottom: 12,
            boxShadow: "0 0 30px rgba(212,175,55,0.25), 0 4px 20px rgba(0,0,0,0.4)",
            transition: "opacity 0.2s, transform 0.2s, box-shadow 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.opacity = "0.88";
            el.style.transform = "translateY(-1px)";
            el.style.boxShadow = "0 0 45px rgba(212,175,55,0.4), 0 8px 24px rgba(0,0,0,0.5)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "0 0 30px rgba(212,175,55,0.25), 0 4px 20px rgba(0,0,0,0.4)";
          }}
        >
          Open the Akashic Seal — €{discountedPrice.toFixed(2)}
        </button>

        <button
          type="button"
          onClick={onCryptoClick}
          style={{
            width: "100%",
            padding: "15px 24px",
            background: "transparent",
            border: "1px solid rgba(212,175,55,0.3)",
            color: "#D4AF37",
            fontWeight: 700,
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            borderRadius: 100,
            cursor: "pointer",
            marginBottom: 12,
            transition: "background 0.2s, border-color 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background = "rgba(212,175,55,0.07)";
            el.style.borderColor = "rgba(212,175,55,0.6)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background = "transparent";
            el.style.borderColor = "rgba(212,175,55,0.3)";
          }}
        >
          Pay with Crypto — €{discountedPrice.toFixed(2)}
        </button>

        {onAkashaInfinityClick && (
          <button
            type="button"
            onClick={onAkashaInfinityClick}
            style={{
              width: "100%",
              padding: "13px 24px",
              background: "transparent",
              border: "1px solid rgba(34,211,238,0.2)",
              color: "#22D3EE",
              fontWeight: 600,
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              borderRadius: 100,
              cursor: "pointer",
              marginBottom: 20,
              transition: "background 0.2s, border-color 0.2s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background = "rgba(34,211,238,0.06)";
              el.style.borderColor = "rgba(34,211,238,0.45)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "transparent";
              el.style.borderColor = "rgba(34,211,238,0.2)";
            }}
          >
            ∞ Unlock via Akasha Infinity
          </button>
        )}

        <p
          style={{
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: isPremium && tierLabel ? "#22D3EE" : "rgba(255,255,255,0.25)",
            textTransform: "uppercase",
            lineHeight: 1.8,
            fontFamily: "Courier New, monospace",
            whiteSpace: "pre-line",
          }}
        >
          {isPremium && tierLabel
            ? `${tierLabel} — 20% discount applied`
            : "Prana Flow & Siddha Quantum receive 20% off\nAkasha Infinity includes complete access"}
        </p>
      </div>

      <style>{`
        @keyframes sqi-fadein {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AkashicReveal;
