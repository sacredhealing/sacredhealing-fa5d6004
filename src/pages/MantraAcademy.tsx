// ============================================================
// src/pages/MantraAcademy.tsx
// SQI MANTRA NADA ACADEMY — Full Page Component
// Deploy: paste into GitHub web editor at src/pages/MantraAcademy.tsx
// ============================================================

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMembership } from "@/hooks/useMembership";
import { useAdminRole } from "@/hooks/useAdminRole";
import { getTierRank } from "@/lib/tierAccess";
import { ACADEMY_CURRICULUM, TIER_CONFIG, Module, Lesson } from "@/data/mantraAcademyData";

// ─── TIER COLOURS ───────────────────────────────────────────
const TIER_COLORS = {
  free:    { border: 'rgba(107,114,128,0.3)', accent: '#6B7280',  bg: 'rgba(107,114,128,0.06)' },
  prana:   { border: 'rgba(16,185,129,0.3)',  accent: '#10B981',  bg: 'rgba(16,185,129,0.06)'  },
  siddha:  { border: 'rgba(212,175,55,0.3)',  accent: '#D4AF37',  bg: 'rgba(212,175,55,0.06)'  },
  akasha:  { border: 'rgba(167,139,250,0.3)', accent: '#A78BFA',  bg: 'rgba(167,139,250,0.06)' },
};

