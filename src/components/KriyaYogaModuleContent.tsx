import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { KRIYA_MODULES } from '@/data/kriyaYogaModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const GOLD = '#D4AF37';
const VIOLET = '#A78BFA';

function renderBody(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ color: 'rgba(255,255,255,0.98)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

const KriyaYogaModuleContent: React.FC<{ moduleKey: string; moduleId: string }> = ({ moduleKey, moduleId }) => {
  const kModule = KRIYA_MODULES.find((m) => m.id === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(moduleId, 'user_kriya_yoga_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!kModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  return (
    <div>
      {kModule.sections.map((section, i) => {
        const sectionId = `s${i}`;
        const isOpen = openIndex === i;
        const sectionState = sectionRows[sectionId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[sectionId] ?? 'idle';

        return (
          <div
            key={sectionId}
            style={{
              marginBottom: 10, borderRadius: 20, overflow: 'hidden',
              border: `1px solid ${isOpen ? 'rgba(212,175,55,0.35)' : isDone ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.06)'}`,
              background: isOpen ? 'rgba(212,175,55,0.04)' : 'rgba(255,255,255,0.012)',
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
                  border: `1.5px solid ${isDone || isOpen ? GOLD : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(212,175,55,0.22)' : isOpen ? 'rgba(212,175,55,0.14)' : 'transparent',
                  color: isDone || isOpen ? GOLD : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{
                  fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700,
                  color: isOpen ? GOLD : 'rgba(255,255,255,0.85)',
                }}>
                  {section.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? GOLD : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                <p style={{ ...bodyStyle, marginBottom: 22 }}>{renderBody(section.content)}</p>

                {section.techniques?.map((t, ti) => (
                  <div key={ti} style={{ background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.18)', borderRadius: 18, padding: '18px 20px', marginBottom: 14 }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
                      Technique
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.92)', marginBottom: 2 }}>{t.name}</div>
                    {t.sanskrit && <div style={{ fontSize: 12, fontStyle: 'italic', color: 'rgba(212,175,55,0.7)', marginBottom: 10 }}>{t.sanskrit}</div>}
                    <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", margin: '0 0 10px' }}>{t.description}</p>
                    {t.steps && t.steps.length > 0 && (
                      <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>
                        {t.steps.map((s, si) => (
                          <li key={si} style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 6 }}>{s}</li>
                        ))}
                      </ol>
                    )}
                    {t.benefit && (
                      <p style={{ fontSize: 13, color: 'rgba(212,175,55,0.6)', margin: 0 }}><strong>Benefit:</strong> {t.benefit}</p>
                    )}
                  </div>
                ))}

                {section.mantras?.map((mt, mi) => (
                  <div key={mi} style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 18, padding: '18px 20px', marginBottom: 14, textAlign: 'center' }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: VIOLET, marginBottom: 10 }}>
                      Mantra
                    </div>
                    <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 600, color: 'rgba(255,255,255,0.92)', margin: '0 0 8px' }}>{mt.text}</p>
                    {mt.translation && <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 15, color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>"{mt.translation}"</p>}
                    <p style={{ fontSize: 11, color: 'rgba(167,139,250,0.7)', margin: 0 }}>{mt.purpose}</p>
                  </div>
                ))}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                      Notes for this section
                    </span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && (
                      <span style={{ fontSize: 9, textTransform: 'uppercase', color: GOLD, display: 'flex', alignItems: 'center', gap: 4 }}>
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
                    placeholder="Your reflections on this section..."
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
                      background: isDone ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isDone ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)'}`,
                      color: isDone ? GOLD : 'rgba(255,255,255,0.6)',
                      padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                      letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                    }}
                  >
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button
                    type="button"
                    disabled={i === kModule.sections.length - 1}
                    onClick={() => setOpenIndex(Math.min(kModule.sections.length - 1, i + 1))}
                    style={{
                      background: i === kModule.sections.length - 1 ? 'transparent' : 'rgba(212,175,55,0.14)',
                      border: `1px solid ${i === kModule.sections.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.4)'}`,
                      color: i === kModule.sections.length - 1 ? 'rgba(255,255,255,0.25)' : GOLD,
                      padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                      cursor: i === kModule.sections.length - 1 ? 'default' : 'pointer',
                    }}
                  >
                    {i === kModule.sections.length - 1 ? 'Last section' : 'Next section →'}
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

export default KriyaYogaModuleContent;
