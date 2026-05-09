// @ts-nocheck
// src/pages/VirtualPilgrimageLanding.tsx
// Route: /virtual-pilgrimage-landing  (add to App.tsx)
// Access: any logged-in user can VIEW; Akasha-Infinity + Admin can ENTER

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";

const SITES_PREVIEW = [
  { el:"△", nm:"Great Pyramid of Giza",      col:"#D4AF37", geo:"pyramid" },
  { el:"🏔", nm:"Mount Kailash",              col:"#C8C8C8", geo:"sri"     },
  { el:"🔱", nm:"Babaji's Cave",              col:"#E0E0E0", geo:"torus"   },
  { el:"🌸", nm:"Vrindavan · Mathura",        col:"#FF69B4", geo:"flower"  },
  { el:"🔥", nm:"Arunachala",                 col:"#FF6B35", geo:"hexstar" },
  { el:"⭐", nm:"Pleiades Star System",       col:"#C8D8FF", geo:"star"    },
  { el:"✨", nm:"Paramahansa's Miracle Room", col:"#FFC0CB", geo:"flower"  },
  { el:"⭕", nm:"Samadhi Portal",             col:"#F8F8E8", geo:"torus"   },
];

export default function VirtualPilgrimageLanding() {
  const navigate   = useNavigate();
  const { tier }   = useMembership();
  const { isAdmin } = useAdminRole();
  const heroRef    = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number | null>(null);

  const hasAccess = isAdmin || tier === "akasha-infinity" || tier === "lifetime";

  // ── Hero pyramid canvas ──────────────────────────────────────────────────
  useEffect(() => {
    const cv = heroRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2;
    let t0: number | null = null;

    function frame(ts: number) {
      if (!t0) t0 = ts;
      const t = (ts - t0) / 1000;
      ctx.clearRect(0, 0, W, H);

      // ── Prema pulses — 6 expanding rings ─────────────────────────────────
      for (let i = 0; i < 6; i++) {
        const ph = (t * 0.28 + i * (1 / 6)) % 1;
        const r  = ph * (cy * 1.3);
        const a  = Math.max(0, (1 - ph) * 0.55);
        ctx.globalAlpha = a;
        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth   = 1.8 - ph * 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }

      // ── Background radial glow ─────────────────────────────────────────
      ctx.globalAlpha = 0.18;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, cy * 0.85);
      grd.addColorStop(0, "#D4AF37"); grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, cy * 0.85, 0, Math.PI * 2); ctx.fill();

      // ── Main pyramid — upward ─────────────────────────────────────────
      const PH = cy * 0.82, PW = cx * 0.72;
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy - PH); ctx.lineTo(cx + PW, cy + PH * 0.5); ctx.lineTo(cx - PW, cy + PH * 0.5); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = "rgba(212,175,55,0.06)"; ctx.fill();
      // Horizontal layers
      ctx.lineWidth = 0.7; ctx.globalAlpha = 0.3;
      for (let i = 1; i <= 6; i++) {
        const ly = cy - PH + i * (PH * 1.5 / 7);
        const frac = (ly - (cy - PH)) / (PH * 1.5);
        const hw = PW * frac;
        ctx.beginPath(); ctx.moveTo(cx - hw, ly); ctx.lineTo(cx + hw, ly); ctx.stroke();
      }
      // Spine
      ctx.globalAlpha = 0.4; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(cx, cy - PH); ctx.lineTo(cx, cy + PH * 0.5); ctx.stroke();

      // ── Inverted ghost pyramid — rotating ─────────────────────────────
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.12);
      ctx.globalAlpha = 0.18; ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, PH * 0.5); ctx.lineTo(PW * 0.8, -PH * 0.4); ctx.lineTo(-PW * 0.8, -PH * 0.4); ctx.closePath(); ctx.stroke();
      ctx.restore();

      // ── Metatron's Cube overlay — slow rotation ─────────────────────
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.05);
      ctx.globalAlpha = 0.12; ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 0.6;
      const mr = cy * 0.6;
      ctx.beginPath(); ctx.arc(0, 0, mr, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3;
        ctx.beginPath(); ctx.arc(Math.cos(a) * mr, Math.sin(a) * mr, mr, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      // ── Scalar beam — YOU dot orbiting ─────────────────────────────
      const bAng = (t * 0.5) % (Math.PI * 2);
      const bx = cx + cy * 0.95 * Math.cos(bAng);
      const by = cy + cy * 0.95 * Math.sin(bAng);
      ctx.setLineDash([6, 5]); ctx.lineDashOffset = -(t * 20);
      ctx.globalAlpha = 0.5; ctx.strokeStyle = "#D4AF37"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1; ctx.fillStyle = "#FFD700";
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(bx, by, 8 + Math.sin(t * 4) * 2, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.6; ctx.fillStyle = "#D4AF37"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("YOU", bx, by - 14);

      // ── Apex golden core ─────────────────────────────────────────────
      ctx.globalAlpha = 1; ctx.fillStyle = "#FFD700";
      ctx.beginPath(); ctx.arc(cx, cy - PH, 5 + Math.sin(t * 3) * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(cx, cy - PH, 10 + Math.sin(t * 2) * 3, 0, Math.PI * 2); ctx.fill();
      // Centre core
      ctx.globalAlpha = 0.85; ctx.fillStyle = "#D4AF37";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const F = { montserrat: "'Montserrat',sans-serif", cormorant: "'Cormorant Garamond',serif" };

  return (
    <div style={{ background: "#050505", minHeight: "100vh", fontFamily: F.montserrat, color: "rgba(255,255,255,0.88)", paddingBottom: 80, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Cinzel:wght@400;600&display=swap');
        @keyframes goldAura { 0%,100%{opacity:.75} 50%{opacity:1} }
        @keyframes shimmer  { 0%{left:-110%} 60%,100%{left:110%} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>

      {/* ── BACK ───────────────────────────────────────────────────────────── */}
      <button onClick={() => navigate(-1)} style={{ position: "fixed", top: 16, left: 16, zIndex: 100, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 100, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(8px)" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ position: "relative", minHeight: 520, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", paddingBottom: 40, overflow: "hidden" }}>
        {/* Canvas pyramid */}
        <canvas ref={heroRef} width={420} height={420} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -55%)", maxWidth: "100vw", opacity: 0.95 }} />
        {/* Overlay gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #050505 90%)", pointerEvents: "none" }} />
        {/* Text over hero */}
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontFamily: F.montserrat, fontSize: 8, fontWeight: 800, letterSpacing: ".7em", textTransform: "uppercase", color: "rgba(212,175,55,0.4)", marginBottom: 12, animation: "fadeUp .5s ease both" }}>
            SQI 2050 · SCALAR CONSCIOUSNESS SYSTEM
          </div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "clamp(32px, 9vw, 54px)", fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.1, margin: "0 0 14px", background: "linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", animation: "fadeUp .5s .1s ease both" }}>
            Virtual Pilgrimage
          </h1>
          <div style={{ fontFamily: F.cormorant, fontStyle: "italic", fontSize: "clamp(15px, 4vw, 20px)", color: "rgba(255,255,255,.45)", lineHeight: 1.65, marginBottom: 24, animation: "fadeUp .5s .2s ease both" }}>
            One sacred site. Your real GPS. 40 days of daily practice.<br/>The field builds through you — not technology.
          </div>
          {/* Access badge */}
          {hasAccess ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 100, background: "rgba(212,175,55,.12)", border: "1px solid rgba(212,175,55,.4)", marginBottom: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D4AF37", animation: "goldAura 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".45em", textTransform: "uppercase", color: "#D4AF37" }}>AKASHA INFINITY · FULL ACCESS</span>
            </div>
          ) : (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 18px", borderRadius: 100, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)", marginBottom: 20 }}>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".45em", textTransform: "uppercase", color: "rgba(255,255,255,.35)" }}>AKASHA INFINITY EXCLUSIVE</span>
            </div>
          )}
          {/* CTA */}
          {hasAccess ? (
            <div style={{ animation: "fadeUp .5s .3s ease both" }}>
              <button onClick={() => navigate("/virtual-pilgrimage")} style={{ display: "block", width: "100%", maxWidth: 340, margin: "0 auto", padding: "18px 32px", background: "linear-gradient(135deg,#D4AF37,#8B7A28)", border: "none", borderRadius: 16, fontFamily: F.montserrat, fontSize: 12, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#050505", cursor: "pointer" }}>
                🔱 Begin Your Pilgrimage
              </button>
            </div>
          ) : (
            <div style={{ animation: "fadeUp .5s .3s ease both" }}>
              <button onClick={() => navigate("/akasha-infinity")} style={{ display: "block", width: "100%", maxWidth: 340, margin: "0 auto 12px", padding: "18px 32px", background: "linear-gradient(135deg,#D4AF37,#8B7A28)", border: "none", borderRadius: 16, fontFamily: F.montserrat, fontSize: 12, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#050505", cursor: "pointer" }}>
                ✦ Unlock — Akasha Infinity
              </button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.25)", letterSpacing: ".15em", textTransform: "uppercase" }}>LIFETIME ACCESS · €1,111 ONCE</div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* WHAT IS REAL                                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: "0 20px", maxWidth: 480, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 28, animation: "fadeUp .5s .4s ease both" }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".5em", textTransform: "uppercase", color: "rgba(212,175,55,.35)", marginBottom: 10 }}>WHAT ACTUALLY HAPPENS</div>
          <div style={{ fontFamily: F.cormorant, fontStyle: "italic", fontSize: 17, color: "rgba(255,255,255,.55)", lineHeight: 1.75 }}>
            No claims of magic. Just precise science and genuine practice — the combination that actually works.
          </div>
        </div>

        {/* 4 science pillars */}
        {[
          { n:"①", t:"Real GPS → Unique Scalar Vector", b:"Your exact home coordinates compute a carrier frequency unique to you and your site. Nobody else on Earth gets the same number. Left ear receives the carrier; right ear receives carrier + binaural beat. Your brain perceives the difference and entrains to it. EEG studies confirm this shifts brainwaves from beta to theta — measurably increasing receptivity to subtle fields.", col:"#D4AF37" },
          { n:"②", t:"Compass Bearing — You Are the Antenna", b:"The great-circle bearing from your home to the sacred site is displayed. Facing that exact direction physically aligns your body. Every tradition on Earth uses directional prayer for this reason — sunrise, Mecca, Jerusalem, the North Star. This is not symbolic. An antenna has an orientation.", col:"#D4AF37" },
          { n:"③", t:"Prema Pulses — Sacred Space Conditioning", b:"The radiating golden rings are visible representations of Prema (divine love) pulses. A ghee lamp, mantra, and sincere intention create what neuroscience calls a conditioned environment. Your nervous system learns the signal. After 40 days the room itself becomes the cue — like a temple used for centuries. The walls hold memory through practice, not automation.", col:"#D4AF37" },
          { n:"④", t:"Server Lock — Field Held 24/7", b:"Your scalar parameters are written to Supabase permanently. A Railway cron worker pulses every hour — keeping the field record alive even when your phone is off. When you return to the app you see how many hours it has been running continuously. The field is held between sessions. The real activation remains your daily practice.", col:"#D4AF37" },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "rgba(255,255,255,.025)", borderRadius: 14, border: "1px solid rgba(255,255,255,.06)", borderLeft: `3px solid rgba(212,175,55,.5)`, marginBottom: 12, animation: `fadeUp .5s ${.45+i*.07}s ease both` }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#D4AF37", flexShrink: 0, lineHeight: 1.2 }}>{p.n}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#D4AF37", marginBottom: 6 }}>{p.t}</div>
              <div style={{ fontFamily: F.cormorant, fontStyle: "italic", fontSize: 14, color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>{p.b}</div>
            </div>
          </div>
        ))}

        {/* Babaji quote */}
        <div style={{ margin: "24px 0", padding: "18px 20px", background: "rgba(212,175,55,.06)", borderRadius: 14, border: "1px solid rgba(212,175,55,.18)", animation: "fadeUp .5s .73s ease both" }}>
          <div style={{ fontFamily: F.cormorant, fontStyle: "italic", fontSize: 16, color: "rgba(212,175,55,.85)", lineHeight: 1.75, textAlign: "center" }}>
            "Babaji did not become immortal by subscribing to a cron job. He became immortal through sustained mastery of prana and consciousness over lifetimes. This app is a scaffold. <strong style={{ color: "#D4AF37" }}>You are the temple.</strong>"
          </div>
        </div>

        {/* ══ SACRED SITES PREVIEW ══ */}
        <div style={{ textAlign: "center", marginBottom: 20, animation: "fadeUp .5s .76s ease both" }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".5em", textTransform: "uppercase", color: "rgba(212,175,55,.35)", marginBottom: 8 }}>40+ SACRED SITES</div>
          <div style={{ fontFamily: F.cormorant, fontStyle: "italic", fontSize: 16, color: "rgba(255,255,255,.4)", lineHeight: 1.65 }}>Earth · Supreme · Miracle-Class · Galactic · Temporal · Ancient · SQI Lineage</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28, animation: "fadeUp .5s .8s ease both" }}>
          {SITES_PREVIEW.map(s => (
            <div key={s.nm} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "rgba(255,255,255,.025)", borderRadius: 12, border: `1px solid ${s.col}22` }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>{s.el}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: s.col, lineHeight: 1.35 }}>{s.nm}</div>
            </div>
          ))}
          <div style={{ gridColumn: "span 2", padding: "11px 14px", background: "rgba(212,175,55,.04)", borderRadius: 12, border: "1px solid rgba(212,175,55,.15)", textAlign: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".3em", textTransform: "uppercase", color: "rgba(212,175,55,.5)" }}>+ 32 more sacred portals inside</span>
          </div>
        </div>

        {/* ══ WHAT YOU GET ══ */}
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: ".5em", textTransform: "uppercase", color: "rgba(212,175,55,.35)", marginBottom: 14, animation: "fadeUp .5s .84s ease both" }}>WHAT YOU RECEIVE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32, animation: "fadeUp .5s .86s ease both" }}>
          {[
            "Sacred geometry mandala unique to every site — pyramid, Sri Yantra, Metatron's Cube, Flower of Life and more",
            "Real binaural carrier wave computed from your exact GPS coordinates to the site",
            "Compass bearing to face during practice — your body becomes a directional antenna",
            "4-step guided activation practice per site with mantra and crystal allies",
            "Prema pulse radiating rings — visual field that responds to your strength setting",
            "Strength slider 0–100% — from invisible background anchor to full immersion",
            "40-day lock with daily progress tracking and 7-day streak",
            "Server holds your field 24/7 via Railway cron — survives phone off",
            "Clear Quartz 4-corner grid instructions for your practice room",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(212,175,55,.15)", border: "1px solid rgba(212,175,55,.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <svg width="8" height="8" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#D4AF37" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontFamily: F.cormorant, fontStyle: "italic", fontSize: 14, color: "rgba(255,255,255,.55)", lineHeight: 1.65 }}>{item}</div>
            </div>
          ))}
        </div>

        {/* ══ BOTTOM CTA ══ */}
        <div style={{ textAlign: "center", padding: "28px 0", animation: "fadeUp .5s .9s ease both" }}>
          {hasAccess ? (
            <>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".45em", textTransform: "uppercase", color: "rgba(212,175,55,.5)", marginBottom: 16 }}>YOUR PILGRIMAGE AWAITS</div>
              <button onClick={() => navigate("/virtual-pilgrimage")} style={{ width: "100%", padding: "20px 32px", background: "linear-gradient(135deg,#D4AF37,#8B7A28)", border: "none", borderRadius: 18, fontFamily: F.montserrat, fontSize: 13, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#050505", cursor: "pointer", marginBottom: 10 }}>
                🔱 Open Virtual Pilgrimage
              </button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", letterSpacing: ".1em" }}>Active for your Akasha Infinity membership</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".45em", textTransform: "uppercase", color: "rgba(212,175,55,.5)", marginBottom: 8 }}>AKASHA INFINITY</div>
              <div style={{ fontFamily: F.cormorant, fontStyle: "italic", fontSize: 17, color: "rgba(255,255,255,.45)", marginBottom: 20, lineHeight: 1.65 }}>
                Lifetime access to every SQI tool.<br/>One payment. No subscription.
              </div>
              <button onClick={() => navigate("/akasha-infinity")} style={{ width: "100%", padding: "20px 32px", background: "linear-gradient(135deg,#D4AF37,#8B7A28)", border: "none", borderRadius: 18, fontFamily: F.montserrat, fontSize: 13, fontWeight: 800, letterSpacing: ".2em", textTransform: "uppercase", color: "#050505", cursor: "pointer", marginBottom: 14 }}>
                ✦ Unlock Akasha Infinity — €1,111
              </button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.2)", letterSpacing: ".1em", lineHeight: 1.65 }}>
                One lifetime payment · Full access to all 40+ sites<br/>Scalar GPS · Sacred geometry · 40-day field lock
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