// ─── AUDIO PLAYER ───────────────────────────────────────────
function AudioPlayer({ url, title, description }: { url?: string; title: string; description: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!audioRef.current || !url) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else          { audioRef.current.play();  setPlaying(true);  }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
    const onEnd  = () => { setPlaying(false); setProgress(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('ended', onEnd);
    return () => { a.removeEventListener('timeupdate', onTime); a.removeEventListener('ended', onEnd); };
  }, []);

  return (
    <div style={{
      background: 'rgba(212,175,55,0.04)',
      border: '1px solid rgba(212,175,55,0.15)',
      borderRadius: 20,
      padding: '20px 24px',
      marginTop: 20,
    }}>
      {url && <audio ref={audioRef} src={url} />}
      <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
        {/* Play button */}
        <button
          onClick={toggle}
          disabled={!url}
          style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: url ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${url ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
            cursor: url ? 'pointer' : 'default',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize: 16, color: url ? '#D4AF37' : 'rgba(255,255,255,0.2)',
            transition: 'all 0.2s',
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em', color:'rgba(255,255,255,0.85)', marginBottom: 4 }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: url ? 10 : 0, lineHeight: 1.5 }}>
            {description}
          </div>
          {!url && (
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform:'uppercase', color:'rgba(212,175,55,0.5)' }}>
              RECORDING COMING SOON — KRITAGYA & LAILA
            </div>
          )}
          {url && (
            <div style={{ height: 3, background:'rgba(255,255,255,0.06)', borderRadius: 2, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progress}%`, background:'#D4AF37', transition:'width 0.3s', borderRadius:2 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LESSON READER ──────────────────────────────────────────
function LessonReader({ lesson, tierAccent }: { lesson: Lesson; tierAccent: string }) {
  return (
    <div>
      {/* Lesson header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: tierAccent, marginBottom: 8 }}>
          Lesson {lesson.number}
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 8 }}>
          {lesson.title}
        </h1>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
          {lesson.subtitle}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap: 8, marginTop: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.35em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)' }}>
            ⏱ {lesson.durationMin} MIN
          </div>
        </div>
      </div>

      {/* Sections */}
      {lesson.sections.map((section, idx) => {
        switch (section.type) {

          case 'intro':
            return (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20,
                padding: '28px 32px',
                marginBottom: 24,
                borderLeft: `3px solid ${tierAccent}`,
              }}>
                {(section.body || '').split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: i < (section.body || '').split('\n\n').length - 1 ? 16 : 0 }}>
                    {para}
                  </p>
                ))}
              </div>
            );

          case 'teaching':
            return (
              <div key={idx} style={{ marginBottom: 28 }}>
                {section.heading && (
                  <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', marginBottom: 14, display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ display:'inline-block', width:3, height:20, background: tierAccent, borderRadius:2 }} />
                    {section.heading}
                  </h2>
                )}
                {(section.body || '').split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.85, marginBottom: 14 }}>
                    {para}
                  </p>
                ))}
              </div>
            );

          case 'mantra':
            return section.mantra ? (
              <div key={idx} style={{
                background: 'rgba(212,175,55,0.04)',
                border: '1px solid rgba(212,175,55,0.2)',
                borderRadius: 24,
                padding: '32px 28px',
                marginBottom: 28,
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, letterSpacing: '0.04em', color: '#D4AF37', textShadow: '0 0 30px rgba(212,175,55,0.4)', lineHeight: 1.3, marginBottom: 10 }}>
                  {section.mantra.devanagari}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.7)', marginBottom: 6 }}>
                  {section.mantra.transliteration}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16, fontWeight: 600 }}>
                  {section.mantra.translation}
                </div>
                <div style={{ height: 1, background: 'rgba(212,175,55,0.1)', margin: '16px 0' }} />
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75 }}>
                  {section.mantra.body}
                </p>
              </div>
            ) : null;

          case 'practice':
            return section.practice ? (
              <div key={idx} style={{
                background: 'rgba(34,211,238,0.03)',
                border: '1px solid rgba(34,211,238,0.12)',
                borderRadius: 24,
                padding: '28px 28px',
                marginBottom: 28,
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#22D3EE', marginBottom: 14 }}>
                  ◈ PRACTICE PROTOCOL
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 20 }}>
                  {section.practice.title}
                </h3>
                <ol style={{ listStyle: 'none', paddingLeft: 0 }}>
                  {section.practice.steps.map((step, i) => (
                    <li key={i} style={{ display:'flex', gap: 14, marginBottom: 14, alignItems:'flex-start' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 900, color: '#22D3EE', marginTop: 1,
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null;

          case 'wisdom':
            return (
              <div key={idx} style={{
                background: 'rgba(167,139,250,0.03)',
                border: '1px solid rgba(167,139,250,0.15)',
                borderRadius: 24,
                padding: '28px 28px',
                marginBottom: 28,
                position: 'relative',
              }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 12 }}>
                  ॥ SIDDHA TRANSMISSION
                </div>
                {section.wisdomTitle && (
                  <h3 style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.85)', marginBottom: 14 }}>
                    {section.wisdomTitle}
                  </h3>
                )}
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontStyle: 'italic' }}>
                  {section.wisdomBody}
                </p>
              </div>
            );

          case 'integration':
            return (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.015)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 24,
                padding: '24px 28px',
                marginBottom: 28,
              }}>
                {section.heading && (
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                    ✦ {section.heading}
                  </div>
                )}
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.8 }}>
                  {section.body}
                </p>
              </div>
            );

          case 'audio':
            return section.audio ? (
              <AudioPlayer
                key={idx}
                url={section.audio.url}
                title={section.audio.title}
                description={section.audio.description}
              />
            ) : null;

          default:
            return null;
        }
      })}

      {/* Completion marker */}
      <div style={{ textAlign: 'center', padding: '32px 0 8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: 100, background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.12)' }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.6)' }}>
            OM SHANTI SHANTI SHANTI
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MODULE SIDEBAR ITEM ─────────────────────────────────────
function ModuleItem({ mod, active, onSelect }: { mod: Module; active: boolean; onSelect: () => void }) {
  const colors = TIER_COLORS[mod.tier];
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left', padding: '14px 16px', borderRadius: 16,
        background: active ? colors.bg : 'transparent',
        border: `1px solid ${active ? colors.border : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.25s', display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: active ? `${colors.accent}22` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? colors.accent + '44' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 900, color: active ? colors.accent : 'rgba(255,255,255,0.3)',
      }}>
        {String(mod.number).padStart(2, '0')}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '-0.01em', color: active ? '#fff' : 'rgba(255,255,255,0.5)', lineHeight: 1.3, marginBottom: 3 }}>
          {mod.title}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: active ? colors.accent : 'rgba(255,255,255,0.25)' }}>
          {TIER_CONFIG[mod.tier].label}
        </div>
      </div>
    </button>
  );
}

