import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Lock,
  Sparkles,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useJyotishVidyaProgress } from '@/hooks/useJyotishVidyaProgress';
import {
  canAccessJyotishModule,
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

const JyotishVidya: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;

  const { modules, progressByModuleId, loading, error, refresh, stats } =
    useJyotishVidyaProgress(membershipReady);

  const tierRows = useMemo(
    () => [
      { key: 'i', slug: 'free' as const },
      { key: 'ii', slug: 'prana-flow' as const },
      { key: 'iii', slug: 'siddha-quantum' as const },
      { key: 'iv', slug: 'akasha-infinity' as const },
    ],
    [],
  );

  if (!membershipReady || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050505]">
        <Sparkles className="h-10 w-10 animate-pulse text-[#D4AF37]" aria-hidden />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/40">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-28 text-white/90">
      <div className="relative overflow-hidden border-b border-white/[0.06]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.35) 0%, transparent 45%), radial-gradient(circle at 80% 60%, rgba(34,211,238,0.12) 0%, transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
          >
            <ArrowLeft size={14} aria-hidden />
            {t('jyotishVidya.back')}
          </button>
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
              <Star className="h-8 w-8 text-[#D4AF37]" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.5em] text-white/50">
                {t('jyotishVidya.kicker')}
              </p>
              <h1 className="mb-3 text-3xl font-black tracking-[-0.05em] text-[#D4AF37] [text-shadow:0_0_15px_rgba(212,175,55,0.3)] sm:text-4xl">
                {t('jyotishVidya.title')}
              </h1>
              <p className="max-w-3xl text-sm leading-[1.6] text-white/60">{t('jyotishVidya.subtitle')}</p>
              {!user && (
                <p className="mt-4 max-w-3xl rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] px-4 py-3 text-xs text-white/55">
                  {t('jyotishVidya.guestBanner')}
                  <button
                    type="button"
                    onClick={() => navigate('/auth')}
                    className="ml-2 inline font-extrabold uppercase tracking-wide text-[#D4AF37]"
                  >
                    {t('jyotishVidya.loginCta')}
                  </button>
                </p>
              )}
            </div>
          </div>

          {user && (
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-5 py-5 backdrop-blur-[40px]">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/40">
                  {t('jyotishVidya.statsCompleted')}
                </p>
                <p className="mt-2 text-2xl font-black tabular-nums text-white">
                  {stats.completedModules}/{stats.totalModules}
                </p>
              </div>
              <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-5 py-5 backdrop-blur-[40px]">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/40">
                  {t('jyotishVidya.statsProgress')}
                </p>
                <p className="mt-2 text-2xl font-black tabular-nums text-[#D4AF37]">
                  {stats.completionPercent}%
                </p>
              </div>
              <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] px-5 py-5 backdrop-blur-[40px]">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/40">
                  {t('jyotishVidya.statsMinutes')}
                </p>
                <p className="mt-2 text-2xl font-black tabular-nums text-white">{stats.totalMinutesLearned}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="mb-12">
          <h2 className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/75">
            {t('jyotishVidya.tierMapTitle')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tierRows.map((row) => (
              <div
                key={row.key}
                className="rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-[40px]"
              >
                <p className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.45em] text-white/35">
                  {t(`jyotishVidya.tiers.${row.key}.label`)}
                </p>
                <p className="mb-2 text-lg font-black text-white/95">{t(tierLabelKey(row.slug))}</p>
                <p className="text-xs text-[#D4AF37]/90">{t(`jyotishVidya.tiers.${row.key}.price`)}</p>
                <p className="mt-3 text-xs leading-relaxed text-white/50">
                  {t(`jyotishVidya.tiers.${row.key}.modules`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-white/35">
            {t('jyotishVidya.modulesTitle')}
          </h2>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-full border border-white/[0.08] px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.25em] text-white/50 hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            {t('jyotishVidya.refresh')}
          </button>
        </section>

        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
            {t('jyotishVidya.loadError')}
            <span className="mt-1 block font-mono text-xs text-red-300/80">{error}</span>
          </div>
        )}

        {!error && modules.length === 0 && (
          <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center text-sm text-white/45">
            {t('jyotishVidya.emptyCatalog')}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((m) => {
            const open = canAccessJyotishModule({
              isAdmin,
              userId: user?.id,
              tier,
              moduleId: m.id,
            });
            const prog = progressByModuleId[m.id];
            const done = prog?.status === 'completed' || (prog?.completion_percentage ?? 0) >= 100;
            const href = `/jyotish-vidya/module/${m.id}`;
            const salesHref = getSalesPageForRank(getCourseTierRequiredRank(m.tier_required));

            return (
              <div
                key={m.id}
                className="group relative overflow-hidden rounded-[32px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-[40px] transition hover:border-[#D4AF37]/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37]/75">
                      {t('jyotishVidya.moduleMeta', { num: String(m.id).padStart(2, '0') })}
                      {!user && m.id <= 3 && (
                        <span className="ml-2 text-white/45">{t('jyotishVidya.previewBadge')}</span>
                      )}
                    </p>
                    <h3 className="text-lg font-black leading-snug text-white/95">{m.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-white/50">{m.subtitle}</p>
                  </div>
                  {done ? (
                    <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-400/90" aria-hidden />
                  ) : !open ? (
                    <Lock className="h-6 w-6 shrink-0 text-white/25" aria-hidden />
                  ) : (
                    <GraduationCap className="h-6 w-6 shrink-0 text-[#D4AF37]/45" aria-hidden />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={12} aria-hidden />
                    {t(tierLabelKey(m.tier_required))}
                  </span>
                  {m.duration_minutes != null && (
                    <span className="inline-flex items-center gap-1 text-white/30">
                      <Clock size={12} aria-hidden />
                      {t('jyotishVidya.durationMinutes', { minutes: m.duration_minutes })}
                    </span>
                  )}
                </div>
                <div className="mt-6">
                  {open ? (
                    <Link
                      to={href}
                      className="inline-flex w-full items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 py-3 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#D4AF37] transition group-hover:bg-[#D4AF37]/18"
                    >
                      {t('jyotishVidya.openModule')}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate(user ? salesHref : '/auth')}
                      className="inline-flex w-full items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] py-3 text-[10px] font-extrabold uppercase tracking-[0.28em] text-white/55 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
                    >
                      {user ? t('jyotishVidya.unlockCta') : t('jyotishVidya.loginToUnlock')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-white/25">
          {t('jyotishVidya.footer')}
        </p>
      </div>
    </div>
  );
};

export default JyotishVidya;
