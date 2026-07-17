import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { NADI_LEAF_LESSONS } from '@/data/nadiLeafData';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const GOLD = '#D4AF37';

const bodyStyle: React.CSSProperties = {
  fontSize: 20, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

const NadiLeafContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const moduleNum = parseInt(moduleKey.replace('m', ''), 10);
  const lessons = NADI_LEAF_LESSONS.filter((l) => l.module === moduleNum);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_nadi_leaf_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (lessons.length === 0) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  return (
    <div>
      {lessons.map((lesson, i) => {
        const sectionId = lesson.id;
        const isOpen = openIndex === i;
        const sectionState = sectionRows[sectionId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[sectionId] ?? 'idle';

        return (
          <div key={sectionId} style={{
            marginBottom: 10, borderRadius: 20, overflow: 'hidden',
            border: `1px solid ${isOpen ? 'rgba(212,175,55,0.35)' : isDone ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.012)',
          }}>
            <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? GOLD : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(212,175,55,0.22)' : isOpen ? 'rgba(212,175,55,0.14)' : 'transparent',
                  color: isDone || isOpen ? GOLD : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? GOLD : 'rgba(255,255,255,0.85)' }}>
                    {lesson.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{lesson.siddha} · {lesson.duration}</div>
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? GOLD : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                <p style={{ ...bodyStyle, marginBottom: 18 }}>{lesson.overview}</p>

                <div style={{ borderLeft: `2px solid ${GOLD}55`, paddingLeft: 16, marginBottom: 18 }}>
                  <p style={{ fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{lesson.quote}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>— {lesson.quoteSource}</p>
                </div>

                <p style={{ ...bodyStyle, marginBottom: 18 }}>{lesson.bodyText}</p>

                <div style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 18, padding: '16px 20px', marginBottom: 14, textAlign: 'center' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: GOLD, margin: '0 0 6px', whiteSpace: 'pre-line' }}>{lesson.mantra}</p>
                  <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', margin: 0 }}>{lesson.mantraMeaning}</p>
                </div>

                {lesson.practices.length > 0 && (
                  <div style={{ marginBottom: lesson.secrets && lesson.secrets.length > 0 ? 14 : 0 }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>Practices</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {lesson.practices.map((p, pi) => <li key={pi} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 8 }}>{p}</li>)}
                    </ul>
                  </div>
                )}

                {lesson.secrets && lesson.secrets.length > 0 && (
                  <div style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 18, padding: '16px 20px' }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 10 }}>Hidden Teaching</div>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {lesson.secrets.map((s, si) => <li key={si} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 8 }}>{s}</li>)}
                    </ul>
                  </div>
                )}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Notes</span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: GOLD, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Saved</span>}
                    {noteStatus === 'error' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#F87171' }}>Could not save</span>}
                  </div>
                  <textarea
                    value={noteValue}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNoteSaveStatus((m) => ({ ...m, [sectionId]: 'saving' }));
                      setSectionNotes(sectionId, v, (ok) => setNoteSaveStatus((m) => ({ ...m, [sectionId]: ok ? 'saved' : 'error' })));
                    }}
                    rows={3}
                    placeholder="Your reflections..."
                    style={{
                      width: '100%', resize: 'vertical', borderRadius: 14,
                      border: '1px solid rgba(255,255,255,.1)', background: 'rgba(5,5,5,.6)',
                      padding: '10px 12px', fontSize: 14.5, color: 'rgba(255,255,255,.85)',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 10 }}>
                  <button type="button" onClick={() => void toggleSectionComplete(sectionId)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isDone ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? GOLD : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === lessons.length - 1} onClick={() => setOpenIndex(Math.min(lessons.length - 1, i + 1))} style={{
                    background: i === lessons.length - 1 ? 'transparent' : 'rgba(212,175,55,0.14)',
                    border: `1px solid ${i === lessons.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.4)'}`,
                    color: i === lessons.length - 1 ? 'rgba(255,255,255,0.25)' : GOLD,
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                    cursor: i === lessons.length - 1 ? 'default' : 'pointer',
                  }}>
                    {i === lessons.length - 1 ? 'Last lesson' : 'Next lesson →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default NadiLeafContent;
