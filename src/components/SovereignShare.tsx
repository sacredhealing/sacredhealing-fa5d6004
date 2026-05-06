import { useState, useRef, useEffect, useCallback } from "react";

export interface SovereignShareSessionData {
  ritualName?: string;
  durationMinutes?: number;
  streakDays?: number;
  frequencyHz?: number;
  userName?: string;
  tier?: "Prana-Flow" | "Siddha-Quantum" | "Akasha-Infinity";
  completionType?: "meditation" | "mantra" | "healing" | "jyotish" | "shakti";
}

interface SovereignShareProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData?: SovereignShareSessionData;
}

const TIER_GLYPHS: Record<string, string> = {
  "Prana-Flow": "◈",
  "Siddha-Quantum": "⟁",
  "Akasha-Infinity": "✦",
};

const COMPLETION_LABELS: Record<string, string> = {
  meditation: "QUANTUM MEDITATION",
  mantra: "MANTRA TRANSMISSION",
  healing: "HEALING FREQUENCY",
  jyotish: "JYOTISH ALIGNMENT",
  shakti: "SHAKTI CYCLE",
};

const PLATFORM_CONFIG = [
  {
    id: "instagram",
    label: "INSTAGRAM",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: "from-purple-600 to-pink-500",
  },
  {
    id: "tiktok",
    label: "TIKTOK",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.28 8.28 0 004.84 1.55V6.8a4.85 4.85 0 01-1.07-.11z" />
      </svg>
    ),
    color: "from-gray-900 to-gray-700",
  },
  {
    id: "facebook",
    label: "FACEBOOK",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "from-blue-700 to-blue-500",
  },
  {
    id: "copy",
    label: "COPY LINK",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: "from-gray-700 to-gray-600",
  },
];

