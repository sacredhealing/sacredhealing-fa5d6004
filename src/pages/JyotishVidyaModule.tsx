import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  Music,
  Play,
  Video,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useMembership } from '@/hooks/useMembership';
import {
  JYOTISH_MODULE_SELECT,
  useJyotishVidyaProgress,
  type JyotishModuleRow,
} from '@/hooks/useJyotishVidyaProgress';
import {
  canAccessJyotishModule,
  getCourseTierRequiredRank,
  getSalesPageForRank,
} from '@/lib/tierAccess';

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

const JyotishVidyaModule: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { tier, loading: membershipLoading, settled } = useMembership();
  const membershipReady = !membershipLoading && settled;

  const { modules, progressByModuleId, upsertProgress, markComplete, touchAccess, refresh } =
    useJyotishVidyaProgress(membershipReady);

  const [module, setModule] = useState<JyotishModuleRow | null>(null);
  const [loadingModule, setLoadingModule] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const moduleNum = id ? parseInt(id, 10) : NaN;
  const validId = Number.isFinite(moduleNum) && moduleNum >= 1 && moduleNum <= 32;

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.sort_order - b.sort_order),
    [modules],
  );

  const allowed = useMemo(() => {
    if (!module) return false;
    return canAccessJyotishModule({
      isAdmin,
      userId: user?.id,
      tier,
      moduleId: module.id,
    });
  }, [module, isAdmin, user?.id, tier]);

  const progress = module ? progressByModuleId[module.id] : undefined;
  const notesBaseline = progress?.notes ?? '';
  const isComplete = progress?.status === 'completed' || (progress?.completion_percentage ?? 0) >= 100;

  const prevModule = useMemo(() => {
    if (!module) return null;
    return sortedModules.find((m) => m.id === module.id - 1) ?? null;
  }, [module, sortedModules]);

  const nextModule = useMemo(() => {
    if (!module) return null;
    return sortedModules.find((m) => m.id === module.id + 1) ?? null;
  }, [module, sortedModules]);

  const fetchModule = useCallback(async () => {
    if (!validId) {
      setModule(null);
      setLoadingModule(false);
      return;
    }
    setLoadingModule(true);
    setLoadErr(null);
    try {
      const { data: row, error: e1 } = await supabase
        .from('jyotish_modules')
        .select(JYOTISH_MODULE_SELECT)
        .eq('id', moduleNum)
        .maybeSingle();
      if (e1) throw e1;
      if (!row) {
        setModule(null);
        setLoadErr('NOT_FOUND');
        return;
      }
      setModule(row as JyotishModuleRow);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoadErr(msg);
      setModule(null);
    } finally {
      setLoadingModule(false);
    }
  }, [moduleNum, validId]);

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
    void touchAccess(module.id);
  }, [module?.id, user?.id, allowed, touchAccess]);

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
          toast.error(t('jyotishVidya.module.toastNotesError'));
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
    if (!module?.id || !user?.id) {
      toast.message(t('jyotishVidya.module.signInToSave'));
      return;
    }
    setMarkingDone(true);
    try {
      await markComplete(module.id);
      toast.success(t('jyotishVidya.module.toastComplete'));
    } catch {
      toast.error(t('jyotishVidya.module.toastCompleteError'));
    } finally {
      setMarkingDone(false);
    }
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
    navigate('/jyotish-vidya', { replace: true });
    return null;
  }

  if (!loadingModule && loadErr && loadErr !== 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-[#050505] px-4 pb-28 pt-8 text-white/80">
        <button
          type="button"
          onClick={() => navigate('/jyotish-vidya')}
          className="mb-6 inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
        >
          <ArrowLeft size={14} aria-hidden />
          {t('jyotishVidya.back')}
        </button>
        <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200/90">
          {t('jyotishVidya.loadError')}
          <span className="mt-1 block font-mono text-xs text-red-300/80">{loadErr}</span>
        </div>
      </div>
    );
  }

  if (loadErr === 'NOT_FOUND' || (!loadingModule && !module)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#050505] px-4">
        <p className="text-center text-sm text-white/45">{t('jyotishVidya.module.notFound')}</p>
        <button
          type="button"
          onClick={() => navigate('/jyotish-vidya')}
          className="rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-6 py-3 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
        >
          {t('jyotishVidya.module.backHub')}
        </button>
      </div>
    );
  }

  if (!module) return null;

  const contentUrl = module.content_url?.trim() || '';
  const pdfUrl = module.pdf_url?.trim() || '';
  const audioUrl = module.audio_url?.trim() || '';
  const ytEmbed = contentUrl && isYoutubeUrl(contentUrl) ? youtubeEmbedUrl(contentUrl) : null;
  const showVideoTag = Boolean(contentUrl && !ytEmbed && /\.(mp4|webm|ogg)(\?|$)/i.test(contentUrl));

  if (!allowed) {
    const href = getSalesPageForRank(getCourseTierRequiredRank(module.tier_required));
    const tierName = t(tierLabelKey(module.tier_required || 'free'));
    return (
      <div className="min-h-screen bg-[#050505] pb-28 text-white/90">
        <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/90 px-4 py-4 backdrop-blur-[40px] sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate('/jyotish-vidya')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-white/60"
            >
              <ArrowLeft size={14} aria-hidden />
              {t('jyotishVidya.module.stickyHub')}
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-lg px-4 pt-10">
          <div className="rounded-[40px] border border-white/[0.06] bg-white/[0.02] p-10 text-center backdrop-blur-[40px]">
            <Lock className="mx-auto mb-5 h-11 w-11 text-[#D4AF37]/45" aria-hidden />
            <p className="mb-2 text-[8px] font-extrabold uppercase tracking-[0.45em] text-[#D4AF37]/80">
              {t('jyotishVidya.module.lockedKicker')}
            </p>
            <p className="mb-3 text-lg font-black text-white/95">{module.title}</p>
            <p className="mb-2 text-sm text-white/55">
              {t('jyotishVidya.module.lockedDetail', { num: module.id, tier: tierName })}
            </p>
            <p className="mb-8 text-xs text-white/40">{t('jyotishVidya.module.lockedBody')}</p>
            <button
              type="button"
              onClick={() => navigate(user ? href : '/auth')}
              className="rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8960C] px-8 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#050505] shadow-[0_0_28px_rgba(212,175,55,0.25)]"
            >
              {user ? t('jyotishVidya.module.unlockCta') : t('jyotishVidya.loginCta')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasMedia = Boolean(ytEmbed || showVideoTag || pdfUrl || audioUrl || contentUrl);

  return (
    <div className="min-h-screen pb-28 text-white/90" style={{ background: '#050505' }}>
      <div className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#050505]/90 backdrop-blur-[40px]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => navigate('/jyotish-vidya')}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[11px] font-bold text-white/60 transition hover:border-[#D4AF37]/25 hover:text-[#D4AF37]"
          >
            <ArrowLeft size={14} aria-hidden />
            <span className="hidden sm:inline">{t('jyotishVidya.module.stickyHub')}</span>
          </button>
          <p className="min-w-0 flex-1 px-2 text-center text-[7px] font-extrabold uppercase leading-tight tracking-[0.28em] text-[#D4AF37] sm:text-[8px] sm:tracking-[0.38em]">
            {t('jyotishVidya.module.stickyMeta', { num: String(module.id).padStart(2, '0') })}
          </p>
          <span className="w-10 sm:w-[72px]" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight text-[#D4AF37] sm:text-3xl">{module.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">{module.subtitle}</p>
          {module.description?.trim() && (
            <p className="mt-4 text-sm leading-relaxed text-white/45">{module.description}</p>
          )}
        </div>

        {!hasMedia && (
          <div className="mb-8 flex flex-col items-center rounded-[32px] border border-white/[0.06] bg-white/[0.02] px-6 py-14 text-center backdrop-blur-[40px]">
            <Video className="mb-4 h-10 w-10 text-white/20" aria-hidden />
            <p className="max-w-md text-sm text-white/45">{t('jyotishVidya.module.noMedia')}</p>
          </div>
        )}

        {ytEmbed && (
          <div className="mb-8 overflow-hidden rounded-[28px] border border-white/[0.06] bg-black/40">
            <div className="relative aspect-video w-full">
              <iframe
                title={t('jyotishVidya.module.videoTitle', { title: module.title })}
                src={`${ytEmbed}?rel=0`}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {showVideoTag && contentUrl && (
          <div className="mb-8 overflow-hidden rounded-[28px] border border-white/[0.06] bg-black/40">
            <video src={contentUrl} controls className="aspect-video w-full" playsInline>
              <track kind="captions" />
            </video>
          </div>
        )}

        {!ytEmbed && !showVideoTag && contentUrl && (
          <a
            href={contentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 flex items-center justify-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-6 py-4 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#D4AF37]"
          >
            <Play size={16} aria-hidden />
            {t('jyotishVidya.module.openContent')}
            <ExternalLink size={14} aria-hidden />
          </a>
        )}

        {pdfUrl && (
          <div className="mb-8 rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-[40px]">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/40">
              <FileText size={16} aria-hidden />
              {t('jyotishVidya.module.pdfSection')}
            </p>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#D4AF37]"
            >
              {t('jyotishVidya.module.downloadPdf')}
              <ExternalLink size={14} aria-hidden />
            </a>
          </div>
        )}

        {audioUrl && (
          <div className="mb-8 rounded-[28px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-[40px]">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.3em] text-white/40">
              <Music size={16} aria-hidden />
              {t('jyotishVidya.module.audioSection')}
            </p>
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        <div className="rounded-[32px] border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-[40px]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-white/40">
              {t('jyotishVidya.module.notesLabel')}
            </p>
            {user ? (
              <span className="text-[9px] font-bold uppercase tracking-wide text-white/30">
                {savingNotes ? t('jyotishVidya.module.saving') : ''}
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#D4AF37]/70">
                {t('jyotishVidya.module.guestNotes')}
              </span>
            )}
          </div>
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            disabled={!user}
            placeholder={t('jyotishVidya.module.notesPlaceholder')}
            rows={5}
            className="w-full resize-y rounded-2xl border border-white/[0.08] bg-[#050505]/80 px-4 py-3 text-sm text-white/80 placeholder:text-white/25 focus:border-[#D4AF37]/35 focus:outline-none disabled:opacity-45"
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!user || markingDone || isComplete}
            onClick={() => void handleMarkComplete()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-6 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-300/95 disabled:opacity-40 min-[420px]:flex-none"
          >
            {isComplete ? (
              <>
                <CheckCircle2 size={16} aria-hidden />
                {t('jyotishVidya.module.alreadyComplete')}
              </>
            ) : (
              t('jyotishVidya.module.markComplete')
            )}
          </button>
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-4 border-t border-white/[0.06] pt-8">
          {prevModule ? (
            <Link
              to={`/jyotish-vidya/module/${prevModule.id}`}
              className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/45 hover:text-[#D4AF37]"
            >
              <ArrowLeft size={14} aria-hidden />
              {t('jyotishVidya.module.navPrevious')}
            </Link>
          ) : (
            <span />
          )}
          {nextModule ? (
            <Link
              to={`/jyotish-vidya/module/${nextModule.id}`}
              className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]"
            >
              {t('jyotishVidya.module.navNext')}
              <ChevronRight size={14} aria-hidden />
            </Link>
          ) : (
            <span />
          )}
        </div>
      </div>
    </div>
  );
};

export default JyotishVidyaModule;
