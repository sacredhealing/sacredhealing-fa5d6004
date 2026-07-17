import React from 'react';
import { CheckCircle, ChevronDown, Flame, Star, Zap, Wind, Waves, Eye } from 'lucide-react';
import { SHIVA_MODULES, SHIVA_NATH_VAULT_MANTRAS } from '@/data/alchemicalShivaModuleContent';
import { useSectionProgress } from '@/hooks/useSectionProgress';

const RED = '#FF6B6B';

const ICONS: Record<string, React.ReactNode> = {
  Flame: <Flame size={16} />, Star: <Star size={16} />, Zap: <Zap size={16} />,
  Wind: <Wind size={16} />, Waves: <Waves size={16} />, Eye: <Eye size={16} />,
};

const bodyStyle: React.CSSProperties = {
  fontSize: 21, lineHeight: 1.8, color: 'rgba(255,250,240,0.86)',
  fontFamily: "'Cormorant Garamond',serif", maxWidth: '68ch', whiteSpace: 'pre-line',
};

const AlchemicalShivaContent: React.FC<{ moduleKey: string; dbModuleId: string }> = ({ moduleKey, dbModuleId }) => {
  const sModule = SHIVA_MODULES.find((m) => `m${m.id}` === moduleKey);
  const [openIndex, setOpenIndex] = React.useState(0);
  const { rows: sectionRows, toggleSectionComplete, setSectionNotes } = useSectionProgress(dbModuleId, 'user_alchemical_shiva_section_progress');
  const [noteSaveStatus, setNoteSaveStatus] = React.useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});

  if (!sModule) {
    return <p style={bodyStyle}>This module's content is being prepared.</p>;
  }

  type Card = { sectionId: string; title: string; render: () => React.ReactNode };
  const cards: Card[] = [
    { sectionId: 'technique', title: sModule.technique, render: () => (
      <>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>
          <span>{ICONS[sModule.iconName]} {sModule.element}</span><span>⏱ {sModule.duration}</span>
        </div>
        <p style={{ ...bodyStyle, marginBottom: 18 }}>{sModule.techniqueDetail}</p>
        <div style={{ background: `${sModule.color}0D`, border: `1px solid ${sModule.color}30`, borderRadius: 18, padding: '18px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 600, color: sModule.color, margin: '0 0 6px' }}>{sModule.mantra}</p>
          {sModule.mantraTransliteration && <p style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', margin: '0 0 10px' }}>{sModule.mantraTransliteration}</p>}
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: "'Cormorant Garamond',serif", margin: 0 }}>{sModule.instruction}</p>
        </div>
      </>
    ) },
  ];

  if (sModule.nyasa && sModule.nyasa.length > 0) {
    cards.push({
      sectionId: 'nyasa', title: 'Panchakshara Nyasa Map', render: () => (
        <div>
          {sModule.nyasa!.map((n, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '10px 0', borderBottom: i < sModule.nyasa!.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 700, color: sModule.color, width: 40 }}>{n.syllable}</span>
              <div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{n.location} · {n.element}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{n.meaning}</div>
              </div>
            </div>
          ))}
        </div>
      ),
    });
  }

  if (sModule.isBonus) {
    SHIVA_NATH_VAULT_MANTRAS.forEach((mt, i) => {
      cards.push({
        sectionId: `vault-${i}`, title: mt.name, render: () => (
          <>
            <div style={{ background: `${mt.color}0D`, border: `1px solid ${mt.color}30`, borderRadius: 18, padding: '18px 20px', textAlign: 'center', marginBottom: 14 }}>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 600, color: mt.color, margin: 0, whiteSpace: 'pre-line' }}>{mt.mantra}</p>
            </div>
            <p style={{ ...bodyStyle, marginBottom: 14 }}>{mt.effect}</p>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', fontFamily: "'Cormorant Garamond',serif" }}>{mt.instruction}</p>
          </>
        ),
      });
    });
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
            border: `1px solid ${isOpen ? 'rgba(255,107,107,0.35)' : isDone ? 'rgba(255,107,107,0.2)' : 'rgba(255,255,255,0.06)'}`,
            background: isOpen ? 'rgba(255,107,107,0.04)' : 'rgba(255,255,255,0.012)',
          }}>
            <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              textAlign: 'left', padding: '16px 20px', cursor: 'pointer', background: 'none', border: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <span style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
                  border: `1.5px solid ${isDone || isOpen ? RED : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? 'rgba(255,107,107,0.22)' : isOpen ? 'rgba(255,107,107,0.14)' : 'transparent',
                  color: isDone || isOpen ? RED : 'rgba(255,255,255,0.4)',
                }}>
                  {isDone ? <CheckCircle size={13} /> : i + 1}
                </span>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.05rem', fontWeight: 700, color: isOpen ? RED : 'rgba(255,255,255,0.85)' }}>
                  {c.title}
                </div>
              </div>
              <ChevronDown size={16} style={{ flexShrink: 0, color: isOpen ? RED : 'rgba(255,255,255,0.3)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {isOpen && (
              <div style={{ padding: '0 20px 24px' }}>
                {c.render()}

                <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Notes</span>
                    {noteStatus === 'saving' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Saving…</span>}
                    {noteStatus === 'saved' && <span style={{ fontSize: 9, textTransform: 'uppercase', color: RED, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={10} /> Saved</span>}
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
                    background: isDone ? 'rgba(255,107,107,0.14)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDone ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: isDone ? RED : 'rgba(255,255,255,0.6)',
                    padding: '9px 16px', borderRadius: 999, fontSize: 10.5, fontWeight: 800,
                    letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer',
                  }}>
                    <CheckCircle size={13} /> {isDone ? 'Completed' : 'Mark Complete'}
                  </button>
                  <button type="button" disabled={i === cards.length - 1} onClick={() => setOpenIndex(Math.min(cards.length - 1, i + 1))} style={{
                    background: i === cards.length - 1 ? 'transparent' : 'rgba(255,107,107,0.14)',
                    border: `1px solid ${i === cards.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,107,107,0.4)'}`,
                    color: i === cards.length - 1 ? 'rgba(255,255,255,0.25)' : RED,
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

export default AlchemicalShivaContent;
