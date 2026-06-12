// src/pages/MantraAcademy.tsx — Mobile-first rebuild

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";
import { ACADEMY_CURRICULUM, TIER_CONFIG, Module, Lesson } from "@/data/mantraAcademyData";

const TIER_COLORS = {
  free:   { border: 'rgba(107,114,128,0.3)', accent: '#6B7280', bg: 'rgba(107,114,128,0.06)' },
  prana:  { border: 'rgba(16,185,129,0.3)',  accent: '#10B981', bg: 'rgba(16,185,129,0.06)'  },
  siddha: { border: 'rgba(212,175,55,0.3)',  accent: '#D4AF37', bg: 'rgba(212,175,55,0.06)'  },
  akasha: { border: 'rgba(167,139,250,0.3)', accent: '#A78BFA', bg: 'rgba(167,139,250,0.06)' },
};

// ─── AUDIO PLAYER ────────────────────────────────────────────
function AudioPlayer({ url, title, description }: { url?: string; title: string; description: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const toggle = () => {
    if (!audioRef.current || !url) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };
  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onEnd  = () => { setPlaying(false); setProgress(0); };
    a.addEventListener('timeupdate', onTime); a.addEventListener('ended', onEnd);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, []);
  return (
    <div style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:20, padding:'18px 20px', marginTop:20 }}>
      {url && <audio ref={audioRef} src={url} />}
      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
        <button onClick={toggle} disabled={!url} style={{ width:44, height:44, borderRadius:'50%', flexShrink:0, background: url?'rgba(212,175,55,0.15)':'rgba(255,255,255,0.03)', border:`1px solid ${url?'rgba(212,175,55,0.4)':'rgba(255,255,255,0.08)'}`, cursor:url?'pointer':'default', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:url?'#D4AF37':'rgba(255,255,255,0.2)' }}>
          {playing ? '⏸' : '▶'}
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:800, color:'rgba(255,255,255,0.85)', marginBottom:4, lineHeight:1.4 }}>{title}</div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', lineHeight:1.5, marginBottom: url?10:0 }}>{description}</div>
          {!url && <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(212,175,55,0.5)' }}>RECORDING COMING SOON</div>}
          {url && <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, overflow:'hidden' }}><div style={{ height:'100%', width:`${progress}%`, background:'#D4AF37', borderRadius:2 }} /></div>}
        </div>
      </div>
    </div>
  );
}

