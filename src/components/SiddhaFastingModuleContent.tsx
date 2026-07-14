import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { SIDDHA_FASTING_CURRICULUM } from '@/data/siddhaFastingModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const TEAL = '#34D399';

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', marginBottom: 20,
};

const SiddhaFastingModuleContent: React.FC<{ tierNum: number; moduleKey: string; moduleId: string }> = ({ tierNum, moduleKey, moduleId }) => {
  const tierSection = SIDDHA_FASTING_CURRICULUM.find((t) => t.tier === tierNum);
  const sfModule = tierSection?.modules.find((m) => m.num === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(moduleId, 'user_siddha_fasting_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!sfModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  return (
    <div>
      {sfModule.lessons.map((lesson, i) => {
        const sectionId = `lesson-${i}`;
        const isOpen = openIndex === i;
        const sectionState = sectionRows[sectionId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[sectionId] ?? 'idle';
        const paragraphs = lesson.content.split(/\n\n+/).filter(Boolean);

        return (
          <div
            key={sectionId}
            style={{
              marginBottom: 10, borderRadius: 20, overflow: 'hidden',
              border: `1px solid ${isOpen ? 'rgba(52,211,153,0.35)' : isDone ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)'}`,
              background: isOpen ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.012)',
            }}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? TEAL : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(52,211,153,0.22)' : isOpen ? 'rgba(52,211,153,0.14)' : 'transparent',
                  color: isDone || isOpen ? TEAL : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700, color: isOpen ? TEAL : 'rgba(255,255,255,0.85)' }}>
                  {lesson.title}
                </span>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? TEAL : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {paragraphs.map((p, pi) => (
                  <p key={pi} style={bodyStyle}>{p}</p>
                ))}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                      Notes for this lesson
                    </span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && (
                      <span style={{ fontSize: 9, textTransform: 'uppercase', color: TEAL, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={10} /> Saved
                      </span>
                    )}
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
                    placeholder="Your reflections on this lesson..."
                    style={{
                      width: '100%', resize: 'vertical', borderRadius: 14,
                      border: '1px solid rgba(255,255,255,.1)', background: 'rgba(5,5,5,.6)',
                      padding: '10px 12px', fontSize: 14.5, color: 'rgba(255,255,255,.85)',
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => void toggleSectionComplete(sectionId)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: isDone ? 'rgba(52,211,153,0.14)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isDone ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.12)'}`,
                      color: isDone ? TEAL : 'rgba(255,255,255,0.6)',
                      padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                      letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button
                    type="button"
                    disabled={i === sfModule.lessons.length - 1}
                    onClick={() => setOpenIndex(Math.min(sfModule.lessons.length - 1, i + 1))}
                    style={{
                      background: i === sfModule.lessons.length - 1 ? 'transparent' : 'rgba(52,211,153,0.14)',
                      border: `1px solid ${i === sfModule.lessons.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(52,211,153,0.4)'}`,
                      color: i === sfModule.lessons.length - 1 ? 'rgba(255,255,255,0.25)' : TEAL,
                      padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                      cursor: i === sfModule.lessons.length - 1 ? 'default' : 'pointer',
                    }}
                  >
                    {i === sfModule.lessons.length - 1 ? 'Last lesson' : 'Next lesson →'}
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

export default SiddhaFastingModuleContent;
