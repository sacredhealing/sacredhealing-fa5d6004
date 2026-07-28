import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  const openScripture = () => {
    window.open('/scriptures/index.html', '_blank');
  };

  if (!isAdmin) {
    return (
      <div style={{ minHeight:"100vh", background:"#050505", display:"flex",
        flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"40px 24px", textAlign:"center" }}>
        <button onClick={() => navigate(-1)} style={{ position:"absolute", top:20, left:20,
          background:"none", border:"none", color:"rgba(212,175,55,0.6)", fontSize:20, cursor:"pointer" }}>←</button>
        <div style={{ fontSize:48, marginBottom:24 }}>📖</div>
        <p style={{ fontFamily:"serif", fontSize:8, letterSpacing:"0.5em", textTransform:"uppercase",
          color:"rgba(212,175,55,0.4)", marginBottom:12 }}>SACRED LIBRARY · COMING SOON</p>
        <h1 style={{ fontFamily:"serif", fontSize:28, color:"#D4AF37", marginBottom:16 }}>Holy Books</h1>
        <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, lineHeight:1.7, maxWidth:300 }}>
          The Complete Restored Covenant Scriptures.<br/>5 sacred volumes. Coming soon.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"#050505", paddingBottom:80 }}>
      <div style={{ background:"rgba(0,0,0,0.8)", borderBottom:"1px solid rgba(212,175,55,0.15)",
        padding:"14px 20px", position:"sticky", top:0, zIndex:50,
        display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={() => navigate(-1)} style={{ background:"none", border:"none",
          color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:18 }}>←</button>
        <span style={{ fontFamily:"serif", fontSize:14, color:"rgba(212,175,55,0.9)", flex:1 }}>Holy Books</span>
        <span style={{ fontSize:9, letterSpacing:"0.2em", padding:"4px 10px", borderRadius:20,
          background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)",
          color:"rgba(212,175,55,0.8)" }}>ADMIN</span>
      </div>

      <div style={{ padding:"28px 20px" }}>
        <p style={{ color:"rgba(255,255,255,0.3)", fontSize:13, fontStyle:"italic", marginBottom:28, lineHeight:1.7 }}>
          One volume · Four books · The full restoration.
        </p>

        <button onClick={openScripture} style={{
          width:"100%", padding:"20px", borderRadius:16, marginBottom:20,
          background:"linear-gradient(135deg, rgba(139,105,20,0.25), rgba(212,175,55,0.1))",
          border:"1px solid rgba(212,175,55,0.5)", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:12
        }}>
          <span style={{ fontSize:24 }}>📖</span>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontFamily:"serif", fontSize:15, color:"#D4AF37", marginBottom:4 }}>
              Read the Complete Scripture
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>
              Opens in browser · Parchment format · Print to PDF
            </div>
          </div>
        </button>

        {[
          { icon:"☥", num:"Prologue", title:"Nile Valley Wisdom", sub:"Hymn to Aten · Maat · Poimandres" },
          { icon:"✦", num:"Vol. I",   title:"The Book of Enoch",   sub:"Complete · 105 Chapters" },
          { icon:"♛", num:"Vol. II",  title:"Kebra Nagast",        sub:"The Glory of Kings · 30 Chapters" },
          { icon:"✝", num:"Vol. III", title:"The Restored Gospels", sub:"Yohanan · Thomas · Holy Twelve" },
          { icon:"♚", num:"Vol. IV",  title:"Imperial Covenant",   sub:"Haile Selassie I — In Progress" },
        ].map(v => (
          <div key={v.num} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 0",
            borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize:20, width:28, textAlign:"center", color:"rgba(212,175,55,0.6)" }}>{v.icon}</span>
            <div>
              <div style={{ fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase",
                color:"rgba(212,175,55,0.35)", marginBottom:4 }}>{v.num}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.8)", marginBottom:2 }}>{v.title}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontStyle:"italic" }}>{v.sub}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop:28, padding:"20px", background:"rgba(212,175,55,0.04)",
          border:"1px solid rgba(212,175,55,0.15)", borderRadius:16 }}>
          <p style={{ fontSize:9, letterSpacing:"0.4em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.4)", marginBottom:8 }}>PDF &amp; PRINT EDITION</p>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:6 }}>
            PDF included with Akasha-Infinity
          </p>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6, marginBottom:16 }}>
            Physical edition on Amazon KDP when all volumes are sealed. Archival parchment · Gold foil · Linen hardcover.
          </p>
          <button onClick={openScripture} style={{ width:"100%", padding:"12px", borderRadius:24,
            background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.35)",
            color:"rgba(212,175,55,0.85)", fontSize:10, letterSpacing:"0.3em",
            textTransform:"uppercase", cursor:"pointer" }}>
            ⬇ Open &amp; Print as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
