import React from 'react';
import { CheckCircle, ChevronDown } from 'lucide-react';
import { NARASIMHA_SEALS, NARASIMHA_ADVANCED_MODULES, NARASIMHA_SECRET_MANTRAS } from '@/data/narasimhaModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const AMBER = '#FF6B35';

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

const NarasimhaContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const seal = NARASIMHA_SEALS.find((s) => `seal${s.id}` === moduleKey);
  const advModule = NARASIMHA_ADVANCED_MODULES.find((a) => `adv${a.id}` === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_narasimha_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!seal && !advModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = [];

  if (seal) {
    cards.push({ sectionId: 'teaching', title: 'The Teaching', render: () => (
      <>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16, flexWrap: 'wrap' }}>
          <span>{seal.sanskrit}</span><span>{seal.chakra}</span><span>⏱ {seal.duration}</span>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14, fontStyle: 'italic' }}>{seal.montrose}</p>
        <p style={bodyStyle}>{seal.description}</p>
      </>
    ) });
    cards.push({ sectionId: 'practices', title: 'Practices', render: () => (
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        {seal.practices.map((p, i) => <li key={i} style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: "'Cormorant Garamond',serif", marginBottom: 8 }}>{p}</li>)}
      </ol>
    ) });
    cards.push({ sectionId: 'guided-practice', title: 'Guided Practice — Step by Step', render: () => (
      <p style={bodyStyle}>{seal.guidedPractice}</p>
    ) });
    cards.push({ sectionId: 'mantra', title: 'Mantra & Affirmation', render: () => (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: seal.color, margin: '0 0 14px' }}>{seal.mantra}</p>
        <p style={{ fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>"{seal.affirmation}"</p>
      </div>
    ) });
  }

  if (advModule) {
    cards.push({ sectionId: 'teaching', title: advModule.subtitle, render: () => (
      <>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>⏱ {advModule.duration}</div>
        <p style={{ ...bodyStyle, marginBottom: 18 }}>{advModule.description}</p>
        <div style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.18)', borderRadius: 18, padding: '18px 20px' }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.3em', textTransform: 'uppercase', color: AMBER, marginBottom: 10 }}>Technique</div>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{advModule.technique}</p>
        </div>
      </>
    ) });
    cards.push({ sectionId: 'secret-mantra', title: 'Secret Mantra', render: () => (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: AMBER, margin: 0 }}>{advModule.secretMantra}</p>
      </div>
    ) });
    if (advModule.id === 'IV') {
      NARASIMHA_SECRET_MANTRAS.forEach((mt, i) => {
        cards.push({ sectionId: `codex-${i}`, title: mt.name, render: () => (
          <>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, color: AMBER, marginBottom: 10, textAlign: 'center' }}>{mt.mantra}</p>
            <p style={{ ...bodyStyle, fontSize: 16, marginBottom: 12 }}>{mt.components}</p>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontFamily: "'Cormorant Garamond',serif" }}>{mt.usage}</p>
          </>
        ) });
      });
    }
  }

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
            border: `1px solid ${isOpen ? 'rgba(255,107,53,0.35)' : isDone ? 'rgba(255,107,53,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(255,107,53,0.04)' : 'rgba(255,255,255,0.012)',
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
                  background: isDone ? 'rgba(255,107,53,0.22)' : isOpen ? 'rgba(255,107,53,0.14)' : 'transparent',
                  color: isDone || isOpen ? AMBER : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? AMBER : 'rgba(255,255,255,0.85)' }}>
                  {c.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? AMBER : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {c.render()}

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
                    background: isDone ? 'rgba(255,107,53,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(255,107,53,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? AMBER : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === cards.length - 1} onClick={() => setOpenIndex(Math.min(cards.length - 1, i + 1))} style={{
                    background: i === cards.length - 1 ? 'transparent' : 'rgba(255,107,53,0.14)',
                    border: `1px solid ${i === cards.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,107,53,0.4)'}`,
                    color: i === cards.length - 1 ? 'rgba(255,255,255,0.25)' : AMBER,
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

export default NarasimhaContent;
