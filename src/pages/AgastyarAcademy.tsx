import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  FlaskConical,
  GraduationCap,
  Home,
  Infinity as InfinityIcon,
  Leaf,
  Lock,
  Music,
  Play,
  Radio,
  Search,
  Sparkles,
  Star,
  Sprout,
  Stethoscope,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAyurvedaProgress, type AyurvedaCourseRow } from '@/hooks/useAyurvedaProgress';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import {
  FEATURE_TIER,
  getCourseTierRequiredRank,
  getSalesPageForRank,
  getTierRank,
  hasFeatureAccess,
} from '@/lib/tierAccess';

const PHASE_NUMBERS = [1, 2, 3, 4, 5] as const;

const PHASE_TIER_SLUG: Record<number, string> = {
  1: 'free',
  2: 'prana-flow',
  3: 'siddha-quantum',
  4: 'akasha-infinity',
  5: 'akasha-infinity',
};

const PHASE_HEX: Record<number, string> = {
  1: '#9CA3AF',
  2: '#4ADE80',
  3: '#D4AF37',
  4: '#A78BFA',
  5: '#F0ABFC',
};

const PAID_TIER_SLUGS = ['prana-flow', 'siddha-quantum', 'akasha-infinity'] as const;

function tierLabelKey(tierSlug: string): string {
  const s = (tierSlug || 'free').toLowerCase();
  if (s.includes('akasha')) return 'conversion.tiers.akasha.label';
  if (s.includes('siddha')) return 'conversion.tiers.siddha.label';
  if (s.includes('prana')) return 'conversion.tiers.prana.label';
  return 'conversion.tiers.free.label';
}

function paidSlugToConversionKey(slug: string): 'prana' | 'siddha' | 'akasha' {
  if (slug.includes('akasha')) return 'akasha';
  if (slug.includes('siddha')) return 'siddha';
  return 'prana';
}

function canonicalPaidSlug(tier: string | null | undefined): string {
  const r = getTierRank(tier);
  if (r >= 3) return 'akasha-infinity';
  if (r === 2) return 'siddha-quantum';
  if (r === 1) return 'prana-flow';
  return 'free';
}

function phaseHexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r},${g},${b}`;
}

function PhaseGlyph({ phase }: { phase: number }) {
  const cls = 'h-8 w-8 text-white/90';
  switch (phase) {
    case 1:
      return <Sprout className={cls} aria-hidden />;
    case 2:
      return <FlaskConical className={cls} aria-hidden />;
    case 3:
      return <Stethoscope className={cls} aria-hidden />;
    case 4:
      return <Sparkles className={cls} aria-hidden />;
    default:
      return <InfinityIcon className={cls} aria-hidden />;
  }
}

const ParticleField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const particles: {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      angle: number;
    }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 72; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.28 + 0.08,
        opacity: Math.random() * 0.55 + 0.08,
        angle: Math.random() * Math.PI * 2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.speed;
        p.x += Math.sin(p.angle + Date.now() * 0.001) * 0.28;
        p.angle += 0.008;
        if (p.y < -5) {
          p.y = canvas.height + 5;
          p.x = Math.random() * canvas.width;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      aria-hidden
    />
  );
};

const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
}> = ({ label, value, icon, accent = '#D4AF37' }) => {
  const rgb = accent === '#D4AF37' ? '212,175,55' : phaseHexToRgb(accent);
  return (
    <div className="glass-card flex min-w-[140px] flex-1 items-center gap-4 rounded-[20px] border border-white/[0.06] bg-white/[0.02] px-5 py-5 backdrop-blur-[40px]">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
        style={{ background: `rgba(${rgb},0.12)`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black tabular-nums text-white">{value}</p>
        <p className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/40">{label}</p>
      </div>
    </div>
  );
};

const AgastyarAcademy: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();

  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, stats, loading: loadingData, error: loadError, refresh, getPhaseModules } =
    useAyurvedaProgress(membershipReady);

  const [activePhase, setActivePhase] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const phaseStats = useMemo(() => {
    return PHASE_NUMBERS.map((num) => {
      const mods = courses.filter((c) => c.phase === num);
      const completed = mods.filter((c) => progressByModuleId[c.id]?.completed).length;
      return { num, total: mods.length, completed };
    });
  }, [courses, progressByModuleId]);

  const phaseAccess = useCallback(
    (phaseNum: number) =>
      hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(PHASE_TIER_SLUG[phaseNum])),
    [isAdmin, tier],
  );

  const activeModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return getPhaseModules(activePhase).filter((m) => {
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        (m.subtitle || '').toLowerCase().includes(q) ||
        (m.description || '').toLowerCase().includes(q) ||
        (m.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      const ct = (m.content_type || '').toLowerCase();
      const matchesType = filterType === 'all' || ct === filterType;
      return matchesSearch && matchesType;
    });
  }, [getPhaseModules, activePhase, searchQuery, filterType]);

  const currentPhaseTier = PHASE_TIER_SLUG[activePhase];
  const currentPhaseAccess = phaseAccess(activePhase);
  const phaseIndex = Math.min(5, Math.max(1, activePhase));
  const sanskritName = t(`academy.modulePlayer.phaseNames.p${phaseIndex}` as const);

  const progressSummary = useMemo(() => {
    let unlocked = 0;
    let completed = 0;
    courses.forEach((c) => {
      const need = getCourseTierRequiredRank(c.tier_required);
      if (hasFeatureAccess(isAdmin, tier, need)) {
        unlocked += 1;
        if (progressByModuleId[c.id]?.completed) completed += 1;
      }
    });
    return { unlocked, completed, total: courses.length };
  }, [courses, progressByModuleId, isAdmin, tier]);

  if (membershipLoading || !settled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050505]">
        <div
          className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin"
          aria-hidden
        />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/40">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden pb-28 text-white/90" style={{ background: '#050505' }}>
      {/* Compact header — title, one-line subtitle, single progress bar */}
      <div className="relative border-b border-white/[0.05] pb-8 pt-8 sm:pt-10">
        <div className="relative z-[1] mx-auto max-w-3xl px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/55 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            <ArrowLeft size={14} className="text-[#D4AF37]/80" aria-hidden />
            {t('academy.back')}
          </button>

          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl"
              style={{ background: 'radial-gradient(120% 120% at 20% 20%, rgba(52,211,153,0.3), rgba(5,5,5,0.9))', border: '1px solid rgba(52,211,153,0.42)' }}
            >
              🪷
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-[26px] font-semibold leading-tight"
                style={{ fontFamily: "'Cormorant Garamond',serif" }}
              >
                {t('academy.title')}
              </p>
              {user && (
                <p className="mt-1 text-[11px] font-extrabold" style={{ color: '#34D399' }}>
                  {stats.completedModules} / {courses.length || 108} · {stats.completionPercent}%
                </p>
              )}
            </div>
          </div>

          {user ? (
            <div className="mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${stats.completionPercent}%`, background: 'linear-gradient(90deg,#34D399,rgba(52,211,153,0.6))' }}
              />
            </div>
          ) : (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] px-10 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#050505] shadow-[0_0_40px_rgba(212,175,55,0.22)]"
              >
                {t('academy.hub.beginInitiation')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        <section className="mb-10">
          <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.45em] text-white/35">
            {t('academy.hub.phasesOfMastery')}
          </h2>

          <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.012] overflow-hidden">
            {phaseStats.map(({ num, total, completed }, idx) => {
              const tierSlug = PHASE_TIER_SLUG[num];
              const color = PHASE_HEX[num];
              const hasAccess = phaseAccess(num);
              const isOpen = activePhase === num;
              const isDone = total > 0 && completed >= total;
              const pct = total > 0 ? (completed / total) * 100 : 0;
              const tierShort = t(tierLabelKey(tierSlug));

              return (
                <div key={num} className={idx > 0 ? 'border-t border-white/[0.05]' : ''}>
                  <button
                    type="button"
                    onClick={() => setActivePhase(isOpen ? 0 : num)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black"
                        style={{
                          background: isDone ? 'rgba(52,211,153,0.16)' : isOpen ? `${color}22` : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${isDone ? 'rgba(52,211,153,0.5)' : isOpen ? `${color}88` : 'rgba(255,255,255,0.12)'}`,
                          color: isDone ? '#34D399' : isOpen ? color : 'rgba(255,255,255,0.4)',
                          boxShadow: isOpen ? `0 0 0 3px ${color}18` : 'none',
                        }}
                      >
                        {isDone ? <CheckCircle2 size={16} aria-hidden /> : !hasAccess ? <Lock size={13} aria-hidden /> : num}
                      </div>
                      <div className="min-w-0">
                        <p
                          className="truncate text-[15px] font-bold"
                          style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.15rem', color: 'rgba(255,255,255,0.92)' }}
                        >
                          {num}. {sanskritForPhase(num, t)}
                        </p>
                        <p className="mt-0.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                          {hasAccess
                            ? t('academy.hub.phaseModulesDone', { completed, total })
                            : `${t('academy.hub.phaseModulesCatalog', { total })} · ${tierShort}`}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className="shrink-0 text-white/30 transition-transform duration-200"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                      aria-hidden
                    />
                  </button>

                  <div className="px-5 pb-1">
                    <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${hasAccess ? pct : 0}%`, backgroundColor: hasAccess ? color : 'rgba(255,255,255,0.12)' }}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-6 pt-4">
                      {!hasAccess ? (
                        <UpgradeGateSection
                          tierSlug={tierSlug}
                          phaseLabel={sanskritForPhase(num, t)}
                          moduleCount={total}
                        />
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {getPhaseModules(num).map((c) => (
                            <HubModuleCard
                              key={c.id}
                              module={c}
                              isAdmin={isAdmin}
                              tier={tier}
                              progress={progressByModuleId[c.id]}
                              onNavigateModule={() => navigate(`/agastyar-academy/module/${c.id}`)}
                              onNavigateUpgrade={(href) => navigate(href)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
            {t('academy.modules.loadError')}
            <span className="mt-1 block font-mono text-xs text-red-300/70">{loadError}</span>
          </div>
        )}

        {loadingData && courses.length === 0 && (
          <div className="flex justify-center py-20">
            <div
              className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin"
              aria-hidden
            />
          </div>
        )}

        <footer className="mt-10 pb-8 text-center">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.45em] text-white/25">{t('academy.footer')}</p>
        </footer>
      </div>
    </div>
  );
};

function sanskritForPhase(n: number, t: (key: string) => string) {
  return t(`academy.modulePlayer.phaseNames.p${n}` as string);
}

function contentTypeLabel(t: (key: string) => string, ct: string | null | undefined) {
  const key = (ct || 'video').toLowerCase().replace(/[^a-z-]/g, '') || 'video';
  const k = `academy.modulePlayer.contentTypeLabels.${key}`;
  const out = t(k);
  return out === k ? t('academy.modulePlayer.contentTypeLabels.video') : out;
}

const HubModuleCard: React.FC<{
  module: AyurvedaCourseRow;
  progress?: { completed: boolean; progress_percent: number | null; bookmarked?: boolean | null };
  isAdmin: boolean;
  tier: string | undefined | null;
  onNavigateModule: () => void;
  onNavigateUpgrade: (href: string) => void;
}> = ({ module: m, progress: prog, isAdmin, tier, onNavigateModule, onNavigateUpgrade }) => {
  const { t } = useTranslation();
  const completed = prog?.completed ?? false;
  const pct = completed ? 100 : Math.min(100, Math.max(0, prog?.progress_percent ?? 0));
  const need = getCourseTierRequiredRank(m.tier_required);
  const allowed = hasFeatureAccess(isAdmin, tier, need);
  const slug = (m.tier_required || 'free').toLowerCase();
  const tierColor =
    slug.includes('akasha') ? 'rgba(167,139,250,0.95)' : slug.includes('siddha') ? '#D4AF37' : slug.includes('prana') ? 'rgba(74,222,128,0.95)' : 'rgba(156,163,175,0.85)';
  const glow =
    slug.includes('akasha')
      ? 'rgba(167,139,250,0.12)'
      : slug.includes('siddha')
        ? 'rgba(212,175,55,0.12)'
        : slug.includes('prana')
          ? 'rgba(74,222,128,0.12)'
          : 'rgba(156,163,175,0.08)';
  const upgradeHref = getSalesPageForRank(need);

  return (
    <button
      type="button"
      onClick={() => (allowed ? onNavigateModule() : onNavigateUpgrade(upgradeHref))}
      className={`relative w-full overflow-hidden rounded-[22px] border p-5 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/25 ${
        completed ? 'border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/08 to-transparent' : 'border-white/[0.06] bg-white/[0.02]'
      }`}
      style={{ backdropFilter: 'blur(40px)' }}
    >
      <span className="absolute right-4 top-4 text-[9px] font-extrabold tracking-wide text-white/15">
        #{String(m.module_number).padStart(3, '0')}
      </span>
      <div
        className="mb-3 inline-flex items-center gap-1 rounded-md border px-2 py-0.5"
        style={{ background: glow, borderColor: `${tierColor}33` }}
      >
        {!allowed && <Lock size={9} style={{ color: tierColor }} aria-hidden />}
        {completed && <CheckCircle2 size={9} className="text-[#D4AF37]" aria-hidden />}
        <span className="text-[7px] font-extrabold uppercase tracking-[0.35em]" style={{ color: tierColor }}>
          {t(tierLabelKey(m.tier_required || 'free'))}
        </span>
      </div>
      <h3 className={`pr-10 text-sm font-black leading-snug ${allowed ? 'text-white' : 'text-white/45'}`}>{m.title}</h3>
      {m.subtitle && (
        <p className={`mt-1 text-[11px] ${allowed ? 'text-[#D4AF37]/75' : 'text-[#D4AF37]/35'}`}>{m.subtitle}</p>
      )}
      {m.description && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/40">{m.description}</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30">
          {m.duration_minutes != null && (
            <span className="inline-flex items-center gap-1">
              <Clock size={10} aria-hidden />
              {m.duration_minutes}m
            </span>
          )}
          <span className="inline-flex items-center gap-1 capitalize">
            {(m.content_type || 'video').toLowerCase() === 'video' && <Play size={10} aria-hidden />}
            {(m.content_type || '').toLowerCase() === 'audio' && <Music size={10} aria-hidden />}
            {(m.content_type || '').toLowerCase() === 'pdf' && <FileText size={10} aria-hidden />}
            {(m.content_type || '').toLowerCase() === 'interactive' && <Zap size={10} aria-hidden />}
            {(m.content_type || '').toLowerCase() === 'live' && <Users size={10} aria-hidden />}
            {!m.content_type && <Play size={10} aria-hidden />}
            {contentTypeLabel(t, m.content_type)}
          </span>
        </div>
        {allowed ? (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
              completed ? 'border-[#D4AF37]/35 bg-[#D4AF37]/12 text-[#D4AF37]' : 'border-white/[0.1] text-white/45'
            }`}
          >
            {completed ? <CheckCircle2 size={14} aria-hidden /> : <Play size={12} className="translate-x-px" aria-hidden />}
          </span>
        ) : (
          <span className="text-[8px] font-extrabold uppercase tracking-[0.28em]" style={{ color: tierColor }}>
            {t('academy.modules.unlockCta')} →
          </span>
        )}
      </div>
      {allowed && pct > 0 && !completed && (
        <div className="mt-3 h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${pct}%` }} />
        </div>
      )}
    </button>
  );
};

const UpgradeGateSection: React.FC<{ tierSlug: string; phaseLabel: string; moduleCount: number }> = ({
  tierSlug,
  phaseLabel,
  moduleCount,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accent =
    tierSlug.includes('akasha') ? '#A78BFA' : tierSlug.includes('siddha') ? '#D4AF37' : '#4ADE80';
  const href = getSalesPageForRank(getCourseTierRequiredRank(tierSlug));

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border p-10 text-center backdrop-blur-[40px]"
      style={{ borderColor: `${accent}44`, background: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, ${accent}14, transparent 72%)` }}
      />
      <div className="relative z-[1]">
        <Lock className="mx-auto mb-4 h-11 w-11 opacity-50" style={{ color: accent }} aria-hidden />
        <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em]" style={{ color: accent }}>
          {t('academy.hub.upgradeGateKicker', { tier: t(tierLabelKey(tierSlug)) })}
        </p>
        <p className="mb-3 text-xl font-black text-white">{t('academy.hub.upgradeGateTitle', { phase: phaseLabel })}</p>
        <p className="mx-auto mb-8 max-w-md text-sm text-white/45">{t('academy.hub.upgradeGateBody', { count: moduleCount })}</p>
        <button
          type="button"
          onClick={() => navigate(href)}
          className="rounded-full px-10 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#050505]"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}bb)`,
            boxShadow: `0 0 28px ${accent}33`,
          }}
        >
          {t('academy.hub.upgradeGateCta')}
        </button>
      </div>
    </div>
  );
};

export default AgastyarAcademy;
