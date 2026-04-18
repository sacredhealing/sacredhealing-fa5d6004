// SQI 2050 — Announcement engine: 24h TTL, latest row only, optional Gemini translation
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { X, Bell } from 'lucide-react';

interface Announcement {
  id: string;
  title?: string | null;
  message: string;
  created_at: string;
}

const DISMISSED_KEY = 'sq_dismissed_ann_v2';
const TTL_HOURS = 24;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  sv: 'Swedish',
  no: 'Norwegian',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  ar: 'Arabic',
  hi: 'Hindi',
};

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDismissed(ids: string[]) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

function cacheKey(id: string, lang: string) {
  return `sq_ann_${id}_${lang}`;
}

async function translateWithGemini(text: string, targetLang: string, kind: 'body' | 'title'): Promise<string | null> {
  const langName = LANGUAGE_NAMES[targetLang] || targetLang;
  const prompt =
    kind === 'body'
      ? `Translate to ${langName}. Return ONLY the translated text, nothing else.\n\n${text}`
      : `Translate this title to ${langName}. Return ONLY the translation:\n${text}`;

  const { data, error } = await supabase.functions.invoke<{ response?: string }>('gemini-bridge', {
    body: {
      prompt,
      model: 'gemini-2.0-flash',
      type: 'announcement-translation',
    },
  });

  if (error || !data?.response?.trim()) return null;
  return data.response.trim();
}

async function translateAnnouncement(
  message: string,
  title: string | null | undefined,
  targetLang: string
): Promise<{ message: string; title?: string }> {
  const msg = await translateWithGemini(message, targetLang, 'body');
  if (!msg) return { message, title: title ?? undefined };

  let translatedTitle: string | undefined;
  if (title) {
    translatedTitle = (await translateWithGemini(title, targetLang, 'title')) ?? undefined;
  }

  return { message: msg, title: translatedTitle };
}

function resolveLang(profileLang: string | undefined, i18nLang: string | undefined): string {
  const raw = profileLang || i18nLang || 'en';
  const code = raw.toLowerCase().split('-')[0];
  if (['en', 'sv', 'no', 'es'].includes(code)) return code;
  if (code === 'nb' || code === 'nn') return 'no';
  return 'en';
}

export function AnnouncementBanner() {
  const { t, i18n } = useTranslation();
  const { profile } = useProfile();
  const userLang = resolveLang(profile?.preferred_language, i18n.language);

  const [raw, setRaw] = useState<Announcement | null>(null);
  const [display, setDisplay] = useState<{ message: string; title?: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>(getDismissed);

  const loadLatest = useCallback(async () => {
    const cutoff = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, message, created_at')
      .gte('created_at', cutoff)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setRaw(data);
      return;
    }

    const { data: fb } = await supabase
      .from('announcements')
      .select('id, title, message, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setRaw(fb ?? null);
  }, []);

  useEffect(() => {
    void loadLatest();
    const channel = supabase
      .channel('ann-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, () => {
        void loadLatest();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadLatest]);

  useEffect(() => {
    if (!raw) return;

    if (!userLang || userLang === 'en') {
      setDisplay({ message: raw.message, title: raw.title ?? undefined });
      return;
    }

    const key = cacheKey(raw.id, userLang);
    const cached = sessionStorage.getItem(key);
    if (cached) {
      try {
        setDisplay(JSON.parse(cached));
      } catch {
        setDisplay({ message: cached });
      }
      return;
    }

    setDisplay({ message: raw.message, title: raw.title ?? undefined });
    setIsTranslating(true);

    translateAnnouncement(raw.message, raw.title, userLang).then((result) => {
      setDisplay(result);
      setIsTranslating(false);
      sessionStorage.setItem(key, JSON.stringify(result));
    });
  }, [raw, userLang]);

  function dismiss() {
    if (!raw) return;
    const updated = [...dismissed, raw.id];
    setDismissed(updated);
    saveDismissed(updated);
    setRaw(null);
    setDisplay(null);
  }

  if (!raw || !display) return null;
  if (dismissed.includes(raw.id)) return null;
  if (Date.now() - new Date(raw.created_at).getTime() > TTL_HOURS * 60 * 60 * 1000) return null;

  return (
    <div
      style={{
        background: 'rgba(212, 175, 55, 0.07)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(212, 175, 55, 0.22)',
        borderRadius: '20px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        margin: '0 0 16px 0',
        animation: 'annFadeIn 0.4s ease',
        opacity: isTranslating ? 0.75 : 1,
        transition: 'opacity 0.25s ease',
      }}
    >
      <style>{`
        @keyframes annFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Bell size={15} style={{ color: '#D4AF37', marginTop: '3px', flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {display.title && (
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: '10px',
              letterSpacing: '0.45em',
              textTransform: 'uppercase',
              color: '#D4AF37',
              margin: '0 0 5px 0',
            }}
          >
            {display.title}
          </p>
        )}

        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 400,
            fontSize: '13.5px',
            lineHeight: 1.6,
            color: isTranslating ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.78)',
            margin: 0,
            transition: 'color 0.25s',
          }}
        >
          {display.message}
          {isTranslating && (
            <span
              style={{
                fontSize: '9px',
                marginLeft: '8px',
                color: 'rgba(212,175,55,0.45)',
                fontStyle: 'italic',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {t('announcement.bannerTranslating')}
            </span>
          )}
        </p>

        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: '8px',
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            color: 'rgba(212, 175, 55, 0.33)',
            margin: '6px 0 0 0',
          }}
        >
          {formatRelativeTime(raw.created_at, t)}
        </p>
      </div>

      <button
        type="button"
        onClick={dismiss}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: 'rgba(255,255,255,0.33)',
          flexShrink: 0,
        }}
        aria-label={t('announcement.bannerDismissAria')}
      >
        <X size={13} />
      </button>
    </div>
  );
}

function formatRelativeTime(iso: string, t: (k: string, opts?: Record<string, number>) => string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t('announcement.bannerJustNow');
  if (mins < 60) return t('announcement.bannerMinutesAgo', { count: mins });
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return t('announcement.bannerHoursAgo', { count: hrs });
  return t('announcement.bannerToday');
}
