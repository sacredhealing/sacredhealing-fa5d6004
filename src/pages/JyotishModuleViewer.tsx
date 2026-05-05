// src/pages/JyotishModuleViewer.tsx
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  Lock,
  Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useJyotishVidyaProgress } from '@/hooks/useJyotishVidyaProgress';
import { getModuleContent } from '@/data/content/content_index';
import { getModuleById, canAccessModule, TIER_CONFIG } from '@/lib/jyotishModules';
import {
  getCourseTierRequiredRank,
  getSalesPageForRank,
} from '@/lib/tierAccess';

function tierLabelKey(tierSlug: string): string {
  const s = (tierSlug || 'free').toLowerCase();
  if (s.includes('akasha')) return 'conversion.tiers.akasha.label';
  if (s.includes('siddha')) return 'conversion.tiers.siddha.label';
  if (s.includes('prana')) return 'conversion.tiers.prana.label';
  return 'conversion.tiers.free.label';
}

const S = {
  page: { minHeight: '100vh', background: '#050505', fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#fff', paddingBottom: 80 } as CSSProperties,
  inner: { maxWidth: 860, margin: '0 auto', padding: '0 16px' } as CSSProperties,
  topBar: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px', maxWidth: 860, margin: '0 auto', borderBottom: '1px solid rgba(255,255,255,0.05)' } as CSSProperties,
  backBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' as const },
  hero: { padding: '40px 16px 32px', maxWidth: 860, margin: '0 auto' } as CSSProperties,
  label: { fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: '#D4AF37', marginBottom: 10 },
  title: { fontSize: 'clamp(22px,4vw,36px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', marginBottom: 8, lineHeight: 1.15 } as CSSProperties,
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 } as CSSProperties,
  opening: { background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 20, padding: '24px 28px', marginBottom: 32, fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.9, fontStyle: 'italic', whiteSpace: 'pre-line' as const },
  sectionCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, marginBottom: 12, overflow: 'hidden' } as CSSProperties,
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', cursor: 'pointer' } as CSSProperties,
  sectionTitle: { fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', flex: 1, paddingRight: 12 } as CSSProperties,
  sectionBody: { padding: '0 22px 22px', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, whiteSpace: 'pre-line' as const } as CSSProperties,
  termGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10, marginTop: 20 } as CSSProperties,
  termCard: { background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 14, padding: '14px 16px' } as CSSProperties,
  termName: { fontSize: 11, fontWeight: 800, color: '#D4AF37', marginBottom: 3 } as CSSProperties,
  termSkt: { fontSize: 9, color: 'rgba(212,175,55,0.5)', marginBottom: 5 } as CSSProperties,
  termDef: { fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 } as CSSProperties,
  practiceBox: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderLeft: '3px solid #D4AF37', borderRadius: 16, padding: '22px 24px', marginBottom: 24, fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, whiteSpace: 'pre-line' as const } as CSSProperties,
  closing: { background: 'rgba(212,175,55,0.03)', border: '1px solid rgba(212,175,55,0.08)', borderRadius: 16, padding: '22px 24px', marginBottom: 32, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-line' as const } as CSSProperties,
  quizCard: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '20px', marginBottom: 12 } as CSSProperties,
  quizQ: { fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 14, lineHeight: 1.5 } as CSSProperties,
  optionBtn: (selected: boolean, correct: boolean | null) => ({
    width: '100%', textAlign: 'left' as const, background: selected
      ? correct ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
      : 'rgba(255,255,255,0.02)',
    border: `1px solid ${selected ? correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
    borderRadius: 10, padding: '11px 14px', cursor: 'pointer', fontSize: 12,
    color: selected ? correct ? '#86efac' : '#fca5a5' : 'rgba(255,255,255,0.55)',
    marginBottom: 8, transition: 'all 0.15s',
  }),
  explanation: { marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, padding: '10px 14px', background: 'rgba(212,175,55,0.05)', border: '1px solid rgba(212,175,55,0.1)', borderRadius: 8 } as CSSProperties,
  divider: { margin: '32px 0', borderTop: '1px solid rgba(255,255,255,0.05)' } as CSSProperties,
  sectionLabel: { fontSize: 9, fontWeight: 800, letterSpacing: '0.5em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.25)', marginBottom: 16 },
  completeBtn: (done: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 10, background: done ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${done ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 14, padding: '14px 20px', cursor: 'pointer', width: '100%', marginBottom: 16,
    fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
    color: done ? '#D4AF37' : 'rgba(255,255,255,0.4)',
  }),
};

function renderBody(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} style={{ fontWeight: 800, color: '#fff', marginBottom: 4, marginTop: 14 }}>{line.replace(/\*\*/g, '')}</p>;
    }
    if (line.includes('**')) {
      const parts = line.split('**');
      return (
        <p key={i} style={{ marginBottom: 6 }}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#fff', fontWeight: 800 }}>{p}</strong> : p)}
        </p>
      );
    }
    if (line.startsWith('- ')) return <p key={i} style={{ paddingLeft: 16, position: 'relative', marginBottom: 4 }}><span style={{ position: 'absolute', left: 0, color: '#D4AF37' }}>◈</span>{line.slice(2)}</p>;
    if (line.startsWith('| ')) return <p key={i} style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{line}</p>;
    if (line === '') return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ marginBottom: 6 }}>{line}</p>;
  });
}

export default function JyotishModuleViewer() {
  const { t } = useTranslation();
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;

  const { progressByModuleId, markComplete, touchAccess } = useJyotishVidyaProgress(membershipReady);

  const id = parseInt(moduleId || '', 10);
  const validId = Number.isFinite(id) && id >= 1 && id <= 32;

  const moduleData = validId ? getModuleById(id) : undefined;
  const content = validId ? getModuleContent(id) : undefined;

  const [openSections, setOpenSections] = useState<number[]>([0]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [markingDone, setMarkingDone] = useState(false);

  const canAccess = useMemo(() => {
    if (!moduleData) return false;
    return canAccessModule(moduleData, tier, { isAdmin, userId: user?.id });
  }, [moduleData, tier, isAdmin, user?.id]);

  const progress = moduleData ? progressByModuleId[moduleData.id] : undefined;
  const isComplete =
    progress?.status === 'completed' || (progress?.completion_percentage ?? 0) >= 100;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!membershipReady || !user || !canAccess || !moduleData) return;
    void touchAccess(moduleData.id);
  }, [membershipReady, user, canAccess, moduleData, touchAccess]);

  const tierCfg = moduleData ? TIER_CONFIG[moduleData.tier] : null;
  const tierSlug = tierCfg?.slug ?? 'free';
  const tierName = t(tierLabelKey(tierSlug));
  const upgradeHref = getSalesPageForRank(getCourseTierRequiredRank(tierSlug));

  const handleAnswer = (qi: number, oi: number) => {
    if (!content || quizAnswers[qi] !== undefined) return;
    setQuizAnswers((prev) => ({ ...prev, [qi]: oi }));
    const newAnswers = { ...quizAnswers, [qi]: oi };
    if (Object.keys(newAnswers).length === content.quiz.length) {
      const correct = content.quiz.filter((q, i) => newAnswers[i] === q.answer).length;
      setQuizScore(correct);
    }
  };

  const handleMarkComplete = useCallback(async () => {
    if (!user || !moduleData || markingDone || isComplete) return;
    setMarkingDone(true);
    try {
      await markComplete(moduleData.id);
      toast.success(t('jyotishVidya.module.toastComplete'));
    } catch {
      toast.error(t('jyotishVidya.module.toastCompleteError'));
    } finally {
      setMarkingDone(false);
    }
  }, [user, moduleData, markingDone, isComplete, markComplete, t]);

  const toggleSection = (i: number) =>
    setOpenSections((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  if (!membershipReady) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]/70" aria-hidden />
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">{t('common.loading')}</p>
      </div>
    );
  }

  if (!moduleData || !content) {
    return (
      <div style={S.page}>
        <div style={S.topBar}>
          <button type="button" style={S.backBtn} onClick={() => navigate('/jyotish-vidya')} aria-label={t('jyotishVidya.module.backHub')}>
            <ChevronLeft size={12} aria-hidden /> {t('jyotishVidya.back')}
          </button>
        </div>
        <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>{t('jyotishVidya.module.notFound')}</div>
      </div>
    );
  }

  const nextId = id < 32 ? id + 1 : null;
  const prevId = id > 1 ? id - 1 : null;

  return (
    <div style={S.page}>
      <div style={S.topBar}>
        <button type="button" style={S.backBtn} onClick={() => navigate('/jyotish-vidya')} aria-label={t('jyotishModuleViewer.allModules')}>
          <ChevronLeft size={12} aria-hidden /> {t('jyotishModuleViewer.allModules')}
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {isComplete && (
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CheckCircle size={12} aria-hidden /> {t('jyotishVidya.catalog.completeBadge')}
            </span>
          )}
          <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.3em', textTransform: 'uppercase', padding: '4px 8px', background: `${tierCfg!.color}15`, border: `1px solid ${tierCfg!.color}25`, borderRadius: 6, color: tierCfg!.color }}>
            {tierCfg!.name}
          </span>
        </div>
      </div>

      <div style={S.hero}>
        <div style={S.label}>
          {t('jyotishModuleViewer.moduleEyebrow', {
            num: String(id).padStart(2, '0'),
            duration: moduleData.duration,
          })}
        </div>
        <h1 style={S.title}>{moduleData.title}</h1>
        <p style={S.subtitle}>{moduleData.subtitle}</p>

        {content.opening && (
          <div style={S.opening}>{content.opening}</div>
        )}
      </div>

      {!canAccess ? (
        <div style={{ ...S.inner, textAlign: 'center', padding: '40px 24px' }}>
          <Lock className="mx-auto mb-5 h-11 w-11 text-[#D4AF37]/45" aria-hidden />
          <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/80">{t('jyotishVidya.module.lockedKicker')}</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>{moduleData.title}</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
            {t('jyotishVidya.module.lockedDetail', { num: id, tier: tierName })}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24 }}>{t('jyotishVidya.module.lockedBody')}</p>
          <button
            type="button"
            onClick={() => navigate(user ? upgradeHref : '/auth')}
            style={{ background: '#D4AF37', color: '#050505', border: 'none', borderRadius: 12, padding: '12px 28px', cursor: 'pointer', fontSize: 12, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            {user ? t('jyotishVidya.module.unlockCta') : t('jyotishVidya.loginCta')}
          </button>
        </div>
      ) : (
        <div style={S.inner}>

          <div style={S.sectionLabel}>{t('jyotishModuleViewer.curriculumTransmission')}</div>
          {content.sections.map((section, i) => (
            <div key={i} style={S.sectionCard}>
              <button type="button" style={{ ...S.sectionHeader, width: '100%', border: 'none', background: 'transparent', color: 'inherit', textAlign: 'left' }} onClick={() => toggleSection(i)}>
                <h2 style={S.sectionTitle}>{section.title}</h2>
                {openSections.includes(i)
                  ? <ChevronUp size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} aria-hidden />
                  : <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} aria-hidden />
                }
              </button>
              {openSections.includes(i) && (
                <div>
                  <div style={S.sectionBody}>{renderBody(section.body)}</div>
                  {section.keyTerms && section.keyTerms.length > 0 && (
                    <div style={{ padding: '0 22px 22px' }}>
                      <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.5)', marginBottom: 10 }}>{t('jyotishModuleViewer.keyTerms')}</p>
                      <div style={S.termGrid}>
                        {section.keyTerms.map((kt, j) => (
                          <div key={j} style={S.termCard}>
                            <div style={S.termName}>{kt.term}</div>
                            {kt.sanskrit && <div style={S.termSkt}>{kt.sanskrit}</div>}
                            <div style={S.termDef}>{kt.definition}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={S.divider} />

          <div style={S.sectionLabel}>{t('jyotishModuleViewer.sadhanaPractice')}</div>
          <div style={S.practiceBox}>{renderBody(content.practice)}</div>

          <div style={S.sectionLabel}>{t('jyotishModuleViewer.closingTransmission')}</div>
          <div style={S.closing}>{content.closing}</div>

          <div style={S.divider} />

          <div style={S.sectionLabel}>{t('jyotishModuleViewer.knowledgeAssessment')}</div>
          {content.quiz.map((q, qi) => {
            const answered = quizAnswers[qi] !== undefined;
            return (
              <div key={qi} style={S.quizCard}>
                <p style={S.quizQ}>{qi + 1}. {q.question}</p>
                {q.options.map((opt, oi) => {
                  const selected = quizAnswers[qi] === oi;
                  const correct = answered ? oi === q.answer : null;
                  return (
                    <button key={oi} type="button" style={S.optionBtn(selected, correct)} onClick={() => handleAnswer(qi, oi)}>
                      {opt}
                    </button>
                  );
                })}
                {answered && (
                  <div style={S.explanation}>
                    {quizAnswers[qi] === q.answer ? t('jyotishModuleViewer.quizCorrect') : t('jyotishModuleViewer.quizReveal')}{q.explanation}
                  </div>
                )}
              </div>
            );
          })}

          {quizScore !== null && (
            <div style={{ textAlign: 'center', padding: '16px 0 24px', fontSize: 13, color: '#D4AF37', fontWeight: 800 }}>
              {t('jyotishModuleViewer.scoreSummary', {
                correct: quizScore,
                total: content.quiz.length,
                percent: Math.round((quizScore / content.quiz.length) * 100),
              })}
            </div>
          )}

          <div style={S.divider} />

          {user && (
            <button type="button" style={S.completeBtn(isComplete)} onClick={() => void handleMarkComplete()} disabled={isComplete || markingDone}>
              {markingDone ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                  {t('jyotishVidya.module.saving')}
                </>
              ) : isComplete ? (
                <>
                  <CheckCircle size={14} aria-hidden /> {t('jyotishVidya.module.alreadyComplete')}
                </>
              ) : (
                <>
                  <Circle size={14} aria-hidden /> {t('jyotishModuleViewer.markComplete')}
                </>
              )}
            </button>
          )}

          {!user && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 16 }}>{t('jyotishVidya.module.signInToSave')}</p>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {prevId && (
              <button type="button" onClick={() => navigate(`/jyotish-vidya/module/${prevId}`)} style={{ ...S.backBtn, flex: 1, justifyContent: 'center' }}>
                <ChevronLeft size={12} aria-hidden /> {t('jyotishModuleViewer.navModule', { num: prevId })}
              </button>
            )}
            {nextId && (
              <button type="button" onClick={() => navigate(`/jyotish-vidya/module/${nextId}`)} style={{ ...S.backBtn, flex: 1, justifyContent: 'center', color: '#D4AF37', borderColor: 'rgba(212,175,55,0.2)', background: 'rgba(212,175,55,0.05)' }}>
                {t('jyotishModuleViewer.navModule', { num: nextId })} <ChevronRight size={12} aria-hidden />
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
