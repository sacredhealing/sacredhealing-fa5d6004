import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const VOLUMES = [
  { icon:"☥", num:"Prologue", title:"Nile Valley Wisdom",    sub:"Hymn to Aten · Maat · Poimandres",          status:"complete" },
  { icon:"✦", num:"Vol. I",   title:"The Book of Enoch",     sub:"Complete · 105 Chapters",                   status:"complete" },
  { icon:"♛", num:"Vol. II",  title:"Kebra Nagast",          sub:"The Glory of Kings · 30 Chapters",          status:"complete" },
  { icon:"✝", num:"Vol. III", title:"The Restored Gospels",  sub:"Yohanan · Thomas · Holy Twelve",            status:"complete" },
  { icon:"♚", num:"Vol. IV",  title:"Imperial Covenant",     sub:"Haile Selassie I — In Preparation",        status:"progress" },
];

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const [reading, setReading] = useState(false);

  /* ── FULLSCREEN READER — stays inside app ── */
  if (reading) {
    return (
      <div style={{
        position:"fixed", inset:0, zIndex:9999,
        display:"flex", flexDirection:"column",
        background:"#FAF6EC",
      }}>
        {/* Thin top bar */}
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"10px 16px", flexShrink:0,
          background:"rgba(10,6,2,0.97)",
          borderBottom:"1px solid rgba(212,175,55,0.2)",
        }}>
          <button
            onClick={() => setReading(false)}
            style={{ background:"none", border:"none", color:"#D4AF37",
              fontSize:22, cursor:"pointer", lineHeight:1, padding:"2px 6px" }}
          >←</button>
          <span style={{ fontFamily:"serif", fontSize:11, letterSpacing:"0.3em",
            textTransform:"uppercase", color:"rgba(212,175,55,0.6)", flex:1 }}>
            Sacred Scripture
          </span>
          <button
            onClick={() => {
              const f = document.getElementById('sf') as HTMLIFrameElement;
              f?.contentWindow?.print();
            }}
            style={{ fontFamily:"serif", fontSize:9, letterSpacing:"0.25em",
              textTransform:"uppercase", color:"#D4AF37",
              background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.4)",
              borderRadius:20, padding:"7px 14px", cursor:"pointer" }}
          >⬇ PDF</button>
        </div>
        {/* iframe fills remaining space */}
        <iframe
          id="sf"
          src="/scriptures/index.html"
          style={{
            flex:1, border:"none", width:"100%",
            display:"block", overflow:"auto",
          }}
          scrolling="yes"
          title="The Complete Restored Covenant Scriptures"
        />
      </div>
    );
  }

  /* ── COMING SOON for non-admins ── */
  if (!isAdmin) {
    return (
      <div style={{ minHeight:"100vh", background:"#050505", display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"40px 24px", textAlign:"center" }}>
        <button onClick={() => navigate(-1)} style={{ position:"absolute", top:20, left:20,
          background:"none", border:"none", color:"rgba(212,175,55,0.6)", fontSize:22, cursor:"pointer" }}>←</button>
        <div style={{ fontSize:52, marginBottom:24 }}>📖</div>
        <p style={{ fontFamily:"serif", fontSize:8, letterSpacing:"0.5em", textTransform:"uppercase",
          color:"rgba(212,175,55,0.4)", marginBottom:12 }}>SACRED LIBRARY · COMING SOON</p>
        <h1 style={{ fontFamily:"serif", fontSize:28, color:"#D4AF37", marginBottom:16 }}>Holy Books</h1>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, lineHeight:1.7, maxWidth:300, marginBottom:32 }}>
          The Complete Restored Covenant Scriptures — 5 sacred volumes being sealed in the Akasha.
        </p>
        <div style={{ width:"100%", maxWidth:360, display:"flex", flexDirection:"column", gap:8 }}>
          {VOLUMES.map(v => (
            <div key={v.num} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.1)", borderRadius:14 }}>
              <span style={{ fontSize:18, color:"rgba(212,175,55,0.5)", width:24 }}>{v.icon}</span>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontSize:8, letterSpacing:"0.3em", textTransform:"uppercase",
                  color:"rgba(212,175,55,0.35)", marginBottom:3 }}>{v.num}</div>
                <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>{v.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── ADMIN VIEW ── */
  return (
    <div style={{ minHeight:"100vh", background:"#050505", paddingBottom:80 }}>
      <div style={{ background:"rgba(0,0,0,0.85)", borderBottom:"1px solid rgba(212,175,55,0.15)",
        padding:"14px 20px", position:"sticky", top:0, zIndex:50, backdropFilter:"blur(20px)",
        display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={() => navigate(-1)} style={{ background:"none", border:"none",
          color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20 }}>←</button>
        <span style={{ fontFamily:"serif", fontSize:15, color:"rgba(212,175,55,0.9)", flex:1 }}>Holy Books</span>
        <span style={{ fontSize:8, letterSpacing:"0.2em", padding:"4px 10px", borderRadius:20,
          background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)",
          color:"rgba(212,175,55,0.8)" }}>ADMIN</span>
      </div>

      <div style={{ padding:"28px 20px" }}>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, fontStyle:"italic", marginBottom:24, lineHeight:1.7 }}>
          One volume · Four books · The full restoration.
        </p>

        {/* BIG READ BUTTON */}
        <button onClick={() => setReading(true)} style={{
          width:"100%", padding:"22px", borderRadius:18, marginBottom:24,
          background:"linear-gradient(135deg,rgba(139,105,20,0.3),rgba(212,175,55,0.12))",
          border:"1px solid rgba(212,175,55,0.55)", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:14,
        }}>
          <span style={{ fontSize:28 }}>📖</span>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontFamily:"serif", fontSize:16, color:"#D4AF37", marginBottom:4 }}>
              Read the Complete Scripture
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>
              Opens inside the app · Print to PDF
            </div>
          </div>
        </button>

        {/* VOLUME LIST */}
        {VOLUMES.map(v => (
          <div key={v.num} style={{ display:"flex", alignItems:"center", gap:14,
            padding:"14px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize:20, width:28, textAlign:"center", color:"rgba(212,175,55,0.55)" }}>{v.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:8, letterSpacing:"0.3em", textTransform:"uppercase",
                color:"rgba(212,175,55,0.35)", marginBottom:4 }}>{v.num}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.8)", marginBottom:2 }}>{v.title}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontStyle:"italic" }}>{v.sub}</div>
            </div>
            <span style={{ fontSize:8, padding:"3px 10px", borderRadius:20,
              background: v.status==="complete" ? "rgba(212,175,55,0.08)" : "rgba(100,200,100,0.07)",
              border: v.status==="complete" ? "1px solid rgba(212,175,55,0.25)" : "1px solid rgba(100,200,100,0.2)",
              color: v.status==="complete" ? "rgba(212,175,55,0.7)" : "rgba(120,220,120,0.7)" }}>
              {v.status==="complete" ? "✦" : "◈"}
            </span>
          </div>
        ))}

        {/* PDF / PRINT */}
        <div style={{ marginTop:28, padding:"20px", background:"rgba(212,175,55,0.04)",
          border:"1px solid rgba(212,175,55,0.14)", borderRadius:16 }}>
          <p style={{ fontSize:8, letterSpacing:"0.4em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.4)", marginBottom:8 }}>PDF · PRINT · AMAZON KDP</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6, marginBottom:16 }}>
            PDF included with Akasha-Infinity membership. Physical edition with archival parchment,
            gold foil and linen hardcover available on Amazon KDP when all volumes are sealed.
          </p>
          <button onClick={() => setReading(true)} style={{ width:"100%", padding:"12px", borderRadius:24,
            background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.35)",
            color:"rgba(212,175,55,0.85)", fontSize:9, letterSpacing:"0.3em",
            textTransform:"uppercase", cursor:"pointer" }}>
            ⬇ Open &amp; Print as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
