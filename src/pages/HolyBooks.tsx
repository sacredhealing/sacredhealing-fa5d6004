import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const GOLD = "#D4AF37";

const VOLUMES = [
  { num:"PROLOGUE", title:"Nile Valley Wisdom", subtitle:"Hymn to Aten · 42 Declarations of Maat · Poimandres", status:"complete", icon:"☥" },
  { num:"VOL. I",   title:"The Book of Enoch",  subtitle:"Complete Sacred Codex · 105 Chapters",              status:"complete", icon:"✦" },
  { num:"VOL. II",  title:"Kebra Nagast",        subtitle:"The Glory of Kings · 30 Chapters",                 status:"complete", icon:"♛" },
  { num:"VOL. III", title:"The Restored Gospels",subtitle:"Yohanan · Thomas · Gospel of the Holy Twelve",     status:"complete", icon:"✝" },
  { num:"VOL. IV",  title:"Imperial Covenant",   subtitle:"Four Great Speeches of Haile Selassie I",          status:"progress", icon:"♚" },
];

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const [reading, setReading] = useState(false);

  /* ── FULLSCREEN READER ── */
  if (reading) {
    return (
      <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#050505", display:"flex", flexDirection:"column" }}>
        <div style={{
          display:"flex", alignItems:"center", gap:12, padding:"10px 16px",
          background:"rgba(10,6,2,0.97)", borderBottom:"1px solid rgba(212,175,55,0.15)",
          flexShrink:0
        }}>
          <button onClick={() => setReading(false)} style={{
            background:"none", border:"none", color:GOLD,
            fontSize:20, cursor:"pointer", padding:"4px 8px"
          }}>←</button>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:10, letterSpacing:"0.4em",
            textTransform:"uppercase", color:"rgba(212,175,55,0.6)", flex:1 }}>
            The Complete Restored Covenant Scriptures
          </span>
          <button onClick={() => {
            const f = document.getElementById('scripture-frame') as HTMLIFrameElement;
            if (f?.contentWindow) f.contentWindow.print();
          }} style={{
            fontFamily:"'Cinzel',serif", fontSize:7, letterSpacing:"0.3em",
            textTransform:"uppercase", color:GOLD, background:"rgba(212,175,55,0.1)",
            border:"1px solid rgba(212,175,55,0.35)", borderRadius:20, padding:"7px 14px", cursor:"pointer"
          }}>⬇ PDF</button>
        </div>
        <iframe
          id="scripture-frame"
          src="/scriptures/index.html"
          style={{ flex:1, border:"none", width:"100%", height:"100%" }}
          title="Sacred Scripture"
        />
      </div>
    );
  }

  /* ── COMING SOON for non-admins ── */
  if (!isAdmin) {
    return (
      <div style={{ minHeight:"100vh", background:"#050505", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", padding:"40px 24px", textAlign:"center" }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ marginBottom:28 }}>
          <defs>
            <radialGradient id="csg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,215,70,0.25)"/>
              <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
            </radialGradient>
          </defs>
          <ellipse cx="60" cy="60" rx="58" ry="58" fill="url(#csg)"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.8" strokeDasharray="4 8">
            <animateTransform attributeName="transform" type="rotate" values="0 60 60;360 60 60" dur="50s" repeatCount="indefinite"/>
          </circle>
          <polygon points="60,8 106,86 14,86" fill="rgba(212,175,55,0.05)" stroke="rgba(212,175,55,0.55)" strokeWidth="1.2"/>
          <polygon points="60,112 14,34 106,34" fill="rgba(212,175,55,0.03)" stroke="rgba(212,175,55,0.35)" strokeWidth="1"/>
          {[0,1,2].map(i => (
            <circle key={i} cx="60" cy="60" r="8" fill="none" stroke="rgba(212,175,55,0.6)" strokeWidth="1">
              <animate attributeName="r" values="6;54" dur="3.5s" begin={`${i*1.17}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.6;0" dur="3.5s" begin={`${i*1.17}s`} repeatCount="indefinite"/>
            </circle>
          ))}
          <circle cx="60" cy="60" r="5" fill="rgba(255,248,160,0.95)"/>
        </svg>
        <p style={{ fontFamily:"'Cinzel',serif", fontSize:7, fontWeight:800, letterSpacing:"0.45em",
          textTransform:"uppercase", color:"rgba(212,175,55,0.4)", marginBottom:12 }}>
          SACRED LIBRARY · COMING SOON
        </p>
        <h1 style={{ fontFamily:"'Cinzel',serif", fontSize:26, fontWeight:700, color:GOLD, marginBottom:12 }}>
          Holy Books
        </h1>
        <p style={{ fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"0.9rem",
          color:"rgba(255,255,255,0.35)", lineHeight:1.7, maxWidth:300, marginBottom:28 }}>
          The Complete Restored Covenant Scriptures — 5 sacred volumes being sealed in the Akasha.
        </p>
        <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", gap:8, marginBottom:28 }}>
          {VOLUMES.map(v => (
            <div key={v.num} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.1)", borderRadius:14 }}>
              <span style={{ fontSize:18, color:"rgba(212,175,55,0.5)", width:24, textAlign:"center" }}>{v.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:7, letterSpacing:"0.35em",
                  textTransform:"uppercase", color:"rgba(212,175,55,0.35)", marginBottom:3 }}>{v.num}</div>
                <div style={{ fontFamily:"Georgia,serif", fontSize:12,
                  color:v.status==="coming"?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.65)" }}>{v.title}</div>
              </div>
              <span style={{ fontFamily:"'Cinzel',serif", fontSize:6, letterSpacing:"0.2em", padding:"3px 8px",
                borderRadius:20, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)",
                color:"rgba(212,175,55,0.6)" }}>
                {v.status==="complete"?"Sealed":v.status==="progress"?"Soon":"◦"}
              </span>
            </div>
          ))}
        </div>
        <button onClick={() => navigate(-1)} style={{ fontFamily:"'Cinzel',serif", fontSize:7, letterSpacing:"0.4em",
          textTransform:"uppercase", color:"rgba(212,175,55,0.5)", background:"rgba(212,175,55,0.06)",
          border:"1px solid rgba(212,175,55,0.18)", borderRadius:24, padding:"12px 28px", cursor:"pointer" }}>
          ← Return
        </button>
      </div>
    );
  }

  /* ── ADMIN VIEW ── */
  return (
    <div style={{ minHeight:"100vh", background:"#050505", paddingBottom:80 }}>
      <div style={{ background:"rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(212,175,55,0.12)",
        padding:"16px 20px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(20px)",
        display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={() => navigate(-1)} style={{ background:"none", border:"none",
          color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:18 }}>←</button>
        <div>
          <p style={{ fontFamily:"'Cinzel',serif", fontSize:6, letterSpacing:"0.45em",
            textTransform:"uppercase", color:"rgba(212,175,55,0.45)", margin:0 }}>SACRED LIBRARY</p>
          <h1 style={{ fontFamily:"'Cinzel',serif", fontSize:18, color:"rgba(212,175,55,0.9)", margin:0 }}>Holy Books</h1>
        </div>
        <span style={{ marginLeft:"auto", fontFamily:"'Cinzel',serif", fontSize:6, letterSpacing:"0.25em",
          textTransform:"uppercase", padding:"4px 12px", borderRadius:20,
          background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.35)",
          color:"rgba(212,175,55,0.8)" }}>● ADMIN</span>
      </div>

      <div style={{ padding:"24px 20px 0" }}>
        <p style={{ fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"0.88rem",
          color:"rgba(255,255,255,0.3)", marginBottom:24 }}>
          One volume · Four books · The full restoration. Read inside the app, download as PDF, or order in print.
        </p>

        {/* READ BUTTON */}
        <button onClick={() => setReading(true)} style={{
          width:"100%", padding:"18px 0", marginBottom:24, borderRadius:28,
          background:"linear-gradient(135deg, rgba(139,105,20,0.3), rgba(212,175,55,0.15))",
          border:"1px solid rgba(212,175,55,0.55)", cursor:"pointer",
          fontFamily:"'Cinzel',serif", fontSize:12, letterSpacing:"0.4em",
          textTransform:"uppercase", color:GOLD,
        }}>
          📖 &nbsp; Open Sacred Scripture
        </button>

        {/* VOLUMES */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {VOLUMES.map(v => (
            <div key={v.num} style={{ background:"rgba(255,255,255,0.02)",
              border:"1px solid rgba(212,175,55,0.15)", borderRadius:18, padding:"18px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <span style={{ fontSize:22, color:"rgba(212,175,55,0.6)", width:32, textAlign:"center" }}>{v.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:6, letterSpacing:"0.4em",
                    textTransform:"uppercase", color:"rgba(212,175,55,0.4)", marginBottom:5 }}>{v.num}</div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:14, color:"rgba(255,255,255,0.85)",
                    marginBottom:4 }}>{v.title}</div>
                  <div style={{ fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:11,
                    color:"rgba(255,255,255,0.3)" }}>{v.subtitle}</div>
                </div>
                <span style={{ fontFamily:"'Cinzel',serif", fontSize:6, letterSpacing:"0.2em",
                  padding:"3px 10px", borderRadius:20,
                  background:v.status==="complete"?"rgba(212,175,55,0.1)":"rgba(100,220,100,0.07)",
                  border:v.status==="complete"?"1px solid rgba(212,175,55,0.35)":"1px solid rgba(100,220,100,0.2)",
                  color:v.status==="complete"?"rgba(212,175,55,0.85)":"rgba(120,220,120,0.8)" }}>
                  {v.status==="complete"?"✦ Done":"◈ WIP"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* PDF + PHYSICAL */}
        <div style={{ marginTop:24, padding:"20px 18px", background:"rgba(212,175,55,0.04)",
          border:"1px solid rgba(212,175,55,0.15)", borderRadius:18 }}>
          <p style={{ fontFamily:"'Cinzel',serif", fontSize:7, letterSpacing:"0.4em",
            textTransform:"uppercase", color:"rgba(212,175,55,0.45)", marginBottom:8 }}>DISTRIBUTION</p>
          <p style={{ fontFamily:"'Cinzel',serif", fontSize:15, color:"rgba(255,255,255,0.75)", marginBottom:6 }}>
            PDF · Physical · Amazon KDP
          </p>
          <p style={{ fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:12,
            color:"rgba(255,255,255,0.3)", lineHeight:1.6, marginBottom:16 }}>
            PDF included with Akasha-Infinity membership. Physical edition: archival parchment, gold foil, linen hardcover. Available on Amazon KDP when all volumes are sealed.
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={() => setReading(true)} style={{ flex:1, padding:"11px 0", borderRadius:24,
              background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.35)",
              color:"rgba(212,175,55,0.85)", fontFamily:"'Cinzel',serif", fontSize:7,
              letterSpacing:"0.3em", textTransform:"uppercase", cursor:"pointer" }}>
              ⬇ Download PDF
            </button>
            <button style={{ flex:1, padding:"11px 0", borderRadius:24,
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.1)",
              color:"rgba(255,255,255,0.4)", fontFamily:"'Cinzel',serif", fontSize:7,
              letterSpacing:"0.3em", textTransform:"uppercase", cursor:"pointer" }}>
              📦 Order Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
