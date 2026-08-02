import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminRole();
  const [mode, setMode] = useState<"menu"|"reader"|"gh12">("menu");

  // Opens the full scripture reader (all 88+ books)
  const openReader = () => setMode("reader");
  // Opens the reader deep-linked directly to Gospel of the Holy Twelve
  const openGH12 = () => setMode("gh12");

  const S = {
    page: { minHeight:"100vh", background:"#050505" } as React.CSSProperties,
    topbar: { background:"rgba(0,0,0,0.95)", borderBottom:"1px solid rgba(212,175,55,0.15)",
      padding:"13px 18px", display:"flex", alignItems:"center", gap:14,
      position:"sticky" as const, top:0, zIndex:100 } as React.CSSProperties,
    back: { background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20 } as React.CSSProperties,
    h1: { fontFamily:"serif", fontSize:15, color:"rgba(212,175,55,0.9)", flex:1 } as React.CSSProperties,
  };

  if (isLoading) return (
    <div style={{...S.page, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{color:"rgba(212,175,55,0.5)", fontFamily:"serif"}}>Opening...</div>
    </div>
  );

  // ── FULL READER MODE ────────────────────────────────────────
  if (mode === "reader") {
    return (
      <div style={{height:"100dvh", display:"flex", flexDirection:"column", background:"#050505"}}>
        <div style={S.topbar}>
          <button style={S.back} onClick={() => setMode("menu")}>← Back</button>
          <span style={S.h1}>The Complete Scripture</span>
        </div>
        <iframe
          src="/scriptures/index.html"
          title="Scripture Reader"
          style={{flex:1, width:"100%", border:"none", background:"#FAF6EC"}}
        />
      </div>
    );
  }

  // ── GOSPEL OF THE HOLY TWELVE DEEP-LINK MODE ───────────────
  if (mode === "gh12") {
    return (
      <div style={{height:"100dvh", display:"flex", flexDirection:"column", background:"#050505"}}>
        <div style={S.topbar}>
          <button style={S.back} onClick={() => setMode("menu")}>← Back</button>
          <span style={S.h1}>Gospel of the Holy Twelve</span>
          <span style={{fontSize:8, letterSpacing:"0.3em", color:"rgba(212,175,55,0.5)",
            background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)",
            padding:"4px 10px", borderRadius:20}}>96 LECTIONS</span>
        </div>
        <iframe
          src="/scriptures/index.html#gospel-holy-twelve-intro"
          title="Gospel of the Holy Twelve"
          style={{flex:1, width:"100%", border:"none", background:"#FAF6EC"}}
        />
      </div>
    );
  }

  // ── ADMIN MENU ─────────────────────────────────────────────
  if (isAdmin) {
    return (
      <div style={S.page}>
        <div style={S.topbar}>
          <button style={S.back} onClick={() => navigate(-1)}>←</button>
          <span style={S.h1}>Holy Books</span>
          <span style={{fontSize:8, letterSpacing:"0.3em", color:"rgba(212,175,55,0.5)",
            background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)",
            padding:"4px 10px", borderRadius:20}}>ADMIN</span>
        </div>
        <div style={{padding:"20px 18px"}}>

          {/* ── Full Scripture Reader ── */}
          <button style={{width:"100%", padding:"20px 18px", borderRadius:16, marginBottom:8,
            background:"linear-gradient(135deg,rgba(139,105,20,0.35),rgba(212,175,55,0.15))",
            border:"2px solid rgba(212,175,55,0.6)", cursor:"pointer",
            display:"flex", alignItems:"center", gap:16, textAlign:"left" as const}}
            onClick={openReader}>
            <span style={{fontSize:28}}>📖</span>
            <div>
              <div style={{fontFamily:"serif", fontSize:16, color:"#D4AF37", marginBottom:4}}>
                Open the Full Scripture
              </div>
              <div style={{fontSize:11, color:"rgba(255,255,255,0.35)"}}>
                88 books · All verses · Parchment reader
              </div>
            </div>
          </button>

          {/* ── Gospel of the Holy Twelve Featured Card ── */}
          <button style={{width:"100%", padding:"18px", borderRadius:16, marginBottom:16,
            background:"linear-gradient(135deg,rgba(20,80,40,0.45),rgba(212,175,55,0.1))",
            border:"1px solid rgba(120,200,120,0.3)", cursor:"pointer",
            display:"flex", alignItems:"center", gap:16, textAlign:"left" as const}}
            onClick={openGH12}>
            <span style={{fontSize:26}}>🌿</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"serif", fontSize:14, color:"#C9D4AF", marginBottom:3}}>
                Gospel of the Holy Twelve
              </div>
              <div style={{fontSize:10, color:"rgba(255,255,255,0.35)", lineHeight:1.5}}>
                Complete · 96 Lections · 1,500 Verses · Restored Names
              </div>
            </div>
            <span style={{fontSize:9, letterSpacing:"0.2em", color:"rgba(180,220,180,0.5)",
              background:"rgba(120,200,120,0.08)", border:"1px solid rgba(120,200,120,0.2)",
              padding:"3px 8px", borderRadius:10, whiteSpace:"nowrap" as const}}>NEW</span>
          </button>

          <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)", margin:"4px 0 14px"}}/>

          {/* ── Section Index ── */}
          {[
            {icon:"📜", t:"Torah", s:"Genesis · Exodus · Leviticus · Numbers · Deuteronomy"},
            {icon:"⚔️", t:"Historical Books", s:"Joshua through Chronicles · 15 Books"},
            {icon:"📖", t:"Wisdom & Poetry", s:"Job · Psalms · Proverbs · Ecclesiastes · Solomon"},
            {icon:"🔥", t:"Major Prophets", s:"Isaiah · Jeremiah · Ezekiel · Daniel"},
            {icon:"🕊️", t:"Minor Prophets", s:"Hosea through Malachi · 12 Books"},
            {icon:"✝️", t:"New Testament", s:"Matthew through Revelation · All 27 Books"},
            {icon:"🌿", t:"Gospel of the Holy Twelve", s:"96 Lections · Complete · Ouseley 1923"},
            {icon:"👁️", t:"1 · 2 · 3 Enoch", s:"Complete Ethiopian Enochic Canon"},
            {icon:"♛",  t:"Kebra Nagast", s:"117 Chapters · The Ark of the Covenant"},
            {icon:"⚔️", t:"1 · 2 · 3 Meqabyan", s:"The Ethiopian Maccabees"},
            {icon:"🌿", t:"Book of Jasher", s:"91 Chapters · 3,910 Verses"},
            {icon:"🦁", t:"Rastafari Sacred Writings", s:"Holy Piby · Ital Law · Garvey · Howell"},
            {icon:"♚",  t:"Haile Selassie I", s:"Biography · UN 1963 · The War Speech"},
            {icon:"🌱", t:"The Ital Living Food Transmission", s:"Parts I–XII · Prana · DNA Symphony"},
            {icon:"✦",  t:"The Akashic Transmission", s:"Abraham · Moses · Yeshua · The Saints"},
            {icon:"📖", t:"Sacred Lexicon", s:"Vedic · Rastafari · Ethiopian · Gnostic Terms"},
          ].map((v,i) => (
            <div key={i} style={{display:"flex", gap:12, padding:"9px 0",
              borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span style={{fontSize:15, width:22, textAlign:"center" as const,
                color:"rgba(212,175,55,0.5)", flexShrink:0}}>{v.icon}</span>
              <div>
                <div style={{fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:1}}>{v.t}</div>
                <div style={{fontSize:10, color:"rgba(255,255,255,0.25)"}}>{v.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── PUBLIC SHOWCASE ────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.back} onClick={() => navigate(-1)}>←</button>
        <span style={S.h1}>Holy Books</span>
      </div>
      <div style={{padding:"32px 20px", textAlign:"center"}}>
        <div style={{fontSize:52, marginBottom:12}}>📖</div>
        <div style={{fontSize:8, letterSpacing:"0.6em", textTransform:"uppercase",
          color:"rgba(212,175,55,0.4)", marginBottom:16}}>
          The Complete Restored Covenant Scriptures
        </div>
        <h1 style={{fontFamily:"serif", fontSize:24, color:"#D4AF37", lineHeight:1.3,
          marginBottom:6, fontWeight:400}}>The Complete Ethiopian Bible</h1>
        <p style={{fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4}}>
          In English · All 88 Books · Every Verse</p>
        <p style={{fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:24}}>
          Including the Books the West Removed</p>
        <div style={{width:100, height:1,
          background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)",
          margin:"0 auto 28px"}}/>
        <button onClick={() => window.open("https://www.amazon.com","_blank")}
          style={{width:"100%", maxWidth:340, padding:"16px 20px", borderRadius:16,
            background:"linear-gradient(135deg,rgba(139,105,20,0.4),rgba(212,175,55,0.2))",
            border:"2px solid rgba(212,175,55,0.6)", color:"#D4AF37", fontSize:13,
            fontFamily:"serif", cursor:"pointer", display:"block", margin:"0 auto 10px"}}>
          📦 Buy Physical Book on Amazon
        </button>
        <button onClick={() => window.open("https://www.amazon.com","_blank")}
          style={{width:"100%", maxWidth:340, padding:"14px 20px", borderRadius:16,
            background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,175,55,0.25)",
            color:"rgba(212,175,55,0.7)", fontSize:12, fontFamily:"serif",
            cursor:"pointer", display:"block", margin:"0 auto 24px"}}>
          📱 Buy Kindle / Digital Edition
        </button>
        <div style={{maxWidth:340, margin:"0 auto 32px", padding:"14px 16px",
          background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:14}}>
          <p style={{fontSize:8, letterSpacing:"0.4em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.35)", marginBottom:6}}>Coming Soon in the App</p>
          <p style={{fontSize:11, color:"rgba(255,255,255,0.25)", lineHeight:1.6}}>
            Interactive scripture reader available soon inside Siddha Quantum Intelligence.
          </p>
        </div>
      </div>
    </div>
  );
}
