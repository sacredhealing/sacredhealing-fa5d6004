import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();

  const S = {
    page: { minHeight:"100vh", background:"#050505", paddingBottom:80 } as React.CSSProperties,
    topbar: { background:"rgba(0,0,0,0.95)", borderBottom:"1px solid rgba(212,175,55,0.15)",
      padding:"13px 18px", display:"flex", alignItems:"center", gap:14 } as React.CSSProperties,
    back: { background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20 } as React.CSSProperties,
    h1: { fontFamily:"serif", fontSize:15, color:"rgba(212,175,55,0.9)", flex:1 } as React.CSSProperties,
    body: { padding:"20px 18px" } as React.CSSProperties,
    bigBtn: (gold?: boolean) => ({
      width:"100%", padding:"20px 18px", borderRadius:16, marginBottom:14,
      background: gold ? "linear-gradient(135deg,rgba(139,105,20,0.35),rgba(212,175,55,0.15))" : "rgba(255,255,255,0.03)",
      border: gold ? "2px solid rgba(212,175,55,0.6)" : "1px solid rgba(212,175,55,0.2)",
      cursor:"pointer", display:"flex", alignItems:"center", gap:16, textAlign:"left" as const,
    } as React.CSSProperties),
    icon: { fontSize:26, flexShrink:0 },
    btnTitle: (gold?: boolean) => ({ fontFamily:"serif", fontSize:16, color: gold ? "#D4AF37" : "rgba(212,175,55,0.75)", marginBottom:4 } as React.CSSProperties),
    btnSub: { fontSize:11, color:"rgba(255,255,255,0.35)", lineHeight:1.5 } as React.CSSProperties,
    divider: { borderBottom:"1px solid rgba(255,255,255,0.06)", margin:"20px 0" } as React.CSSProperties,
    bookRow: { display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" } as React.CSSProperties,
    bookIcon: { fontSize:18, width:28, textAlign:"center" as const, color:"rgba(212,175,55,0.5)", flexShrink:0 },
    bookName: { fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:2 } as React.CSSProperties,
    bookSub: { fontSize:10, color:"rgba(255,255,255,0.3)", fontStyle:"italic" as const } as React.CSSProperties,
    badge: (done?: boolean) => ({
      fontSize:9, padding:"3px 10px", borderRadius:20, flexShrink:0,
      background: done ? "rgba(212,175,55,0.08)" : "rgba(100,220,100,0.07)",
      border: done ? "1px solid rgba(212,175,55,0.25)" : "1px solid rgba(100,220,100,0.2)",
      color: done ? "rgba(212,175,55,0.7)" : "rgba(120,220,120,0.7)",
    } as React.CSSProperties),
  };

  const VOLUMES = [
    { icon:"📜", title:"Torah", sub:"Genesis · Exodus · Leviticus · Numbers · Deuteronomy", done:true },
    { icon:"⚔️",  title:"Historical Books", sub:"Joshua through Esther · 15 books", done:true },
    { icon:"📖", title:"Wisdom Books", sub:"Job · Psalms · Proverbs · Ecclesiastes · Song of Solomon", done:true },
    { icon:"🔥", title:"Major Prophets", sub:"Isaiah · Jeremiah · Lamentations · Ezekiel · Daniel", done:true },
    { icon:"🕊️", title:"Minor Prophets", sub:"All 12 · Hosea through Malachi", done:true },
    { icon:"✝️",  title:"New Testament", sub:"Matthew through Revelation · All 27 books", done:true },
    { icon:"☥",  title:"Ethiopian Exclusives", sub:"Enoch · Jubilees · Meqabyan · Shepherd · Sinodos · Clement", done:true },
    { icon:"♛",  title:"Kebra Nagast", sub:"117 Chapters · Queen of Sheba · Menelik · The Ark", done:true },
    { icon:"✦",  title:"Sacred Additions", sub:"Nile Valley · Thomas · Holy Twelve · Poimandres", done:true },
    { icon:"🦁", title:"Rastafari Writings", sub:"Holy Piby · Ital Law · Holy Days · Black Israelites", done:true },
    { icon:"♚",  title:"Haile Selassie I", sub:"Deep Biography · Lineage · Coronation · Exile · OAU", done:true },
    { icon:"📜", title:"Imperial Covenant", sub:"Coronation 1930 · League of Nations 1936", done:true },
  ];

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.back} onClick={() => navigate(-1)}>←</button>
        <span style={S.h1}>Holy Books</span>

      </div>

      <div style={S.body}>

        {/* TOC BUTTON — FIRST AND BIGGEST */}
        <button style={S.bigBtn(true)} onClick={() => window.location.href = '/scriptures/toc.html'}>
          <span style={S.icon}>📋</span>
          <div>
            <div style={S.btnTitle(true)}>Table of Contents</div>
            <div style={S.btnSub}>Every book · chapter counts · tap any book to jump straight to it</div>
          </div>
        </button>

        {/* READ BUTTON */}
        <button style={S.bigBtn()} onClick={() => window.location.href = '/scriptures/index.html'}>
          <span style={S.icon}>📖</span>
          <div>
            <div style={S.btnTitle()}>Open the Full Scripture</div>
            <div style={S.btnSub}>88 books · Full screen · Parchment format · Print to PDF</div>
          </div>
        </button>

        <div style={S.divider}/>

        {/* BOOK LIST */}
        {VOLUMES.map((v,i) => (
          <div key={i} style={S.bookRow}>
            <span style={S.bookIcon}>{v.icon}</span>
            <div style={{flex:1}}>
              <div style={S.bookName}>{v.title}</div>
              <div style={S.bookSub}>{v.sub}</div>
            </div>
            <span style={S.badge(v.done)}>{v.done ? "✦" : "◈"}</span>
          </div>
        ))}

        <div style={S.divider}/>

        <div style={{padding:"16px", background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:14}}>
          <p style={{fontSize:8, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.4)", marginBottom:8}}>PDF · PRINT · AMAZON KDP</p>
          <p style={{fontSize:12, color:"rgba(255,255,255,0.3)", lineHeight:1.6, marginBottom:14}}>
            PDF included with Akasha-Infinity membership. Physical edition in preparation.
          </p>
          <button onClick={() => window.location.href = '/scriptures/index.html'}
            style={{width:"100%", padding:"12px", borderRadius:20, background:"rgba(212,175,55,0.08)",
              border:"1px solid rgba(212,175,55,0.3)", color:"rgba(212,175,55,0.8)",
              fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", cursor:"pointer"}}>
            ⬇ Open &amp; Print as PDF
          </button>
        </div>

      </div>
    </div>
  );
}
