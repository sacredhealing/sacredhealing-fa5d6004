import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Sacred Codex Styles ─────────────────────────────────────
const S = {
  bg: "#050505",
  gold: "#D4AF37",
  goldFaint: "rgba(212,175,55,0.12)",
  goldBorder: "rgba(212,175,55,0.28)",
  parchment: "#FAF6EC",
  darkBrown: "#1C1208",
  text: "rgba(255,255,255,0.85)",
  textDim: "rgba(255,255,255,0.4)",
};

// ── Volume Data ─────────────────────────────────────────────
const VOLUMES = [
  {
    id: "prologue",
    num: "PROLOGUE",
    icon: "☥",
    title: "The Nile Valley Covenant",
    subtitle: "Kemet & Cush · The Ancient Root",
    desc: "Hymn to the Aten · 42 Declarations of Ma'at · Poimandres — the oldest monotheistic wisdom on earth, the direct foundation of the biblical covenant.",
    status: "complete",
    color: "#D4AF37",
  },
  {
    id: "vol1",
    num: "VOLUME I",
    icon: "✦",
    title: "The First Book of Enoch",
    subtitle: "The Antediluvian Visions · Ethiopian Canon",
    desc: "The Watchers · The Son of Man · The Heavenly Throne · 108 chapters of prophecy kept in Ethiopia for 1600 years while Rome suppressed it.",
    status: "complete",
    color: "#D4AF37",
  },
  {
    id: "vol2",
    num: "VOLUME II",
    icon: "◈",
    title: "The Hebrew & Ethiopian Canon",
    subtitle: "Sealed until the appointed time",
    desc: "Genesis through Malachi · Meqabyan · 4 Ezra · The full Old Testament with divine names restored — being prepared.",
    status: "coming",
    color: "#D4AF37",
  },
  {
    id: "vol3",
    num: "VOLUME III",
    icon: "♛",
    title: "The Kebra Nagast",
    subtitle: "The Glory of Kings · 30 Core Chapters",
    desc: "Queen Makeda · King Shlomo · Menelik I · The Transfer of Zion to Axum · The unbroken Solomonic covenant from Abraham to Haile Selassie I.",
    status: "complete",
    color: "#D4AF37",
  },
  {
    id: "vol4",
    num: "VOLUME IV",
    icon: "✝",
    title: "The Restored Gospels & Hidden Scriptures",
    subtitle: "Yeshua the Messiah · The Inner Kingdom",
    desc: "Gospel of John · All 114 Sayings of Thomas · The Missing Years of Issa · The Gospel of the Holy Twelve — the Ital covenant.",
    status: "complete",
    color: "#D4AF37",
  },
  {
    id: "vol5",
    num: "VOLUME V",
    icon: "♚",
    title: "The Imperial Covenant",
    subtitle: "Haile Selassie I · King of Kings · Lord of Lords",
    desc: "The four great addresses to the nations of the world — 1936 League of Nations · 1963 United Nations · The Bible Society · Jamaica 1966.",
    status: "progress",
    color: "#FFD700",
  },
];

