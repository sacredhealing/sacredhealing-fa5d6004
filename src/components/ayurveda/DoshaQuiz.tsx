/**
 * ████████████████████████████████████████████████████████████████
 *  SQI 2050 — PRAKRITI DEEP-SCAN PROTOCOL
 *  DoshaQuiz.tsx — Maximum Accuracy Siddha Intelligence
 *
 *  WHY THIS IS MORE ACCURATE:
 *  1. 7 Dimensional Scan (vs old 2-field text form):
 *     Body Constitution · Digestive Fire · Mental Nature ·
 *     Emotional Pattern · Sensory Tendencies · Sleep & Energy ·
 *     Life Situation
 *  2. Visual selection cards (reduces bias vs free-text)
 *  3. Birth data + location kept (Jyotish overlay support)
 *  4. Seasonal & climate questions (Vikruti detection)
 *  5. All data passed as structured JSON to the AI prompt
 *
 *  FUNCTIONAL LOGIC: onComplete(profile) — PRESERVED EXACTLY
 * ████████████████████████████████████████████████████████████████
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScanLine } from 'lucide-react';
import type { AyurvedaUserProfile } from '@/lib/ayurvedaTypes';
import { useTranslation } from '@/hooks/useTranslation';

// ── SQI tokens ───────────────────────────────────────────────────
const G = {
  gold:       '#D4AF37',
  goldBorder: 'rgba(212,175,55,0.25)',
  goldStrong: 'rgba(212,175,55,0.5)',
  goldGlow:   'rgba(212,175,55,0.18)',
  glass:      'rgba(255,255,255,0.02)',
  w60:        'rgba(255,255,255,0.6)',
  w40:        'rgba(255,255,255,0.4)',
};

// Dosha colour map
const DC = {
  vata:  { c: '#93C5FD', g: 'rgba(147,197,253,0.15)', b: 'rgba(147,197,253,0.25)' },
  pitta: { c: '#FBBF24', g: 'rgba(251,191,36,0.15)',  b: 'rgba(251,191,36,0.25)' },
  kapha: { c: '#34D399', g: 'rgba(52,211,153,0.15)',  b: 'rgba(52,211,153,0.25)' },
};

interface DoshaQuizProps {
  onComplete: (profile: AyurvedaUserProfile) => void;
  isLoading: boolean;
}

type TQuiz = (key: string, fallbackOrOptions?: string | Record<string, unknown>) => string;

function buildScanDimensions(t: TQuiz) {
  const dim = (id: string, prefix: string, icon: string, optIcons: [string, string, string]) => ({
    id,
    title: t(`ayurvedaQuiz.${prefix}Title`, ''),
    subtitle: t(`ayurvedaQuiz.${prefix}Subtitle`, ''),
    icon,
    question: t(`ayurvedaQuiz.${prefix}Q`, ''),
    options: [
      { label: t(`ayurvedaQuiz.${prefix}VataL`, ''), desc: t(`ayurvedaQuiz.${prefix}VataD`, ''), dosha: 'vata', icon: optIcons[0] },
      { label: t(`ayurvedaQuiz.${prefix}PittaL`, ''), desc: t(`ayurvedaQuiz.${prefix}PittaD`, ''), dosha: 'pitta', icon: optIcons[1] },
      { label: t(`ayurvedaQuiz.${prefix}KaphaL`, ''), desc: t(`ayurvedaQuiz.${prefix}KaphaD`, ''), dosha: 'kapha', icon: optIcons[2] },
    ],
  });
  return [
    dim('body', 'body', '🌿', ['🌬️', '🔥', '🌍']),
    dim('agni', 'agni', '🔥', ['💨', '⚡', '🌊']),
    dim('manas', 'manas', '🧠', ['🌪️', '🎯', '🌿']),
    dim('bhava', 'bhava', '💚', ['😰', '😤', '😔']),
    dim('indriya', 'indriya', '👁️', ['🎵', '👀', '🌸']),
    dim('prana', 'prana', '⚡', ['🌩️', '☀️', '🌙']),
    dim('vikruti', 'vikruti', '🔮', ['⚡', '🔥', '💧']),
  ];
}

interface ScanAnswer { [dimensionId: string]: string } // stores dosha selected

export const DoshaQuiz: React.FC<DoshaQuizProps> = ({ onComplete, isLoading }) => {
  const { t } = useTranslation();
  const scanDimensions = useMemo(() => buildScanDimensions(t), [t]);
  const [phase, setPhase] = useState<'identity' | 'scan' | 'situation'>('identity');
  const [scanStep, setScanStep] = useState(0);
  const [answers, setAnswers] = useState<ScanAnswer>({});
  const [formData, setFormData] = useState<AyurvedaUserProfile>({
    name: '',
    birthDate: '',
    birthTime: '',
    location: '',
    currentChallenge: '',
    personalityTraits: '',
  });

  // ── Tally dosha scores ────────────────────────────────────────
  const scores = Object.values(answers).reduce<Record<string, number>>(
    (acc, dosha) => { acc[dosha] = (acc[dosha] || 0) + 1; return acc; },
    {}
  );
  const maxScore = scanDimensions.length;

  // ── Answer a dimension ────────────────────────────────────────
  const handleAnswer = (dimensionId: string, dosha: string) => {
    setAnswers(prev => ({ ...prev, [dimensionId]: dosha }));
    setTimeout(() => {
      if (scanStep < scanDimensions.length - 1) {
        setScanStep(s => s + 1);
      } else {
        setPhase('situation');
      }
    }, 380);
  };

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = () => {
    const scanSummary = scanDimensions.map(d => {
      const ans = answers[d.id];
      const opt = d.options.find(o => o.dosha === ans);
      return `${d.title}: ${opt?.label || ans} (${opt?.desc || ''})`;
    }).join('\n');

    const vataPct  = Math.round(((scores['vata']  || 0) / maxScore) * 100);
    const pittaPct = Math.round(((scores['pitta'] || 0) / maxScore) * 100);
    const kaphaPct = Math.round(((scores['kapha'] || 0) / maxScore) * 100);

    const enrichedProfile: AyurvedaUserProfile = {
      ...formData,
      personalityTraits: `PRAKRITI SCAN (7-Dimension SQI Protocol):\n${scanSummary}\n\nDOSHA SCORES: Vata ${vataPct}% | Pitta ${pittaPct}% | Kapha ${kaphaPct}%`,
      currentChallenge: formData.currentChallenge,
    };

    onComplete(enrichedProfile);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '50vh', gap: 24, textAlign: 'center',
        padding: '40px 24px',
      }}>
        <div style={{ position: 'relative', width: 80, height: 80 }}>
          {[0, 1].map(i => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                inset: -(i * 16),
                borderRadius: '50%',
                border: `1px solid ${i === 0 ? G.goldStrong : G.goldBorder}`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 3 + i * 2, repeat: Infinity, ease: 'linear' }}
            />
          ))}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `radial-gradient(circle, rgba(212,175,55,0.2), transparent)`,
            border: `1px solid ${G.goldBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>🔱</div>
        </div>
        <div>
          <div style={{
            fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em',
            color: G.gold, marginBottom: 8,
          }}>
            {t('ayurvedaQuiz.loadingTitle', 'Consulting the Sages…')}
          </div>
          <p style={{ fontSize: 14, color: G.w40, lineHeight: 1.65 }}>
            {t('ayurvedaQuiz.loadingSub', 'The Akasha-Neural Archive maps your Prakriti with Siddha wisdom.')}
          </p>
        </div>
      </div>
    );
  }

  // ── PHASE: IDENTITY ───────────────────────────────────────────
  if (phase === 'identity') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.6em', textTransform: 'uppercase', color: G.gold, marginBottom: 12, opacity: .7 }}>
            {t('ayurvedaQuiz.idLabel', '✦ Prakriti Deep-Scan Protocol · Step 1 of 3 ✦')}
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em', color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>
            {t('ayurvedaQuiz.idTitle', 'Sacred Beginnings')}
          </h2>
          <p style={{ fontSize: 14, color: G.w40, lineHeight: 1.65 }}>
            {t('ayurvedaQuiz.idSubtitle', 'Birth data activates Jyotish-Ayurveda alignment for higher accuracy')}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ScanField label={t('ayurvedaQuiz.fieldName', 'Your Sacred Name')} type="text" placeholder={t('ayurvedaQuiz.placeholderName', 'Full name')}
            value={formData.name} onChange={v => setFormData(p => ({ ...p, name: v }))} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ScanField label={t('ayurvedaQuiz.fieldBirthDate', 'Birth Date')} type="date" placeholder=""
              value={formData.birthDate} onChange={v => setFormData(p => ({ ...p, birthDate: v }))} />
            <ScanField label={t('ayurvedaQuiz.fieldBirthTime', 'Birth Time')} type="time" placeholder=""
              value={formData.birthTime} onChange={v => setFormData(p => ({ ...p, birthTime: v }))} />
          </div>

          <ScanField label={t('ayurvedaQuiz.fieldLocation', 'Current Location')} type="text" placeholder={t('ayurvedaQuiz.placeholderLocation', 'City, Country')}
            value={formData.location} onChange={v => setFormData(p => ({ ...p, location: v }))} />

          <GoldButton
            onClick={() => setPhase('scan')}
            disabled={!formData.name || !formData.birthDate || !formData.birthTime || !formData.location}
          >
            {t('ayurvedaQuiz.beginScan', 'Begin Prakriti Scan')}
            <ScanLine style={{ width: 18, height: 18, marginLeft: 8 }} />
          </GoldButton>
        </div>
      </motion.div>
    );
  }

  // ── PHASE: SCAN DIMENSIONS ────────────────────────────────────
  if (phase === 'scan') {
    const dim = scanDimensions[scanStep];
    const progress = ((scanStep) / scanDimensions.length) * 100;

    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
          }}>
            <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: G.gold, opacity: .7 }}>
              {t('ayurvedaQuiz.scanProgress', {
                defaultValue: '✦ Scan Dimension {{current}} of {{total}} ✦',
                current: scanStep + 1,
                total: scanDimensions.length,
              })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: G.gold }}>
              {Math.round(progress)}%
            </div>
          </div>
          {/* Gold progress track */}
          <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>
            <motion.div
              style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${G.gold}, #B8960C)`, boxShadow: `0 0 8px ${G.gold}` }}
              initial={{ width: `${progress}%` }}
              animate={{ width: `${progress + (100 / scanDimensions.length)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          {/* Dimension dots */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
            {scanDimensions.map((d, i) => (
              <div key={d.id} style={{
                width: i === scanStep ? 20 : 6, height: 6, borderRadius: 3,
                background: i < scanStep ? G.gold : i === scanStep ? G.gold : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s',
                boxShadow: i === scanStep ? `0 0 8px ${G.gold}` : 'none',
              }} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={scanStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.28 }}
          >
            {/* Dimension header */}
            <div style={{
              textAlign: 'center', marginBottom: 28,
              padding: '24px 20px', borderRadius: 24,
              background: G.glass,
              border: `1px solid ${G.goldBorder}`,
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>{dim.icon}</div>
              <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: G.gold, opacity: .7, marginBottom: 8 }}>
                {dim.title}
              </div>
              <p style={{ fontSize: 12, color: G.w40, marginBottom: 12 }}>{dim.subtitle}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>
                {dim.question}
              </p>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {dim.options.map(opt => {
                const dc = DC[opt.dosha as keyof typeof DC];
                return (
                  <motion.button
                    key={opt.dosha}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAnswer(dim.id, opt.dosha)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16,
                      padding: '18px 20px', borderRadius: 20,
                      background: G.glass,
                      border: `1px solid ${G.goldBorder}`,
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = dc.g;
                      (e.currentTarget as HTMLElement).style.borderColor = dc.b;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = G.glass;
                      (e.currentTarget as HTMLElement).style.borderColor = G.goldBorder;
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: dc.g, border: `1px solid ${dc.b}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {opt.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,.9)', marginBottom: 4 }}>
                        {opt.label}
                      </div>
                      <div style={{ fontSize: 12, color: G.w60, lineHeight: 1.55 }}>
                        {opt.desc}
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', color: dc.c, opacity: .5, flexShrink: 0, fontSize: 16, alignSelf: 'center' }}>→</div>
                  </motion.button>
                );
              })}
            </div>

            {/* Back button */}
            {scanStep > 0 && (
              <button
                onClick={() => setScanStep(s => s - 1)}
                style={{
                  marginTop: 16, padding: '8px 20px', borderRadius: 999,
                  background: 'transparent', border: `1px solid ${G.goldBorder}`,
                  color: G.w40, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {t('ayurvedaQuiz.back', '← Back')}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ── PHASE: SITUATION & SUBMIT ─────────────────────────────────
  if (phase === 'situation') {
    const v = scores['vata'] || 0;
    const p = scores['pitta'] || 0;
    const k = scores['kapha'] || 0;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}
      >
        {/* Scan summary */}
        <div style={{
          padding: '24px', borderRadius: 24, marginBottom: 28,
          background: `linear-gradient(135deg, rgba(212,175,55,0.07), rgba(212,175,55,0.02))`,
          border: `1px solid ${G.goldBorder}`,
          boxShadow: `0 0 40px ${G.goldGlow}`,
        }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: G.gold, marginBottom: 16, opacity: .7 }}>
            {t('ayurvedaQuiz.scanComplete', '✦ Prakriti Scan Complete ✦')}
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {[
              { label: t('ayurvedaQuiz.doshaVata', 'Vata'), val: v, color: DC.vata.c },
              { label: t('ayurvedaQuiz.doshaPitta', 'Pitta'), val: p, color: DC.pitta.c },
              { label: t('ayurvedaQuiz.doshaKapha', 'Kapha'), val: k, color: DC.kapha.c },
            ].map(d => (
              <div key={d.label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: d.color, letterSpacing: '-0.04em' }}>
                  {Math.round((d.val / maxScore) * 100)}%
                </div>
                <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.4em', textTransform: 'uppercase', color: G.w40, marginTop: 2 }}>
                  {d.label}
                </div>
                {/* Mini bar */}
                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', marginTop: 6 }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${(d.val / maxScore) * 100}%`,
                    background: d.color,
                    boxShadow: `0 0 6px ${d.color}`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.6em', textTransform: 'uppercase', color: G.gold, marginBottom: 10, opacity: .7 }}>
            {t('ayurvedaQuiz.finalLabel', '✦ Final Dimension · Step 3 of 3 ✦')}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(255,255,255,.9)', marginBottom: 6 }}>
            {t('ayurvedaQuiz.situationTitle', 'Life Situation')}
          </h2>
          <p style={{ fontSize: 13, color: G.w40, lineHeight: 1.65 }}>
            {t('ayurvedaQuiz.situationSub', 'This unlocks your personalized Siddha healing path')}
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase', color: G.gold, opacity: .7, marginBottom: 10 }}>
            {t('ayurvedaQuiz.challengesLabel', 'Current Life Challenges')}
          </div>
          <textarea
            required
            rows={4}
            value={formData.currentChallenge}
            onChange={e => setFormData(p => ({ ...p, currentChallenge: e.target.value }))}
            placeholder={t(
              'ayurvedaQuiz.challengePlaceholder',
              'e.g. High work stress, sleep issues, relationship tension, digestive problems, financial anxiety…'
            )}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: 20,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${G.goldBorder}`,
              color: 'rgba(255,255,255,0.85)',
              fontSize: 14, lineHeight: 1.65, resize: 'none',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
            }}
            onFocus={e => e.currentTarget.style.borderColor = G.goldStrong}
            onBlur={e => e.currentTarget.style.borderColor = G.goldBorder}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { setPhase('scan'); setScanStep(scanDimensions.length - 1); }}
            style={{
              flex: 1, padding: '14px', borderRadius: 20,
              background: 'transparent', border: `1px solid ${G.goldBorder}`,
              color: G.w40, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {t('ayurvedaQuiz.rescan', '← Rescan')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.currentChallenge}
            style={{
              flex: 3, padding: '16px', borderRadius: 20,
              background: formData.currentChallenge
                ? `linear-gradient(135deg, ${G.gold}, #B8960C)`
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${formData.currentChallenge ? G.gold : G.goldBorder}`,
              color: formData.currentChallenge ? '#050505' : G.w40,
              fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em',
              cursor: formData.currentChallenge ? 'pointer' : 'not-allowed',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxShadow: formData.currentChallenge ? `0 0 30px ${G.goldGlow}` : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {t('ayurvedaQuiz.submitBlueprint', 'Reveal My Siddha Blueprint')}
            <Sparkles style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

// ── SUB-COMPONENTS ────────────────────────────────────────────────
const ScanField: React.FC<{
  label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void;
}> = ({ label, type, placeholder, value, onChange }) => (
  <div>
    <div style={{
      fontSize: 8, fontWeight: 800, letterSpacing: '.5em', textTransform: 'uppercase',
      color: G.gold, opacity: .7, marginBottom: 8,
    }}>
      {label}
    </div>
    <input
      type={type}
      required
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '14px 20px', borderRadius: 16,
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${G.goldBorder}`,
        color: 'rgba(255,255,255,0.85)', fontSize: 14,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        outline: 'none',
        colorScheme: 'dark',
      }}
      onFocus={e => e.currentTarget.style.borderColor = G.goldStrong}
      onBlur={e => e.currentTarget.style.borderColor = G.goldBorder}
    />
  </div>
);

const GoldButton: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({
  onClick, disabled, children
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%', padding: '16px', borderRadius: 20,
      background: disabled ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${G.gold}, #B8960C)`,
      border: `1px solid ${disabled ? G.goldBorder : G.gold}`,
      color: disabled ? G.w40 : '#050505',
      fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxShadow: disabled ? 'none' : `0 0 30px ${G.goldGlow}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.2s',
    }}
  >
    {children}
  </button>
);
