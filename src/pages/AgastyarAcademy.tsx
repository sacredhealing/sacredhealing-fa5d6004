import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
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
      {/* Hero */}
      <div className="relative border-b border-white/[0.05] pb-14 pt-16 sm:pt-20">
        <ParticleField />
        <div
          className="pointer-events-none absolute left-1/2 top-[-100px] h-[400px] w-[min(600px,100vw)] -translate-x-1/2 rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.09) 0%, transparent 72%)',
          }}
        />
        <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/55 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            <ArrowLeft size={14} className="text-[#D4AF37]/80" aria-hidden />
            {t('academy.back')}
          </button>

          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]">
              <Sparkles size={11} aria-hidden />
              {t('academy.hub.heroBadge')}
              <Sparkles size={11} aria-hidden />
            </span>
          </div>

          <h1 className="mb-4 bg-gradient-to-br from-white via-[#D4AF37]/95 to-[#D4AF37]/50 bg-clip-text text-center text-3xl font-black tracking-[-0.04em] text-transparent sm:text-5xl">
            {t('academy.title')}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-center text-sm leading-relaxed text-white/45 sm:text-base">
            {t('academy.hub.heroSubtitle')}
          </p>

          {user && (
            <div className="mx-auto mb-4 flex max-w-4xl flex-wrap justify-center gap-3">
              <StatCard
                label={t('academy.hub.statsModulesComplete')}
                value={stats.completedModules}
                icon={<CheckCircle2 size={18} aria-hidden />}
              />
              <StatCard
                label={t('academy.hub.statsCurrentPhase')}
                value={stats.currentPhase}
                icon={<TrendingUp size={18} aria-hidden />}
              />
              <StatCard
                label={t('academy.hub.statsHoursLearned')}
                value={Math.round(stats.totalMinutesLearned / 60)}
                icon={<Clock size={18} aria-hidden />}
              />
              <StatCard
                label={t('academy.hub.statsCompletion')}
                value={`${stats.completionPercent}%`}
                icon={<Award size={18} aria-hidden />}
                accent="#A78BFA"
              />
            </div>
          )}

          {!user && (
            <div className="text-center">
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

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {user && (
          <div className="mb-10 rounded-[28px] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-6 backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
                <Leaf className="text-[#D4AF37]" size={26} aria-hidden />
              </div>
              <div>
                <p className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/85">
                  {t('academy.hub.doshaKicker')}
                </p>
                <p className="mb-1 text-lg font-black text-white/95">{t('academy.hub.doshaTitle')}</p>
                <p className="text-sm text-white/45">{t('academy.hub.doshaBody')}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/ayurveda')}
              className="mt-5 w-full shrink-0 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-6 py-3 text-[9px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37] transition hover:bg-[#D4AF37]/15 sm:mt-0 sm:w-auto"
            >
              {t('academy.hub.doshaCta')}
            </button>
          </div>
        )}

        <section className="mb-10">
          <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/70">
            {t('academy.hub.quickLinks')}
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/jyotish-vidya"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
            >
              <Star size={16} aria-hidden />
              {t('academy.links.jyotishVidya')}
            </Link>
            <Link
              to="/quantum-apothecary"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]"
            >
              <BookOpen size={16} aria-hidden />
              {t('academy.links.apothecary')}
              {!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.quantumApothecary) && (
                <Lock size={12} className="text-white/35" aria-hidden />
              )}
            </Link>
            <Link
              to="/temple-home"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
            >
              <Home size={16} aria-hidden />
              {t('academy.links.temple')}
              {!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.templeHome) && (
                <Lock size={12} className="text-white/35" aria-hidden />
              )}
            </Link>
            <Link
              to="/nadi-scanner"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
            >
              <Radio size={16} aria-hidden />
              {t('academy.links.nadi')}
            </Link>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.45em] text-white/35">
            {t('academy.hub.phasesOfMastery')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {phaseStats.map(({ num, total, completed }) => {
              const tierSlug = PHASE_TIER_SLUG[num];
              const color = PHASE_HEX[num];
              const hasAccess = phaseAccess(num);
              const isActive = activePhase === num;
              const isDone = total > 0 && completed >= total;
              const pct = total > 0 ? (completed / total) * 100 : 0;
              const tierShort = t(tierLabelKey(tierSlug));

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => setActivePhase(num)}
                  className={`relative min-w-[160px] flex-1 overflow-hidden rounded-[24px] border p-5 text-left transition ${
                    isActive ? 'border-white/[0.12]' : 'border-white/[0.06] hover:border-[#D4AF37]/15'
                  }`}
                  style={{
                    background: isActive ? `rgba(${phaseHexToRgb(color)},0.09)` : 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(40px)',
                    borderColor: isActive ? `${color}55` : undefined,
                  }}
                >
                  {isActive && (
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                      style={{ background: `radial-gradient(circle, ${color}35, transparent 70%)` }}
                    />
                  )}
                  <div className="relative z-[1] mb-3 opacity-90">
                    <PhaseGlyph phase={num} />
                  </div>
                  <p className="relative z-[1] mb-2 text-[8px] font-extrabold uppercase tracking-[0.38em]" style={{ color }}>
                    {t('academy.hub.phaseTierLine', { n: num, tier: tierShort })}
                  </p>
                  <p className="relative z-[1] text-base font-black text-white">{sanskritForPhase(num, t)}</p>
                  <p className="relative z-[1] mt-1 text-[11px] text-white/40">
                    {t(`academy.hub.phaseTagline.p${num}` as const)}
                  </p>
                  <div className="relative z-[1] mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${hasAccess ? pct : 0}%`,
                        backgroundColor: hasAccess ? color : 'rgba(255,255,255,0.12)',
                      }}
                    />
                  </div>
                  <div className="relative z-[1] mt-2 flex items-center justify-between text-[10px] text-white/40">
                    <span>
                      {hasAccess
                        ? t('academy.hub.phaseModulesDone', { completed, total })
                        : t('academy.hub.phaseModulesCatalog', { total })}
                    </span>
                    {!hasAccess && <Lock size={12} className="text-white/25" aria-hidden />}
                    {isDone && hasAccess && <CheckCircle2 size={14} style={{ color }} aria-hidden />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em]"
              style={{ color: PHASE_HEX[phaseIndex] }}
            >
              {t('academy.hub.activePhaseHeadline', { n: activePhase, sanskrit: sanskritName })}
            </p>
            <p className="text-xl font-black text-white">{t(`academy.hub.phaseTagline.p${phaseIndex}` as const)}</p>
            <p className="mt-2 max-w-xl text-sm text-white/45">{t(`academy.hub.phaseDesc.p${phaseIndex}` as const)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <Search size={13} className="text-white/35" aria-hidden />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('academy.hub.searchPlaceholder')}
                className="w-[140px] border-none bg-transparent text-xs text-white outline-none placeholder:text-white/25 sm:w-[180px]"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 text-[11px] text-white/60 outline-none"
            >
              <option value="all">{t('academy.hub.filterAllTypes')}</option>
              <option value="video">{t('academy.hub.filterVideo')}</option>
              <option value="audio">{t('academy.hub.filterAudio')}</option>
              <option value="pdf">{t('academy.hub.filterPdf')}</option>
              <option value="interactive">{t('academy.hub.filterInteractive')}</option>
              <option value="live">{t('academy.hub.filterLive')}</option>
            </select>
            <button
              type="button"
              onClick={() => void refresh()}
              className="rounded-xl border border-white/[0.08] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45 hover:text-[#D4AF37]"
            >
              {t('academy.hub.refreshCatalog')}
            </button>
          </div>
        </section>

        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
            {t('academy.modules.loadError')}
            <span className="mt-1 block font-mono text-xs text-red-300/70">{loadError}</span>
          </div>
        )}

        {loadingData && courses.length === 0 ? (
          <div className="flex justify-center py-20">
            <div
              className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin"
              aria-hidden
            />
          </div>
        ) : !currentPhaseAccess ? (
          <UpgradeGateSection
            tierSlug={currentPhaseTier}
            phaseLabel={sanskritName}
            moduleCount={courses.filter((c) => c.phase === activePhase).length}
          />
        ) : activeModules.length === 0 ? (
          <div className="rounded-[28px] border border-white/[0.06] py-16 text-center text-white/35">
            <BookOpen className="mx-auto mb-3 h-9 w-9 opacity-30" aria-hidden />
            <p>{courses.length === 0 ? t('academy.modules.empty') : t('academy.hub.noMatches')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeModules.map((c) => (
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

        <section className="glass-card mt-14 rounded-[32px] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.04] p-8 text-center backdrop-blur-[40px] sm:p-10">
          <GraduationCap className="mx-auto mb-4 text-[#D4AF37]/60" size={32} aria-hidden />
          <p className="mb-3 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/70">
            {t('academy.hub.closingQuoteTitle')}
          </p>
          <p className="mx-auto mb-4 max-w-3xl text-[15px] italic leading-relaxed text-white/70">{t('academy.quote')}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]/55">{t('academy.quoteAttribution')}</p>
        </section>

        <section className="mt-12">
          <h2 className="mb-6 text-center text-[10px] font-extrabold uppercase tracking-[0.45em] text-white/35">
            {t('academy.hub.pathToMastery')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PAID_TIER_SLUGS.map((slug) => {
              const conv = paidSlugToConversionKey(slug);
              const label = t(`conversion.tiers.${conv}.label`);
              const price = t(`conversion.tiers.${conv}.price`);
              const accent =
                slug === 'prana-flow' ? '#4ADE80' : slug === 'siddha-quantum' ? '#D4AF37' : '#A78BFA';
              const userR = getTierRank(tier);
              const needR = getCourseTierRequiredRank(slug);
              const isYours = !isAdmin && canonicalPaidSlug(tier) === slug;

              return (
                <div
                  key={slug}
                  className="relative overflow-hidden rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-xl"
                  style={{
                    borderColor: isYours ? `${accent}44` : undefined,
                    boxShadow: isYours ? `0 0 40px ${accent}12` : undefined,
                  }}
                >
                  {isYours && (
                    <span
                      className="absolute right-3 top-3 rounded px-2 py-0.5 text-[7px] font-extrabold uppercase tracking-[0.25em]"
                      style={{ border: `1px solid ${accent}44`, color: accent }}
                    >
                      {t('academy.hub.yourTierBadge')}
                    </span>
                  )}
                  <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.4em]" style={{ color: accent }}>
                    {label}
                  </p>
                  <p className="text-lg font-black text-white">{price}</p>
                  {!isAdmin && userR < needR ? (
                    <button
                      type="button"
                      onClick={() => navigate(getSalesPageForRank(needR))}
                      className="mt-5 w-full rounded-xl border py-2.5 text-[8px] font-extrabold uppercase tracking-[0.28em] transition hover:bg-white/[0.05]"
                      style={{ borderColor: `${accent}55`, color: accent }}
                    >
                      {t('academy.hub.tierExploreCta')}
                    </button>
                  ) : !isAdmin ? (
                    <p className="mt-5 text-[10px] text-white/35">{t('academy.hub.tierIncluded')}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[28px] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.06] px-5 py-4">
          <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">{t('academy.progress.title')}</p>
          <p className="mt-1 text-sm text-white/70">
            {t('academy.progress.summary', {
              completed: progressSummary.completed,
              unlocked: progressSummary.unlocked,
            })}
          </p>
          <p className="mt-2 text-[10px] text-white/35">
            {t('academy.progress.catalog')}: <span className="font-black text-[#D4AF37]">{progressSummary.total}</span>
          </p>
        </section>

        <footer className="mt-12 pb-8 text-center">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.45em] text-white/35">{t('academy.footer')}</p>
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