// ── Inline Reader Component ─────────────────────────────────
function CodexReader({ vol, onClose }: { vol: typeof VOLUMES[0]; onClose: () => void }) {
  const getContent = () => {
    switch (vol.id) {
      case "prologue":
        return <PrologueContent />;
      case "vol1":
        return <EnochContent />;
      case "vol3":
        return <KebraContent />;
      case "vol4":
        return <GospelsContent />;
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "#1C1208",
      overflowY: "auto",
      fontFamily: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
    }}>
      {/* Sticky nav */}
      <div style={{
        position: "sticky", top: 0,
        background: "#1C1208",
        borderBottom: "1px solid rgba(212,175,55,0.35)",
        padding: "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: S.gold,
            fontSize: 20, cursor: "pointer", lineHeight: 1,
          }}>←</button>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9, fontWeight: 800, letterSpacing: "0.3em",
            textTransform: "uppercase", color: "rgba(212,175,55,0.7)",
          }}>{vol.num} · {vol.title}</span>
        </div>
        <button onClick={() => window.print()} style={{
          background: S.gold, color: "#1C1208", border: "none",
          padding: "6px 14px", fontWeight: 800, fontSize: 10,
          letterSpacing: "0.08em", textTransform: "uppercase",
          cursor: "pointer", borderRadius: 3,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>Save PDF</button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 12px 80px" }}>
        {getContent()}
      </div>

      <style>{`
        @media print {
          body > *:not(.codex-print) { display: none !important; }
        }
        .codex-page {
          background: #FDFAF3;
          border-radius: 4px;
          margin-bottom: 14px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5);
          overflow: hidden;
          color: #1A1208;
          padding: 28px 20px 36px;
        }
        .codex-title {
          font-size: clamp(20pt, 6vw, 28pt);
          font-weight: 700;
          color: #8C6D1F;
          text-align: center;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .codex-sub {
          font-size: 10pt;
          font-style: italic;
          color: #7A6035;
          text-align: center;
          line-height: 1.6;
          margin-bottom: 8px;
        }
        .codex-rule {
          height: 1px;
          background: linear-gradient(90deg, transparent, #B8922A, transparent);
          margin: 14px 0;
          border: none;
        }
        .codex-ch {
          text-align: center;
          margin: 20px 0 10px;
        }
        .codex-ch-orn { color: #B8922A; font-size: 11pt; letter-spacing: 0.2em; margin-bottom: 4px; }
        .codex-ch-num { font-size: 8px; font-weight: 800; letter-spacing: 0.45em; text-transform: uppercase; color: #8C6D1F; font-family: system-ui, sans-serif; margin-bottom: 4px; }
        .codex-ch-title { font-size: clamp(12pt, 3.5vw, 14pt); font-weight: 700; font-style: italic; color: #1A1208; }
        .codex-col { column-count: 2; column-gap: 18px; column-rule: 1px solid rgba(200,184,122,0.3); }
        @media(max-width: 520px) { .codex-col { column-count: 1; } }
        .verse-flow { font-size: 10.5pt; line-height: 1.95; color: #1A1208; text-align: justify; hyphens: auto; }
        .v { display: inline; }
        .v::after { content: " "; }
        .vn { font-size: 5.5pt; font-weight: 400; color: rgba(184,146,42,0.6); vertical-align: super; margin-right: 2px; font-family: system-ui; }
        .vdrop::first-letter { float: left; font-size: 44pt; font-weight: 700; line-height: 0.78; color: #8C6D1F; margin-right: 4pt; margin-top: 4pt; }
        .codex-sb { text-align: center; color: #B8922A; letter-spacing: 0.3em; margin: 12px 0; font-size: 11pt; }
        .codex-intro { font-size: 10.5pt; line-height: 1.9; color: #1A1208; text-align: justify; hyphens: auto; }
        .codex-intro p { margin-bottom: 12px; text-indent: 18px; }
        .codex-intro p:first-child { text-indent: 0; }
        .codex-drop::first-letter { float: left; font-size: 50pt; font-weight: 700; line-height: 0.72; color: #8C6D1F; margin-right: 5pt; margin-top: 4pt; }
        .codex-callout { background: #EDE4C8; border-left: 3px solid #B8922A; border-radius: 0 3px 3px 0; padding: 12px 14px; margin: 14px 0; font-size: 10pt; line-height: 1.8; color: #2A1A08; font-style: italic; }
        .codex-callout-label { font-style: normal; font-size: 7.5px; font-weight: 800; letter-spacing: 0.4em; text-transform: uppercase; color: #8C6D1F; margin-bottom: 6px; display: block; font-family: system-ui; }
        .pg { text-align: center; font-size: 8pt; color: #9A7D3A; letter-spacing: 0.1em; margin-top: 20px; font-family: system-ui; }
      `}</style>
    </div>
  );
}

// ── Volume Content Components ───────────────────────────────

