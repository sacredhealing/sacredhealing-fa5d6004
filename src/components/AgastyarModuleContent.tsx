// src/components/AgastyarModuleContent.tsx
// ⟡ Rich In-App Content Renderer — No videos needed ⟡
// Renders all ContentSection types with full SQI glassmorphism

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ContentSection, ModuleContent } from '@/data/moduleContent';
import { CheckCircle, XCircle, BookOpen, Leaf, Zap, AlertTriangle, Star, ChevronDown } from 'lucide-react';

// ─── MARKDOWN-STYLE BOLD/ITALIC RENDERER ──────────────────────
const RichText: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => {
  // Convert **bold** and *italic* to JSX
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <span style={style}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: '#D4AF37', fontWeight: 800 }}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <strong key={i} style={{ color: 'rgba(255,255,255,0.98)', fontWeight: 700 }}>{part.slice(1, -1)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

// ─── SECTION TYPE: TEACHING ───────────────────────────────────
const TeachingSection: React.FC<{ section: ContentSection }> = ({ section }) => (
  <div style={{
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '28px',
    marginBottom: '20px',
  }}>
    {section.title && (
      <h3 style={{
        fontSize: '15px', fontWeight: 900, color: 'rgba(52,211,153,0.92)',
        marginBottom: '16px', letterSpacing: '-0.02em',
        borderBottom: '1px solid rgba(212,175,55,0.15)',
        paddingBottom: '12px',
      }}>
        {section.title}
      </h3>
    )}
    {section.body && (
      <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.8, marginBottom: section.items ? '16px' : 0, fontFamily: "'Cormorant Garamond',serif" }}>
        {section.body.split('\n\n').map((para, i) => (
          <p key={i} style={{ marginBottom: '12px' }}>
            <RichText text={para} />
          </p>
        ))}
      </div>
    )}
    {section.items && (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {section.items.map((item, i) => (
          <li key={i} style={{
            padding: '10px 0',
            borderBottom: i < (section.items?.length ?? 0) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            fontSize: '22px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.8, fontFamily: "'Cormorant Garamond',serif",
            display: 'flex', gap: '10px', alignItems: 'flex-start',
          }}>
            <span style={{ color: '#D4AF37', flexShrink: 0, marginTop: '3px' }}>⟡</span>
            <RichText text={item} />
          </li>
        ))}
      </ul>
    )}
  </div>
);

