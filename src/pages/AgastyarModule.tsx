import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Music,
  Play,
  Users,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import {
  AYURVEDA_COURSE_SELECT,
  useAyurvedaProgress,
  type AyurvedaCourseRow,
} from '@/hooks/useAyurvedaProgress';
import {
  getCourseTierRequiredRank,
  getSalesPageForRank,
  hasFeatureAccess,
} from '@/lib/tierAccess';
import AgastyarModuleContent from '@/components/AgastyarModuleContent';
import { getAllModuleContent as getModuleContent } from '@/data/moduleContentIndex';
import ModuleReaderShell from '@/components/education/ModuleReaderShell';
import { teal, fade } from '@/components/education/tokens';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isYoutubeUrl(url: string): boolean {
  return /youtube\.com\/watch|youtu\.be\//i.test(url);
}

function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const vid = u.pathname.replace(/^\//, '');
      return vid ? `https://www.youtube.com/embed/${vid}` : null;
    }
    const v = u.searchParams.get('v');
    return v ? `https://www.youtube.com/embed/${v}` : null;
  } catch {
    return null;
  }
}

function tierLabelKey(tierSlug: string): string {
  const s = (tierSlug || 'free').toLowerCase();
  if (s.includes('akasha')) return 'conversion.tiers.akasha.label';
  if (s.includes('siddha')) return 'conversion.tiers.siddha.label';
  if (s.includes('prana')) return 'conversion.tiers.prana.label';
  return 'conversion.tiers.free.label';
}

function clampPhase(phase: number): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(phase);
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

