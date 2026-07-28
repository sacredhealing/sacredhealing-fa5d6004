import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const TITLE_STYLE: React.CSSProperties = {
  fontFamily: "'Cinzel', serif",
  fontWeight: 600,
  letterSpacing: "0.04em",
  lineHeight: 1.2,
  background: "linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%)",
  backgroundSize: "200% auto",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  WebkitTextFillColor: "transparent",
  animation: "hShimmer 5s linear infinite",
};

const VOLUMES = [
  {
    num: "VOL. 0",
    title: "Front Matter & Nile Valley Prologue",
    subtitle: "Hymn to Aten · 42 Declarations of Maat · Poimandres",
    status: "complete",
    icon: "☥",
    color: "rgba(212,175,55,",
  },
  {
    num: "VOL. I",
    title: "The Book of Enoch",
    subtitle: "Sacred Codex — Complete Text",
    status: "complete",
    icon: "✦",
    color: "rgba(212,175,55,",
  },
  {
    num: "VOL. II",
    title: "Coming Soon",
    subtitle: "Sealed until the appointed time",
    status: "coming",
    icon: "◈",
    color: "rgba(212,175,55,",
  },
  {
    num: "VOL. III",
    title: "Kebra Nagast",
    subtitle: "Glory of Kings — 30 Chapters",
    status: "complete",
    icon: "♛",
    color: "rgba(212,175,55,",
  },
  {
    num: "VOL. IV",
    title: "The Restored Gospels",
    subtitle: "Gospel of John · 114 Sayings of Thomas · Gospel of the Holy Twelve",
    status: "complete",
    icon: "✝",
    color: "rgba(212,175,55,",
  },
  {
    num: "VOL. V",
    title: "Imperial Covenant",
    subtitle: "The Four Great Speeches of Haile Selassie I — Jah Rastafari",
    status: "progress",
    icon: "♚",
    color: "rgba(255,200,80,",
  },
];

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  /* ── COMING SOON SCREEN for non-admins ─────────────────────────────────── */
  if (!isAdmin) {
    return (
      <div style={{
        minHeight: "100vh", background: "#050505", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "40px 24px", textAlign: "center",
      }}>
        {/* Sacred geometry orb */}
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ marginBottom: 32 }}>
          <defs>
            <radialGradient id="hbg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,215,70,0.28)"/>
              <stop offset="60%" stopColor="rgba(212,175,55,0.06)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </radialGradient>
          </defs>
          <ellipse cx="70" cy="70" rx="66" ry="66" fill="url(#hbg)"/>
          <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="0.8" strokeDasharray="4 10">
            <animateTransform attributeName="transform" type="rotate" values="0 70 70;360 70 70" dur="50s" repeatCount="indefinite"/>
          </circle>
          <polygon points="70,12 118,90 22,90" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.2"/>
          <polygon points="70,128 22,50 118,50" fill="rgba(212,175,55,0.03)" stroke="rgba(212,175,55,0.35)" strokeWidth="1"/>
          <circle cx="70" cy="70" r="36" fill="none" stroke="rgba(212,175,55,0.09)" strokeWidth="0.6"/>
          {[0,60,120,180,240,300].map((angle, i) => {
            const r = angle * Math.PI / 180;
            return (
              <circle key={i} cx={70 + Math.cos(r) * 60} cy={70 + Math.sin(r) * 60} r="3" fill="rgba(255,235,100,0.85)">
                <animate attributeName="opacity" values="0.2;1;0.2" dur={`${1.8 + i * 0.3}s`} repeatCount="indefinite"/>
              </circle>
            );
          })}
          {[0,1,2].map(i => (
            <circle key={i} cx="70" cy="70" r="10" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="1">
              <animate attributeName="r" values="8;60" dur="3.5s" begin={`${i * 1.17}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.65;0" dur="3.5s" begin={`${i * 1.17}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          <circle cx="70" cy="70" r="5" fill="rgba(255,248,160,0.97)">
            <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite"/>
          </circle>
        </svg>

        <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(212,175,55,0.45)", marginBottom: 14 }}>
          SACRED LIBRARY · IN PREPARATION
        </p>
        <h1 style={{ ...TITLE_STYLE, fontSize: "clamp(24px,7vw,36px)", marginBottom: 12 }}>
          Holy Books
        </h1>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "1rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.7, maxWidth: 320, marginBottom: 32 }}>
          The Complete Restored Covenant Scriptures — 5 sacred volumes being sealed in the Akasha. Coming soon.
        </p>

        {/* Volume titles preview */}
        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
          {VOLUMES.map((v) => (
            <div key={v.num} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(212,175,55,0.10)",
              borderRadius: 16,
            }}>
              <span style={{ fontSize: 20, color: "rgba(212,175,55,0.55)", width: 28, textAlign: "center" }}>{v.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)", marginBottom: 3 }}>{v.num}</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 600, color: v.status === "coming" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>{v.title}</div>
              </div>
              <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 20,
                background: v.status === "complete" ? "rgba(212,175,55,0.1)" : v.status === "progress" ? "rgba(100,200,100,0.08)" : "rgba(255,255,255,0.04)",
                border: v.status === "complete" ? "1px solid rgba(212,175,55,0.28)" : v.status === "progress" ? "1px solid rgba(100,200,100,0.2)" : "1px solid rgba(255,255,255,0.08)",
                color: v.status === "complete" ? "rgba(212,175,55,0.75)" : v.status === "progress" ? "rgba(120,220,120,0.75)" : "rgba(255,255,255,0.2)",
              }}>
                {v.status === "complete" ? "Sealed" : v.status === "progress" ? "In Progress" : "Coming"}
              </span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate(-1)} style={{
          fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.4em",
          textTransform: "uppercase", color: "rgba(212,175,55,0.6)", background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.2)", borderRadius: 28, padding: "12px 28px", cursor: "pointer",
        }}>← Return</button>

        <style>{`@keyframes hShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }`}</style>
      </div>
    );
  }

  /* ── ADMIN FULL VIEW ────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#050505", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(212,175,55,0.12)",
        padding: "16px 20px", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 18 }}>←</button>
        <div>
          <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(212,175,55,0.45)", margin: 0 }}>SACRED LIBRARY · ADMIN</p>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: "rgba(212,175,55,0.9)", margin: 0 }}>Holy Books</h1>
        </div>
        <span style={{ marginLeft: "auto", fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.35)", color: "rgba(212,175,55,0.8)" }}>● ADMIN</span>
      </div>

      <div style={{ padding: "24px 20px 0" }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.92rem", color: "rgba(255,255,255,0.35)", marginBottom: 28 }}>
          The Complete Restored Covenant Scriptures — 5-volume sacred library. Read online, download PDF, or order physical copies.
        </p>

        {/* Volumes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {VOLUMES.map((v) => (
            <div key={v.num} style={{
              position: "relative", overflow: "hidden",
              background: "rgba(255,255,255,0.02)", border: `1px solid ${v.color}0.22)`,
              borderRadius: 20, padding: "20px 18px",
            }}>
              {/* Status badge */}
              <div style={{ position: "absolute", top: 14, right: 14 }}>
                <span style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20,
                  background: v.status === "complete" ? "rgba(212,175,55,0.12)" : v.status === "progress" ? "rgba(100,220,100,0.08)" : "rgba(255,255,255,0.04)",
                  border: v.status === "complete" ? "1px solid rgba(212,175,55,0.4)" : v.status === "progress" ? "1px solid rgba(100,220,100,0.25)" : "1px solid rgba(255,255,255,0.1)",
                  color: v.status === "complete" ? "rgba(212,175,55,0.9)" : v.status === "progress" ? "rgba(120,220,120,0.9)" : "rgba(255,255,255,0.3)",
                }}>
                  {v.status === "complete" ? "✦ Complete" : v.status === "progress" ? "◈ In Progress" : "○ Coming"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: `radial-gradient(circle at 35% 35%, ${v.color}0.2), ${v.color}0.05) 60%, rgba(5,5,5,0.8))`, border: `1px solid ${v.color}0.4)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: `${v.color}0.9)` }}>
                  {v.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 80 }}>
                  <div style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: `${v.color}0.5)`, marginBottom: 6 }}>{v.num}</div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 600, color: v.status !== "coming" ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)", lineHeight: 1.3, marginBottom: 6 }}>{v.title}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{v.subtitle}</div>
                </div>
              </div>

              {/* Action buttons — only for complete volumes */}
              {v.status === "complete" && (
                <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${v.color}0.08)` }}>
                  <button style={{ flex: 1, padding: "10px 0", borderRadius: 28, background: `${v.color}0.1)`, border: `1px solid ${v.color}0.35)`, color: `${v.color}0.85)`, fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer" }}>
                    📖 Read Online
                  </button>
                  <button style={{ flex: 1, padding: "10px 0", borderRadius: 28, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer" }}>
                    ⬇ PDF
                  </button>
                  <button style={{ flex: 1, padding: "10px 0", borderRadius: 28, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", cursor: "pointer" }}>
                    📦 Order
                  </button>
                </div>
              )}
              {v.status === "progress" && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${v.color}0.08)` }}>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "65%", background: `linear-gradient(90deg, ${v.color}0.6), ${v.color}0.9))`, borderRadius: 2, animation: "shimBar 2s ease-in-out infinite" }}/>
                  </div>
                  <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(120,220,120,0.5)", marginTop: 8 }}>65% — Being inscribed in the Akasha</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Physical copies CTA */}
        <div style={{ marginTop: 28, padding: "22px 20px", background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.18)", borderRadius: 20 }}>
          <p style={{ fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", marginBottom: 8 }}>PHYSICAL SACRED CODEX</p>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>Order the Complete Printed Edition</p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 12.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.6, marginBottom: 16 }}>
            Archival-quality parchment paper · Gold foil stamping · Linen-bound hardcover. Available when all 5 volumes are sealed.
          </p>
          <button style={{ padding: "12px 28px", borderRadius: 28, background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.4)", color: "rgba(212,175,55,0.85)", fontFamily: "'Montserrat',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", cursor: "pointer" }}>
            NOTIFY ME WHEN AVAILABLE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes hShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes shimBar { 0%,100%{opacity:0.7} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