// ─── SECTION TYPE: DOSHA CHART ────────────────────────────────
const DoshaChart: React.FC<{ section: ContentSection }> = ({ section }) => {
  const { t } = useTranslation();
  return (
  <div style={{
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    overflow: 'hidden',
    marginBottom: '20px',
  }}>
    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(52,211,153,0.92)', margin: 0 }}>{section.title}</h3>
    </div>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{t('academy.moduleContent.doshaColTrait')}</th>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#60A5FA', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{t('academy.moduleContent.doshaColVata')}</th>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#F87171', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{t('academy.moduleContent.doshaColPitta')}</th>
            <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#4ADE80', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{t('academy.moduleContent.doshaColKapha')}</th>
          </tr>
        </thead>
        <tbody>
          {section.rows?.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              <td style={{ padding: '12px 20px', fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: "'Cormorant Garamond',serif" }}>{row.label}</td>
              <td style={{ padding: '12px 20px', fontSize: '17px', color: 'rgba(96,165,250,0.9)', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: "'Cormorant Garamond',serif" }}>{row.vata}</td>
              <td style={{ padding: '12px 20px', fontSize: '17px', color: 'rgba(248,113,113,0.9)', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: "'Cormorant Garamond',serif" }}>{row.pitta}</td>
              <td style={{ padding: '12px 20px', fontSize: '17px', color: 'rgba(74,222,128,0.9)', borderBottom: '1px solid rgba(255,255,255,0.03)', fontFamily: "'Cormorant Garamond',serif" }}>{row.kapha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};

// ─── SECTION TYPE: TABLE ──────────────────────────────────────
const TableSection: React.FC<{ section: ContentSection }> = ({ section }) => (
  <div style={{
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    overflow: 'hidden',
    marginBottom: '20px',
  }}>
    {section.title && (
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(52,211,153,0.92)', margin: 0 }}>{section.title}</h3>
      </div>
    )}
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {section.tableData?.headers.map((h, i) => (
              <th key={i} style={{
                padding: '12px 16px', textAlign: 'left',
                fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em',
                color: i === 0 ? 'rgba(255,255,255,0.4)' : '#D4AF37',
                textTransform: 'uppercase',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.tableData?.rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
              {row.map((cell, j) => (
                <td key={j} style={{
                  padding: '11px 16px',
                  fontSize: '17px',
                  color: j === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.78)',
                  fontWeight: j === 0 ? 700 : 400,
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  lineHeight: 1.6,
                  fontFamily: "'Cormorant Garamond',serif",
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── SECTION TYPE: PRACTICE / RITUAL ─────────────────────────
const PracticeSection: React.FC<{ section: ContentSection }> = ({ section }) => {
  const { t } = useTranslation();
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    const next = new Set(completed);
    next.has(i) ? next.delete(i) : next.add(i);
    setCompleted(next);
  };

  return (
    <div style={{
      background: 'rgba(212,175,55,0.03)',
      backdropFilter: 'blur(40px)',
      border: '1px solid rgba(212,175,55,0.12)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Zap size={15} color="#D4AF37" />
        </div>
        <div>
          <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#D4AF37', textTransform: 'uppercase' }}>
            {t('academy.moduleContent.livingPractice')}
          </div>
          {section.title && <div style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(52,211,153,0.92)' }}>{section.title}</div>}
        </div>
      </div>

      {section.body && (
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.78)', marginBottom: '16px', lineHeight: 1.75, fontFamily: "'Cormorant Garamond',serif" }}>
          {section.body}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {section.ritual?.map((step, i) => (
          <div
            key={i}
            onClick={() => toggle(i)}
            style={{
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              background: completed.has(i) ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${completed.has(i) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)'}`,
              borderRadius: '14px', padding: '14px 16px',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }}
          >
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
              background: completed.has(i) ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${completed.has(i) ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {completed.has(i) && <CheckCircle size={13} color="#D4AF37" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em',
                color: '#D4AF37', textTransform: 'uppercase', marginBottom: '5px',
              }}>
                {step.step}
              </div>
              <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, fontFamily: "'Cormorant Garamond',serif" }}>
                {step.instruction}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SECTION TYPE: MANTRA ─────────────────────────────────────
const MantraSection: React.FC<{ section: ContentSection }> = ({ section }) => (
  <div style={{
    background: 'rgba(167,139,250,0.04)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(167,139,250,0.15)',
    borderRadius: '20px',
    padding: '32px',
    marginBottom: '20px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at center, rgba(167,139,250,0.05) 0%, transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      {section.title && (
        <div style={{
          fontSize: '8px', fontWeight: 800, letterSpacing: '0.5em',
          textTransform: 'uppercase', color: '#A78BFA', marginBottom: '20px',
        }}>
          {section.title}
        </div>
      )}
      {section.mantraText && (
        <div style={{
          fontSize: 'clamp(16px, 3vw, 22px)',
          fontWeight: 900, letterSpacing: '0.05em',
          color: '#fff', lineHeight: 1.8,
          marginBottom: '20px',
          textShadow: '0 0 30px rgba(167,139,250,0.4)',
          whiteSpace: 'pre-line',
        }}>
          {section.mantraText}
        </div>
      )}
      {section.mantraMeaning && (
        <div style={{
          fontSize: '17px', color: 'rgba(255,255,255,0.75)',
          lineHeight: 1.8, fontFamily: "'Cormorant Garamond',serif",
          borderTop: '1px solid rgba(167,139,250,0.15)',
          paddingTop: '16px', marginTop: '4px',
        }}>
          {section.mantraMeaning}
        </div>
      )}
    </div>
  </div>
);

// ─── SECTION TYPE: HERB ───────────────────────────────────────
const HerbSection: React.FC<{ section: ContentSection }> = ({ section }) => {
  const { t } = useTranslation();
  return (
  <div style={{
    background: 'rgba(74,222,128,0.03)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(74,222,128,0.12)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <Leaf size={16} color="#4ADE80" />
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#4ADE80', textTransform: 'uppercase' }}>
        {t('academy.moduleContent.herbMonograph')}
      </div>
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'rgba(52,211,153,0.92)', marginBottom: '16px' }}>
      {section.herbName}
    </h3>
    {section.herbProps && (
      <div style={{ display: 'grid', gap: '8px' }}>
        {Object.entries(section.herbProps).map(([key, val]) => (
          <div key={key} style={{
            display: 'flex', gap: '12px',
            padding: '10px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              fontSize: '8px', fontWeight: 800, letterSpacing: '0.3em',
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
              width: '100px', flexShrink: 0, paddingTop: '2px',
            }}>
              {key}
            </div>
            <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontFamily: "'Cormorant Garamond',serif" }}>
              {val}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  );
};

// ─── SECTION TYPE: QUIZ ───────────────────────────────────────
const QuizSection: React.FC<{ section: ContentSection; index: number }> = ({ section, index }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const handleSelect = (i: number) => {
    if (revealed) return;
    setSelected(i);
  };

  const handleReveal = () => {
    if (selected !== null) setRevealed(true);
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      backdropFilter: 'blur(40px)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '20px',
      padding: '24px',
      marginBottom: '20px',
    }}>
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#D4AF37', textTransform: 'uppercase', marginBottom: '12px' }}>
        {t('academy.moduleContent.knowledgeCheck', { n: index + 1 })}
      </div>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(52,211,153,0.92)', marginBottom: '16px', lineHeight: 1.5 }}>
        {section.quizQuestion}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {section.quizOptions?.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === section.quizAnswer;
          let bg = 'rgba(255,255,255,0.03)';
          let border = 'rgba(255,255,255,0.06)';
          let textColor = 'rgba(255,255,255,0.6)';

          if (revealed && isCorrect) { bg = 'rgba(74,222,128,0.08)'; border = 'rgba(74,222,128,0.3)'; textColor = '#4ADE80'; }
          else if (revealed && isSelected && !isCorrect) { bg = 'rgba(248,113,113,0.08)'; border = 'rgba(248,113,113,0.3)'; textColor = '#F87171'; }
          else if (!revealed && isSelected) { bg = 'rgba(212,175,55,0.08)'; border = 'rgba(212,175,55,0.3)'; textColor = '#D4AF37'; }

          return (
            <div
              key={i}
              onClick={() => handleSelect(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: bg, border: `1px solid ${border}`,
                borderRadius: '12px', padding: '12px 16px',
                cursor: revealed ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: revealed && isCorrect ? 'rgba(74,222,128,0.2)'
                  : revealed && isSelected ? 'rgba(248,113,113,0.2)'
                  : isSelected ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${revealed && isCorrect ? 'rgba(74,222,128,0.4)'
                  : revealed && isSelected ? 'rgba(248,113,113,0.4)'
                  : isSelected ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {revealed && isCorrect && <CheckCircle size={13} color="#4ADE80" />}
                {revealed && isSelected && !isCorrect && <XCircle size={13} color="#F87171" />}
                {!revealed && isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF37' }} />}
              </div>
              <span style={{ fontSize: '18px', color: textColor, fontWeight: isSelected ? 700 : 500, fontFamily: "'Cormorant Garamond',serif" }}>
                {opt}
              </span>
            </div>
          );
        })}
      </div>
      {!revealed ? (
        <button
          type="button"
          onClick={handleReveal}
          disabled={selected === null}
          style={{
            background: selected !== null ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${selected !== null ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '12px', padding: '10px 20px',
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: selected !== null ? '#D4AF37' : 'rgba(255,255,255,0.2)',
            cursor: selected !== null ? 'pointer' : 'default',
          }}
        >
          {t('academy.moduleContent.revealAnswer')}
        </button>
      ) : (
        <div style={{
          fontSize: '18px', fontFamily: "'Cormorant Garamond',serif", color: selected === section.quizAnswer ? '#4ADE80' : '#F87171',
          fontWeight: 700,
        }}>
          {selected === section.quizAnswer ? t('academy.moduleContent.quizCorrect') : t('academy.moduleContent.quizIncorrect')}
        </div>
      )}
    </div>
  );
};

// ─── SECTION TYPE: SECRET ─────────────────────────────────────
const SecretSection: React.FC<{ section: ContentSection }> = ({ section }) => {
  const { t } = useTranslation();
  return (
  <div style={{
    background: 'rgba(212,175,55,0.04)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', top: '-20px', right: '-20px',
      width: '100px', height: '100px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(212,175,55,0.1), transparent 70%)',
      pointerEvents: 'none',
    }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', position: 'relative' }}>
      <Star size={16} color="#D4AF37" fill="rgba(212,175,55,0.3)" />
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#D4AF37', textTransform: 'uppercase' }}>
        {t('academy.moduleContent.secretTeaching')}
      </div>
    </div>
    {section.title && (
      <h3 style={{ fontSize: '15px', fontWeight: 900, color: 'rgba(52,211,153,0.92)', marginBottom: '14px' }}>
        {section.title.replace('⟡ ', '')}
      </h3>
    )}
    {section.body && (
      <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.8, fontFamily: "'Cormorant Garamond',serif" }}>
        {section.body.split('\n\n').map((para, i) => (
          <p key={i} style={{ marginBottom: '12px' }}>
            <RichText text={para} />
          </p>
        ))}
      </div>
    )}
  </div>
  );
};

// ─── SECTION TYPE: WARNING ────────────────────────────────────
const WarningSection: React.FC<{ section: ContentSection }> = ({ section }) => (
  <div style={{
    background: 'rgba(251,191,36,0.04)',
    border: '1px solid rgba(251,191,36,0.2)',
    borderRadius: '16px', padding: '20px', marginBottom: '20px',
    display: 'flex', gap: '14px',
  }}>
    <AlertTriangle size={18} color="#FCD34D" style={{ flexShrink: 0, marginTop: '2px' }} />
    <div>
      {section.title && <div style={{ fontSize: '17px', fontWeight: 800, color: '#FCD34D', marginBottom: '6px' }}>{section.title}</div>}
      {section.body && <div style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.75, fontFamily: "'Cormorant Garamond',serif" }}>{section.body}</div>}
    </div>
  </div>
);

// ─── INTRO SECTION (Agastyar Opening) ────────────────────────
const IntroSection: React.FC<{ text: string }> = ({ text }) => {
  const { t } = useTranslation();
  return (
  <div style={{
    background: 'rgba(212,175,55,0.03)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(212,175,55,0.1)',
    borderRadius: '20px',
    padding: '28px',
    marginBottom: '24px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at top left, rgba(212,175,55,0.05) 0%, transparent 60%)',
      pointerEvents: 'none',
    }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '14px' }}>
        {t('academy.moduleContent.introSpeaks')}
      </div>
      <p style={{ fontSize: '19px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1.85, margin: 0, fontFamily: "'Cormorant Garamond',serif" }}>
        "{text}"
      </p>
    </div>
  </div>
  );
};

// ─── CLOSING SECTION ─────────────────────────────────────────
const ClosingSection: React.FC<{ text: string }> = ({ text }) => {
  const { t } = useTranslation();
  return (
  <div style={{
    background: 'rgba(212,175,55,0.03)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(212,175,55,0.1)',
    borderRadius: '20px',
    padding: '28px',
    marginTop: '8px',
    marginBottom: '24px',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: '24px', marginBottom: '14px' }}>⟡</div>
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '14px' }}>
        {t('academy.moduleContent.closingTransmission')}
      </div>
      <p style={{ fontSize: '22px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.85, maxWidth: '600px', margin: '0 auto', fontFamily: "'Cormorant Garamond',serif" }}>
        "{text}"
      </p>
    </div>
  </div>
  );
};

// ─── KEY TAKEAWAYS ────────────────────────────────────────────
const KeyTakeaways: React.FC<{ items: string[] }> = ({ items }) => {
  const { t } = useTranslation();
  return (
  <div style={{
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <BookOpen size={16} color="#D4AF37" />
      <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.4em', color: '#D4AF37', textTransform: 'uppercase' }}>
        {t('academy.moduleContent.keyTakeaways')}
      </div>
    </div>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: '10px', alignItems: 'flex-start',
          padding: '8px 0',
          borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
        }}>
          <CheckCircle size={14} color="#D4AF37" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontFamily: "'Cormorant Garamond',serif" }}>{item}</span>
        </li>
      ))}
    </ul>
  </div>
  );
};

// ─── DAILY PRACTICE ───────────────────────────────────────────
const DailyPractice: React.FC<{ text: string }> = ({ text }) => {
  const { t } = useTranslation();
  return (
  <div style={{
    background: 'linear-gradient(135deg, rgba(212,175,55,0.06), rgba(212,175,55,0.02))',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: '20px',
    padding: '24px',
    marginBottom: '20px',
  }}>
    <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase', color: '#D4AF37', marginBottom: '12px' }}>
      {t('academy.moduleContent.dailyPracticeHeading')}
    </div>
    <p style={{ fontSize: '22px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.8, margin: 0, fontFamily: "'Cormorant Garamond',serif" }}>{text}</p>
  </div>
  );
};

// ─── STEP LABELS (fallback when a section has no explicit title) ──
const TYPE_LABEL: Record<ContentSection['type'], string> = {
  intro: 'Wisdom',
  teaching: 'Teaching',
  'dosha-chart': 'Dosha Comparison',
  table: 'Comparison',
  practice: 'Practice',
  ritual: 'Practice',
  mantra: 'Mantra',
  herb: 'Herb Profile',
  quiz: 'Knowledge Check',
  secret: 'Hidden Wisdom',
  warning: 'Caution',
};

// ─── MAIN RENDERER — paginated, one section per screen ─────────
const AgastyarModuleContent: React.FC<{ content: ModuleContent }> = ({ content }) => {
  const { t } = useTranslation();
  let quizCount = 0;

  type Step = { id: string; label: string; render: () => React.ReactNode };
  const steps: Step[] = [];

  steps.push({ id: 'opening', label: 'Agastyar Speaks', render: () => <IntroSection text={content.agastyarOpening} /> });

  content.sections.forEach((section, i) => {
    const label = section.title || TYPE_LABEL[section.type] || 'Teaching';
    let node: React.ReactNode;
    switch (section.type) {
      case 'teaching':
      case 'intro':
        node = <TeachingSection section={section} />; break;
      case 'dosha-chart':
        node = <DoshaChart section={section} />; break;
      case 'table':
        node = <TableSection section={section} />; break;
      case 'practice':
      case 'ritual':
        node = <PracticeSection section={section} />; break;
      case 'mantra':
        node = <MantraSection section={section} />; break;
      case 'herb':
        node = <HerbSection section={section} />; break;
      case 'quiz': {
        const qIdx = quizCount++;
        node = <QuizSection section={section} index={qIdx} />; break;
      }
      case 'secret':
        node = <SecretSection section={section} />; break;
      case 'warning':
        node = <WarningSection section={section} />; break;
      default:
        node = <TeachingSection section={section} />;
    }
    steps.push({ id: `s${i}`, label, render: () => node });
  });

  steps.push({ id: 'closing', label: 'Closing Wisdom', render: () => <ClosingSection text={content.agastyarClosing} /> });
  steps.push({ id: 'takeaways', label: 'Key Takeaways', render: () => <KeyTakeaways items={content.keyTakeaways} /> });
  steps.push({ id: 'practice-today', label: "Today's Practice", render: () => <DailyPractice text={content.dailyPractice} /> });

  const [active, setActive] = React.useState(0);
  const [subnavOpen, setSubnavOpen] = React.useState(false);
  const current = steps[Math.min(active, steps.length - 1)];

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* Desktop rail — sub-navigation within this lesson */}
      <div
        className="module-subnav-desktop"
        style={{
          flex: '0 0 210px', position: 'sticky', top: 90, display: 'none',
          background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 18, padding: '10px 8px', maxHeight: 'calc(100vh - 130px)', overflowY: 'auto',
        }}
      >
        <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', padding: '4px 10px 8px' }}>
          {'In This Lesson'}
        </div>
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
              padding: '8px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: i === active ? 'rgba(52,211,153,0.09)' : 'transparent',
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: i === active ? '#34D399' : i < active ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.15)',
            }} />
            <span style={{
              fontSize: 12.5, lineHeight: 1.35, color: i === active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)',
              fontWeight: i === active ? 700 : 500,
            }}>
              {s.label}
            </span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile sub-nav — same collapsible "tap to browse" pattern as the academy module list */}
        <div className="module-subnav-mobile" style={{ marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setSubnavOpen((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
              padding: '12px 16px', borderRadius: 16, cursor: 'pointer',
              border: '1px solid rgba(52,211,153,0.25)', background: 'rgba(52,211,153,0.06)',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 800, color: '#34D399', textAlign: 'left' }}>
              {current.label} — {active + 1} of {steps.length} · tap to browse
            </span>
            <ChevronDown size={15} color="#34D399" style={{ flexShrink: 0, transform: subnavOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {subnavOpen && (
            <div style={{ marginTop: 6, borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.012)', overflow: 'hidden' }}>
              {steps.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setActive(i); setSubnavOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                    padding: '11px 16px', cursor: 'pointer', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: i === active ? 'rgba(52,211,153,0.08)' : 'transparent',
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: i === active ? '#34D399' : i < active ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.15)',
                  }} />
                  <span style={{ fontSize: 13, color: i === active ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: i === active ? 700 : 500 }}>
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {current.render()}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
          <button
            type="button"
            disabled={active === 0}
            onClick={() => setActive((a) => Math.max(0, a - 1))}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)',
              padding: '10px 18px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: active === 0 ? 'default' : 'pointer',
              opacity: active === 0 ? 0.35 : 1,
            }}
          >
            ← {'Previous Section'}
          </button>
          <button
            type="button"
            disabled={active === steps.length - 1}
            onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
            style={{
              background: active === steps.length - 1 ? 'transparent' : 'rgba(52,211,153,0.14)',
              border: `1px solid ${active === steps.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(52,211,153,0.4)'}`,
              color: active === steps.length - 1 ? 'rgba(255,255,255,0.3)' : '#34D399',
              padding: '10px 18px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              cursor: active === steps.length - 1 ? 'default' : 'pointer',
            }}
          >
            {'Next Section'} →
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 860px) {
          .module-subnav-desktop { display: block !important; }
          .module-subnav-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default AgastyarModuleContent;
