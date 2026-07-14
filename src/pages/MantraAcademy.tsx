// src/pages/MantraAcademy.tsx — Simple tier cards + accordion

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";
import { ACADEMY_CURRICULUM, TIER_CONFIG, Module, Lesson } from "@/data/mantraAcademyData";

const T = {
  free:   { accent: '#6B7280', gold: 'rgba(107,114,128,0.6)', bg: 'rgba(107,114,128,0.07)', border: 'rgba(107,114,128,0.25)', label: 'FREE',           price: 'Free',           icon: '◎', modules: '1–6'  },
  prana:  { accent: '#10B981', gold: 'rgba(16,185,129,0.6)',  bg: 'rgba(16,185,129,0.07)',  border: 'rgba(16,185,129,0.25)',  label: 'PRANA-FLOW',     price: '€19/mo',         icon: '◈', modules: '7–12' },
  siddha: { accent: '#D4AF37', gold: 'rgba(212,175,55,0.6)',  bg: 'rgba(212,175,55,0.07)',  border: 'rgba(212,175,55,0.25)',  label: 'SIDDHA-QUANTUM', price: '€45/mo',         icon: '✦', modules: '13–18'},
  akasha: { accent: '#A78BFA', gold: 'rgba(167,139,250,0.6)', bg: 'rgba(167,139,250,0.07)', border: 'rgba(167,139,250,0.25)', label: 'AKASHA-INFINITY',price: '€2,997 lifetime', icon: '⬡', modules: '19–24'},
};
type Tier = keyof typeof T;
const TIER_ORDER: Tier[] = ['free','prana','siddha','akasha'];

// ─── LESSON READER ───────────────────────────────────────────
function LessonReader({ lesson, accent, onBack }: { lesson: Lesson; accent: string; onBack: () => void }) {
  const topRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={topRef} style={{ minHeight:'100vh', background:'#050505', color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {/* topbar */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'rgba(5,5,5,0.96)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:16, flexShrink:0 }}>←</button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:accent }}>LESSON {lesson.number}</div>
          <div style={{ fontSize:13, fontWeight:700, color:'rgba(255,255,255,0.8)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lesson.title}</div>
        </div>
      </div>

      <div style={{ padding:'24px 18px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:'clamp(22px,5vw,34px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:8 }}>{lesson.title}</h1>
          <div style={{ fontSize:11, textTransform:'uppercase', letterSpacing:'0.1em', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{lesson.subtitle}</div>
          <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', marginTop:8 }}>⏱ {lesson.durationMin} MIN</div>
        </div>

        {lesson.sections.map((s, i) => {
          if (s.type === 'intro') return (
            <div key={i} style={{ background:'rgba(255,255,255,0.015)', borderLeft:`3px solid ${accent}`, borderRadius:'0 14px 14px 0', padding:'18px 18px', marginBottom:20 }}>
              {(s.body||'').split('\n\n').map((p,j)=><p key={j} style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.8, marginBottom:j<(s.body||'').split('\n\n').length-1?12:0 }}>{p}</p>)}
            </div>
          );
          if (s.type === 'teaching') return (
            <div key={i} style={{ marginBottom:22 }}>
              {s.heading && <h2 style={{ fontSize:15, fontWeight:900, color:'#fff', marginBottom:10, display:'flex', alignItems:'flex-start', gap:8 }}><span style={{ width:3, height:18, background:accent, borderRadius:2, flexShrink:0, marginTop:3, display:'block' }}/>{s.heading}</h2>}
              {(s.body||'').split('\n\n').map((p,j)=><p key={j} style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.85, marginBottom:10 }}>{p}</p>)}
            </div>
          );
          if (s.type === 'mantra' && s.mantra) return (
            <div key={i} style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:18, padding:'22px 18px', marginBottom:22, textAlign:'center' }}>
              <div style={{ fontSize:'clamp(20px,5vw,36px)', fontWeight:900, color:'#D4AF37', textShadow:'0 0 30px rgba(212,175,55,0.4)', lineHeight:1.4, marginBottom:8, whiteSpace:'pre-line' }}>{s.mantra.devanagari}</div>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(212,175,55,0.7)', marginBottom:6, whiteSpace:'pre-line' }}>{s.mantra.transliteration}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:12 }}>{s.mantra.translation}</div>
              <div style={{ height:1, background:'rgba(212,175,55,0.1)', margin:'12px 0' }}/>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>{s.mantra.body}</p>
            </div>
          );
          if (s.type === 'practice' && s.practice) return (
            <div key={i} style={{ background:'rgba(34,211,238,0.03)', border:'1px solid rgba(34,211,238,0.12)', borderRadius:18, padding:'18px', marginBottom:22 }}>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'#22D3EE', marginBottom:10 }}>◈ PRACTICE PROTOCOL</div>
              <h3 style={{ fontSize:14, fontWeight:900, marginBottom:16 }}>{s.practice.title}</h3>
              {s.practice.steps.map((step,j)=>(
                <div key={j} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:900, color:'#22D3EE', marginTop:2 }}>{j+1}</div>
                  <p style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.7, margin:0 }}>{step}</p>
                </div>
              ))}
            </div>
          );
          if (s.type === 'wisdom') return (
            <div key={i} style={{ background:'rgba(167,139,250,0.03)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:18, padding:'18px', marginBottom:22 }}>
              <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'#A78BFA', marginBottom:8 }}>॥ SIDDHA TRANSMISSION</div>
              {s.wisdomTitle && <h3 style={{ fontSize:14, fontWeight:900, color:'rgba(255,255,255,0.85)', marginBottom:10 }}>{s.wisdomTitle}</h3>}
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.8, fontStyle:'italic' }}>{s.wisdomBody}</p>
            </div>
          );
          if (s.type === 'audio' && s.audio) return (
            <div key={i} style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:16, padding:'16px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', flexShrink:0, background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color:'#D4AF37', fontSize:14 }}>▶</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.85)', marginBottom:3 }}>{s.audio.title}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', lineHeight:1.4 }}>{s.audio.description}</div>
                {!s.audio.url && <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(212,175,55,0.5)', marginTop:4 }}>COMING SOON</div>}
              </div>
            </div>
          );
          return null;
        })}

        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <span style={{ fontSize:10, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:'rgba(212,175,55,0.4)' }}>OM SHANTI SHANTI SHANTI</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────