// ─── LESSON READER ───────────────────────────────────────────
function LessonReader({ lesson, tierAccent }: { lesson: Lesson; tierAccent: string }) {
  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:tierAccent, marginBottom:8 }}>Lesson {lesson.number}</div>
        <h1 style={{ fontSize:'clamp(22px,5vw,36px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.1, marginBottom:8 }}>{lesson.title}</h1>
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>{lesson.subtitle}</div>
        <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginTop:10 }}>⏱ {lesson.durationMin} MIN</div>
      </div>
      {lesson.sections.map((section, idx) => {
        switch (section.type) {
          case 'intro': return (
            <div key={idx} style={{ background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.06)', borderLeft:`3px solid ${tierAccent}`, borderRadius:16, padding:'20px', marginBottom:20 }}>
              {(section.body||'').split('\n\n').map((p,i)=><p key={i} style={{ fontSize:14, color:'rgba(255,255,255,0.75)', lineHeight:1.8, marginBottom:i<(section.body||'').split('\n\n').length-1?14:0 }}>{p}</p>)}
            </div>
          );
          case 'teaching': return (
            <div key={idx} style={{ marginBottom:24 }}>
              {section.heading && <h2 style={{ fontSize:16, fontWeight:900, letterSpacing:'-0.02em', color:'#fff', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}><span style={{ display:'inline-block', width:3, height:18, background:tierAccent, borderRadius:2, flexShrink:0 }}/>{section.heading}</h2>}
              {(section.body||'').split('\n\n').map((p,i)=><p key={i} style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.85, marginBottom:12 }}>{p}</p>)}
            </div>
          );
          case 'mantra': return section.mantra ? (
            <div key={idx} style={{ background:'rgba(212,175,55,0.04)', border:'1px solid rgba(212,175,55,0.2)', borderRadius:20, padding:'24px 20px', marginBottom:24, textAlign:'center' }}>
              <div style={{ fontSize:'clamp(22px,5vw,40px)', fontWeight:900, color:'#D4AF37', textShadow:'0 0 30px rgba(212,175,55,0.4)', lineHeight:1.4, marginBottom:10, whiteSpace:'pre-line' }}>{section.mantra.devanagari}</div>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(212,175,55,0.7)', marginBottom:6, whiteSpace:'pre-line' }}>{section.mantra.transliteration}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', marginBottom:14, fontWeight:600 }}>{section.mantra.translation}</div>
              <div style={{ height:1, background:'rgba(212,175,55,0.1)', margin:'14px 0' }}/>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>{section.mantra.body}</p>
            </div>
          ) : null;
          case 'practice': return section.practice ? (
            <div key={idx} style={{ background:'rgba(34,211,238,0.03)', border:'1px solid rgba(34,211,238,0.12)', borderRadius:20, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'#22D3EE', marginBottom:12 }}>◈ PRACTICE PROTOCOL</div>
              <h3 style={{ fontSize:15, fontWeight:900, letterSpacing:'-0.02em', marginBottom:18 }}>{section.practice.title}</h3>
              <ol style={{ listStyle:'none', paddingLeft:0 }}>
                {section.practice.steps.map((step,i)=>(
                  <li key={i} style={{ display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' }}>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, background:'rgba(34,211,238,0.1)', border:'1px solid rgba(34,211,238,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:900, color:'#22D3EE', marginTop:1 }}>{i+1}</div>
                    <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.7, margin:0 }}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null;
          case 'wisdom': return (
            <div key={idx} style={{ background:'rgba(167,139,250,0.03)', border:'1px solid rgba(167,139,250,0.15)', borderRadius:20, padding:'20px', marginBottom:24 }}>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'#A78BFA', marginBottom:10 }}>॥ SIDDHA TRANSMISSION</div>
              {section.wisdomTitle && <h3 style={{ fontSize:14, fontWeight:900, color:'rgba(255,255,255,0.85)', marginBottom:12 }}>{section.wisdomTitle}</h3>}
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.8, fontStyle:'italic' }}>{section.wisdomBody}</p>
            </div>
          );
          case 'integration': return (
            <div key={idx} style={{ background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, padding:'20px', marginBottom:24 }}>
              {section.heading && <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginBottom:10 }}>✦ {section.heading}</div>}
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.8 }}>{section.body}</p>
            </div>
          );
          case 'audio': return section.audio ? <AudioPlayer key={idx} url={section.audio.url} title={section.audio.title} description={section.audio.description}/> : null;
          default: return null;
        }
      })}
      <div style={{ textAlign:'center', padding:'28px 0 8px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', padding:'10px 24px', borderRadius:100, background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)' }}>
          <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(212,175,55,0.6)' }}>OM SHANTI SHANTI SHANTI</span>
        </div>
      </div>
    </div>
  );
}