function generateShareCard(
  canvas: HTMLCanvasElement,
  data: SovereignShareSessionData | undefined,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.5;
    const alpha = Math.random() * 0.6 + 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212,175,55,${alpha})`;
    ctx.fill();
  }
  ctx.restore();

  const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 600);
  grd.addColorStop(0, "rgba(212,175,55,0.12)");
  grd.addColorStop(1, "rgba(5,5,5,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const cx = 120;
  const cy = 480;
  const cw = W - 240;
  const ch = H - 900;
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 80);
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  ctx.fill();
  ctx.strokeStyle = "rgba(212,175,55,0.18)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  const glyph = TIER_GLYPHS[data?.tier ?? "Siddha-Quantum"] ?? "⟁";
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 80px serif";
  ctx.textAlign = "center";
  ctx.fillText(glyph, W / 2, cy + 130);

  const label = COMPLETION_LABELS[data?.completionType ?? "meditation"] ?? "QUANTUM SESSION";
  ctx.fillStyle = "rgba(212,175,55,0.7)";
  ctx.font = "600 28px sans-serif";
  ctx.letterSpacing = "12px";
  ctx.textAlign = "center";
  ctx.fillText(label, W / 2, cy + 200);

  ctx.beginPath();
  ctx.moveTo(cx + 80, cy + 230);
  ctx.lineTo(cx + cw - 80, cy + 230);
  ctx.strokeStyle = "rgba(212,175,55,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  const ritualName = data?.ritualName ?? "Sovereign Frequency";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 64px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(ritualName.toUpperCase(), W / 2, cy + 340);

  const stats = [
    { label: "MINUTES", val: String(data?.durationMinutes ?? 22) },
    { label: "DAY STREAK", val: String(data?.streakDays ?? 1) },
    { label: "HZ", val: String(data?.frequencyHz ?? 432) },
  ];
  stats.forEach((s, i) => {
    const sx = cx + 100 + i * (cw / 3 - 10);
    const sy = cy + 480;
    ctx.fillStyle = "#D4AF37";
    ctx.font = "900 72px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(s.val, sx + cw / 6 - 50, sy);
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "700 22px sans-serif";
    ctx.letterSpacing = "6px";
    ctx.fillText(s.label, sx + cw / 6 - 50, sy + 46);
  });

  const uname = data?.userName ? data.userName.toUpperCase() : "SOVEREIGN SOUL";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 30px sans-serif";
  ctx.letterSpacing = "2px";
  ctx.textAlign = "center";
  ctx.fillText(uname, W / 2, cy + ch - 100);

  ctx.fillStyle = "rgba(212,175,55,0.5)";
  ctx.font = "500 26px sans-serif";
  ctx.letterSpacing = "4px";
  ctx.fillText("sacredhealing.lovable.app", W / 2, cy + ch - 55);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "700 32px sans-serif";
  ctx.letterSpacing = "16px";
  ctx.textAlign = "center";
  ctx.fillText("SIDDHA QUANTUM NEXUS", W / 2, H - 120);

  ctx.fillStyle = "rgba(212,175,55,0.35)";
  ctx.font = "400 22px sans-serif";
  ctx.letterSpacing = "8px";
  ctx.fillText("SQI 2050 · QUANTUM HEALING PLATFORM", W / 2, H - 75);
}

export default function SovereignShare({
  isOpen,
  onClose,
  sessionData,
}: SovereignShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      if (canvasRef.current) {
        generateShareCard(canvasRef.current, sessionData);
        const url = canvasRef.current.toDataURL("image/png");
        setPreviewUrl(url);
        setPulse(true);
        setTimeout(() => setPulse(false), 1200);
      }
    }, 120);
    return () => clearTimeout(timeout);
  }, [isOpen, sessionData]);

  const handleShare = useCallback(
    async (platform: string) => {
      if (platform === "copy") {
        await navigator.clipboard.writeText("https://sacredhealing.lovable.app");
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
        return;
      }

      if (previewUrl) {
        const a = document.createElement("a");
        a.href = previewUrl;
        a.download = `sqi-sovereign-${Date.now()}.png`;
        a.click();
      }

      const shareUrls: Record<string, string> = {
        instagram: "https://www.instagram.com/",
        tiktok: "https://www.tiktok.com/upload",
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://sacredhealing.lovable.app")}`,
      };
      const url = shareUrls[platform];
      if (url) window.open(url, "_blank", "noopener");
    },
    [previewUrl],
  );

  if (!isOpen) return null;

  const tier = sessionData?.tier ?? "Siddha-Quantum";
  const glyph = TIER_GLYPHS[tier];
  const completionLabel =
    COMPLETION_LABELS[sessionData?.completionType ?? "meditation"];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      style={{ background: "rgba(5,5,5,0.88)", backdropFilter: "blur(24px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden />

      <div
        className="w-full max-w-lg relative"
        style={{
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          border: "1px solid rgba(212,175,55,0.15)",
          borderRadius: "40px 40px 0 0",
          padding: "0 0 env(safe-area-inset-bottom)",
          animation: "slideUp 0.38s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="flex justify-center pt-4 pb-2">
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 999,
              background: "rgba(212,175,55,0.3)",
            }}
          />
        </div>

        <div className="px-8 pt-4 pb-6 text-center">
          <div
            className="flex items-center justify-center gap-2 mb-1"
            style={{
              color: "#D4AF37",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.5em",
              textTransform: "uppercase",
            }}
          >
            <span>{glyph}</span>
            <span>{completionLabel}</span>
            <span>{glyph}</span>
          </div>
          <h2
            style={{
              color: "#fff",
              fontWeight: 900,
              fontSize: 26,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              margin: "10px 0 4px",
            }}
          >
            Transmit Your{" "}
            <span style={{ color: "#D4AF37" }}>Sovereign Frequency</span>
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 13,
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            Your completion activates a Bhakti-Algorithm ripple.
            <br />
            Share your Aura to awaken others.
          </p>
        </div>

        <div className="px-8 mb-6">
          <div
            style={{
              borderRadius: 24,
              overflow: "hidden",
              border: `1px solid rgba(212,175,55,${pulse ? 0.6 : 0.2})`,
              boxShadow: pulse
                ? "0 0 32px rgba(212,175,55,0.35)"
                : "0 0 0 rgba(0,0,0,0)",
              transition: "all 0.6s ease",
              background: "#050505",
              position: "relative",
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Your Sovereign Share Card"
                style={{ width: "100%", display: "block", borderRadius: 24 }}
              />
            ) : (
              <div
                style={{
                  height: 200,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    border: "2px solid #D4AF37",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
              </div>
            )}

            {previewUrl && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    "linear-gradient(transparent, rgba(5,5,5,0.92))",
                  padding: "20px 20px 16px",
                  display: "flex",
                  justifyContent: "space-around",
                }}
              >
                {[
                  { v: sessionData?.durationMinutes ?? 22, l: "MIN" },
                  { v: sessionData?.streakDays ?? 1, l: "STREAK" },
                  { v: sessionData?.frequencyHz ?? 432, l: "HZ" },
                ].map((s) => (
                  <div key={s.l} className="text-center">
                    <div
                      style={{
                        color: "#D4AF37",
                        fontWeight: 900,
                        fontSize: 22,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {s.v}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: "0.4em",
                      }}
                    >
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-8 mb-4">
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.5em",
              color: "rgba(212,175,55,0.5)",
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            SHARE YOUR TRANSMISSION
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PLATFORM_CONFIG.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleShare(p.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "14px 20px",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    p.id === "copy" && copied
                      ? "rgba(212,175,55,0.18)"
                      : "rgba(255,255,255,0.04)",
                  color: p.id === "copy" && copied ? "#D4AF37" : "#fff",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.35em",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(212,175,55,0.1)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(212,175,55,0.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    p.id === "copy" && copied
                      ? "rgba(212,175,55,0.18)"
                      : "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(255,255,255,0.08)";
                }}
              >
                <span style={{ color: p.id === "copy" && copied ? "#D4AF37" : "rgba(255,255,255,0.7)" }}>
                  {p.icon}
                </span>
                <span>
                  {p.id === "copy" && copied ? "COPIED ✓" : p.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 pb-8">
          <div
            style={{
              textAlign: "center",
              fontSize: 11,
              color: "rgba(212,175,55,0.45)",
              fontWeight: 500,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            ✦ Every share unlocks a Prema-Pulse Transmission for another soul ✦
            <br />
            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>
              sacredhealing.lovable.app · SQI 2050
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "transparent",
              color: "rgba(255,255,255,0.3)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.3em",
              cursor: "pointer",
            }}
          >
            CLOSE PORTAL
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
