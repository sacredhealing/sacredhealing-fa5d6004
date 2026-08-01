import React from "react";
import { useNavigate } from "react-router-dom";

export default function HolyBooks() {
  const navigate = useNavigate();

  const S = {
    page: { minHeight:"100vh", background:"#050505", paddingBottom:80 } as React.CSSProperties,
    topbar: { background:"rgba(0,0,0,0.95)", borderBottom:"1px solid rgba(212,175,55,0.15)",
      padding:"13px 18px", display:"flex", alignItems:"center", gap:14 } as React.CSSProperties,
    back: { background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20 } as React.CSSProperties,
    h1: { fontFamily:"serif", fontSize:15, color:"rgba(212,175,55,0.9)", flex:1 } as React.CSSProperties,
  };

  const VOLUMES = [
    { icon:"📜", title:"The Torah", sub:"Genesis · Exodus · Leviticus · Numbers · Deuteronomy · 5 Books" },
    { icon:"⚔️",  title:"Historical Books", sub:"Joshua · Judges · Ruth · Samuel · Kings · Chronicles · 15 Books" },
    { icon:"📖", title:"Wisdom & Poetry", sub:"Job · Psalms · Proverbs · Ecclesiastes · Song of Solomon · 5 Books" },
    { icon:"🔥", title:"Major Prophets", sub:"Isaiah · Jeremiah · Lamentations · Ezekiel · Daniel · 5 Books" },
    { icon:"🕊️", title:"Minor Prophets", sub:"Hosea · Joel · Amos · Obadiah · Jonah · Micah · Malachi · 12 Books" },
    { icon:"☥",  title:"Ethiopian Deuterocanon", sub:"Tobit · Judith · Wisdom · Sirach · Baruch · Maccabees · 14 Books" },
    { icon:"✝️",  title:"New Testament", sub:"Matthew through Revelation · All 27 Books" },
    { icon:"👁️", title:"1 Enoch — Complete", sub:"108 Chapters · 1,048 Verses · The Watchers · The Son of Man" },
    { icon:"✨",  title:"2 Enoch — Complete", sub:"68 Chapters · The Slavonic Book · Seven Heavens · Throne of Jah" },
    { icon:"⚡",  title:"3 Enoch — Sacred Addition", sub:"Sepher Hekhalot · Metatron · The Hebrew Book of Enoch" },
    { icon:"📅", title:"Book of Jubilees — Complete", sub:"50 Chapters · The Little Genesis · Ethiopian Sacred Time" },
    { icon:"🌿", title:"Book of Jasher — Complete", sub:"91 Chapters · 3,910 Verses · Referenced in Joshua & Samuel" },
    { icon:"♛",  title:"Kebra Nagast — Complete", sub:"117 Chapters · Queen of Sheba · Menelik · The Ark of the Covenant" },
    { icon:"⚔️", title:"1 · 2 · 3 Meqabyan", sub:"The Ethiopian Maccabees · Never Before in Any English Bible" },
    { icon:"🌍", title:"Nile Valley Wisdom", sub:"Hymn to Aten · 42 Laws of Maat · Poimandres · Ancient Egypt" },
    { icon:"📜", title:"Lost Gospels", sub:"Gospel of Thomas · Gospel of the Holy Twelve · Shepherd of Hermas" },
    { icon:"🔮", title:"Nag Hammadi Texts", sub:"Gospel of Truth · Thunder Perfect Mind · Apocryphon of John" },
    { icon:"🦁", title:"Rastafari Sacred Writings", sub:"Holy Piby · Ital Law · Marcus Garvey · Leonard Howell · Prophets of Sound" },
    { icon:"♚",  title:"Haile Selassie I", sub:"Coronation 1930 · League of Nations 1936 · UN Address 1963 · Biography" },
    { icon:"🌟", title:"Yeshua in the East", sub:"Issa Nath Trilogy · Babaji & Christ · The Lost Years" },
    { icon:"🌹", title:"The Sacred Feminine", sub:"Mary Magdalene · Pistis Sophia · Therapeutae · Aquarian Gospel" },
    { icon:"🌱", title:"The Ital Living Food Transmission", sub:"The Science of Prana · Fear-Code · Solar Data Blueprint · DNA Symphony" },
    { icon:"✦",  title:"The Akashic Transmission", sub:"Abraham · Moses · David · Yeshua · The Saints · Original Writing" },
    { icon:"📿", title:"Sacred Prayers", sub:"Ethiopian Orthodox · Nyahbinghi · Selassie I · Rastafari Invocations" },
    { icon:"📖", title:"Sacred Lexicon", sub:"Vedic · Rastafari · Ethiopian · Gnostic · Christ Consciousness Terms" },
  ];

  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <button style={S.back} onClick={() => navigate(-1)}>←</button>
        <span style={S.h1}>Holy Books</span>
      </div>

      <div style={{padding:"32px 20px 20px", textAlign:"center"}}>

        {/* Book cover feel */}
        <div style={{fontSize:52, marginBottom:12}}>📖</div>
        <div style={{fontSize:8, letterSpacing:"0.6em", textTransform:"uppercase",
          color:"rgba(212,175,55,0.4)", marginBottom:16, fontFamily:"serif"}}>
          The Complete Restored Covenant Scriptures
        </div>
        <h1 style={{fontFamily:"serif", fontSize:24, color:"#D4AF37", lineHeight:1.3,
          marginBottom:6, fontWeight:400}}>
          The Complete Ethiopian Bible
        </h1>
        <p style={{fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:4}}>
          In English · All 88 Books · Every Verse
        </p>
        <p style={{fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:4}}>
          Including the Books the West Removed
        </p>
        <p style={{fontSize:10, color:"rgba(212,175,55,0.35)", marginBottom:24, letterSpacing:"0.15em"}}>
          Compiled & Restored by Kritagya Das
        </p>

        {/* Gold rule */}
        <div style={{width:100, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)",
          margin:"0 auto 28px"}} />

        {/* Buy buttons */}
        <button
          onClick={() => window.open("https://www.amazon.com/dp/", "_blank")}
          style={{width:"100%", maxWidth:340, padding:"16px 20px", borderRadius:16, marginBottom:10,
            background:"linear-gradient(135deg,rgba(139,105,20,0.4),rgba(212,175,55,0.2))",
            border:"2px solid rgba(212,175,55,0.6)", color:"#D4AF37",
            fontSize:13, fontFamily:"serif", cursor:"pointer", display:"block", margin:"0 auto 10px"}}>
          📦 Buy Physical Book on Amazon
        </button>

        <button
          onClick={() => window.open("https://www.amazon.com/dp/", "_blank")}
          style={{width:"100%", maxWidth:340, padding:"14px 20px", borderRadius:16, marginBottom:24,
            background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,175,55,0.25)",
            color:"rgba(212,175,55,0.7)", fontSize:12, fontFamily:"serif", cursor:"pointer",
            display:"block", margin:"0 auto 24px"}}>
          📱 Buy Kindle / Digital Edition
        </button>

        {/* Coming soon in app */}
        <div style={{maxWidth:340, margin:"0 auto 32px", padding:"14px 16px",
          background:"rgba(212,175,55,0.04)", border:"1px solid rgba(212,175,55,0.12)",
          borderRadius:14}}>
          <p style={{fontSize:8, letterSpacing:"0.4em", textTransform:"uppercase",
            color:"rgba(212,175,55,0.35)", marginBottom:6}}>Coming Soon in the App</p>
          <p style={{fontSize:11, color:"rgba(255,255,255,0.25)", lineHeight:1.6}}>
            Interactive scripture reader with search, bookmarks, and daily verse — available soon inside Siddha Quantum Intelligence.
          </p>
        </div>

        <div style={{width:100, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.2),transparent)",
          margin:"0 auto 28px"}} />

        {/* Contents list */}
        <div style={{fontSize:8, letterSpacing:"0.5em", textTransform:"uppercase",
          color:"rgba(212,175,55,0.3)", marginBottom:20}}>What Is Inside</div>

        <div style={{maxWidth:400, margin:"0 auto"}}>
          {VOLUMES.map((v, i) => (
            <div key={i} style={{display:"flex", alignItems:"flex-start", gap:12, padding:"10px 0",
              borderBottom:"1px solid rgba(255,255,255,0.04)", textAlign:"left"}}>
              <span style={{fontSize:16, width:24, flexShrink:0, textAlign:"center",
                color:"rgba(212,175,55,0.5)", marginTop:1}}>{v.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:12, color:"rgba(255,255,255,0.65)", marginBottom:2}}>{v.title}</div>
                <div style={{fontSize:10, color:"rgba(255,255,255,0.25)", lineHeight:1.5}}>{v.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop:32, padding:"20px 0", textAlign:"center"}}>
          <p style={{fontSize:9, color:"rgba(255,255,255,0.15)", lineHeight:1.8, maxWidth:320, margin:"0 auto"}}>
            The Bible in which Haile Selassie I actually read. 22 more books than the Protestant Bible.
            15 more than the Roman Catholic Bible. The hidden covenant of the ancient world — in English, for the first time complete.
          </p>
        </div>

      </div>
    </div>
  );
}
