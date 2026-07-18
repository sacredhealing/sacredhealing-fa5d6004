import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { MONTHS } from '@/data/practitionerCertificationData';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const GOLD = '#D4AF37';
const CYAN = '#22D3EE';

const bodyStyle: React.CSSProperties = {
  fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.75)',
  fontFamily: "'Cormorant Garamond',serif", whiteSpace: 'pre-line',
};

const PractitionerCertContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const num = parseInt(moduleKey.replace('m', ''), 10);
  const mod = MONTHS.find((m) => m.n === num);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_practitioner_cert_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!mod) {
    return <p style={bodyStyle}>This month's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = [
    {
      sectionId: 'initiation', title: 'Personal Diksha — Initiation', render: () => (
        <p style={bodyStyle}>{mod.initiation}</p>
      ),
    },
    {
      sectionId: 'teaching', title: 'The Teaching', render: () => (
        <>
          {mod.teaching.split('\n\n').map((p, pi) => (
            <p key={pi} style={{ ...bodyStyle, marginBottom: 16 }}>{p}</p>
          ))}
        </>
      ),
    },
    {
      sectionId: 'weeks', title: 'Weekly Breakdown', render: () => (
        <>
          {mod.weeks.map((w, wi) => (
            <div key={wi} style={{ marginBottom: 16, paddingLeft: 14, borderLeft: `2px solid ${GOLD}55` }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>Week {wi + 1}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>{w.title}</div>
              <p style={{ ...bodyStyle, fontSize: 14 }}>{w.content}</p>
            </div>
          ))}
        </>
      ),
    },
    {
      sectionId: 'meditation', title: `Meditation — ${mod.meditation.name}`, render: () => (
        <>
          <p style={{ fontSize: 11, fontWeight: 700, color: CYAN, letterSpacing: '.1em', marginBottom: 14 }}>{mod.meditation.duration}</p>
          {mod.meditation.steps.map((s, si) => (
            <div key={si} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'flex-start' }}>
              <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: CYAN, marginTop: 1 }}>{si + 1}</div>
              <p style={{ ...bodyStyle, fontSize: 14.5, margin: 0 }}>{s}</p>
            </div>
          ))}
        </>
      ),
    },
    {
      sectionId: 'mantra', title: `Mantra — ${mod.mantra.text}`, render: () => (
        <>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: GOLD, margin: '0 0 8px' }}>{mod.mantra.text}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>{mod.mantra.pronunciation}</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>Meaning</div>
            <p style={bodyStyle}>{mod.mantra.meaning}</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>Practice</div>
            <p style={bodyStyle}>{mod.mantra.practice}</p>
          </div>
          <div>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>Benefits</div>
            <p style={bodyStyle}>{mod.mantra.benefits}</p>
          </div>
        </>
      ),
    },
    {
      sectionId: 'exercises', title: 'Exercises', render: () => (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {mod.exercises.map((e, ei) => <li key={ei} style={{ ...bodyStyle, fontSize: 14.5, marginBottom: 10 }}>{e}</li>)}
        </ul>
      ),
    },
    {
      sectionId: 'reflections', title: 'Reflections', render: () => (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {mod.reflections.map((r, ri) => <li key={ri} style={{ ...bodyStyle, fontSize: 14.5, marginBottom: 10, fontStyle: 'italic' }}>{r}</li>)}
        </ul>
      ),
    },
    {
      sectionId: 'outcome', title: 'Outcome', render: () => (
        <p style={{ ...bodyStyle, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{mod.outcome}</p>
      ),
    },
  ];

  return (
    <div>
      {cards.map((c, i) => {
        const isOpen = openIndex === i;
        const sectionState = sectionRows[c.sectionId];
        const isDone = sectionState?.completed ?? false;
        const noteValue = sectionState?.notes ?? '';
        const noteStatus = noteSaveStatus[c.sectionId] ?? 'idle';
        return (
          <div key={c.sectionId} style={{
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
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? GOLD : 'rgba(255,255,255,0.85)' }}>
                  {c.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? GOLD : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {c.render()}

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
                      setNoteSaveStatus((m) => ({ ...m, [c.sectionId]: 'saving' }));
                      setSectionNotes(c.sectionId, v, (ok) => setNoteSaveStatus((m) => ({ ...m, [c.sectionId]: ok ? 'saved' : 'error' })));
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
                  <button type="button" onClick={() => void toggleSectionComplete(c.sectionId)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: isDone ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? GOLD : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === cards.length - 1} onClick={() => setOpenIndex(Math.min(cards.length - 1, i + 1))} style={{
                    background: i === cards.length - 1 ? 'transparent' : 'rgba(212,175,55,0.14)',
                    border: `1px solid ${i === cards.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(212,175,55,0.4)'}`,
                    color: i === cards.length - 1 ? 'rgba(255,255,255,0.25)' : GOLD,
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 700,
                    cursor: i === cards.length - 1 ? 'default' : 'pointer',
                  }}>
                    {i === cards.length - 1 ? 'Last section' : 'Next section →'}
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

export default PractitionerCertContent;