// ─── LOCKED MODULE ───────────────────────────────────────────
function LockedModule({ mod }: { mod: Module }) {
  const colors = TIER_COLORS[mod.tier];
  const cfg = TIER_CONFIG[mod.tier];
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:360, textAlign:'center', gap:20, padding:'40px 20px' }}>
      <div style={{ fontSize:40 }}>🔐</div>
      <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:colors.accent }}>{cfg.label} · {cfg.price}</div>
      <h2 style={{ fontSize:24, fontWeight:900, letterSpacing:'-0.03em' }}>{mod.title}</h2>
      <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', maxWidth:360, lineHeight:1.7 }}>{mod.description}</p>
      <a href="/prana-flow" style={{ display:'inline-flex', padding:'12px 32px', borderRadius:100, background:colors.bg, border:`1px solid ${colors.border}`, color:colors.accent, fontSize:11, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', textDecoration:'none' }}>
        Upgrade to {cfg.label} →
      </a>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function MantraAcademy() {
  // view: 'list' = module/lesson list, 'lesson' = reading a lesson
  const [view, setView] = useState<'list' | 'lesson'>('list');
  const [activeModuleId, setActiveModuleId] = useState<string>(ACADEMY_CURRICULUM[0]?.id ?? '');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : (getTierRank(tier) ?? 0);
  const userTier: 'free' | 'prana' | 'siddha' | 'akasha' =
    rank >= 3 ? 'akasha' : rank >= 2 ? 'siddha' : rank >= 1 ? 'prana' : 'free';

  const TIER_ORDER: Array<'free' | 'prana' | 'siddha' | 'akasha'> = ['free', 'prana', 'siddha', 'akasha'];
  const userTierIndex = TIER_ORDER.indexOf(userTier);
  const canAccess = (t: 'free' | 'prana' | 'siddha' | 'akasha') => TIER_ORDER.indexOf(t) <= userTierIndex;

  const activeModule = ACADEMY_CURRICULUM.find(m => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons.find(l => l.id === activeLessonId);
  const tierColors = activeModule ? TIER_COLORS[activeModule.tier] : TIER_COLORS.free;

  const openLesson = (mod: Module, lesson: Lesson) => {
    setActiveModuleId(mod.id);
    setActiveLessonId(lesson.id);
    setView('lesson');
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextLesson = () => {
    if (!activeModule || !activeLesson) return;
    const idx = activeModule.lessons.findIndex(l => l.id === activeLessonId);
    if (idx < activeModule.lessons.length - 1) {
      openLesson(activeModule, activeModule.lessons[idx + 1]);
    } else {
      const modIdx = ACADEMY_CURRICULUM.findIndex(m => m.id === activeModuleId);
      if (modIdx < ACADEMY_CURRICULUM.length - 1) {
        const nextMod = ACADEMY_CURRICULUM[modIdx + 1];
        if (nextMod.lessons.length > 0) openLesson(nextMod, nextMod.lessons[0]);
      }
    }
  };

  // ── LESSON VIEW ──────────────────────────────────────────
  if (view === 'lesson' && activeModule && activeLesson) {
    return (
      <div ref={contentRef} style={{ minHeight:'100vh', background:'#050505', color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
        {/* Sticky topbar */}
        <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(5,5,5,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setView('list')} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:14, flexShrink:0 }}>←</button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:tierColors.accent, marginBottom:2 }}>
              {TIER_CONFIG[activeModule.tier].label} · MODULE {activeModule.number}
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,255,255,0.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {activeModule.title}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'24px 18px 100px' }}>
          {!canAccess(activeModule.tier) ? (
            <LockedModule mod={activeModule} />
          ) : (
            <LessonReader lesson={activeLesson} tierAccent={tierColors.accent} />
          )}
          {canAccess(activeModule.tier) && (
            <button onClick={nextLesson} style={{ width:'100%', padding:'16px', borderRadius:100, background:tierColors.bg, border:`1px solid ${tierColors.border}`, color:tierColors.accent, fontSize:11, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', cursor:'pointer', marginTop:8 }}>
              NEXT LESSON →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#050505', color:'#fff', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {/* Topbar */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(5,5,5,0.95)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate('/siddha-portal')} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.6)', fontSize:14, flexShrink:0 }}>←</button>
        <div>
          <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color:'#D4AF37' }}>SQI · NADA ACADEMY</div>
          <div style={{ fontSize:15, fontWeight:900, letterSpacing:'-0.02em', color:'#fff' }}>Mantra Curriculum</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, margin:'0 0 2px', background:'rgba(255,255,255,0.04)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        {[['24','Modules'],['108+','Lessons'],['4','Tiers']].map(([v,l])=>(
          <div key={l} style={{ padding:'14px 8px', textAlign:'center', background:'#050505' }}>
            <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.04em', color:'#D4AF37' }}>{v}</div>
            <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Module + lesson list */}
      <div style={{ padding:'8px 0 100px' }}>
        {ACADEMY_CURRICULUM.map(mod => {
          const colors = TIER_COLORS[mod.tier];
          const isOpen = mod.id === activeModuleId;
          const locked = !canAccess(mod.tier);
          return (
            <div key={mod.id}>
              {/* Module row */}
              <button
                onClick={() => setActiveModuleId(isOpen ? '' : mod.id)}
                style={{ width:'100%', textAlign:'left', padding:'14px 16px', display:'flex', alignItems:'center', gap:14, background:isOpen?'rgba(255,255,255,0.02)':'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}
              >
                <div style={{ width:40, height:40, borderRadius:12, flexShrink:0, background: isOpen?`${colors.accent}18`:'rgba(255,255,255,0.04)', border:`1px solid ${isOpen?colors.accent+'44':'rgba(255,255,255,0.07)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:900, color:isOpen?colors.accent:'rgba(255,255,255,0.3)' }}>
                  {locked ? '🔒' : String(mod.number).padStart(2,'0')}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:8, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color:isOpen?colors.accent:'rgba(255,255,255,0.3)', marginBottom:3 }}>
                    {TIER_CONFIG[mod.tier].label}
                  </div>
                  <div style={{ fontSize:14, fontWeight:800, color:isOpen?'#fff':'rgba(255,255,255,0.65)', lineHeight:1.3 }}>
                    {mod.title}
                  </div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', marginTop:2 }}>
                    {mod.lessons.length} lessons
                  </div>
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', flexShrink:0, transition:'transform 0.2s', transform:isOpen?'rotate(180deg)':'rotate(0deg)' }}>▼</div>
              </button>

              {/* Lesson list — expanded */}
              {isOpen && (
                <div style={{ background:'rgba(255,255,255,0.01)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                  {locked ? (
                    <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,0.4)', flex:1 }}>{TIER_CONFIG[mod.tier].label} required to access these lessons</div>
                      <a href="/prana-flow" style={{ padding:'8px 16px', borderRadius:100, background:colors.bg, border:`1px solid ${colors.border}`, color:colors.accent, fontSize:9, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase', textDecoration:'none', whiteSpace:'nowrap' }}>UPGRADE →</a>
                    </div>
                  ) : (
                    mod.lessons.map((lesson, li) => (
                      <button
                        key={lesson.id}
                        onClick={() => openLesson(mod, lesson)}
                        style={{ width:'100%', textAlign:'left', padding:'12px 16px 12px 70px', display:'flex', alignItems:'center', gap:12, background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer' }}
                      >
                        <div style={{ fontSize:10, fontWeight:900, color:colors.accent, flexShrink:0, width:20 }}>
                          {String(li + 1).padStart(2,'0')}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'rgba(255,255,255,0.8)', lineHeight:1.3 }}>{lesson.title}</div>
                          <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{lesson.durationMin} min</div>
                        </div>
                        <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', flexShrink:0 }}>→</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Coming soon */}
        {[...Array(Math.max(0, 24 - ACADEMY_CURRICULUM.length))].map((_, i) => (
          <div key={i} style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:14, borderBottom:'1px solid rgba(255,255,255,0.03)', opacity:0.3 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'rgba(255,255,255,0.2)', fontWeight:900 }}>
              {String(ACADEMY_CURRICULUM.length + i + 1).padStart(2,'0')}
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:500 }}>Coming Soon</div>
          </div>
        ))}
      </div>
    </div>
  );
}