function PrologueContent() {
  return (
    <>
      <div className="codex-page" style={{ textAlign: "center", minHeight: "40vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", marginBottom: 10 }}>The Complete Restored Covenant Scriptures</div>
        <div style={{ color: "#B8922A", fontSize: 13, letterSpacing: "0.2em", margin: "10px 0" }}>✦ &nbsp; ✦ &nbsp; ✦</div>
        <div className="codex-title">PROLOGUE</div>
        <div className="codex-title" style={{ color: "#1A1208", fontSize: "clamp(16pt,5vw,22pt)" }}>The Nile Valley Covenant</div>
        <hr className="codex-rule" style={{ width: "min(3in,80%)", margin: "14px auto" }} />
        <div className="codex-sub">Kemet · Cush · The Ancient Nile Wisdom</div>
        <div style={{ fontStyle: "italic", color: "#5C4A1E", fontSize: "10.5pt", lineHeight: 1.9, maxWidth: "90%", marginTop: 14 }}>
          Egypt (Mizraim) and Ethiopia (Cush) are not strangers to the covenant of Jah.<br />They are its oldest keepers.
        </div>
        <div style={{ color: "#B8922A", fontSize: 12, letterSpacing: "0.2em", margin: "16px 0" }}>✦ &nbsp; ✦ &nbsp; ✦</div>
        <div className="pg">P · I</div>
      </div>

      <div className="codex-page">
        <div className="codex-ch"><div className="codex-ch-orn">✦</div><div className="codex-ch-num">Nile Valley Text I · Kemet · c. 1350 BCE</div><div className="codex-ch-title">The Great Hymn to the Aten</div></div>
        <div className="codex-callout"><span className="codex-callout-label">The Root of Psalm 104</span>The oldest surviving monotheistic psalm in human history. The imagery matches Psalm 104 line-for-line — proof that the Nile Valley worshipped the One Creator millennia before Rome or Babylon.</div>
        <div className="codex-col"><div className="verse-flow">
          <p className="v vdrop">Thy rising is beautiful in the horizon of heaven, O Aten, ordainer of life. When thou dawnest in the east, thou fillest every land with thy beauty. Thou art beautiful and great, and thy gleaming is high above the earth.</p>
          <p className="v">When thou settest in the western horizon, the land is in darkness as if in death. People sleep with their heads covered, and one eye does not see another. Every lion comes forth from its den, and all the creeping things sting. Darkness hovers, and the earth is in silence — for their maker resteth in the horizon.</p>
          <p className="v">When thou risest in the horizon at dawn, thou shinest as the Aten in the day-time. Thou drivest away the darkness and givest thy beams of light. The Two Lands are in festival. People wake and stand upon their feet, for thou hast lifted them up. All the world does its work.</p>
          <p className="v">How manifold are thy works! They are hidden from the face of man. O thou sole One, whose powers no other possesseth, thou didst create the earth according to thy heart while thou wast alone — men, all cattle great and small, all that go upon the earth and that fly with wings.</p>
          <p className="v">Thou art in my heart. There is no other who knows thee — only thy son whom thou hast taught thy ways and thy might. The world came into being by thy hand. When thou hast risen they live. When thou settest they die. Thou art lifetime itself, and one lives by thee.</p>
          <p className="v"><strong>Thou art One.</strong></p>
        </div></div>
        <div className="codex-sb">— ✦ —</div>
        <div className="pg">P · II</div>
      </div>

      <div className="codex-page">
        <div className="codex-ch"><div className="codex-ch-orn">✦</div><div className="codex-ch-num">Nile Valley Text II · Kemet · c. 1250 BCE</div><div className="codex-ch-title">The 42 Declarations of Ma'at</div></div>
        <div className="codex-callout"><span className="codex-callout-label">The Moral Foundation of the Nile</span>Spoken before the scales of divine justice. The direct Nile Valley precursor to the Ten Commandments — the same covenant, an older tongue, an older land.</div>
        <div style={{ marginTop: 12 }}>
          {[
            ["1","I have not committed sin against Jah or against any person."],
            ["2","I have not robbed with violence."],
            ["3","I have done no violence to any living being."],
            ["4","I have not stolen."],
            ["5","I have not slain any man or woman without just cause."],
            ["8","I have not told lies."],
            ["10","I have not uttered words of wickedness or cursed with my mouth."],
            ["13","I have not committed adultery or fornication."],
            ["14","I have made no one weep without cause."],
            ["21","I have not polluted the sacred waters of Jah."],
            ["39","I have not been an oppressor of the weak or the poor."],
            ["40","I have done no harm to the animals and creatures of Jah's creation."],
            ["41","I have not turned my face from the suffering that I had power to relieve."],
            ["42","I have lived in truth. My heart is balanced upon the scales of Ma'at. Jah is my witness."],
          ].map(([num, text]) => (
            <div key={num} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(200,184,122,0.25)", fontSize: "10pt", lineHeight: 1.6, color: "#1A1208" }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: "#B8922A", minWidth: 22, textAlign: "right", flexShrink: 0, fontFamily: "system-ui" }}>{num}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="codex-sb">✦ &nbsp; ✦ &nbsp; ✦</div>
        <div className="pg">P · III</div>
      </div>
    </>
  );
}

function EnochContent() {
  return (
    <>
      <div className="codex-page" style={{ textAlign: "center", minHeight: "40vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", marginBottom: 10 }}>Volume I</div>
        <div style={{ color: "#B8922A", fontSize: 13, letterSpacing: "0.2em", margin: "10px 0" }}>✦ &nbsp; ✦ &nbsp; ✦</div>
        <div className="codex-title">The First Book<br />of Enoch</div>
        <div className="codex-sub">Ethiopic Enoch · The Antediluvian Visions</div>
        <hr className="codex-rule" style={{ width: "min(3in,80%)", margin: "14px auto" }} />
        <div style={{ fontStyle: "italic", color: "#5C4A1E", fontSize: "10.5pt", lineHeight: 1.9 }}>
          "The words of the blessing of Enoch,<br />wherewith he blessed the elect and righteous."
        </div>
        <div className="pg">I · 1</div>
      </div>

      <div className="codex-page">
        <div className="codex-callout"><span className="codex-callout-label">The Jude Confirmation</span>"And Enoch also, the seventh from Adam, prophesied of these, saying, Behold, Jah cometh with ten thousands of his saints, to execute judgment upon all..." — Jude 1:14. Direct quotation of 1 Enoch 1:9. The New Testament canon quotes this book by name. Rome removed it anyway.</div>
        <div className="codex-intro">
          <p className="codex-drop">Of all the scriptures lost to the Western world, none carries more prophetic weight than the First Book of Enoch. It was not lost by accident. It was removed. Councils voted. Men decided. And so for sixteen centuries, the peoples of Europe and the Americas inherited a Bible with a wound in it — a silence where the voice of Enoch should have been.</p>
          <p>The Ethiopian Orthodox Church never accepted that silence. For over 1,600 years, the Ge'ez canon has read 1 Enoch as Scripture equal in authority to Genesis or the Psalms. The divine Name has been restored throughout: where translators wrote LORD in capital letters — the Tetragrammaton — this text reads Jah.</p>
        </div>
        <div className="pg">I · 2</div>
      </div>

      <div className="codex-page">
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", textAlign: "center", marginBottom: 8 }}>Book of the Watchers · Chapters I–XXXVI</div>
        <hr className="codex-rule" />

        {[
          ["I","The Blessing of Enoch","1|The words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation, when all the wicked and godless are to be removed. 2|And he took up his parable and said — Enoch a righteous man, whose eyes were opened by Jah, saw the vision of the Holy One in the heavens, which the angels showed me, and from them I heard everything, and from them I understood as I saw, but not for this generation, but for a remote one which is for to come. 3|The Holy Great One will come forth from His dwelling, 4|And the eternal Jah will tread upon the earth, even on Mount Sinai, and appear in the strength of His might from the heaven of heavens. 5|And all shall be smitten with fear and the Watchers shall quake, and great fear and trembling shall seize them unto the ends of the earth. 8|But with the righteous He will make peace, and will protect the elect, and mercy shall be upon them. And they shall all belong to Jah, and they shall be prospered, and they shall all be blessed. And light shall appear unto them, and He will make peace with them. 9|And behold! He cometh with ten thousands of His holy ones to execute judgement upon all, and to destroy all the ungodly."],
          ["VI","The Descent of the Watchers","1|And it came to pass when the children of men had multiplied that in those days were born unto them beautiful and comely daughters. 2|And the angels, the children of the heaven, saw and lusted after them, and said to one another: Come, let us choose us wives from among the children of men. 3|And Semjaza, who was their leader, said: I fear ye will not indeed agree to do this deed, and I alone shall have to pay the penalty of a great sin. 4|And they all answered: Let us all swear an oath, and all bind ourselves by mutual imprecations not to abandon this plan. 5|Then sware they all together and bound themselves. 6|And they were in all two hundred; who descended in the days of Jared on the summit of Mount Hermon."],
          ["XII","Enoch Called by the Watchers","1|Before these things Enoch was hidden, and no one of the children of men knew where he was hidden, and where he abode, and what had become of him. 2|And his activities had to do with the Watchers, and his days were with the holy ones. 3|And I, Enoch, was blessing Jah of Majesty and the King of the Ages, and lo! the Watchers called me — Enoch the scribe — and said to me: 4|Enoch, thou scribe of righteousness, go, declare to the Watchers of the heaven who have left the high heaven, the holy eternal place, and have defiled themselves with women. Ye have wrought great destruction on the earth. 6|The murder of their beloved ones shall they see, and over the destruction of their children shall they lament, but mercy and peace shall ye not attain."],
          ["XIV","The Vision of the Throne of Jah","8|Behold, in the vision clouds invited me and a mist summoned me, and the course of the stars and the lightnings sped and hastened me, and the winds in the vision caused me to fly and lifted me upward, and bore me into heaven. 9|And I went in till I drew nigh to a wall which is built of crystals and surrounded by tongues of fire. 11|Its ceiling was like the path of the stars and the lightnings, and between them were fiery cherubim, and their heaven was clear as water. 12|A flaming fire surrounded the walls, and its portals blazed with fire. 20|And the Great Glory sat thereon, and His raiment shone more brightly than the sun and was whiter than any snow. 21|None of the angels could enter and could behold His face by reason of the magnificence and glory and no flesh could behold Him. 24|And the Lord called me with His own mouth, and said to me: Come hither, Enoch, and hear my word."],
          ["XLVI","The Son of Man Vision","1|And there I saw One who had a head of days, and His head was white like wool, and with Him was another being whose countenance had the appearance of a man, and his face was full of graciousness, like one of the holy angels. 2|And I asked the angel who went with me concerning that Son of Man, who He was, and why He went with the Ancient of Days? And he answered: This is the Son of Man who hath righteousness, with whom dwelleth righteousness, and who revealeth all the treasures of that which is hidden, because Jah of Spirits hath chosen Him."],
          ["XLVIII","He Was Named Before Creation","2|And at that hour that Son of Man was named in the presence of Jah of Spirits, and His name before the Ancient of Days. 3|Yea, before the sun and the signs were created, before the stars of the heaven were made, His name was named before Jah of Spirits. 4|He shall be a staff to the righteous whereon to stay themselves and not fall, and He shall be the light of the Gentiles, and the hope of those who are troubled of heart. 5|All who dwell on earth shall fall down and worship before Him, and will praise and bless and celebrate with song Jah of Spirits."],
          ["LXXI","Peace in the Name of Jah of Spirits","14|And he said unto me: This is the Son of Man who is born unto righteousness; and righteousness abides over Him, and the righteousness of the Ancient of Days forsakes Him not. 15|He proclaims unto thee peace in the name of the world to come. 17|And so there shall be length of days with that Son of Man, and the righteous shall have peace and an upright way in the Name of Jah of Spirits for ever and ever."],
        ].map(([num, title, verses]) => (
          <div key={num}>
            <div className="codex-ch">
              <div className="codex-ch-orn">✦</div>
              <div className="codex-ch-num">Chapter {num}</div>
              <div className="codex-ch-title">{title}</div>
            </div>
            <div className="codex-col"><div className="verse-flow">
              {(verses as string).split('|').reduce((acc: React.ReactNode[], part, i) => {
                if (i === 0) {
                  // first verse — check if number
                  const m = part.match(/^(\d+)(.+)/);
                  if (m) acc.push(<span key={i} className={`v ${i === 0 ? 'vdrop' : ''}`}><sup className="vn">{m[1]}</sup>{m[2]}</span>);
                  else acc.push(<span key={i} className="v vdrop">{part}</span>);
                } else {
                  const m = part.match(/^(\d+)(.+)/);
                  if (m) acc.push(<span key={i} className="v"><sup className="vn">{m[1]}</sup>{m[2]}</span>);
                  else acc.push(<span key={i} className="v">{part}</span>);
                }
                return acc;
              }, [])}
            </div></div>
            <div className="codex-sb">— ✦ —</div>
          </div>
        ))}
        <div className="pg">I · 3</div>
      </div>
    </>
  );
}

function KebraContent() {
  return (
    <>
      <div className="codex-page" style={{ textAlign: "center", minHeight: "40vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", marginBottom: 10 }}>Volume III</div>
        <div style={{ color: "#B8922A", fontSize: 13, letterSpacing: "0.2em", margin: "10px 0" }}>✦ &nbsp; ✦ &nbsp; ✦</div>
        <div className="codex-title">The Kebra Nagast</div>
        <div className="codex-sub">The Glory of Kings · The Solomonic Covenant</div>
        <hr className="codex-rule" style={{ width: "min(3in,80%)", margin: "14px auto" }} />
        <div style={{ fontStyle: "italic", color: "#5C4A1E", fontSize: "10.5pt", lineHeight: 1.9 }}>
          "Ethiopia hath stretched out her hands unto Jah."<br />
          <span style={{ fontSize: "9pt", color: "#7A6035" }}>Psalm 68:31</span>
        </div>
        <div className="pg">III · 1</div>
      </div>

      <div className="codex-page">
        <div className="codex-callout"><span className="codex-callout-label">The Unbroken Chain</span>Jah → Abraham → David → Shlomo → Queen Makeda → Menelik I → 225 generations → Haile Selassie I. One covenant. One bloodline. One Ark. One Jah.</div>
        <div className="codex-intro">
          <p className="codex-drop">The Kebra Nagast — The Glory of Kings — is the central theological pillar of Ethiopian Orthodox and Rastafari tradition. When King John IV of Ethiopia wrote to the British government demanding its return in 1872, he declared: "There is a book called Kivera Negust which contains the Law of the whole of Ethiopia. I pray you find out who has got this book, and send it to me, for in my country my people will not obey my orders without it."</p>
        </div>
        <div className="pg">III · 2</div>
      </div>

      <div className="codex-page">
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", textAlign: "center", marginBottom: 8 }}>The Glory of Kings · Core Chapters</div>
        <hr className="codex-rule" />

        {[
          ["XXI","Concerning the Queen of the South","And there was a Queen of the South who was exceedingly wise in mind, and beautiful in face, and she traded with all the kings of the world. Her riches were surpassing those of all the kings of the earth. And she heard concerning Shlomo the King the report of his wisdom and she marvelled and determined to go to him. For her heart moved her to go to Shlomo, and she was strengthened in her resolve by the words of Tamrin, the captain of her caravans, who said: I saw in Jerusalem a King who is full of wisdom, and his face shineth as the face of the angels. And Queen Makeda rose up and prepared to journey to Jerusalem."],
          ["XXV","How the Queen Came to Shlomo","And Shlomo rejoiced greatly and said unto her: Come in peace, O Queen. Thou hast come from the ends of the earth to hear my wisdom. Blessed be Jah thy Jah who hath brought thee hither. And the Queen saw the house of Shlomo and was greatly astonished, and said: How beautiful is thy house, and how great is thy wisdom! The report which I heard was true, but I believed it not until mine eyes had seen. The half was not told me. And Shlomo loved her wisdom, and she communed with him daily, and there was not anything hidden from him which he told her not."],
          ["XXVIII","How the Queen Turned to Jah","And Queen Makeda said: From this day forward I will not worship the sun and the moon and the stars, but I will worship Jah the Jah of Israel. And Shlomo answered: Blessed art thou who hast forsaken the worship of the sun and the moon and the stars, for they are the works of Jah's hands. And Jah Almighty, the Maker of heaven and earth, shall bless thee and thy seed after thee for ever."],
          ["XXXII","How the Queen Brought Forth a Son","And nine months and five days after her departure from Jerusalem, Queen Makeda brought forth a man child, and she rejoiced with an exceedingly great joy, and she called his name Menelik — the son of the wise man. And the child grew and became strong in wisdom and in stature, and he was beautiful in face, and his features were those of his father Shlomo the King of Israel."],
          ["XLVIII","How They Carried Away Zion","And it came to pass that the firstborn sons of the nobles of Israel entered secretly into the Holy of Holies. And Azariah, the son of Zadok the priest, made a case of wood after the pattern of the Ark of the Covenant, and by night he exchanged the copy for the true Tabernacle of Zion. And they departed at night, and they bore the Ark of Jah, and they traveled swiftly — for Jah gave them speed beyond nature. And in the morning when Shlomo rose up, the Ark was gone. And Shlomo said: Jah hath willed this thing. For I dreamed that the sun departed from Israel and went to Ethiopia, and shone there for ever."],
          ["LXXXVI","How Makeda Made Her Son King","And Makeda abdicated her throne in favour of her son Menelik, saying: Henceforth thou art King of Ethiopia. For it is the will of Jah that a King, the son of Shlomo, shall reign over this land for ever. And all the nobles of Ethiopia swore: We will serve thee and thy seed after thee for ever. And thy kingdom shall endure until the end of the world. And Menelik received the crown, and the Tabernacle of Zion remained in Axum, and Jah blessed the land."],
          ["CXVII","The Eternal Covenant","And from the days of Menelik the first unto the days of Haile Selassie the First — which is to say the Power of the Trinity — the Solomonic line of kings hath not been broken. And the King of Ethiopia shall bear the titles that belong to the covenant: King of Kings of Ethiopia, Lord of Lords, Conquering Lion of the Tribe of Judah, Elect of Jah. These are the titles that flow from the Kebra Nagast through 225 generations. Ethiopia shall be exalted among the nations. The Ark of Jah rests in Axum. The covenant endures for ever."],
        ].map(([num, title, text]) => (
          <div key={num}>
            <div className="codex-ch">
              <div className="codex-ch-orn">✦</div>
              <div className="codex-ch-num">Chapter {num}</div>
              <div className="codex-ch-title">{title}</div>
            </div>
            <div className="codex-col"><div className="verse-flow">
              <p className="v vdrop">{text}</p>
            </div></div>
            <div className="codex-sb">— ✦ —</div>
          </div>
        ))}
        <div className="pg">III · 3</div>
      </div>
    </>
  );
}

function GospelsContent() {
  return (
    <>
      <div className="codex-page" style={{ textAlign: "center", minHeight: "40vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 800, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", marginBottom: 10 }}>Volume IV</div>
        <div style={{ color: "#B8922A", fontSize: 13, letterSpacing: "0.2em", margin: "10px 0" }}>✦ &nbsp; ✦ &nbsp; ✦</div>
        <div className="codex-title">The Restored Gospels<br />&amp; Hidden Scriptures</div>
        <div className="codex-sub">Yeshua the Messiah · The Living Word</div>
        <hr className="codex-rule" style={{ width: "min(3in,80%)", margin: "14px auto" }} />
        <div style={{ fontStyle: "italic", color: "#5C4A1E", fontSize: "10.5pt", lineHeight: 1.9 }}>
          "I am the light that is over all. I am the All.<br />The All has come from me and unfolds toward me."
        </div>
        <div className="pg">IV · 1</div>
      </div>

      <div className="codex-page">
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", textAlign: "center", marginBottom: 8 }}>Part I · The Gospel According to John</div>
        <hr className="codex-rule" />
        <div className="codex-ch"><div className="codex-ch-orn">✦</div><div className="codex-ch-num">Chapter I</div><div className="codex-ch-title">In the Beginning Was the Word</div></div>
        <div className="codex-col"><div className="verse-flow">
          <span className="v vdrop"><sup className="vn">1</sup>In the beginning was the Word, and the Word was with Jah, and the Word was Jah.</span>
          <span className="v"><sup className="vn">2</sup>The same was in the beginning with Jah.</span>
          <span className="v"><sup className="vn">3</sup>All things were made by him; and without him was not any thing made that was made.</span>
          <span className="v"><sup className="vn">4</sup>In him was life; and the life was the light of men.</span>
          <span className="v"><sup className="vn">5</sup>And the light shineth in darkness; and the darkness comprehended it not.</span>
          <span className="v"><sup className="vn">9</sup>That was the true Light, which lighteth every man that cometh into the world.</span>
          <span className="v"><sup className="vn">12</sup>But as many as received him, to them gave he power to become the sons of Jah, even to them that believe on his name.</span>
          <span className="v"><sup className="vn">14</sup>And the Word was made flesh, and dwelt among us, and we beheld his glory, the glory as of the only begotten of the Father, full of grace and truth.</span>
        </div></div>
        <div className="codex-sb">— ✦ —</div>
        <div className="codex-ch"><div className="codex-ch-orn">✦</div><div className="codex-ch-num">Chapter XIV</div><div className="codex-ch-title">I Am the Way, the Truth, and the Life</div></div>
        <div className="codex-col"><div className="verse-flow">
          <span className="v vdrop"><sup className="vn">1</sup>Let not your heart be troubled: ye believe in Jah, believe also in me.</span>
          <span className="v"><sup className="vn">2</sup>In my Father's house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.</span>
          <span className="v"><sup className="vn">6</sup>Yeshua saith, I am the way, the truth, and the life: no man cometh unto the Father, but by me.</span>
          <span className="v"><sup className="vn">27</sup>Peace I leave with you, my peace I give unto you. Let not your heart be troubled, neither let it be afraid.</span>
        </div></div>
        <div className="codex-sb">— ✦ —</div>
        <div className="pg">IV · 2</div>
      </div>

      <div className="codex-page">
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", textAlign: "center", marginBottom: 8 }}>Part II · The Gospel of Thomas · All 114 Sayings</div>
        <hr className="codex-rule" />
        <div className="codex-ch" style={{ marginTop: 0 }}><div className="codex-ch-orn">✦</div><div className="codex-ch-num">Prologue</div></div>
        <div className="verse-flow" style={{ marginBottom: 16 }}><p className="v vdrop">These are the hidden sayings that the living Yeshua spoke and Didymos Judas Thomas wrote down.</p></div>

        {[
          ["1","True Meaning","Whoever discovers the meaning of these sayings will not taste death."],
          ["2","Seek and Find","Whoever seeks should not stop until they find. When they find, they will be disturbed. When they are disturbed, they will be amazed, and reign over the All."],
          ["3","The Kingdom Within","The Kingdom of Jah is within you and outside of you. When you know yourselves, then you will be known, and you will realize that you are the children of the Living Father Jah."],
          ["5","Hidden and Revealed","Know what is in front of your face, and what is hidden from you will be revealed to you, because there is nothing hidden that will not be revealed."],
          ["10","Fire on the World","I have cast fire on the world, and look, I am watching over it until it blazes."],
          ["17","The Divine Gift","I will give you what no eye has ever seen, no ear has ever heard, no hand has ever touched, and no human mind has ever thought."],
          ["22","Making the Two into One","When you make the two into one, and make the inner like the outer and the outer like the inner — then you will enter the Kingdom."],
          ["24","Light Within","Light exists within a person of light, and they light up the whole world. If they do not shine, there is darkness."],
          ["25","Love and Protect","Love your brother as your own soul. Protect them like the pupil of your eye."],
          ["42","Passing By","Become passersby."],
          ["49","The Chosen","Blessed are those who are one — those who are chosen — because you will find the Kingdom. You have come from there and will return there."],
          ["50","Our Origin","If they ask you, 'Where do you come from?' tell them: 'We have come from the light, the place where light came into being by itself and appeared in their image.' If they ask, 'Is it you?' then say: 'We are its children, and we are chosen by our Living Father Jah.'"],
          ["54","The Poor","Blessed are those who are poor, for yours is the Kingdom of Heaven."],
          ["70","Salvation Within","If you give birth to what is within you, what you have within you will save you. If you do not have that within you, what you do not have will destroy you."],
          ["76","The Pearl","The Kingdom of Jah the Father can be compared to a merchant who found a pearl. The merchant was wise; they sold all their merchandise and bought that single pearl. You too, look for the treasure that does not perish but endures."],
          ["77","Yeshua is the Light","I am the light that is over all. I am the All. The All has come from me and unfolds toward me. Split a log; I am there. Lift the stone, and you will find me there."],
          ["82","Near the Fire","Whoever is near me is near the fire, and whoever is far from me is far from the Kingdom."],
          ["90","The Easy Yoke","Come to me, because my yoke is easy and my requirements are light. You will be refreshed."],
          ["108","Becoming Like Yeshua","Whoever drinks from my mouth will become like me, and I myself will become like them; then, what is hidden will be revealed to them."],
          ["113","The Kingdom Is Present","The Kingdom of Jah the Father is already spread out over the earth, and people do not see it."],
        ].map(([num, title, text]) => (
          <div key={num}>
            <div className="codex-ch" style={{ margin: "14px 0 6px" }}>
              <div className="codex-ch-orn" style={{ fontSize: 9 }}>✦</div>
              <div className="codex-ch-num">Saying {num}</div>
              <div className="codex-ch-title">{title}</div>
            </div>
            <div className="verse-flow" style={{ marginBottom: 4 }}><p className="v">{text}</p></div>
          </div>
        ))}
        <div className="codex-sb">✦ &nbsp; ✦ &nbsp; ✦</div>
        <div className="pg">IV · 3</div>
      </div>

      <div className="codex-page">
        <div style={{ fontFamily: "system-ui", fontSize: 8, fontWeight: 700, letterSpacing: "0.5em", textTransform: "uppercase", color: "#8C6D1F", textAlign: "center", marginBottom: 8 }}>Part III · The Gospel of the Holy Twelve</div>
        <hr className="codex-rule" />
        <div className="codex-callout"><span className="codex-callout-label">The Ital Covenant</span>"I am come to end the sacrifices and feasts of blood. The body is the temple of the Ruach Ha'Kodesh. Be merciful to every creature which is within your care, for ye are to them as gods, to whom they look in their need." — Lection 21</div>

        {[
          ["4","The Nativity","And she brought forth her firstborn child in a Cave, and wrapped him in swaddling clothes, and laid him in a manger, which was in the cave. And there were in the same cave an ox, and a horse, and an ass, and a sheep, and beneath the manger was a cat with her little ones, and there were doves also overhead. Thus it came to pass that he was born in the midst of the animals which, through the redemption of man from ignorance and selfishness, he came to redeem from their sufferings."],
          ["6","The Lion is Set Free","And on a certain day as he was passing by a mountain side, there met him a lion and many men were pursuing him with stones and javelins to slay him. But Yeshua rebuked them, saying: Why hunt ye these creatures of Jah, which are more noble than you? Cease ye to persecute this creature who desireth not to harm you. And the lion came and lay at the feet of Yeshua, and shewed love to him; and the people were astonished."],
          ["19","How to Pray","Our Father-Mother Who art above and within: Hallowed be Thy Name in twofold Trinity. In Wisdom, Love and Equity Thy Kingdom come to all. Thy will be done, as in Heaven so in Earth. Give us day by day to partake of Thy holy Bread. As Thou dost forgive us our trespasses, so may we forgive others. In the hour of temptation, deliver us from evil. And wheresoever there are seven gathered together in my Name there am I in the midst of them. Raise the Stone, and there thou shalt find me. Cleave the wood, and there am I."],
          ["21","Yeshua Heals the Horse","But the horse had fallen down, for it was overladen, and the man struck it till the blood flowed. And Yeshua went to him and said: Son of cruelty, why strikest thou thy beast? Seest thou not that it is too weak for its burden, and knowest thou not that it suffereth? And the Lord was sorrowful, and said: Woe unto you because of the dullness of your hearts, ye hear not how it lamenteth and crieth unto the heavenly Creator for mercy. And he went forward and touched it, and the horse stood up, and its wounds were healed."],
          ["25","The Sermon on the Mount","Blessed in spirit are the poor, for theirs is the kingdom of heaven. Blessed are they that mourn: for they shall be comforted. Blessed are the meek; for they shall inherit the earth. Blessed are the merciful: for they shall obtain mercy. Blessed are the pure in heart: for they shall see Jah. Blessed are the peacemakers: for they shall be called the children of Jah. Love your enemies, do good to them which hate you. Bless them that curse you, and pray for them which despitefully use you. Be ye therefore perfect, even as your Parent Who is in heaven is perfect."],
        ].map(([num, title, text]) => (
          <div key={num}>
            <div className="codex-ch">
              <div className="codex-ch-orn">✦</div>
              <div className="codex-ch-num">Lection {num}</div>
              <div className="codex-ch-title">{title}</div>
            </div>
            <div className="codex-col"><div className="verse-flow">
              <p className="v vdrop">{text}</p>
            </div></div>
            <div className="codex-sb">— ✦ —</div>
          </div>
        ))}
        <div className="pg">IV · 4</div>
      </div>
    </>
  );
}

// ── Main HolyBooks Component ────────────────────────────────
export default function HolyBooks() {
  const navigate = useNavigate();
  const [openVol, setOpenVol] = useState<typeof VOLUMES[0] | null>(null);

  if (openVol) {
    return <CodexReader vol={openVol} onClose={() => setOpenVol(null)} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: S.bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        borderBottom: `1px solid ${S.goldBorder}`,
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 14,
        position: "sticky", top: 0, zIndex: 50,
        backdropFilter: "blur(20px)",
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: S.textDim, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>←</button>
        <div>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(212,175,55,0.45)", margin: 0 }}>SACRED LIBRARY</p>
          <h1 style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: "rgba(212,175,55,0.9)", margin: 0 }}>Holy Books</h1>
        </div>
      </div>

      <div style={{ padding: "20px 16px 0" }}>
        {/* One book banner */}
        <div style={{
          padding: "22px 20px 18px",
          background: "radial-gradient(ellipse at 30% 40%, rgba(60,35,0,0.98) 0%, rgba(20,11,0,0.99) 60%, #050505 100%)",
          border: `1px solid rgba(212,175,55,0.45)`,
          borderRadius: 20, marginBottom: 22,
        }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.45em", textTransform: "uppercase", color: "rgba(212,175,55,0.6)", marginBottom: 8 }}>
            THE COMPLETE RESTORED COVENANT SCRIPTURES
          </p>
          <div style={{ fontFamily: "'Cinzel',serif", fontWeight: 700, fontSize: "clamp(20px,6vw,26px)", lineHeight: 1.2, marginBottom: 10, background: "linear-gradient(135deg, #D4AF37 0%, #F5E17A 40%, #D4AF37 60%, #A07C10 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ONE SACRED LIBRARY<br />FIVE COVENANT VOLUMES
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.88rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginBottom: 0 }}>
            Nile Valley Prologue · 1 Enoch · Kebra Nagast · The Restored Gospels · The Imperial Covenant — divine names restored, sacred codex typography, parchment format.
          </p>
        </div>

        {/* Volume cards — each opens inline reader */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {VOLUMES.map((v) => (
            <div
              key={v.id}
              onClick={() => v.status !== "coming" && setOpenVol(v)}
              style={{
                position: "relative", overflow: "hidden",
                background: "rgba(255,255,255,0.02)",
                border: `1px solid ${v.status === "complete" ? "rgba(212,175,55,0.25)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 18, padding: "18px 16px",
                cursor: v.status === "coming" ? "default" : "pointer",
                transition: "border-color 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: v.status !== "coming" ? "radial-gradient(circle at 35% 35%, rgba(212,175,55,0.2), rgba(212,175,55,0.05) 60%, rgba(5,5,5,0.8))" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${v.status !== "coming" ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, color: v.status !== "coming" ? "rgba(212,175,55,0.9)" : "rgba(255,255,255,0.2)",
                }}>
                  {v.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 70 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 6, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: v.status !== "coming" ? "rgba(212,175,55,0.55)" : "rgba(255,255,255,0.2)", marginBottom: 5 }}>{v.num}</div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, fontWeight: 600, color: v.status !== "coming" ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.25)", lineHeight: 1.3, marginBottom: 5 }}>{v.title}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 11.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{v.subtitle}</div>
                </div>
              </div>

              {/* Status badge */}
              <div style={{ position: "absolute", top: 14, right: 14 }}>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 6, fontWeight: 800,
                  letterSpacing: "0.2em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 20,
                  background: v.status === "complete" ? "rgba(212,175,55,0.12)" : v.status === "progress" ? "rgba(100,220,100,0.08)" : "rgba(255,255,255,0.03)",
                  border: v.status === "complete" ? "1px solid rgba(212,175,55,0.4)" : v.status === "progress" ? "1px solid rgba(100,220,100,0.2)" : "1px solid rgba(255,255,255,0.08)",
                  color: v.status === "complete" ? "rgba(212,175,55,0.9)" : v.status === "progress" ? "rgba(120,220,120,0.8)" : "rgba(255,255,255,0.2)",
                }}>
                  {v.status === "complete" ? "✦ Open" : v.status === "progress" ? "◈ Soon" : "○ Sealed"}
                </span>
              </div>

              {/* Open arrow for complete */}
              {v.status !== "coming" && (
                <div style={{ position: "absolute", bottom: 14, right: 14, color: "rgba(212,175,55,0.5)", fontSize: 16 }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* Physical codex CTA */}
        <div style={{ marginTop: 24, padding: "20px 18px", background: S.goldFaint, border: `1px solid ${S.goldBorder}`, borderRadius: 18 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.55)", marginBottom: 7 }}>PHYSICAL SACRED CODEX</p>
          <p style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 600, color: S.text, marginBottom: 7 }}>Order the Complete Printed Edition</p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 12, color: S.textDim, lineHeight: 1.6, marginBottom: 14 }}>Archival parchment · Gold foil stamping · Linen-bound hardcover — available when all 5 volumes are sealed.</p>
          <button style={{ padding: "11px 26px", borderRadius: 28, background: S.goldFaint, border: `1px solid rgba(212,175,55,0.4)`, color: "rgba(212,175,55,0.85)", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 7, fontWeight: 800, letterSpacing: "0.35em", textTransform: "uppercase", cursor: "pointer" }}>
            NOTIFY ME WHEN AVAILABLE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes hShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      `}</style>
    </div>
  );
}
