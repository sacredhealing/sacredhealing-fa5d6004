import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { VASTU_MODULES } from '@/data/vastuModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const AMBER = '#D97706';

const bodyStyle: React.CSSProperties = {
  fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)',
  fontFamily: "'Cormorant Garamond',serif", whiteSpace: 'pre-line',
};

const VastuContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const vModule = VASTU_MODULES.find((m) => m.id === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_vastu_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!vModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  return (
    <div>
      {vModule.lessons.map((lesson, i) => {
        const sectionId = lesson.id;
        const isOpen = openIndex === i;
        const sectionState = sectionRows[sectionId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[sectionId] ?? 'idle';

        return (
          <div key={sectionId} style={{
            marginBottom: 10, borderRadius: 20, overflow: 'hidden',
            border: `1px solid ${isOpen ? 'rgba(217,119,6,0.35)' : isDone ? 'rgba(217,119,6,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(217,119,6,0.04)' : 'rgba(255,255,255,0.012)',
          }}>
            <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? AMBER : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(217,119,6,0.22)' : isOpen ? 'rgba(217,119,6,0.14)' : 'transparent',
                  color: isDone || isOpen ? AMBER : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : (lesson.glyph || i + 1)}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? AMBER : 'rgba(255,255,255,0.85)' }}>
                    {lesson.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{lesson.duration}</div>
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? AMBER : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                <p style={{ ...bodyStyle, fontStyle: 'italic', marginBottom: 18 }}>{lesson.overview}</p>

                {lesson.sections.map((s, si) => (
                  <div key={si} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: AMBER, marginBottom: 6 }}>{s.heading}</div>
                    <p style={bodyStyle}>{s.body}</p>
                  </div>
                ))}

                <div style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 18, padding: '16px 20px', marginBottom: 14 }}>
                  <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: AMBER, marginBottom: 10 }}>Practice</div>
                  <p style={{ ...bodyStyle, margin: 0 }}>{lesson.practice}</p>
                </div>

                {lesson.mantra && (
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: AMBER, margin: 0 }}>{lesson.mantra}</p>
                  </div>
                )}

                {lesson.secret && (
                  <div style={{ borderLeft: `2px solid ${AMBER}55`, paddingLeft: 16, marginBottom: 14 }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Siddha Secret</div>
                    <p style={{ ...bodyStyle, fontStyle: 'italic', margin: 0 }}>{lesson.secret}</p>
                  </div>
                )}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Notes</span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: AMBER, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Saved</span>}
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
                    background: isDone ? 'rgba(217,119,6,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(217,119,6,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? AMBER : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === vModule.lessons.length - 1} onClick={() => setOpenIndex(Math.min(vModule.lessons.length - 1, i + 1))} style={{
                    background: i === vModule.lessons.length - 1 ? 'transparent' : 'rgba(217,119,6,0.14)',
                    border: `1px solid ${i === vModule.lessons.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(217,119,6,0.4)'}`,
                    color: i === vModule.lessons.length - 1 ? 'rgba(255,255,255,0.25)' : AMBER,
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                    cursor: i === vModule.lessons.length - 1 ? 'default' : 'pointer',
                  }}>
                    {i === vModule.lessons.length - 1 ? 'Last lesson' : 'Next lesson →'}
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

export default VastuContent;
