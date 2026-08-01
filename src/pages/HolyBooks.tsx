import React from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { useMembership } from "@/hooks/useMembership";
import { getTierRank } from "@/lib/tierAccess";

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { tier, loading } = useMembership();

  // Admin or any paid tier (rank >= 1) gets access
  const hasAccess = isAdmin || getTierRank(tier) >= 1;

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

  if (loading) {
    return (
      <div style={{...S.page, display:"flex", alignItems:"center", justifyContent:"center"}}>
        <div style={{width:32, height:32, borderRadius:"50%", border:"2px solid rgba(212,175,55,0.2)",
          borderTopColor:"#D4AF37", animation:"spin 1s linear infinite"}} />
      </div>
    );
  }

  // ── LOCKED SCREEN — no access ──────────────────────────────
  if (!hasAccess) {
    return (
      <div style={S.page}>
        <div style={S.topbar}>
          <button style={S.back} onClick={() => navigate(-1)}>←</button>
          <span style={S.h1}>Holy Books</span>
        </div>

        <div style={{padding:"40px 24px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center"}}>

          {/* Ornament */}
          <div style={{fontSize:48, marginBottom:8}}>📖</div>
          <div style={{fontSize:10, letterSpacing:"0.5em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.4)", marginBottom:24, fontFamily:"serif"}}>
            THE COMPLETE RESTORED COVENANT SCRIPTURES
          </div>

          {/* Title */}
          <h1 style={{fontFamily:"serif", fontSize:26, color:"#D4AF37", lineHeight:1.3,
            marginBottom:8, fontWeight:400}}>
            The Complete Ethiopian Bible
          </h1>
          <p style={{fontSize:13, color:"rgba(255,255,255,0.3)", marginBottom:6}}>
            88 Sacred Books · All Books the West Removed
          </p>
          <p style={{fontSize:11, color:"rgba(212,175,55,0.4)", marginBottom:32, letterSpacing:"0.2em"}}>
            1 Enoch · Jubilees · Kebra Nagast · Meqabyan · Jasher · The Lost Gospels · Rastafari Writings
          </p>

          {/* Gold rule */}
          <div style={{width:120, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.4),transparent)",
            marginBottom:32}} />

          {/* What they get */}
          <div style={{width:"100%", maxWidth:340, marginBottom:32}}>
            {[
              "Full parchment scripture reader",
              "All 88 books in beautiful format",
              "1 Enoch · 2 Enoch · 3 Enoch complete",
              "Kebra Nagast · 117 chapters",
              "Rastafari Sacred Writings",
              "Haile Selassie I transmissions",
              "Sacred Lexicon & commentaries",
              "Print to PDF for physical copy",
            ].map((f, i) => (
              <div key={i} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0",
                borderBottom:"1px solid rgba(255,255,255,0.04)", textAlign:"left"}}>
                <span style={{color:"#D4AF37", fontSize:12}}>✦</span>
                <span style={{fontSize:12, color:"rgba(255,255,255,0.55)"}}>{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate("/membership")}
            style={{width:"100%", maxWidth:340, padding:"18px 24px", borderRadius:20,
              background:"linear-gradient(135deg,rgba(139,105,20,0.4),rgba(212,175,55,0.2))",
              border:"2px solid rgba(212,175,55,0.6)", color:"#D4AF37",
              fontSize:13, fontFamily:"serif", cursor:"pointer", marginBottom:12,
              letterSpacing:"0.05em"}}>
            ✦ Unlock the Full Scripture
          </button>

          <p style={{fontSize:10, color:"rgba(255,255,255,0.2)", lineHeight:1.6, maxWidth:280}}>
            Available with Prana Flow (€19/mo), Siddha Quantum (€45/mo),
            or Akasha Infinity (€2997 lifetime)
          </p>

          <div style={{marginTop:32, width:"100%", maxWidth:340}}>
            <div style={{fontSize:8, letterSpacing:"0.4em", textTransform:"uppercase",
              color:"rgba(212,175,55,0.3)", marginBottom:16}}>Contents</div>
            {VOLUMES.map((v, i) => (
              <div key={i} style={{...S.bookRow, opacity:0.4}}>
                <span style={S.bookIcon}>🔒</span>
                <div style={{flex:1}}>
                  <div style={S.bookName}>{v.title}</div>
                  <div style={S.bookSub}>{v.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── UNLOCKED — has access ──────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.back} onClick={() => navigate(-1)}>←</button>
        <span style={S.h1}>Holy Books</span>
      </div>

      <div style={S.body}>

        <button style={S.bigBtn(true)} onClick={() => window.location.href = '/scriptures/toc.html'}>
          <span style={S.icon}>📋</span>
          <div>
            <div style={S.btnTitle(true)}>Table of Contents</div>
            <div style={S.btnSub}>Every book · chapter counts · tap any book to jump straight to it</div>
          </div>
        </button>

        <button style={S.bigBtn()} onClick={() => window.location.href = '/scriptures/index.html'}>
          <span style={S.icon}>📖</span>
          <div>
            <div style={S.btnTitle()}>Open the Full Scripture</div>
            <div style={S.btnSub}>88 books · Full screen · Parchment format · Print to PDF</div>
          </div>
        </button>

        <div style={S.divider}/>

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
            Physical edition in preparation. Open & print from the scripture reader.
          </p>
          <button onClick={() => window.location.href = '/scriptures/index.html'}
            style={{width:"100%", padding:"12px", borderRadius:20, background:"rgba(212,175,55,0.08)",
              border:"1px solid rgba(212,175,55,0.3)", color:"rgba(212,175,55,0.8)",
              fontSize:9, letterSpacing:"0.3em", textTransform:"uppercase", cursor:"pointer"}}>
            ⬇ Open & Print as PDF
          </button>
        </div>

      </div>
    </div>
  );
}
