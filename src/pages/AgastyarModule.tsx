import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import { useAyurvedaProgress, type AyurvedaCourseRow } from '@/hooks/useAyurvedaProgress';
import {
  getCourseTierRequiredRank,
  getSalesPageForRank,
  hasFeatureAccess,
} from '@/lib/tierAccess';

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

const AgastyarModule: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();

  const membershipReady = !membershipLoading && settled;
  const { progressByModuleId, upsertProgress, markComplete, refresh } =
    useAyurvedaProgress(membershipReady);

  const [module, setModule] = useState<AyurvedaCourseRow | null>(null);
  const [nextModuleId, setNextModuleId] = useState<string | null>(null);
  const [loadingModule, setLoadingModule] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const validId = Boolean(id && UUID_RE.test(id));

  const allowed = useMemo(() => {
    if (!module) return false;
    return hasFeatureAccess(isAdmin, tier, getCourseTierRequiredRank(module.tier_required));
  }, [module, isAdmin, tier]);

  const progress = module ? progressByModuleId[module.id] : undefined;
  const notesBaseline = progress?.notes ?? '';

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
        .select(
          'id, module_number, phase, title, description, tier_required, duration_minutes, content_type, content_url, pdf_url, audio_url',
        )
        .eq('id', id)
        .maybeSingle();
      if (e1) throw e1;
      if (!row) {
        setModule(null);
        setLoadErr('NOT_FOUND');
        return;
      }
      const m = row as AyurvedaCourseRow;
      setModule(m);

      const { data: nextRow } = await supabase
        .from('ayurveda_courses')
        .select('id')
        .eq('module_number', m.module_number + 1)
        .maybeSingle();
      setNextModuleId(nextRow?.id ? (nextRow.id as string) : null);
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

  const contentUrl = module?.content_url?.trim() || '';
  const pdfUrl = module?.pdf_url?.trim() || '';
  const audioUrl = module?.audio_url?.trim() || '';

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
      <div className="min-h-screen bg-[#050505] px-4 pb-28 pt-8 text-white/80">
        <button
          type="button"
          onClick={() => navigate('/agastyar-academy')}
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
        >
          <ArrowLeft size={14} aria-hidden />
          {t('academy.back')}
        </button>
        <p className="text-center text-sm text-white/50">{t('academy.modulePlayer.notFound')}</p>
      </div>
    );
  }

  if (!module) return null;

  if (!allowed) {
    const href = getSalesPageForRank(getCourseTierRequiredRank(module.tier_required));
    return (
      <div className="min-h-screen bg-[#050505] px-4 pb-28 pt-8">
        <button
          type="button"
          onClick={() => navigate('/agastyar-academy')}
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
        >
          <ArrowLeft size={14} aria-hidden />
          {t('academy.back')}
        </button>
        <div className="glass-card mx-auto max-w-lg rounded-[40px] border border-white/[0.06] bg-white/[0.03] p-8 text-center backdrop-blur-[40px]">
          <Lock className="mx-auto mb-4 h-10 w-10 text-[#D4AF37]/50" aria-hidden />
          <p className="mb-4 text-sm text-white/65">{t('academy.modulePlayer.lockedBody')}</p>
          <button
            type="button"
            onClick={() => navigate(href)}
            className="rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/15 px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#D4AF37]"
          >
            {t('academy.modulePlayer.unlock')}
          </button>
        </div>
      </div>
    );
  }

  const ytEmbed = contentUrl && isYoutubeUrl(contentUrl) ? youtubeEmbedUrl(contentUrl) : null;
  const showVideoTag =
    Boolean(contentUrl && !ytEmbed && (/\.(mp4|webm|ogg)(\?|$)/i.test(contentUrl) || module.content_type === 'video'));

  return (
    <div className="min-h-screen pb-28 text-white/90" style={{ background: '#050505' }}>
      <div className="relative z-10 mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/agastyar-academy')}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-white/55 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            <ArrowLeft size={14} className="text-[#D4AF37]/80" aria-hidden />
            {t('academy.modulePlayer.backHub')}
          </button>
          <Link
            to="/quantum-apothecary"
            className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]/70 hover:text-[#D4AF37]"
          >
            <BookMarked size={14} aria-hidden />
            {t('academy.links.apothecary')}
          </Link>
        </div>

        <header className="mb-8">
          <p className="text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/55">
            {t('academy.modules.moduleMeta', { num: module.module_number, phase: module.phase })}
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[#D4AF37] [text-shadow:0_0_14px_rgba(212,175,55,0.22)] sm:text-3xl">
            {module.title}
          </h1>
          {module.description && (
            <p className="mt-4 text-sm leading-relaxed text-white/55">{module.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-wider text-white/35">
            {module.duration_minutes != null && (
              <span className="rounded-lg bg-white/[0.06] px-2 py-1">
                {t('academy.modules.duration', { minutes: module.duration_minutes })}
              </span>
            )}
            {progress?.completed && (
              <span className="flex items-center gap-1 rounded-lg bg-[#D4AF37]/15 px-2 py-1 text-[#D4AF37]">
                <CheckCircle2 size={12} aria-hidden />
                {t('academy.modulePlayer.completedBadge')}
              </span>
            )}
          </div>
        </header>

        <section className="glass-card mb-8 overflow-hidden rounded-[32px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-[40px]">
          {ytEmbed ? (
            <div className="aspect-video w-full bg-black">
              <iframe
                title={module.title}
                src={ytEmbed}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : showVideoTag ? (
            <video controls playsInline className="max-h-[70vh] w-full bg-black" src={contentUrl}>
              <track kind="captions" />
            </video>
          ) : contentUrl ? (
            <div className="p-6 text-center">
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
          ) : (
            <div className="p-8 text-center text-sm text-white/45">{t('academy.modulePlayer.noMedia')}</div>
          )}
        </section>

        {(pdfUrl || audioUrl) && (
          <section className="mb-8 space-y-4">
            {pdfUrl && (
              <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-5">
                <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]/75">
                  <FileText size={16} aria-hidden />
                  {t('academy.modulePlayer.pdfSection')}
                </div>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#D4AF37] underline-offset-4 hover:underline"
                >
                  {t('academy.modulePlayer.downloadPdf')}
                  <ExternalLink size={14} aria-hidden />
                </a>
              </div>
            )}
            {audioUrl && (
              <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] p-5">
                <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]/75">
                  {t('academy.modulePlayer.audioSection')}
                </p>
                <audio controls className="w-full" src={audioUrl}>
                  <track kind="captions" />
                </audio>
              </div>
            )}
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
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/35 bg-[#D4AF37]/15 py-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37] transition hover:bg-[#D4AF37]/25 disabled:cursor-not-allowed disabled:opacity-40"
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

          {nextModuleId && (
            <button
              type="button"
              onClick={() => navigate(`/agastyar-academy/module/${nextModuleId}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/[0.1] bg-white/[0.04] py-4 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/75 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
            >
              {t('academy.modulePlayer.nextModule')}
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </div>

        {!nextModuleId && (
          <p className="mt-6 text-center text-[11px] text-white/35">{t('academy.modulePlayer.endOfReleased')}</p>
        )}
      </div>
    </div>
  );
};

export default AgastyarModule;
