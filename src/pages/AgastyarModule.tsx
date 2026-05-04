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
  const { courses, progressByModuleId, upsertProgress, markComplete, refresh, toggleBookmark } =
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

  const contentUrl = module.content_url?.trim() || '';
  const pdfUrl = module.pdf_url?.trim() || '';
  const audioUrl = module.audio_url?.trim() || '';
  const ctLower = contentTypeKey(module.content_type);

  if (!allowed) {
    const href = getSalesPageForRank(getCourseTierRequiredRank(module.tier_required));
    const tierName = t(tierLabelKey(module.tier_required || 'free'));
    return (
      <div className="min-h-screen bg-[#050505] pb-28 text-white/90">
        <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/90 px-4 py-4 backdrop-blur-[40px] sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/agastyar-academy')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-white/60"
            >
              <ArrowLeft size={14} aria-hidden />
              {t('academy.modulePlayer.stickyAcademy')}
            </button>
            <p className="hidden flex-1 text-center text-[8px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37]/90 sm:block">
              {t('academy.modulePlayer.stickyMeta', {
                phase: module.phase,
                phaseName: phaseDisplayName(module.phase),
                num: String(module.module_number).padStart(3, '0'),
              })}
            </p>
            <span className="w-10 sm:w-[120px]" />
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 pt-10">
          <div className="glass-card relative overflow-hidden rounded-[40px] border border-white/[0.06] bg-white/[0.02] p-10 text-center backdrop-blur-[40px]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <Lock className="mx-auto mb-5 h-11 w-11 text-[#D4AF37]/45" aria-hidden />
              <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/80">
                {t('academy.modulePlayer.lockedKicker')}
              </p>
              <p className="mb-3 text-lg font-black text-white/95">{t('academy.modulePlayer.lockedUpgradeTitle')}</p>
              <p className="mb-2 text-sm text-white/55">{t('academy.modulePlayer.lockedUpgradeDetail', {
                num: module.module_number,
                tier: tierName,
              })}</p>
              <p className="mb-8 text-xs text-white/40">{t('academy.modulePlayer.lockedBody')}</p>
              <button
                type="button"
                onClick={() => navigate(href)}
                className="rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] px-8 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#050505] shadow-[0_0_28px_rgba(212,175,55,0.25)]"
              >
                {t('academy.modulePlayer.unlockModuleCta')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ytEmbed = contentUrl && isYoutubeUrl(contentUrl) ? youtubeEmbedUrl(contentUrl) : null;
  const showVideoTag =
    Boolean(contentUrl && !ytEmbed && (/\.(mp4|webm|ogg)(\?|$)/i.test(contentUrl) || ctLower === 'video'));

  const primaryAudioShown =
    Boolean(!ytEmbed && !showVideoTag && ctLower === 'audio' && (audioUrl || contentUrl));

  const hasPrimaryMedia =
    Boolean(ytEmbed) ||
    showVideoTag ||
    primaryAudioShown ||
    Boolean(contentUrl);

  return (
    <div className="min-h-screen pb-28 text-white/90" style={{ background: '#050505' }}>
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-[40px]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/agastyar-academy')}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-white/60 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
          >
            <ArrowLeft size={14} aria-hidden />
            <span className="hidden sm:inline">{t('academy.modulePlayer.stickyAcademy')}</span>
          </button>
          <p className="min-w-0 flex-1 px-2 text-center text-[7px] font-extrabold uppercase leading-tight tracking-[0.28em] text-[#D4AF37] sm:text-[8px] sm:tracking-[0.38em]">
            {t('academy.modulePlayer.stickyMeta', {
              phase: module.phase,
              phaseName: phaseDisplayName(module.phase),
              num: String(module.module_number).padStart(3, '0'),
            })}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={!user?.id || bookmarkBusy}
              onClick={() => void handleBookmark()}
              className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 transition disabled:cursor-not-allowed disabled:opacity-35 ${
                isBookmarked
                  ? 'border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/45 hover:border-[#D4AF37]/20'
              }`}
              aria-label={isBookmarked ? t('academy.modulePlayer.bookmarkRemove') : t('academy.modulePlayer.bookmarkAdd')}
            >
              {bookmarkBusy ? (
                <Loader2 className="h-[13px] w-[13px] animate-spin" aria-hidden />
              ) : isBookmarked ? (
                <BookmarkCheck size={15} aria-hidden />
              ) : (
                <Bookmark size={15} aria-hidden />
              )}
            </button>
            <Link
              to="/quantum-apothecary"
              className="hidden items-center gap-1.5 rounded-xl border border-white/[0.06] px-2 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#D4AF37]/75 hover:text-[#D4AF37] sm:inline-flex"
            >
              <BookMarked size={13} aria-hidden />
              <span className="max-w-[88px] truncate">{t('academy.links.apothecary')}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <header className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-2.5 py-1 text-[7px] font-extrabold uppercase tracking-[0.35em] text-[#D4AF37]">
              {ctLower === 'video' && <Play size={9} aria-hidden />}
              {ctLower === 'audio' && <Music size={9} aria-hidden />}
              {ctLower === 'pdf' && <FileText size={9} aria-hidden />}
              {ctLower === 'interactive' && <Zap size={9} aria-hidden />}
              {ctLower === 'live' && <Users size={9} aria-hidden />}
              {contentTypeLabel(module.content_type)}
            </span>
            {module.duration_minutes != null && (
              <span className="inline-flex items-center gap-1 text-[10px] text-white/35">
                <Clock size={11} aria-hidden />
                {t('academy.modules.duration', { minutes: module.duration_minutes })}
              </span>
            )}
          </div>
          <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/55">
            {t('academy.modules.moduleMeta', { num: module.module_number, phase: module.phase })}
          </p>
          <h1 className="mt-2 bg-gradient-to-br from-white to-[#D4AF37]/80 bg-clip-text text-2xl font-black tracking-[-0.04em] text-transparent sm:text-3xl">
            {module.title}
          </h1>
          {module.subtitle && (
            <p className="mt-2 text-sm font-semibold leading-snug text-[#D4AF37]/75">{module.subtitle}</p>
          )}
          {module.description && (
            <p className="mt-4 text-sm leading-relaxed text-white/55">{module.description}</p>
          )}
          {module.tags && module.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {module.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/35"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider text-white/35">
            {progress?.completed && (
              <span className="flex items-center gap-1 rounded-lg bg-[#D4AF37]/15 px-2 py-1 text-[#D4AF37]">
                <CheckCircle2 size={12} aria-hidden />
                {t('academy.modulePlayer.completedBadge')}
              </span>
            )}
          </div>
        </header>

        {richModuleContent && (
          <section
            className="mb-8"
            aria-label={t('academy.moduleContent.richTeachingAria')}
          >
            <AgastyarModuleContent content={richModuleContent} />
          </section>
        )}

        <section className="glass-card mb-8 overflow-hidden rounded-[28px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-[40px]">
          {hasPrimaryMedia && (
            <div
              className={`relative flex items-center justify-center overflow-hidden bg-black/40 ${
                ctLower === 'audio' ? 'min-h-[140px]' : 'aspect-video min-h-[200px]'
              }`}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 72%)',
                }}
              />
              {ytEmbed ? (
                <iframe
                  title={module.title}
                  src={ytEmbed}
                  className="relative z-[1] h-full min-h-[220px] w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : showVideoTag ? (
                <video controls playsInline className="relative z-[1] max-h-[70vh] w-full" src={contentUrl}>
                  <track kind="captions" />
                </video>
              ) : primaryAudioShown ? (
                <div className="relative z-[1] w-full px-6 py-8 sm:px-10">
                  <audio controls className="w-full accent-[#D4AF37]" src={audioUrl || contentUrl}>
                    <track kind="captions" />
                  </audio>
                </div>
              ) : (
                <div className="relative z-[1] p-6 text-center">
                  <a
                    href={contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-5 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]"
                  >
                    {t('academy.modulePlayer.openContent')}
                    <ExternalLink size={14} aria-hidden />
                  </a>
                </div>
              )}
            </div>
          )}

          {pdfUrl && (
            <div className="flex flex-col gap-3 border-t border-white/[0.05] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-xs text-white/45">
                <FileText size={14} aria-hidden />
                {t('academy.modulePlayer.pdfDownloadAvailable')}
              </span>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
              >
                {t('academy.modulePlayer.downloadPdf')}
                <ExternalLink size={12} aria-hidden />
              </a>
            </div>
          )}
        </section>

        {audioUrl && !primaryAudioShown && (
          <section className="mb-8 rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]/75">
              {t('academy.modulePlayer.audioSection')}
            </p>
            <audio controls className="w-full accent-[#D4AF37]" src={audioUrl}>
              <track kind="captions" />
            </audio>
          </section>
        )}

        <section className="mb-8 rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="academy-notes"
              className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/45"
            >
              {t('academy.modulePlayer.notesLabel')}
            </label>
            {savingNotes && (
              <span className="text-[9px] uppercase tracking-wider text-white/35">
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
            className="w-full resize-y rounded-2xl border border-white/[0.08] bg-[#050505]/80 px-4 py-3 text-sm text-white/85 placeholder:text-white/25 focus:border-[#D4AF37]/35 focus:outline-none"
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={markingDone || progress?.completed}
            onClick={() => void handleMarkComplete()}
            className={
              progress?.completed
                ? 'flex flex-1 cursor-default items-center justify-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 py-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]'
                : 'flex flex-1 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/35 bg-gradient-to-br from-[#D4AF37] to-[#B8960C] py-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#050505] shadow-[0_0_24px_rgba(212,175,55,0.18)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50'
            }
          >
            {progress?.completed ? (
              <>
                <CheckCircle2 size={18} aria-hidden />
                {t('academy.modulePlayer.alreadyComplete')}
              </>
            ) : markingDone ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('academy.modulePlayer.saving')}
              </>
            ) : (
              <>
                <CheckCircle2 size={18} aria-hidden />
                {t('academy.modulePlayer.markComplete')}
              </>
            )}
          </button>

          {nextModule && nextModuleAllowed && (
            <button
              type="button"
              onClick={() => navigate(`/agastyar-academy/module/${nextModule.id}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] py-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/75 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
            >
              {t('academy.modulePlayer.nextModule')}
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </div>

        {!nextModule && (
          <p className="mt-6 text-center text-[11px] text-white/35">{t('academy.modulePlayer.endOfReleased')}</p>
        )}

        <div className="mt-10 flex gap-3 border-t border-white/[0.06] pt-8">
          {prevModule ? (
            <button
              type="button"
              onClick={() => navigate(`/agastyar-academy/module/${prevModule.id}`)}
              className="flex flex-1 items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-left transition hover:border-[#D4AF37]/15"
            >
              <ChevronLeft size={18} className="shrink-0 text-white/35" aria-hidden />
              <div className="min-w-0">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.3em] text-white/35">
                  {t('academy.modulePlayer.navPrevious')}
                </p>
                <p className="truncate text-[13px] font-bold text-white/65">{prevModule.title}</p>
              </div>
            </button>
          ) : (
            <div className="flex-1" />
          )}
          {nextModule ? (
            <button
              type="button"
              onClick={() => navigate(`/agastyar-academy/module/${nextModule.id}`)}
              className="flex flex-1 items-center justify-end gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4 text-right transition hover:border-[#D4AF37]/15"
            >
              <div className="min-w-0">
                <p className="text-[8px] font-extrabold uppercase tracking-[0.3em] text-white/35">
                  {t('academy.modulePlayer.navNext')}
                </p>
                <p className="truncate text-[13px] font-bold text-white/65">{nextModule.title}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-white/35" aria-hidden />
            </button>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AgastyarModule;