export default function MantraAcademy() {
  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const canAccess = (t: Tier) => isAdmin || TIER_ORDER.indexOf(t) <= rank;

  const [openTier,   setOpenTier]   = useState<Tier | null>('free');
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<{ lesson: Lesson; tier: Tier } | null>(null);

  // ── LESSON VIEW ──────────────────────────────────────────
  if (activeLesson) {
    return (
      <LessonReader
        lesson={activeLesson.lesson}
        accent={T[activeLesson.tier].accent}
        onBack={() => setActiveLesson(null)}
      />
    );
  }

  // ── MAIN LIST VIEW ───────────────────────────────────────
  const tiers: Tier[] = ['free','prana','siddha','akasha'];

  return (
    <div style={{ minHeight:'100vh', background:'#050505', color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif", paddingBottom:100 }}>

      {/* Topbar */}
      <div style={{ position:'sticky', top:0, zIndex:20, background:'rgba(5,5,5,0.96)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate(-1)} style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:16, flexShrink:0 }}>←</button>
        <div>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'#D4AF37' }}>SQI · MANTRA NADA ACADEMY</div>
          <div style={{ fontSize:15, fontWeight:900, letterSpacing:'-0.02em' }}>24 Modules · 4 Tiers</div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ padding:'28px 18px 20px', textAlign:'center' }}>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:8 }}>
          The Complete<br/><span style={{ color:'#D4AF37', textShadow:'0 0 30px rgba(212,175,55,0.3)' }}>Nada Transmission</span>
        </div>
        <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', lineHeight:1.7, maxWidth:340, margin:'0 auto' }}>
          24 modules of Vedic Light-Codes transmitted through the Tamil Siddha lineage
        </p>
      </div>

      {/* Tier cards */}
      <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:10 }}>
        {tiers.map(tierKey => {
          const tc = T[tierKey];
          const unlocked = canAccess(tierKey);
          const isOpen = openTier === tierKey;
          const mods = ACADEMY_CURRICULUM.filter(m => m.tier === tierKey);

          return (
            <div key={tierKey} style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${isOpen ? tc.border : 'rgba(255,255,255,0.06)'}`, borderRadius:24, overflow:'hidden', transition:'border-color 0.2s' }}>

              {/* Tier header — tap to open/close */}
              <button
                onClick={() => setOpenTier(isOpen ? null : tierKey)}
                style={{ width:'100%', padding:'18px 18px', display:'flex', alignItems:'center', gap:14, background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
              >
                <div style={{ width:44, height:44, borderRadius:14, flexShrink:0, background: unlocked ? tc.bg : 'rgba(255,255,255,0.04)', border:`1px solid ${unlocked ? tc.border : 'rgba(255,255,255,0.07)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, color: unlocked ? tc.accent : 'rgba(255,255,255,0.2)' }}>
                  {unlocked ? tc.icon : '🔒'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color: unlocked ? tc.accent : 'rgba(255,255,255,0.3)', marginBottom:3 }}>
                    {tc.label} · MODULES {tc.modules}
                  </div>
                  <div style={{ fontSize:15, fontWeight:900, letterSpacing:'-0.02em', color: unlocked ? '#fff' : 'rgba(255,255,255,0.4)', marginBottom:2 }}>
                    {tierKey === 'free'   && 'Nada Foundations'}
                    {tierKey === 'prana'  && 'Living Mantra Science'}
                    {tierKey === 'siddha' && 'Siddha Lineage Codes'}
                    {tierKey === 'akasha' && 'Para Nada — The Absolute'}
                  </div>
                  <div style={{ fontSize:11, color: unlocked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.2)' }}>
                    {mods.length} modules · {unlocked ? tc.price : `Upgrade — ${tc.price}`}
                  </div>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', flexShrink:0, transition:'transform 0.25s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</div>
              </button>

              {/* Locked upgrade CTA */}
              {isOpen && !unlocked && (
                <div style={{ padding:'0 18px 20px' }}>
                  <div style={{ background: tc.bg, border:`1px solid ${tc.border}`, borderRadius:16, padding:'16px 18px', textAlign:'center' }}>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginBottom:14, lineHeight:1.6 }}>
                      Unlock {mods.length} modules and all lessons with {tc.label}
                    </div>
                    <a href="/prana-flow" style={{ display:'inline-block', padding:'10px 28px', borderRadius:100, background:tc.bg, border:`1px solid ${tc.accent}`, color:tc.accent, fontSize:10, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase', textDecoration:'none' }}>
                      UPGRADE — {tc.price} →
                    </a>
                  </div>
                </div>
              )}

              {/* Unlocked modules */}
              {isOpen && unlocked && (
                <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                  {mods.map(mod => {
                    const modOpen = openModule === mod.id;
                    return (
                      <div key={mod.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>

                        {/* Module row */}
                        <button
                          onClick={() => setOpenModule(modOpen ? null : mod.id)}
                          style={{ width:'100%', padding:'14px 18px', display:'flex', alignItems:'center', gap:12, background: modOpen ? 'rgba(255,255,255,0.025)' : 'none', border:'none', cursor:'pointer', textAlign:'left' }}
                        >
                          <div style={{ width:32, height:32, borderRadius:10, flexShrink:0, background: modOpen ? `${tc.accent}22` : 'rgba(255,255,255,0.05)', border:`1px solid ${modOpen ? tc.accent+'55' : 'rgba(255,255,255,0.08)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color: modOpen ? tc.accent : 'rgba(255,255,255,0.4)' }}>
                            {String(mod.number).padStart(2,'0')}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:13, fontWeight:700, color: modOpen ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight:1.3 }}>{mod.title}</div>
                            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{mod.lessons.length} lessons</div>
                          </div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', flexShrink:0, transition:'transform 0.2s', transform: modOpen ? 'rotate(180deg)' : 'none' }}>▼</div>
                        </button>

                        {/* Lesson rows */}
                        {modOpen && (
                          <div style={{ background:'rgba(0,0,0,0.2)' }}>
                            {mod.lessons.map((lesson, li) => (
                              <button
                                key={lesson.id}
                                onClick={() => setActiveLesson({ lesson, tier: tierKey })}
                                style={{ width:'100%', padding:'12px 18px 12px 62px', display:'flex', alignItems:'center', gap:12, background:'none', border:'none', borderTop:'1px solid rgba(255,255,255,0.03)', cursor:'pointer', textAlign:'left' }}
                              >
                                <div style={{ fontSize:9, fontWeight:900, color:tc.accent, width:20, flexShrink:0 }}>
                                  {String(li+1).padStart(2,'0')}
                                </div>
                                <div style={{ flex:1, minWidth:0 }}>
                                  <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.75)', lineHeight:1.3 }}>{lesson.title}</div>
                                  <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{lesson.durationMin} min</div>
                                </div>
                                <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', flexShrink:0 }}>→</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
