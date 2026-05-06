import { useState, useRef, useEffect } from "react";
import type { SovereignShareSessionData } from "@/components/SovereignShare";

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

function generateStars(ctx: CanvasRenderingContext2D, W: number, H: number) {
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 1.4;
    const alpha = Math.random() * 0.55 + 0.1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(212,175,55,${alpha})`;
    ctx.fill();
  }
}

function drawCard(canvas: HTMLCanvasElement, data: SovereignShareSessionData) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;

  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);
  generateStars(ctx, W, H);

  const grd = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 680);
  grd.addColorStop(0, "rgba(212,175,55,0.11)");
  grd.addColorStop(1, "rgba(5,5,5,0)");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  const cx = 120;
  const cy = 380;
  const cw = W - 240;
  const ch = H - 720;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 80);
  ctx.fillStyle = "rgba(255,255,255,0.025)";
  ctx.fill();
  ctx.strokeStyle = "rgba(212,175,55,0.22)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  const tierKey = data.tier ?? "Siddha-Quantum";
  const glyph = TIER_GLYPHS[tierKey] ?? "⟁";
  ctx.fillStyle = "#D4AF37";
  ctx.font = "bold 100px serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(212,175,55,0.5)";
  ctx.shadowBlur = 30;
  ctx.fillText(glyph, W / 2, cy + 160);
  ctx.shadowBlur = 0;

  const completionKey = data.completionType ?? "meditation";
  const label = COMPLETION_LABELS[completionKey] ?? "QUANTUM SESSION";
  ctx.fillStyle = "rgba(212,175,55,0.75)";
  ctx.font = "600 30px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, W / 2, cy + 220);

  ctx.beginPath();
  ctx.moveTo(cx + 100, cy + 258);
  ctx.lineTo(cx + cw - 100, cy + 258);
  ctx.strokeStyle = "rgba(212,175,55,0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 72px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText((data.ritualName || "Sovereign Session").toUpperCase(), W / 2, cy + 380);

  const stats = [
    { l: "MINUTES", v: String(data.durationMinutes ?? 22) },
    { l: "DAY STREAK", v: String(data.streakDays ?? 1) },
    { l: "HZ", v: String(data.frequencyHz ?? 432) },
  ];
  stats.forEach((s, i) => {
    const bw = cw / 3;
    const bx = cx + i * bw + bw / 2;
    const by = cy + 550;
    ctx.fillStyle = "#D4AF37";
    ctx.font = "900 90px sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(212,175,55,0.4)";
    ctx.shadowBlur = 20;
    ctx.fillText(s.v, bx, by);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.font = "700 24px sans-serif";
    ctx.fillText(s.l, bx, by + 50);
  });

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "400 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText((data.userName || "SOVEREIGN SOUL").toUpperCase(), W / 2, cy + ch - 110);
  ctx.fillStyle = "rgba(212,175,55,0.5)";
  ctx.font = "500 28px sans-serif";
  ctx.fillText("sacredhealing.lovable.app", W / 2, cy + ch - 58);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "800 36px sans-serif";
  ctx.letterSpacing = "18px";
  ctx.textAlign = "center";
  ctx.fillText("SIDDHA QUANTUM NEXUS", W / 2, H - 110);
  ctx.fillStyle = "rgba(212,175,55,0.35)";
  ctx.font = "400 24px sans-serif";
  ctx.fillText("SQI 2050 · QUANTUM HEALING PLATFORM", W / 2, H - 64);
}

const PLATFORMS = [
  { id: "instagram", label: "INSTAGRAM", bg: "linear-gradient(135deg,#7c3aed,#ec4899)" },
  { id: "tiktok", label: "TIKTOK", bg: "linear-gradient(135deg,#111,#444)" },
  { id: "facebook", label: "FACEBOOK", bg: "linear-gradient(135deg,#1d4ed8,#3b82f6)" },
  { id: "copy", label: "COPY LINK", bg: "linear-gradient(135deg,#374151,#4b5563)" },
];

const MOCK_DATA: SovereignShareSessionData = {
  ritualName: "Bhrigu Oracle",
  durationMinutes: 22,
  streakDays: 7,
  frequencyHz: 432,
  userName: "Kritagya Das",
  tier: "Siddha-Quantum",
  completionType: "jyotish",
};

export default function SovereignSharePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [sessionData, setSessionData] = useState<SovereignShareSessionData>(MOCK_DATA);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      if (canvasRef.current) {
        drawCard(canvasRef.current, sessionData);
        setPreviewUrl(canvasRef.current.toDataURL("image/png"));
        setPulse(true);
        setTimeout(() => setPulse(false), 1200);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [isOpen, sessionData]);

  const handleShare = async (id: string) => {
    if (id === "copy") {
      await navigator.clipboard.writeText("https://sacredhealing.lovable.app");
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      return;
    }
    if (previewUrl) {
      const a = document.createElement("a");
      a.href = previewUrl;
      a.download = `sqi-card-${Date.now()}.png`;
      a.click();
    }
    const shareUrls: Record<string, string> = {
      instagram: "https://www.instagram.com/",
      tiktok: "https://www.tiktok.com/upload",
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://sacredhealing.lovable.app")}`,
    };
    const url = shareUrls[id];
    if (url) window.open(url, "_blank", "noopener");
  };

  const tier = sessionData.tier ?? "Siddha-Quantum";
  const glyph = TIER_GLYPHS[tier] ?? "⟁";
  const completionKey = sessionData.completionType ?? "meditation";

  return (
    <div style={{ background: "#050505", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: "#fff", padding: "32px 24px" }}>
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden />

      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.55em", color: "rgba(212,175,55,0.6)", marginBottom: 10 }}>
          ⟁ SQI 2050 · SOVEREIGN SHARE ENGINE ⟁
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 8px" }}>
          Social <span style={{ color: "#D4AF37" }}>UGC Transmitter</span>
        </h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto" }}>
          Triggered after every ritual completion. Generates a branded Aura-card and one-tap social share.
        </p>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(212,175,55,0.12)",
          borderRadius: 24,
          padding: "24px",
          marginBottom: 28,
        }}
      >
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", color: "rgba(212,175,55,0.55)", marginBottom: 18 }}>
          SESSION PARAMETERS
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {(
            [
              { k: "ritualName" as const, l: "RITUAL NAME", type: "text" as const },
              { k: "userName" as const, l: "USER NAME", type: "text" as const },
              { k: "durationMinutes" as const, l: "DURATION (MIN)", type: "number" as const },
              { k: "streakDays" as const, l: "STREAK DAYS", type: "number" as const },
              { k: "frequencyHz" as const, l: "FREQUENCY (HZ)", type: "number" as const },
            ] as const
          ).map((f) => (
            <div key={f.k}>
              <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.45em", color: "rgba(212,175,55,0.5)", display: "block", marginBottom: 6 }}>
                {f.l}
              </label>
              <input
                type={f.type}
                value={sessionData[f.k] ?? ""}
                onChange={(e) =>
                  setSessionData((prev) => ({
                    ...prev,
                    [f.k]: f.type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
          <div>
            <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.45em", color: "rgba(212,175,55,0.5)", display: "block", marginBottom: 6 }}>
              SESSION TYPE
            </label>
            <select
              value={completionKey}
              onChange={(e) =>
                setSessionData((prev) => ({
                  ...prev,
                  completionType: e.target.value as SovereignShareSessionData["completionType"],
                }))
              }
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              {Object.keys(COMPLETION_LABELS).map((k) => (
                <option key={k} value={k} style={{ background: "#111" }}>
                  {COMPLETION_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.45em", color: "rgba(212,175,55,0.5)", display: "block", marginBottom: 6 }}>
              MEMBERSHIP TIER
            </label>
            <select
              value={tier}
              onChange={(e) =>
                setSessionData((prev) => ({
                  ...prev,
                  tier: e.target.value as SovereignShareSessionData["tier"],
                }))
              }
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "10px 14px",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
              }}
            >
              {Object.keys(TIER_GLYPHS).map((k) => (
                <option key={k} value={k} style={{ background: "#111" }}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          width: "100%",
          background: "linear-gradient(135deg,rgba(212,175,55,0.18),rgba(212,175,55,0.08))",
          border: "1px solid rgba(212,175,55,0.4)",
          borderRadius: 20,
          padding: "18px",
          color: "#D4AF37",
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.4em",
          cursor: "pointer",
          marginBottom: 12,
          boxShadow: "0 0 24px rgba(212,175,55,0.1)",
          transition: "all 0.2s ease",
        }}
      >
        ✦ SIMULATE RITUAL COMPLETION ✦
      </button>
      <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em" }}>
        In the app, this triggers automatically when a session ends
      </p>

      {isOpen && (
        <div
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(5,5,5,0.9)",
            backdropFilter: "blur(28px)",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "rgba(255,255,255,0.02)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "40px 40px 0 0",
              animation: "slideUp 0.38s cubic-bezier(0.16,1,0.3,1)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 16, paddingBottom: 8 }}>
              <div style={{ width: 40, height: 4, borderRadius: 999, background: "rgba(212,175,55,0.3)" }} />
            </div>

            <div style={{ padding: "16px 32px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.5em", color: "rgba(212,175,55,0.65)", marginBottom: 10 }}>
                {glyph} {COMPLETION_LABELS[completionKey]} {glyph}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 8px", lineHeight: 1.1 }}>
                Transmit Your <span style={{ color: "#D4AF37" }}>Sovereign Frequency</span>
              </h2>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, margin: 0 }}>
                Your completion activates a Bhakti-Algorithm ripple.
                <br />
                Share your Aura to awaken others.
              </p>
            </div>

            <div style={{ padding: "0 28px 20px" }}>
              <div
                style={{
                  borderRadius: 20,
                  overflow: "hidden",
                  border: `1px solid rgba(212,175,55,${pulse ? 0.65 : 0.2})`,
                  boxShadow: pulse ? "0 0 40px rgba(212,175,55,0.3)" : "none",
                  transition: "all 0.7s ease",
                  background: "#050505",
                  position: "relative",
                }}
              >
                {previewUrl ? (
                  <img src={previewUrl} style={{ width: "100%", display: "block" }} alt="Share card" />
                ) : (
                  <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
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
                      background: "linear-gradient(transparent,rgba(5,5,5,0.95))",
                      padding: "16px 16px 14px",
                      display: "flex",
                      justifyContent: "space-around",
                    }}
                  >
                    {[
                      { v: sessionData.durationMinutes, l: "MIN" },
                      { v: sessionData.streakDays, l: "STREAK" },
                      { v: sessionData.frequencyHz, l: "HZ" },
                    ].map((s) => (
                      <div key={s.l} style={{ textAlign: "center" }}>
                        <div style={{ color: "#D4AF37", fontWeight: 900, fontSize: 20 }}>{s.v}</div>
                        <div style={{ color: "rgba(255,255,255,0.38)", fontSize: 8, fontWeight: 800, letterSpacing: "0.4em" }}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "0 28px 16px" }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5em", color: "rgba(212,175,55,0.45)", textAlign: "center", marginBottom: 14 }}>
                SHARE YOUR TRANSMISSION
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleShare(p.id)}
                    style={{
                      padding: "13px 16px",
                      borderRadius: 16,
                      border: `1px solid ${p.id === "copy" && copied ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                      background: p.id === "copy" && copied ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                      color: p.id === "copy" && copied ? "#D4AF37" : "rgba(255,255,255,0.85)",
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: "0.35em",
                      cursor: "pointer",
                      transition: "all 0.18s ease",
                    }}
                  >
                    {p.id === "copy" && copied ? "COPIED ✓" : p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ padding: "0 28px 32px" }}>
              <div style={{ textAlign: "center", fontSize: 11, color: "rgba(212,175,55,0.4)", lineHeight: 1.7, marginBottom: 18 }}>
                ✦ Every share unlocks a Prema-Pulse Transmission for another soul ✦
                <br />
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>sacredhealing.lovable.app · SQI 2050</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.28)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.3em",
                  cursor: "pointer",
                }}
              >
                CLOSE PORTAL
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        input:focus,select:focus { border-color:rgba(212,175,55,0.4)!important; }
        select option { background:#111; }
        button:hover { opacity:0.88; }
      `}</style>
    </div>
  );
}