// ─── LESSON SIDEBAR ITEM ─────────────────────────────────────
function LessonItem({ lesson, active, onSelect, accent }: { lesson: Lesson; active: boolean; onSelect: () => void; accent: string }) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 12,
        background: active ? `${accent}11` : 'transparent',
        border: `1px solid ${active ? accent + '33' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 10, alignItems: 'flex-start',
      }}
    >
      <div style={{ fontSize: 9, fontWeight: 900, color: active ? accent : 'rgba(255,255,255,0.25)', paddingTop: 1, flexShrink: 0 }}>
        {String(lesson.number).padStart(2, '0')}
      </div>
      <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
        {lesson.title}
      </div>
    </button>
  );
}

// ─── LOCKED MODULE PLACEHOLDER ───────────────────────────────
function LockedModule({ mod }: { mod: Module }) {
  const colors = TIER_COLORS[mod.tier];
  const cfg    = TIER_CONFIG[mod.tier];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center', gap: 20 }}>
      <div style={{ fontSize: 40 }}>🔐</div>
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: colors.accent, marginBottom: 10 }}>
          {cfg.label} · {cfg.price}
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 10 }}>{mod.title}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 420, margin: '0 auto 24px' }}>
          {mod.description}
        </p>
        <a href="/prana-flow" style={{
          display: 'inline-flex', padding: '12px 32px', borderRadius: 100,
          background: colors.bg, border: `1px solid ${colors.border}`,
          color: colors.accent, fontSize: 11, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase',
          textDecoration: 'none', transition: 'all 0.2s',
        }}>
          Upgrade to {cfg.label} →
        </a>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function MantraAcademy() {
  const [activeModuleId, setActiveModuleId] = useState<string>(ACADEMY_CURRICULUM[0]?.id ?? '');
  const [activeLessonId, setActiveLessonId] = useState<string>(ACADEMY_CURRICULUM[0]?.lessons[0]?.id ?? '');
  const [sidebarOpen,   setSidebarOpen]    = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { tier } = useMembership();
  const { isAdmin } = useAdminRole();
  const rank = isAdmin ? 3 : getTierRank(tier);
  const userTier: 'free' | 'prana' | 'siddha' | 'akasha' =
    rank >= 3 ? 'akasha' : rank >= 2 ? 'siddha' : rank >= 1 ? 'prana' : 'free';

  const TIER_ORDER: Array<'free' | 'prana' | 'siddha' | 'akasha'> = ['free', 'prana', 'siddha', 'akasha'];
  const userTierIndex = TIER_ORDER.indexOf(userTier);
  const canAccess = (tier: 'free' | 'prana' | 'siddha' | 'akasha') => TIER_ORDER.indexOf(tier) <= userTierIndex;

  const activeModule = ACADEMY_CURRICULUM.find(m => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons.find(l => l.id === activeLessonId);
  const tierColors   = activeModule ? TIER_COLORS[activeModule.tier] : TIER_COLORS.free;

  const selectModule = (mod: Module) => {
    setActiveModuleId(mod.id);
    if (mod.lessons.length > 0) setActiveLessonId(mod.lessons[0].id);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectLesson = (lesson: Lesson) => {
    setActiveLessonId(lesson.id);
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextLesson = () => {
    if (!activeModule || !activeLesson) return;
    const idx = activeModule.lessons.findIndex(l => l.id === activeLessonId);
    if (idx < activeModule.lessons.length - 1) {
      selectLesson(activeModule.lessons[idx + 1]);
    } else {
      // Move to next module
      const modIdx = ACADEMY_CURRICULUM.findIndex(m => m.id === activeModuleId);
      if (modIdx < ACADEMY_CURRICULUM.length - 1) selectModule(ACADEMY_CURRICULUM[modIdx + 1]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050505', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: sidebarOpen ? 300 : 0,
        minWidth: sidebarOpen ? 300 : 0,
        transition: 'all 0.35s ease',
        overflow: 'hidden',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.01)',
      }}>
        {/* Sidebar header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <button onClick={() => navigate('/siddha-portal')} style={{ display:'block', background:'none', border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:9, fontWeight:800, letterSpacing:'0.35em', textTransform:'uppercase', color:'rgba(212,175,55,0.45)', padding:'0 0 12px 0' }}>← SIDDHA PORTAL</button>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: 4 }}>
            SQI · NADA ACADEMY
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
            Mantra Curriculum
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            {ACADEMY_CURRICULUM.length} Modules · 24 complete
          </div>
        </div>

        {/* Module list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {ACADEMY_CURRICULUM.map(mod => (
            <div key={mod.id}>
              <ModuleItem
                mod={mod}
                active={mod.id === activeModuleId}
                onSelect={() => selectModule(mod)}
              />
              {/* Lesson sub-list — visible when module active */}
              {mod.id === activeModuleId && (
                <div style={{ paddingLeft: 12, paddingBottom: 8 }}>
                  {mod.lessons.map(lesson => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      active={lesson.id === activeLessonId}
                      onSelect={() => selectLesson(lesson)}
                      accent={TIER_COLORS[mod.tier].accent}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Coming soon placeholders */}
          {[...Array(24 - ACADEMY_CURRICULUM.length)].map((_, i) => (
            <div key={i} style={{ padding: '12px 16px', opacity: 0.25 }}>
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:'rgba(255,255,255,0.2)', fontWeight:900 }}>
                  {String(ACADEMY_CURRICULUM.length + i + 1).padStart(2,'0')}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.2)', fontWeight:600 }}>Coming Soon</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(30px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
        }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'8px 10px', cursor:'pointer', color:'rgba(255,255,255,0.5)', fontSize:13 }}
          >
            {sidebarOpen ? '◂' : '▸'}
          </button>
          {activeModule && (
            <>
              <div style={{ height:20, width:1, background:'rgba(255,255,255,0.08)' }} />
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.4em', textTransform:'uppercase', color: tierColors.accent }}>
                {TIER_CONFIG[activeModule.tier].label}
              </div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', fontWeight:600 }}>
                Module {activeModule.number} · {activeModule.title}
              </div>
            </>
          )}
        </div>

        {/* Lesson content */}
        <div style={{ flex: 1, padding: 'clamp(24px, 5vw, 60px) clamp(20px, 8vw, 80px)' }}>
          {!activeModule ? (
            <div style={{ textAlign:'center', paddingTop:80, color:'rgba(255,255,255,0.3)' }}>Select a module to begin</div>
          ) : !canAccess(activeModule.tier) ? (
            <LockedModule mod={activeModule} />
          ) : activeLesson ? (
            <LessonReader lesson={activeLesson} tierAccent={tierColors.accent} />
          ) : (
            /* Module overview */
            <div>
              <div style={{ fontSize:9, fontWeight:800, letterSpacing:'0.5em', textTransform:'uppercase', color: tierColors.accent, marginBottom:16 }}>
                Module {activeModule.number} · {TIER_CONFIG[activeModule.tier].label}
              </div>
              <h1 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.05, marginBottom:16 }}>
                {activeModule.title}
              </h1>
              <p style={{ fontSize:15, color:'rgba(255,255,255,0.6)', lineHeight:1.75, maxWidth:680, marginBottom:40 }}>
                {activeModule.description}
              </p>
              <div style={{ display:'grid', gap:12 }}>
                {activeModule.lessons.map(lesson => (
                  <button key={lesson.id} onClick={() => selectLesson(lesson)} style={{
                    textAlign:'left', padding:'20px 24px', borderRadius:20,
                    background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.06)',
                    cursor:'pointer', transition:'all 0.25s', display:'flex', gap:20, alignItems:'center',
                  }}>
                    <div style={{ fontSize:11, fontWeight:900, color: tierColors.accent, flexShrink:0 }}>
                      {String(lesson.number).padStart(2,'0')}
                    </div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.01em', marginBottom:4 }}>{lesson.title}</div>
                      <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase' }}>
                        {lesson.subtitle} · {lesson.durationMin} min
                      </div>
                    </div>
                    <div style={{ marginLeft:'auto', fontSize:16, color:'rgba(255,255,255,0.2)' }}>→</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next lesson button */}
          {activeLesson && (
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:48, paddingTop:32, borderTop:'1px solid rgba(255,255,255,0.04)' }}>
              <button onClick={nextLesson} style={{
                padding:'14px 32px', borderRadius:100,
                background: tierColors.bg, border:`1px solid ${tierColors.border}`,
                color: tierColors.accent, fontSize:11, fontWeight:800, letterSpacing:'0.3em', textTransform:'uppercase',
                cursor:'pointer', transition:'all 0.2s',
              }}>
                NEXT LESSON →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
