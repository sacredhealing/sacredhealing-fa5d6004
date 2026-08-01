import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";

const GITHUB_RAW = "https://raw.githubusercontent.com/sacredhealing/sacredhealing-fa5d6004/main/public/scriptures/";

const PARTS = [
  {file:'part2_cover_nav.html',label:'Opening the Sacred Codex...'},
  {file:'part2b_frontmatter.html',label:'Invocation and Foreword...'},
  {file:'part_authors_note.html',label:'A Note from the Heart...'},
  {file:'part2b_toc.html',label:'Table of Contents — All 88 Books...'},
  {file:'full_genesis.html',label:'Genesis — Bereshit · 50 Chapters...'},
  {file:'full_exodus.html',label:'Exodus — The Liberation · 40 Chapters...'},
  {file:'full_leviticus.html',label:'Leviticus · 27 Chapters...'},
  {file:'full_numbers.html',label:'Numbers · 36 Chapters...'},
  {file:'full_deuteronomy.html',label:'Deuteronomy · 34 Chapters...'},
  {file:'full_joshua.html',label:'Joshua · 24 Chapters...'},
  {file:'full_judges.html',label:'Judges · 21 Chapters...'},
  {file:'full_ruth.html',label:'Ruth · 4 Chapters...'},
  {file:'full_1samuel.html',label:'1 Samuel · 31 Chapters...'},
  {file:'full_2samuel.html',label:'2 Samuel · 24 Chapters...'},
  {file:'full_1kings.html',label:'1 Kings · 22 Chapters...'},
  {file:'full_2kings.html',label:'2 Kings · 25 Chapters...'},
  {file:'full_1chronicles.html',label:'1 Chronicles · 29 Chapters...'},
  {file:'full_2chronicles.html',label:'2 Chronicles · 36 Chapters...'},
  {file:'full_ezra.html',label:'Ezra · 10 Chapters...'},
  {file:'full_nehemiah.html',label:'Nehemiah · 13 Chapters...'},
  {file:'full_esther.html',label:'Esther · 10 Chapters...'},
  {file:'full_job.html',label:'Job · 42 Chapters...'},
  {file:'full_psalms.html',label:'Psalms — Tehillim · 150 Chapters...'},
  {file:'full_proverbs.html',label:'Proverbs · 31 Chapters...'},
  {file:'full_ecclesiastes.html',label:'Ecclesiastes · 12 Chapters...'},
  {file:'full_songofsolomon.html',label:'Song of Solomon · 8 Chapters...'},
  {file:'full_isaiah.html',label:'Isaiah · 66 Chapters...'},
  {file:'full_jeremiah.html',label:'Jeremiah · 52 Chapters...'},
  {file:'full_lamentations.html',label:'Lamentations · 5 Chapters...'},
  {file:'full_ezekiel.html',label:'Ezekiel · 48 Chapters...'},
  {file:'full_daniel.html',label:'Daniel · 12 Chapters...'},
  {file:'full_hosea.html',label:'Hosea · 14 Chapters...'},
  {file:'full_joel.html',label:'Joel · 3 Chapters...'},
  {file:'full_amos.html',label:'Amos · 9 Chapters...'},
  {file:'full_obadiah.html',label:'Obadiah · 1 Chapter...'},
  {file:'full_jonah.html',label:'Jonah · 4 Chapters...'},
  {file:'full_micah.html',label:'Micah · 7 Chapters...'},
  {file:'full_nahum.html',label:'Nahum · 3 Chapters...'},
  {file:'full_habakkuk.html',label:'Habakkuk · 3 Chapters...'},
  {file:'full_zephaniah.html',label:'Zephaniah · 3 Chapters...'},
  {file:'full_haggai.html',label:'Haggai · 2 Chapters...'},
  {file:'full_zechariah.html',label:'Zechariah · 14 Chapters...'},
  {file:'full_malachi.html',label:'Malachi · 4 Chapters...'},
  {file:'full_matthew.html',label:'Matthew · 28 Chapters...'},
  {file:'full_mark.html',label:'Mark · 16 Chapters...'},
  {file:'full_luke.html',label:'Luke · 24 Chapters...'},
  {file:'full_john.html',label:'John · 21 Chapters...'},
  {file:'full_acts.html',label:'Acts of the Apostles · 28 Chapters...'},
  {file:'full_romans.html',label:'Romans · 16 Chapters...'},
  {file:'full_1enoch_complete.html',label:'1 Enoch — Complete · 108 Chapters...'},
  {file:'full_2enoch_complete.html',label:'2 Enoch — Complete · 68 Chapters...'},
  {file:'full_3enoch_complete.html',label:'3 Enoch — Sacred Addition...'},
  {file:'full_jubilees_complete.html',label:'Book of Jubilees · 50 Chapters...'},
  {file:'full_kebra_nagast_complete.html',label:'Kebra Nagast · 117 Chapters...'},
  {file:'full_1meqabyan.html',label:'1 Meqabyan · 36 Chapters...'},
  {file:'full_2meqabyan.html',label:'2 Meqabyan · 21 Chapters...'},
  {file:'full_3meqabyan.html',label:'3 Meqabyan · 10 Chapters...'},
  {file:'full_jasher.html',label:'Book of Jasher · 91 Chapters...'},
  {file:'part31_rasta_additions.html',label:'Rastafari Sacred Writings...'},
  {file:'part32_selassie_a.html',label:'Haile Selassie I — Part I...'},
  {file:'part32_selassie_b.html',label:'Haile Selassie I — Part II...'},
  {file:'part32_selassie_c.html',label:'Haile Selassie I — Part III...'},
  {file:'part33_issa_a.html',label:'Yeshua in the East — Part I...'},
  {file:'part34_babaji_christ.html',label:'The Babaji-Christ Transmission...'},
  {file:'part35_mary_magdalene.html',label:'Mary Magdalene · The Sacred Feminine...'},
  {file:'part36b_ital_transmission.html',label:'The Ital Living Food Transmission...'},
  {file:'part36_akashic_transmission.html',label:'The Akashic Transmission...'},
  {file:'part42_revelation_of_christ.html',label:'The Revelation of Christ...'},
  {file:'part37b_prayers.html',label:'Sacred Prayers...'},
  {file:'part99_lexicon.html',label:'The Sacred Lexicon...'},
];

export default function HolyBooks() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminRole();
  const [mode, setMode] = useState<"menu"|"reader">("menu");

  // The scripture reader is a self-contained parchment codex with its own
  // fonts, CSS and loading screen. It must render inside an iframe so the
  // app's dark theme never leaks into the book design.
  const openReader = () => setMode("reader");

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

  // ── READER MODE ────────────────────────────────────────────
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
          <button style={{width:"100%", padding:"20px 18px", borderRadius:16, marginBottom:12,
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
          <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)", margin:"12px 0 16px"}}/>
          {[
            {icon:"📜", t:"Torah", s:"Genesis · Exodus · Leviticus · Numbers · Deuteronomy"},
            {icon:"⚔️", t:"Historical Books", s:"Joshua through Chronicles · 15 Books"},
            {icon:"📖", t:"Wisdom & Poetry", s:"Job · Psalms · Proverbs · Ecclesiastes · Solomon"},
            {icon:"🔥", t:"Major Prophets", s:"Isaiah · Jeremiah · Ezekiel · Daniel"},
            {icon:"🕊️", t:"Minor Prophets", s:"Hosea through Malachi · 12 Books"},
            {icon:"✝️", t:"New Testament", s:"Matthew through Revelation · All 27 Books"},
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
