import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Lock,
  Sparkles,
  ExternalLink,
  Radio,
  Home,
  Leaf,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAyurvedaProgress, type AyurvedaCourseRow } from '@/hooks/useAyurvedaProgress';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import {
  getCourseTierRequiredRank,
  getSalesPageForRank,
  hasFeatureAccess,
  FEATURE_TIER,
} from '@/lib/tierAccess';

function tierLabelKey(tierSlug: string): string {
  const s = (tierSlug || 'free').toLowerCase();
  if (s.includes('akasha')) return 'conversion.tiers.akasha.label';
  if (s.includes('siddha')) return 'conversion.tiers.siddha.label';
  if (s.includes('prana')) return 'conversion.tiers.prana.label';
  return 'conversion.tiers.free.label';
}

function tierPriceKey(tierSlug: string): string | null {
  const s = (tierSlug || 'free').toLowerCase();
  if (s.includes('akasha')) return 'conversion.tiers.akasha.price';
  if (s.includes('siddha')) return 'conversion.tiers.siddha.price';
  if (s.includes('prana')) return 'conversion.tiers.prana.price';
  return null;
}

const AgastyarAcademy: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();

  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, loading: loadingData, error: loadError, refresh } =
    useAyurvedaProgress(membershipReady);

  const phases = useMemo(
    () => [
      { n: 1, titleKey: 'academy.phases.p1.title', subKey: 'academy.phases.p1.sub' },
      { n: 2, titleKey: 'academy.phases.p2.title', subKey: 'academy.phases.p2.sub' },
      { n: 3, titleKey: 'academy.phases.p3.title', subKey: 'academy.phases.p3.sub' },
      { n: 4, titleKey: 'academy.phases.p4.title', subKey: 'academy.phases.p4.sub' },
      { n: 5, titleKey: 'academy.phases.p5.title', subKey: 'academy.phases.p5.sub' },
    ],
    [],
  );

  const tierCards = useMemo(
    () => [
      {
        tierKey: 'free',
        slug: 'free',
        phaseAccessKey: 'academy.tiers.free.phases',
        modulesKey: 'academy.tiers.free.modules',
      },
      {
        tierKey: 'prana',
        slug: 'prana-flow',
        phaseAccessKey: 'academy.tiers.prana.phases',
        modulesKey: 'academy.tiers.prana.modules',
      },
      {
        tierKey: 'siddha',
        slug: 'siddha-quantum',
        phaseAccessKey: 'academy.tiers.siddha.phases',
        modulesKey: 'academy.tiers.siddha.modules',
      },
      {
        tierKey: 'akasha',
        slug: 'akasha-infinity',
        phaseAccessKey: 'academy.tiers.akasha.phases',
        modulesKey: 'academy.tiers.akasha.modules',
      },
    ],
    [],
  );

  const progressSummary = useMemo(() => {
    let unlocked = 0;
    let completed = 0;
    courses.forEach((c) => {
      const need = getCourseTierRequiredRank(c.tier_required);
      if (hasFeatureAccess(isAdmin, tier, need)) {
        unlocked += 1;
        const p = progressByModuleId[c.id];
        if (p?.completed) completed += 1;
      }
    });
    return { unlocked, completed, total: courses.length };
  }, [courses, progressByModuleId, isAdmin, tier]);

  if (membershipLoading || !settled) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4"
        style={{ background: '#050505' }}
      >
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
    <div className="min-h-screen pb-28 text-white/90" style={{ background: '#050505' }}>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 15%, rgba(212,175,55,0.06) 0%, transparent 45%), radial-gradient(ellipse at 80% 70%, rgba(212,175,55,0.04) 0%, transparent 40%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/55 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
        >
          <ArrowLeft size={14} className="text-[#D4AF37]/80" aria-hidden />
          {t('academy.back')}
        </button>

        <header className="mb-10 text-center sm:text-left">
          <p className="mb-3 text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/50">
            {t('academy.kicker')}
          </p>
          <h1 className="mb-4 text-2xl font-black tracking-[-0.05em] text-[#D4AF37] sm:text-4xl [text-shadow:0_0_18px_rgba(212,175,55,0.25)]">
            {t('academy.title')}
          </h1>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-white/60 sm:mx-0">
            {t('academy.subtitle')}
          </p>
        </header>

        <section className="glass-card mb-10 rounded-[40px] border border-white/[0.05] bg-white/[0.02] p-6 backdrop-blur-[40px] sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/20 to-transparent">
              <GraduationCap className="text-[#D4AF37]" size={28} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-3 text-[15px] italic leading-relaxed text-white/75">{t('academy.quote')}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]/55">
                {t('academy.quoteAttribution')}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/70">
            {t('academy.architecture.title')}
          </h2>
          <ul className="space-y-3 text-sm leading-relaxed text-white/55">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i} className="flex gap-3">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]/50" aria-hidden />
                <span>{t(`academy.architecture.bullet${i}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-center text-[10px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/70 sm:text-left">
            {t('academy.tiers.title')}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {tierCards.map((card) => {
              const label = t(`conversion.tiers.${card.tierKey}.label`);
              const price =
                card.tierKey === 'free'
                  ? t('academy.tiers.priceFree')
                  : t(`conversion.tiers.${card.tierKey}.price`);
              return (
                <div
                  key={card.slug}
                  className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-5 backdrop-blur-xl"
                >
                  <p className="text-[8px] font-extrabold uppercase tracking-[0.4em] text-white/45">
                    {t('academy.tiers.tierLabel', { name: label })}
                  </p>
                  <p className="mt-2 text-lg font-black tracking-tight text-[#D4AF37]">{price}</p>
                  <p className="mt-3 text-xs text-white/55">{t(card.phaseAccessKey)}</p>
                  <p className="mt-1 text-[11px] text-white/40">{t(card.modulesKey)}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/70">
            {t('academy.phasesStrip.title')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {phases.map((p) => (
              <div
                key={p.n}
                className="min-w-[140px] flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-3"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#D4AF37]/80">
                  {t('academy.phaseNumber', { n: p.n })}
                </p>
                <p className="mt-1 text-xs font-bold text-white/80">{t(p.titleKey)}</p>
                <p className="mt-0.5 text-[10px] text-white/45">{t(p.subKey)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-[#D4AF37]/15 bg-[#D4AF37]/[0.06] px-5 py-4">
          <div>
            <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/50">
              {t('academy.progress.title')}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {t('academy.progress.summary', {
                completed: progressSummary.completed,
                unlocked: progressSummary.unlocked,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/40">{t('academy.progress.catalog')}</p>
            <p className="text-xl font-black tabular-nums text-[#D4AF37]">{progressSummary.total}</p>
          </div>
        </section>

        <section className="mb-10 flex flex-wrap gap-3">
          <Link
            to="/quantum-apothecary"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:border-[#D4AF37]/35"
          >
            <BookOpen size={16} aria-hidden />
            {t('academy.links.apothecary')}
            {!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.quantumApothecary) && (
              <Lock size={12} className="text-white/35" aria-hidden />
            )}
          </Link>
          <Link
            to="/ayurveda"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
          >
            <Leaf size={16} aria-hidden />
            {t('academy.links.dosha')}
          </Link>
          <Link
            to="/temple-home"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
          >
            <Home size={16} aria-hidden />
            {t('academy.links.temple')}
            {!hasFeatureAccess(isAdmin, tier, FEATURE_TIER.templeHome) && (
              <Lock size={12} className="text-white/35" aria-hidden />
            )}
          </Link>
          <Link
            to="/nadi-scanner"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
          >
            <Radio size={16} aria-hidden />
            {t('academy.links.nadi')}
          </Link>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/70">
              {t('academy.modules.title')}
            </h2>
            <button
              type="button"
              onClick={() => void refresh()}
              className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 underline-offset-4 hover:text-[#D4AF37] hover:underline"
            >
              {t('academy.modules.refresh')}
            </button>
          </div>

          {loadError && (
            <div className="mb-4 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
              {t('academy.modules.loadError')}
              <span className="mt-1 block font-mono text-xs text-red-300/70">{loadError}</span>
            </div>
          )}

          {loadingData ? (
            <div className="flex justify-center py-16">
              <div
                className="h-10 w-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin"
                aria-hidden
              />
            </div>
          ) : courses.length === 0 ? (
            <p className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-6 py-10 text-center text-sm text-white/45">
              {t('academy.modules.empty')}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {courses.map((c) => {
                const needRank = getCourseTierRequiredRank(c.tier_required);
                const allowed = hasFeatureAccess(isAdmin, tier, needRank);
                const prog = progressByModuleId[c.id];
                const pct = prog?.completed ? 100 : Math.min(100, Math.max(0, prog?.progress_percent ?? 0));
                const upgradeHref = getSalesPageForRank(needRank);
                const tierName = t(tierLabelKey(c.tier_required || 'free'));
                return (
                  <div
                    key={c.id}
                    className={`relative rounded-[28px] border p-5 backdrop-blur-xl transition ${
                      allowed
                        ? 'border-white/[0.08] bg-white/[0.03]'
                        : 'border-white/[0.05] bg-white/[0.015] opacity-80'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[8px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37]/55">
                          {t('academy.modules.moduleMeta', {
                            num: c.module_number,
                            phase: c.phase,
                          })}
                        </p>
                        <h3 className="mt-1 text-base font-black leading-snug tracking-tight text-white/90">
                          {c.title}
                        </h3>
                      </div>
                      {!allowed && (
                        <Lock className="mt-1 h-5 w-5 shrink-0 text-[#D4AF37]/45" aria-hidden />
                      )}
                    </div>
                    {c.description && (
                      <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-white/50">{c.description}</p>
                    )}
                    <div className="mb-3 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider text-white/35">
                      {c.duration_minutes != null && (
                        <span className="rounded-lg bg-white/[0.06] px-2 py-1">
                          {t('academy.modules.duration', { minutes: c.duration_minutes })}
                        </span>
                      )}
                      {c.content_type && (
                        <span className="rounded-lg bg-white/[0.06] px-2 py-1">{c.content_type}</span>
                      )}
                      <span className="rounded-lg bg-[#D4AF37]/10 px-2 py-1 text-[#D4AF37]/70">
                        {tierName}
                      </span>
                    </div>
                    {allowed && (
                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-[9px] uppercase tracking-wider text-white/40">
                          <span>{t('academy.modules.progressLabel')}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#D4AF37]/40 to-[#D4AF37]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {!allowed ? (
                      <button
                        type="button"
                        onClick={() => navigate(upgradeHref)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                      >
                        {t('academy.modules.unlockCta')}
                        {tierPriceKey(c.tier_required || '') && (
                          <span className="text-white/50">
                            ({t(tierPriceKey(c.tier_required || '')!)})
                          </span>
                        )}
                        <ExternalLink size={14} aria-hidden />
                      </button>
                    ) : (
                      <Link
                        to={`/agastyar-academy/module/${c.id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-[#D4AF37]/20"
                      >
                        {t('academy.modules.openModule')}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="mt-14 pb-8 text-center">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.45em] text-white/35">{t('academy.footer')}</p>
        </footer>
      </div>
    </div>
  );
};

export default AgastyarAcademy;