const AgastyarModule: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();

  const membershipReady = !membershipLoading && settled;
  const { courses, progressByModuleId, upsertProgress, markComplete, refresh, toggleBookmark, stats } =
    useAyurvedaProgress(membershipReady);

  const [module, setModule] = useState<AyurvedaCourseRow | null>(null);
  const [loadingModule, setLoadingModule] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validId = Boolean(id && UUID_RE.test(id));

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.module_number - b.module_number),
    [courses],
  );

  const richModuleContent = useMemo(
    () => (module ? getModuleContent(module.module_number) : null),
    [module],
  );

  const allowed = useMemo(() => {
    if (!module) return false;
    return hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(module.tier_required));
  }, [module, isAdmin, tier]);

  const progress = module ? progressByModuleId[module.id] : undefined;
  const notesBaseline = progress?.notes ?? '';
  const isBookmarked = Boolean(progress?.bookmarked);

  const prevModule = useMemo(() => {
    if (!module) return null;
    return sortedCourses.find((c) => c.module_number === module.module_number - 1) ?? null;
  }, [module, sortedCourses]);

  const nextModule = useMemo(() => {
    if (!module) return null;
    return sortedCourses.find((c) => c.module_number === module.module_number + 1) ?? null;
  }, [module, sortedCourses]);

  const nextModuleAllowed = useMemo(() => {
    if (!nextModule) return false;
    return hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(nextModule.tier_required));
  }, [nextModule, isAdmin, tier]);

  /** Rail list for the unified ModuleReaderShell — same shape every academy will build. */
  /**
   * Kajabi/Thinkific-style Module → Lesson accordion, built from the
   * existing `phase` field (1-5) already on every ayurveda_courses row —
   * no new data needed. Phase names come from the existing
   * academy.modulePlayer.phaseNames.p1-p5 translation keys.
   */
  const railGroups = useMemo(() => {
    const phases = [1, 2, 3, 4, 5] as const;
    return phases.map((phase) => {
      const items = sortedCourses.filter((c) => c.phase === phase);
      const doneCount = items.filter((c) => progressByModuleId[c.id]?.completed).length;
      const containsCurrent = module ? items.some((c) => c.id === module.id) : false;

      const lessonItems = items.map((c) => {
        const done = Boolean(progressByModuleId[c.id]?.completed);
        const isCurrentModule = module ? c.id === module.id : false;
        const courseAllowed = hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(c.tier_required));
        const state: 'done' | 'current' | 'available' | 'locked' = done
          ? 'done'
          : isCurrentModule
            ? 'current'
            : courseAllowed
              ? 'available'
              : 'locked';
        return {
          id: c.id,
          number: c.module_number,
          title: c.title,
          state,
          href: `/agastyar-academy/module/${c.id}`,
        };
      });

      return {
        id: `phase-${phase}`,
        title: `${phase}. ${t(`academy.modulePlayer.phaseNames.p${phase}`)}`,
        meta: `${doneCount} / ${items.length} lessons${doneCount === items.length && items.length > 0 ? ' complete' : ''}`,
        done: items.length > 0 && doneCount === items.length,
        current: containsCurrent,
        items: lessonItems,
      };
    });
  }, [sortedCourses, progressByModuleId, module, isAdmin, tier, t]);


  const fetchModule = useCallback(async () => {
    if (!validId || !id) {
      setModule(null);
      setLoadingModule(false);
      return;
    }
    setLoadingModule(true);
    setLoadErr(null);
    try {
      const { data: row, error: e1 } = await supabase
        .from('ayurveda_courses')
        .select(AYURVEDA_COURSE_SELECT)
        .eq('id', id)
        .maybeSingle();
      if (e1) throw e1;
      if (!row) {
        setModule(null);
        setLoadErr('NOT_FOUND');
        return;
      }
      setModule(row as AyurvedaCourseRow);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoadErr(msg);
      setModule(null);
    } finally {
      setLoadingModule(false);
    }
  }, [id, validId]);

  useEffect(() => {
    void fetchModule();
  }, [fetchModule]);

  useEffect(() => {
    if (membershipReady) void refresh();
  }, [membershipReady, refresh]);

  useEffect(() => {
    setNotesDraft(notesBaseline);
  }, [notesBaseline, module?.id]);

  useEffect(() => {
    if (!module?.id || !user?.id || !allowed) return;
    if (notesDraft === notesBaseline) return;
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(() => {
      void (async () => {
        setSavingNotes(true);
        try {
          await upsertProgress({ moduleId: module.id, notes: notesDraft });
        } catch {
          toast.error(t('academy.modulePlayer.toastNotesError'));
        } finally {
          setSavingNotes(false);
        }
      })();
    }, 700);
    return () => {
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    };
  }, [notesDraft, notesBaseline, module?.id, user?.id, allowed, upsertProgress, t]);

  const handleMarkComplete = async () => {
    if (!module?.id) return;
    setMarkingDone(true);
    try {
      await markComplete(module.id);
      toast.success(t('academy.modulePlayer.toastComplete'));
    } catch {
      toast.error(t('academy.modulePlayer.toastCompleteError'));
    } finally {
      setMarkingDone(false);
    }
  };

  const handleBookmark = async () => {
    if (!module?.id || !user?.id) return;
    setBookmarkBusy(true);
    try {
      await toggleBookmark(module.id);
    } catch {
      toast.error(t('academy.modulePlayer.toastBookmarkError'));
    } finally {
      setBookmarkBusy(false);
    }
  };

  const contentTypeKey = (ct: string | null | undefined) =>
    (ct || 'video').toLowerCase().replace(/[^a-z-]/g, '') || 'video';

  const contentTypeLabel = (ct: string | null | undefined) => {
    const key = contentTypeKey(ct);
    const k = `academy.modulePlayer.contentTypeLabels.${key}` as const;
    const translated = t(k);
    return translated === k ? t('academy.modulePlayer.contentTypeLabels.video') : translated;
  };

  const phaseDisplayName = (phase: number) => {
    const p = clampPhase(phase);
    return t(`academy.modulePlayer.phaseNames.p${p}`);
  };

  if (!membershipReady || loadingModule) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050505]">
        <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37]" aria-hidden />
        <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/40">
          {t('common.loading')}
        </p>
      </div>
    );
  }

  if (!validId) {
    navigate('/agastyar-academy', { replace: true });
    return null;
  }

  if (!loadingModule && loadErr && loadErr !== 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pb-28 pt-8 text-white/80">
        <button
          type="button"
          onClick={() => navigate('/agastyar-academy')}
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
        >
          <ArrowLeft size={14} aria-hidden />
          {t('academy.back')}
        </button>
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
          {t('academy.modules.loadError')}
          <span className="mt-1 block font-mono text-xs text-red-300/80">{loadErr}</span>
        </div>
      </div>
    );
  }

  if (loadErr === 'NOT_FOUND' || (!loadingModule && !module)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#050505] px-4">
        <p className="text-center text-sm text-white/45">{t('academy.modulePlayer.notFound')}</p>
        <button
          type="button"
          onClick={() => navigate('/agastyar-academy')}
          className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
        >
          {t('academy.modulePlayer.backHub')}
        </button>
      </div>
    );
  }

  if (!module) return null;

  /**
   * ── UNIFIED MODULE READER ──────────────────────────────────────────────
   * Every academy renders through ModuleReaderShell (src/components/education).
   * Only the accent color and the data below are specific to Agastyar —
   * the header, progress bar, module rail, locked state, and nav are shared
   * with every other academy so the reading experience never has to be
   * rebuilt or re-matched by eye again.
   */
  const accent = teal(0.9);
  const progressPercent = stats.completionPercent;
  const progressLabel = `${stats.completedModules} / ${stats.totalModules} modules · ${stats.completionPercent}%`;

  const salesHref = getSalesPageForRank(getCourseTierRequiredRank(module.tier_required));
  const tierName = t(tierLabelKey(module.tier_required || 'free'));

  const bookmarkButton = (
    <button
      type="button"
      disabled={!user?.id || bookmarkBusy}
      onClick={() => void handleBookmark()}
      style={{
        marginTop: 12,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: isBookmarked ? fade(accent, 0.12) : 'rgba(255,255,255,.04)',
        border: `1px solid ${isBookmarked ? fade(accent, 0.35) : 'rgba(255,255,255,.08)'}`,
        borderRadius: 999, padding: '7px 14px',
        color: isBookmarked ? accent : 'rgba(255,255,255,.5)',
        fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
        cursor: 'pointer', opacity: bookmarkBusy ? 0.5 : 1,
      }}
    >
      {bookmarkBusy ? (
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
      ) : isBookmarked ? (
        <BookmarkCheck size={13} aria-hidden />
      ) : (
        <Bookmark size={13} aria-hidden />
      )}
      {isBookmarked ? t('academy.modulePlayer.bookmarkRemove') : t('academy.modulePlayer.bookmarkAdd')}
    </button>
  );

  const notesSection = (
    <section
      style={{
        marginTop: 36, borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 24,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <label
          htmlFor="academy-notes"
          style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}
        >
          {t('academy.modulePlayer.notesLabel')}
        </label>
        {savingNotes && (
          <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.1em', color: 'rgba(255,255,255,.35)' }}>
            {t('academy.modulePlayer.saving')}
          </span>
        )}
      </div>
      <textarea
        id="academy-notes"
        value={notesDraft}
        onChange={(e) => setNotesDraft(e.target.value)}
        rows={5}
        placeholder={t('academy.modulePlayer.notesPlaceholder')}
        style={{
          width: '100%', resize: 'vertical', borderRadius: 16,
          border: '1px solid rgba(255,255,255,.08)', background: 'rgba(5,5,5,.8)',
          padding: '12px 14px', fontSize: 15, color: 'rgba(255,255,255,.85)',
          fontFamily: "'Plus Jakarta Sans',sans-serif",
        }}
      />
    </section>
  );

  // Fallback plain-text body when a module hasn't had its rich content authored yet.
  const fallbackBody = module.description || module.subtitle || '';

  return (
    <ModuleReaderShell
      accent={accent}
      academyName={t('academy.modulePlayer.stickyAcademy')}
      academyHref="/agastyar-academy"
      moduleNumber={module.module_number}
      totalModules={stats.totalModules}
      moduleTitle={module.title}
      thesis={module.subtitle || undefined}
      progressLabel={progressLabel}
      progressPercent={progressPercent}
      courseTitle="Ayurveda Mastery Path"
      courseIcon="🪷"
      railGroups={railGroups}
      contentBlocks={richModuleContent ? [] : [{ label: t('academy.modules.moduleMeta', { num: module.module_number, phase: module.phase }), body: fallbackBody }]}
      locked={!allowed}
      lockedCta={
        <button
          type="button"
          onClick={() => navigate(salesHref)}
          style={{
            borderRadius: 999, padding: '13px 26px',
            background: `linear-gradient(135deg, ${accent}, ${fade(accent, 0.7)})`,
            border: 'none', color: '#050505', fontSize: 10, fontWeight: 800,
            letterSpacing: '.2em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          {t('academy.modulePlayer.unlockModuleCta', { tier: tierName })}
        </button>
      }
      onMarkComplete={() => void handleMarkComplete()}
      markingComplete={markingDone}
      isComplete={Boolean(progress?.completed)}
      prevHref={prevModule ? `/agastyar-academy/module/${prevModule.id}` : null}
      nextHref={nextModule && nextModuleAllowed ? `/agastyar-academy/module/${nextModule.id}` : null}
      headerExtra={bookmarkButton}
      footerExtra={
        <>
          {richModuleContent && (
            <section aria-label={t('academy.moduleContent.richTeachingAria')}>
              <AgastyarModuleContent content={richModuleContent} />
            </section>
          )}
          {notesSection}
        </>
      }
    />
  );
};

export default AgastyarModule;
