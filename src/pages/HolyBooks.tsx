import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const GITHUB_RAW = "https://raw.githubusercontent.com/sacredhealing/sacredhealing-fa5d6004/main/public/scriptures/";

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminRole();
  const [mode, setMode] = useState<"menu"|"reader"|"toc">("menu");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(false);

  const openReader = async () => {
    setMode("reader");
    setLoading(true);
    try {
      const res = await fetch(GITHUB_RAW + "index.html");
      let html = await res.text();
      // Fix all internal resource paths to use GitHub raw
      html = html.replace(/\/scriptures\//g, GITHUB_RAW);
      html = html.replace(/src=\"(?!http)/g, `src="${GITHUB_RAW}`);
      html = html.replace(
        /fetch\('\.\/|fetch\('(?!http)/g,
        `fetch('${GITHUB_RAW}`
      );
      const blob = new Blob([html], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      if (iframeRef.current) {
        iframeRef.current.src = blobUrl;
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const openToc = async () => {
    setMode("toc");
    setLoading(true);
    try {
      const res = await fetch(GITHUB_RAW + "toc.html");
      let html = await res.text();
      html = html.replace(/\/scriptures\//g, GITHUB_RAW);
      const blob = new Blob([html], { type: "text/html" });
      if (iframeRef.current) {
        iframeRef.current.src = URL.createObjectURL(blob);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const S = {
    page: { minHeight:"100vh", background:"#050505", paddingBottom:80 } as React.CSSProperties,
    topbar: { background:"rgba(0,0,0,0.95)", borderBottom:"1px solid rgba(212,175,55,0.15)",
      padding:"13px 18px", display:"flex", alignItems:"center", gap:14, position:"sticky" as const, top:0, zIndex:100 } as React.CSSProperties,
    back: { background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20 } as React.CSSProperties,
    h1: { fontFamily:"serif", fontSize:15, color:"rgba(212,175,55,0.9)", flex:1 } as React.CSSProperties,
  };

  const VOLUMES = [
    { icon:"📜", title:"The Torah", sub:"Genesis · Exodus · Leviticus · Numbers · Deuteronomy" },
    { icon:"⚔️", title:"Historical Books", sub:"Joshua · Judges · Ruth · Samuel · Kings · Chronicles" },
    { icon:"📖", title:"Wisdom & Poetry", sub:"Job · Psalms · Proverbs · Ecclesiastes · Song of Solomon" },
    { icon:"🔥", title:"Major Prophets", sub:"Isaiah · Jeremiah · Lamentations · Ezekiel · Daniel" },
    { icon:"🕊️", title:"Minor Prophets", sub:"Hosea · Joel · Amos · Obadiah · Jonah · Micah · Malachi" },
    { icon:"☥",  title:"Ethiopian Deuterocanon", sub:"Tobit · Judith · Wisdom · Sirach · Baruch · Maccabees" },
    { icon:"✝️", title:"New Testament", sub:"Matthew through Revelation · All 27 Books" },
    { icon:"👁️", title:"1 Enoch — Complete", sub:"108 Chapters · The Watchers · The Son of Man" },
    { icon:"✨", title:"2 Enoch — Complete", sub:"68 Chapters · Seven Heavens · Throne of Jah" },
    { icon:"⚡", title:"3 Enoch — Sacred Addition", sub:"Sepher Hekhalot · Metatron" },
    { icon:"📅", title:"Book of Jubilees", sub:"50 Chapters · The Little Genesis" },
    { icon:"🌿", title:"Book of Jasher", sub:"91 Chapters · 3,910 Verses" },
    { icon:"♛",  title:"Kebra Nagast", sub:"117 Chapters · Queen of Sheba · Menelik · The Ark" },
    { icon:"⚔️", title:"1 · 2 · 3 Meqabyan", sub:"The Ethiopian Maccabees" },
    { icon:"🌍", title:"Nile Valley Wisdom", sub:"Hymn to Aten · 42 Laws of Maat · Poimandres" },
    { icon:"📜", title:"Lost Gospels", sub:"Gospel of Thomas · Gospel of the Holy Twelve" },
    { icon:"🔮", title:"Nag Hammadi Texts", sub:"Gospel of Truth · Thunder Perfect Mind" },
    { icon:"🦁", title:"Rastafari Sacred Writings", sub:"Holy Piby · Ital Law · Garvey · Howell" },
    { icon:"♚",  title:"Haile Selassie I", sub:"Biography · Coronation · League of Nations · UN 1963" },
    { icon:"🌟", title:"Yeshua in the East", sub:"Issa Nath Trilogy · Babaji · The Lost Years" },
    { icon:"🌹", title:"The Sacred Feminine", sub:"Mary Magdalene · Pistis Sophia · Aquarian Gospel" },
    { icon:"🌱", title:"The Ital Living Food Transmission", sub:"Parts I–XII · Prana · Fear-Code · DNA Symphony" },
    { icon:"✦",  title:"The Akashic Transmission", sub:"Abraham · Moses · David · Yeshua · The Saints" },
    { icon:"📿", title:"Sacred Prayers", sub:"Ethiopian Orthodox · Nyahbinghi · Selassie I" },
    { icon:"📖", title:"Sacred Lexicon", sub:"Vedic · Rastafari · Ethiopian · Gnostic Terms" },
  ];

  if (isLoading) return (
    <div style={{...S.page, display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{color:"rgba(212,175,55,0.5)", fontFamily:"serif"}}>Opening...</div>
    </div>
  );

  // ── IFRAME READER MODE ─────────────────────────────────────
  if (mode === "reader" || mode === "toc") {
    return (
      <div style={{position:"fixed", inset:0, background:"#050505", zIndex:999, display:"flex", flexDirection:"column"}}>
        <div style={{...S.topbar, flexShrink:0}}>
          <button style={S.back} onClick={() => setMode("menu")}>← Back</button>
          <span style={S.h1}>{mode === "toc" ? "Contents" : "The Complete Scripture"}</span>
          {mode === "menu" ? null : (
            <button onClick={() => mode === "reader" ? openToc() : openReader()}
              style={{fontSize:11, padding:"6px 12px", borderRadius:20, background:"rgba(212,175,55,0.1)",
                border:"1px solid rgba(212,175,55,0.3)", color:"rgba(212,175,55,0.8)", cursor:"pointer"}}>
              {mode === "reader" ? "Contents" : "Reader"}
            </button>
          )}
        </div>
        {loading && (
          <div style={{flex:1, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16}}>
            <div style={{fontFamily:"serif", fontSize:11, letterSpacing:"0.3em", color:"rgba(212,175,55,0.5)"}}>
              OPENING THE SACRED CODEX
            </div>
            <div style={{width:200, height:2, background:"rgba(212,175,55,0.1)", borderRadius:2}}>
              <div style={{height:"100%", width:"60%", background:"rgba(212,175,55,0.5)", borderRadius:2, animation:"pulse 1.5s ease infinite"}}/>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          style={{flex:1, border:"none", display: loading ? "none" : "block"}}
          onLoad={() => setLoading(false)}
          title="Scripture Reader"
        />
      </div>
    );
  }

  // ── SHOWCASE / MENU ────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div style={S.page}>
        <div style={S.topbar}>
          <button style={S.back} onClick={() => navigate(-1)}>←</button>
          <span style={S.h1}>Holy Books</span>
        </div>
        <div style={{padding:"32px 20px", textAlign:"center"}}>
          <div style={{fontSize:52, marginBottom:12}}>📖</div>
          <div style={{fontSize:8, letterSpacing:"0.6em", textTransform:"uppercase", color:"rgba(212,175,55,0.4)", marginBottom:16}}>
            The Complete Restored Covenant Scriptures
          </div>
          <h1 style={{fontFamily:"serif", fontSize:24, color:"#D4AF37", lineHeight:1.3, marginBottom:6, fontWeight:400}}>
            The Complete Ethiopian Bible
          </h1>
          <p style={{fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4}}>In English · All 88 Books · Every Verse</p>
          <p style={{fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:24}}>Including the Books the West Removed</p>
          <div style={{width:100, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)", margin:"0 auto 28px"}}/>
          <button onClick={() => window.open("https://www.amazon.com","_blank")}
            style={{width:"100%", maxWidth:340, padding:"16px 20px", borderRadius:16, marginBottom:10,
              background:"linear-gradient(135deg,rgba(139,105,20,0.4),rgba(212,175,55,0.2))",
              border:"2px solid rgba(212,175,55,0.6)", color:"#D4AF37", fontSize:13, fontFamily:"serif",
              cursor:"pointer", display:"block", margin:"0 auto 10px"}}>
            📦 Buy Physical Book on Amazon
          </button>
          <button onClick={() => window.open("https://www.amazon.com","_blank")}
            style={{width:"100%", maxWidth:340, padding:"14px 20px", borderRadius:16,
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,175,55,0.25)",
              color:"rgba(212,175,55,0.7)", fontSize:12, fontFamily:"serif", cursor:"pointer",
              display:"block", margin:"0 auto 24px"}}>
            📱 Buy Kindle / Digital Edition
          </button>
          <div style={{maxWidth:340, margin:"0 auto 32px", padding:"14px 16px",
            background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.12)", borderRadius:14}}>
            <p style={{fontSize:8, letterSpacing:"0.4em", textTransform:"uppercase", color:"rgba(212,175,55,0.35)", marginBottom:6}}>Coming Soon in the App</p>
            <p style={{fontSize:11, color:"rgba(255,255,255,0.25)", lineHeight:1.6}}>
              Interactive scripture reader available soon inside Siddha Quantum Intelligence.
            </p>
          </div>
          <div style={{maxWidth:400, margin:"0 auto"}}>
            {VOLUMES.map((v,i) => (
              <div key={i} style={{display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0",
                borderBottom:"1px solid rgba(255,255,255,0.04)", textAlign:"left"}}>
                <span style={{fontSize:16, width:24, flexShrink:0, textAlign:"center", color:"rgba(212,175,55,0.5)"}}>{v.icon}</span>
                <div>
                  <div style={{fontSize:12, color:"rgba(255,255,255,0.65)", marginBottom:2}}>{v.title}</div>
                  <div style={{fontSize:10, color:"rgba(255,255,255,0.25)"}}>{v.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ADMIN MENU ─────────────────────────────────────────────
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
        <button style={{width:"100%", padding:"20px 18px", borderRadius:16, marginBottom:12,
          background:"linear-gradient(135deg,rgba(139,105,20,0.35),rgba(212,175,55,0.15))",
          border:"2px solid rgba(212,175,55,0.6)", cursor:"pointer", display:"flex", alignItems:"center", gap:16, textAlign:"left" as const}}
          onClick={openReader}>
          <span style={{fontSize:28}}>📖</span>
          <div>
            <div style={{fontFamily:"serif", fontSize:16, color:"#D4AF37", marginBottom:4}}>Open the Full Scripture</div>
            <div style={{fontSize:11, color:"rgba(255,255,255,0.35)"}}>88 books · All verses · Parchment reader</div>
          </div>
        </button>
        <button style={{width:"100%", padding:"18px", borderRadius:16, marginBottom:20,
          background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,175,55,0.2)",
          cursor:"pointer", display:"flex", alignItems:"center", gap:16, textAlign:"left" as const}}
          onClick={openToc}>
          <span style={{fontSize:24}}>📋</span>
          <div>
            <div style={{fontFamily:"serif", fontSize:14, color:"rgba(212,175,55,0.75)", marginBottom:4}}>Table of Contents</div>
            <div style={{fontSize:11, color:"rgba(255,255,255,0.3)"}}>Jump to any book</div>
          </div>
        </button>
        <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)", margin:"0 0 16px"}}/>
        {VOLUMES.map((v,i) => (
          <div key={i} style={{display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0",
            borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <span style={{fontSize:16, width:24, flexShrink:0, textAlign:"center" as const, color:"rgba(212,175,55,0.5)"}}>{v.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:2}}>{v.title}</div>
              <div style={{fontSize:10, color:"rgba(255,255,255,0.25)"}}>{v.sub}</div>
            </div>
            <span style={{fontSize:9, color:"rgba(212,175,55,0.5)"}}>✦</span>
          </div>
        ))}
      </div>
    </div>
  );
}
