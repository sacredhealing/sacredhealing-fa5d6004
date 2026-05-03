import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flame,
  Infinity,
  Lock,
  Star,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import {
  getCourseTierRequiredRank,
  getSalesPageForRank,
  canAccessJyotishModule,
} from '@/lib/tierAccess';
import { cn } from '@/lib/utils';
import {
  JYOTISH_MODULES,
  TIER_CONFIG,
  getModulesByTier,
  canAccessModule,
  type JyotishTier,
  type JyotishModule,
} from '@/lib/jyotishModules';

const TIER_ICONS = {
  free: BookOpen,
  prana: Flame,
  siddha: Star,
  akasha: Infinity,
} as const;

const TIER_ORDER: JyotishTier[] = ['free', 'prana', 'siddha', 'akasha'];

const TIER_I18N_ROW: Record<JyotishTier, 'i' | 'ii' | 'iii' | 'iv'> = {
  free: 'i',
  prana: 'ii',
  siddha: 'iii',
  akasha: 'iv',
};

interface ProgressMap {
  [moduleId: number]: { status: string; completion_percentage: number };
}

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
  const { tier: membershipTier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;

  const [activeTier, setActiveTier] = useState<JyotishTier>('free');
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [dataReady, setDataReady] = useState(false);

  const refreshProgress = useCallback(async () => {
    if (!user?.id) {
      setProgress({});
      setDataReady(true);
      return;
    }
    const { data: prog } = await supabase
      .from('jyotish_progress')
      .select('module_id,status,completion_percentage')
      .eq('user_id', user.id);
    const map: ProgressMap = {};
    (prog || []).forEach((r: { module_id: number; status: string; completion_percentage: number }) => {
      map[r.module_id] = { status: r.status, completion_percentage: r.completion_percentage };
    });
    setProgress(map);
    setDataReady(true);
  }, [user?.id]);

  useEffect(() => {
    if (!membershipReady) return;
    setDataReady(false);
    void refreshProgress();
  }, [membershipReady, refreshProgress]);

  const tier = membershipTier ?? 'free';

  const handleModuleClick = async (module: JyotishModule) => {
    const canAccess = canAccessModule(module, tier, { isAdmin, userId: user?.id });
    if (!canAccess) return;
    setExpandedModule((prev) => (prev === module.id ? null : module.id));
    if (user && !progress[module.id]) {
      await supabase.from('jyotish_progress').upsert(
        {
          user_id: user.id,
          module_id: module.id,
          status: 'in_progress',
          completion_percentage: 0,
          last_accessed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,module_id' },
      );
      setProgress((prev) => ({
        ...prev,
        [module.id]: { status: 'in_progress', completion_percentage: 0 },
      }));
    }
  };

  const completedCount = useMemo(
    () => Object.values(progress).filter((p) => p.status === 'completed').length,
    [progress],
  );

  const totalAccessible = useMemo(
    () =>
      JYOTISH_MODULES.filter((m) =>
        canAccessModule(m, tier, { isAdmin, userId: user?.id }),
      ).length,
    [tier, isAdmin, user?.id],
  );

  if (!membershipReady || !dataReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050505]">
        <Star className="h-10 w-10 animate-pulse text-[#D4AF37]" aria-hidden />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/40">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pb-28 font-sans text-white/90">
      {/* Hero */}
      <div className="relative border-b border-white/[0.05] px-6 pb-12 pt-16 text-center">
        <div className="mx-auto max-w-[720px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
          >
            <ArrowLeft size={14} aria-hidden />
            {t('jyotishVidya.back')}
          </button>
          <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]">
            {t('jyotishVidya.catalog.heroEyebrow')}
          </p>
          <h1 className="mb-4 text-[clamp(28px,5vw,48px)] font-black leading-tight tracking-[-0.04em] text-white">
            {t('jyotishVidya.catalog.heroTitleLine1')}
            <br />
            <span className="text-[#D4AF37]">{t('jyotishVidya.catalog.heroTitleAccent')}</span>
          </h1>
          <p className="mx-auto mb-8 max-w-[560px] text-sm leading-[1.7] text-white/50">
            {t('jyotishVidya.catalog.heroBody')}
          </p>

          {user && (
            <div className="mx-auto flex max-w-[400px] items-center gap-4 rounded-[20px] border border-white/[0.05] bg-white/[0.02] px-6 py-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex justify-between">
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.4em] text-white/40">
                    {t('jyotishVidya.catalog.yourProgress')}
                  </span>
                  <span className="text-xs font-bold text-[#D4AF37]">
                    {t('jyotishVidya.catalog.progressFraction', {
                      completed: completedCount,
                      total: totalAccessible,
                    })}
                  </span>
                </div>
                <div className="h-[3px] rounded-sm bg-white/[0.05]">
                  <div
                    className="h-full rounded-sm bg-[#D4AF37] transition-[width] duration-500 ease-out"
                    style={{
                      width: `${totalAccessible ? (completedCount / totalAccessible) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4">
        {/* Tier selector */}
        <div className="my-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {TIER_ORDER.map((tierKey) => {
            const cfg = TIER_CONFIG[tierKey];
            const Icon = TIER_ICONS[tierKey];
            const isActive = activeTier === tierKey;
            const firstMod = cfg.moduleRange[0];
            const tierReachable = canAccessJyotishModule({
              isAdmin,
              userId: user?.id,
              tier,
              moduleId: firstMod,
            });
            const isLocked = tierKey !== 'free' && !tierReachable;
            const modules = getModulesByTier(tierKey);
            const completedInTier = modules.filter((m) => progress[m.id]?.status === 'completed').length;
            const rowKey = TIER_I18N_ROW[tierKey];

            return (
              <button
                key={tierKey}
                type="button"
                onClick={() => setActiveTier(tierKey)}
                className={cn(
                  'relative overflow-hidden rounded-[24px] border px-3.5 pb-4 pt-[18px] text-left transition-colors',
                  isActive
                    ? 'border-[#D4AF37]/30 bg-[#D4AF37]/[0.06]'
                    : 'border-white/[0.05] bg-white/[0.02]',
                )}
              >
                <div
                  className="absolute left-0 right-0 top-0 h-0.5 rounded-t-[24px]"
                  style={{
                    backgroundColor: cfg.color,
                    opacity: isActive ? 1 : 0.4,
                  }}
                />
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={12} className="opacity-80" style={{ color: cfg.color }} aria-hidden />
                  <span
                    className="text-[8px] font-extrabold uppercase tracking-[0.4em]"
                    style={{ color: cfg.color }}
                  >
                    {t(`jyotishVidya.tiers.${rowKey}.label`)}
                  </span>
                  {isLocked && tierKey !== 'free' && (
                    <Lock size={9} className="ml-auto shrink-0 text-white/25" aria-hidden />
                  )}
                </div>
                <div className="mb-0.5 text-[13px] font-black tracking-[-0.03em] text-white">
                  {t(tierLabelKey(cfg.slug))}
                </div>
                <div className="mb-2.5 text-[10px] text-white/35">
                  {t(`jyotishVidya.tiers.${rowKey}.price`)}
                </div>
                {user && (
                  <div className="text-[9px] text-white/25">
                    {t('jyotishVidya.catalog.tierCompleted', {
                      completed: completedInTier,
                      total: modules.length,
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Modules */}
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {getModulesByTier(activeTier).map((module) => {
            const canAccess = canAccessModule(module, tier, { isAdmin, userId: user?.id });
            const prog = progress[module.id];
            const isExpanded = expandedModule === module.id;
            const tierCfg = TIER_CONFIG[module.tier];
            const rowKey = TIER_I18N_ROW[module.tier];
            const salesHref = getSalesPageForRank(getCourseTierRequiredRank(tierCfg.slug));

            return (
              <div
                key={module.id}
                role="button"
                tabIndex={0}
                onClick={() => void handleModuleClick(module)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void handleModuleClick(module);
                  }
                }}
                className={cn(
                  'rounded-[24px] border bg-white/[0.02] p-5 transition-all',
                  canAccess ? 'cursor-pointer' : 'cursor-default opacity-45',
                  isExpanded ? 'border-[#D4AF37]/20 md:col-span-2' : 'border-white/[0.05]',
                )}
              >
                <div className="mb-2.5 flex items-start gap-3">
                  <div className="shrink-0">
                    <div className="mb-1 text-[8px] font-extrabold uppercase tracking-[0.4em] text-[#D4AF37]/50">
                      {t('jyotishVidya.moduleMeta', { num: String(module.id).padStart(2, '0') })}
                    </div>
                    {module.isSecret && (
                      <div className="inline-block rounded border border-[#D4AF37]/15 bg-[#D4AF37]/[0.08] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.3em] text-[#D4AF37]">
                        {t('jyotishVidya.module.secretBadge')}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-sm font-black leading-snug tracking-[-0.02em] text-white">
                      {module.title}
                    </h3>
                    <p className="text-[11px] leading-snug text-white/40">{module.subtitle}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {!canAccess ? (
                      <Lock size={14} className="text-white/20" aria-hidden />
                    ) : isExpanded ? (
                      <ChevronUp size={14} className="text-white/40" aria-hidden />
                    ) : (
                      <ChevronDown size={14} className="text-white/40" aria-hidden />
                    )}
                  </div>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-white/45">{module.description}</p>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.3em]"
                    style={{
                      color: tierCfg.color,
                      backgroundColor: `${tierCfg.color}18`,
                      border: `1px solid ${tierCfg.color}25`,
                    }}
                  >
                    {t(tierLabelKey(tierCfg.slug))}
                  </span>
                  <span className="text-[10px] text-white/30">{module.duration}</span>
                  {prog && (
                    <div className="ml-auto flex items-center gap-1.5">
                      {prog.status === 'completed' ? (
                        <span className="text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#D4AF37]">
                          {t('jyotishVidya.catalog.completeBadge')}
                        </span>
                      ) : (
                        <>
                          <div className="h-0.5 w-[50px] rounded-sm bg-white/[0.05]">
                            <div
                              className="h-full rounded-sm bg-[#D4AF37]"
                              style={{ width: `${prog.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-white/25">{prog.completion_percentage}%</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && canAccess && (
                  <div className="mt-5 border-t border-white/[0.05] pt-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]">
                          {t('jyotishVidya.catalog.curriculumHeading')}
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {module.topics.map((topic, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-[11px] leading-snug text-white/55"
                            >
                              <span className="mt-0.5 shrink-0 text-[#D4AF37]/40">◈</span>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        {module.sourceText && (
                          <div className="mb-4">
                            <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.5em] text-white/30">
                              {t('jyotishVidya.module.sourceLabel')}
                            </p>
                            <p className="text-[11px] italic leading-relaxed text-white/40">
                              {module.sourceText}
                            </p>
                          </div>
                        )}
                        <div className="rounded-2xl border border-[#D4AF37]/[0.08] bg-black/30 p-4">
                          <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.5em] text-white/30">
                            {t('jyotishVidya.catalog.markProgressHeading')}
                          </p>
                          <div className="flex flex-col gap-2">
                            {(['in_progress', 'completed'] as const).map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!user) return;
                                  const pct = status === 'completed' ? 100 : 50;
                                  await supabase.from('jyotish_progress').upsert(
                                    {
                                      user_id: user.id,
                                      module_id: module.id,
                                      status,
                                      completion_percentage: pct,
                                      last_accessed_at: new Date().toISOString(),
                                      ...(status === 'completed'
                                        ? { completed_at: new Date().toISOString() }
                                        : {}),
                                    },
                                    { onConflict: 'user_id,module_id' },
                                  );
                                  setProgress((prev) => ({
                                    ...prev,
                                    [module.id]: { status, completion_percentage: pct },
                                  }));
                                }}
                                className={cn(
                                  'rounded-[10px] border px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.3em]',
                                  prog?.status === status
                                    ? 'border-[#D4AF37]/25 bg-[#D4AF37]/[0.12] text-[#D4AF37]'
                                    : 'border-white/[0.05] bg-white/[0.03] text-white/40',
                                )}
                              >
                                {status === 'in_progress'
                                  ? t('jyotishVidya.catalog.btnInProgress')
                                  : t('jyotishVidya.catalog.btnMarkComplete')}
                              </button>
                            ))}
                          </div>
                          <Link
                            to={`/jyotish-vidya/module/${module.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-4 flex w-full items-center justify-center rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 py-3 text-[10px] font-extrabold uppercase tracking-[0.28em] text-[#D4AF37] transition hover:bg-[#D4AF37]/18"
                          >
                            {t('jyotishVidya.openModule')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!canAccess && (
                  <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] px-3.5 py-3">
                    <Lock size={12} className="shrink-0 text-white/20" aria-hidden />
                    <span className="text-[11px] text-white/30">
                      {t('jyotishVidya.catalog.unlockLine', {
                        tier: t(tierLabelKey(tierCfg.slug)),
                        price: t(`jyotishVidya.tiers.${rowKey}.price`),
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(user ? salesHref : '/auth');
                      }}
                      className="ml-auto shrink-0 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/[0.08] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#D4AF37]"
                    >
                      {user ? t('jyotishVidya.catalog.upgradeShort') : t('jyotishVidya.loginToUnlock')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!user && (
          <div className="mt-12 rounded-[32px] border border-[#D4AF37]/10 bg-white/[0.01] px-6 py-10 text-center">
            <p className="mb-3 text-[9px] font-extrabold uppercase tracking-[0.5em] text-[#D4AF37]">
              {t('jyotishVidya.catalog.guestEyebrow')}
            </p>
            <h2 className="mb-3 text-2xl font-black tracking-[-0.03em] text-white">
              {t('jyotishVidya.catalog.guestTitle')}
            </h2>
            <p className="mx-auto mb-6 max-w-[400px] text-[13px] text-white/40">
              {t('jyotishVidya.catalog.guestBody')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="rounded-[14px] bg-[#D4AF37] px-8 py-3.5 text-xs font-black uppercase tracking-[0.1em] text-[#050505]"
            >
              {t('jyotishVidya.catalog.guestCta')}
            </button>
          </div>
        )}

        <p className="mt-12 pb-8 text-center text-[10px] font-medium uppercase tracking-[0.35em] text-white/25">
          {t('jyotishVidya.footer')}
        </p>
      </div>
    </div>
  );
};

export default JyotishVidya;
