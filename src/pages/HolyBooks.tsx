import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const VOLUMES = [
  { icon:"☥", num:"Prologue",  title:"Nile Valley Wisdom",    sub:"Hymn to Aten · Maat · Poimandres",        status:"complete" },
  { icon:"📖", num:"OT",       title:"Ethiopian Old Testament", sub:"Genesis through Malachi · 39 Books",      status:"complete" },
  { icon:"✝",  num:"NT",       title:"New Testament",          sub:"Matthew through Revelation · 27 Books",   status:"complete" },
  { icon:"☥",  num:"Exclusives",title:"Ethiopian Exclusives",  sub:"Enoch · Jubilees · Meqabyan · Sinodos",   status:"complete" },
  { icon:"♛",  num:"Vol. II",  title:"Kebra Nagast",           sub:"117 Chapters — The Glory of Kings",       status:"complete" },
  { icon:"✝",  num:"Gospels",  title:"Restored Gospels",       sub:"Thomas · Holy Twelve · Yohanan",          status:"complete" },
  { icon:"♚",  num:"Imperial", title:"Imperial Covenant",      sub:"Haile Selassie I — In Preparation",       status:"progress" },
];

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  const openScripture = () => {
    window.location.href = '/scriptures/index.html';
  };

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
          The Complete Restored Covenant Scriptures — 88 sacred books of the Ethiopian Orthodox Bible.
        </p>
        <div style={{ width:"100%", maxWidth:360, display:"flex", flexDirection:"column", gap:8 }}>
          {VOLUMES.map(v => (
            <div key={v.num} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px",
              background:"rgba(255,255,255,0.02)", border:"1px solid rgba(212,175,55,0.1)", borderRadius:14 }}>
              <span style={{ fontSize:18, color:"rgba(212,175,55,0.5)", width:24 }}>{v.icon}</span>
              <div style={{ flex:1, textAlign:"left" }}>
                <div style={{ fontSize:8, letterSpacing:"0.3em", textTransform:"uppercase",
                  color:"rgba(212,175,55,0.35)", marginBottom:3 }}>{v.num}</div>
                <div style={{ fontSize:13, color: v.status==="coming" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.65)" }}>{v.title}</div>
              </div>
              <span style={{ fontSize:8, padding:"3px 8px", borderRadius:20,
                background: v.status==="complete" ? "rgba(212,175,55,0.08)" : "rgba(100,220,100,0.07)",
                border: v.status==="complete" ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(100,220,100,0.2)",
                color: v.status==="complete" ? "rgba(212,175,55,0.6)" : "rgba(120,220,120,0.7)" }}>
                {v.status==="complete" ? "✦" : "◈"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#050505", paddingBottom:80 }}>
      <div style={{ background:"rgba(0,0,0,0.9)", borderBottom:"1px solid rgba(212,175,55,0.15)",
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
          88 books · Ethiopian Orthodox Canon · One sacred volume.
        </p>

        <button onClick={openScripture} style={{
          width:"100%", padding:"22px", borderRadius:18, marginBottom:24,
          background:"linear-gradient(135deg,rgba(139,105,20,0.3),rgba(212,175,55,0.12))",
          border:"2px solid rgba(212,175,55,0.55)", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:14,
        }}>
          <span style={{ fontSize:28 }}>📖</span>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontFamily:"serif", fontSize:17, color:"#D4AF37", marginBottom:4 }}>
              Open the Complete Scripture
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
              Full screen · Parchment format · Print to PDF
            </div>
          </div>
        </button>

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
            <span style={{ fontSize:9, padding:"3px 10px", borderRadius:20,
              background: v.status==="complete" ? "rgba(212,175,55,0.08)" : "rgba(100,220,100,0.07)",
              border: v.status==="complete" ? "1px solid rgba(212,175,55,0.25)" : "1px solid rgba(100,220,100,0.2)",
              color: v.status==="complete" ? "rgba(212,175,55,0.7)" : "rgba(120,220,120,0.7)" }}>
              {v.status==="complete" ? "✦ Done" : "◈ WIP"}
            </span>
          </div>
        ))}

        <div style={{ marginTop:28, padding:"20px", background:"rgba(212,175,55,0.04)",
          border:"1px solid rgba(212,175,55,0.14)", borderRadius:16 }}>
          <p style={{ fontSize:8, letterSpacing:"0.4em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.4)", marginBottom:8 }}>PDF · PRINT · AMAZON KDP</p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6, marginBottom:16 }}>
            PDF included with Akasha-Infinity membership. Physical edition on Amazon KDP when complete.
            Archival parchment · Gold foil · Linen hardcover.
          </p>
          <button onClick={openScripture} style={{ width:"100%", padding:"13px", borderRadius:24,
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
